/**
 * On-screen console for `?debug=1`. Mobile browsers hide the console without a
 * USB-tethered desktop, which made device-only failures impossible to report, so
 * this mirrors both the page's and the worker's console into the page itself.
 */

export type DebugLevel = "debug" | "log" | "info" | "warn" | "error";

export interface DebugEntry {
	time: number;
	source: "page" | "worker";
	level: DebugLevel;
	text: string;
}

export type ConsoleLike = Record<DebugLevel, (...args: unknown[]) => void>;

const LEVELS: DebugLevel[] = ["debug", "log", "info", "warn", "error"];

// biome-ignore lint/suspicious/noControlCharactersInRegex: matches ANSI escapes
const ANSI_ESCAPES = /\u001b\[[0-9;]*m/g;

/** Oldest entries are dropped past this, so a long session cannot grow unbounded. */
export const MAX_DEBUG_ENTRIES = 1000;

export function isDebugEnabled(search: string): boolean {
	return new URLSearchParams(search).get("debug") === "1";
}

function formatArg(arg: unknown): string {
	if (typeof arg === "string") return arg;
	if (arg instanceof Error) {
		const text = arg.stack?.includes(arg.message)
			? arg.stack
			: `${arg.name}: ${arg.message}`;

		return arg.cause === undefined
			? text
			: `${text}\nCaused by: ${formatArg(arg.cause)}`;
	}

	try {
		return JSON.stringify(arg) ?? String(arg);
	} catch {
		return String(arg);
	}
}

/**
 * Flattens console arguments to one string. Done at the source because Errors
 * lose their stack crossing `postMessage`, and to strip the ANSI colour codes
 * ONNX Runtime puts in its warnings.
 */
export function formatConsoleArgs(args: unknown[]): string {
	return args.map(formatArg).join(" ").replace(ANSI_ESCAPES, "");
}

/**
 * Wraps each console method so it also reports to `report`, keeping the original
 * output. Returns a function that restores the originals.
 */
export function mirrorConsole(
	target: ConsoleLike,
	report: (level: DebugLevel, text: string) => void,
): () => void {
	const originals = LEVELS.map((level) => [level, target[level]] as const);

	for (const [level, original] of originals) {
		target[level] = (...args: unknown[]) => {
			original.apply(target, args);
			try {
				report(level, formatConsoleArgs(args));
			} catch {
				// A broken reporter must never break logging itself.
			}
		};
	}

	return () => {
		for (const [level, original] of originals) target[level] = original;
	};
}

export function formatEntries(entries: DebugEntry[]): string {
	return entries
		.map(
			(entry) =>
				`${new Date(entry.time).toISOString()} [${entry.source}] ${entry.level.toUpperCase()} ${entry.text}`,
		)
		.join("\n");
}

export type LogStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const DEBUG_LOG_STORAGE_KEY = "debackground:debug-log";

/**
 * Lines kept across a reload. A tab Chrome kills for memory takes the in-memory
 * log with it, and the last lines before the crash are the ones that matter.
 */
export const MAX_PERSISTED_ENTRIES = 300;

function isDebugEntry(value: unknown): value is DebugEntry {
	const entry = value as DebugEntry;

	return (
		typeof entry?.time === "number" &&
		typeof entry.text === "string" &&
		LEVELS.includes(entry.level) &&
		(entry.source === "page" || entry.source === "worker")
	);
}

/** Saves the newest entries. Storage failures only cost the crash history. */
export function persistEntries(
	storage: LogStorage | null,
	entries: DebugEntry[],
): void {
	try {
		storage?.setItem(
			DEBUG_LOG_STORAGE_KEY,
			JSON.stringify(entries.slice(-MAX_PERSISTED_ENTRIES)),
		);
	} catch {
		// Quota or blocked storage: the live log still works.
	}
}

/**
 * Returns what the previous page load saved and removes it, so each load shows
 * only the one before it.
 */
export function takePersistedEntries(storage: LogStorage | null): DebugEntry[] {
	try {
		const saved = storage?.getItem(DEBUG_LOG_STORAGE_KEY);
		storage?.removeItem(DEBUG_LOG_STORAGE_KEY);
		if (!saved) return [];

		const parsed: unknown = JSON.parse(saved);

		return Array.isArray(parsed) ? parsed.filter(isDebugEntry) : [];
	} catch {
		return [];
	}
}
