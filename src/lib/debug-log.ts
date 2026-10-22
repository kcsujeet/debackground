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
