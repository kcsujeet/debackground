import { Bug } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ENHANCED_BACKGROUND_REMOVAL_MODEL_ID } from "@/lib/constants";
import {
	type DebugEntry,
	formatEntries,
	mirrorConsole,
	persistEntries,
	takePersistedEntries,
} from "@/lib/debug-log";
import {
	ENHANCED_MODEL_MARKER_KEY,
	markerStorage,
	recordModelFailure,
} from "@/lib/enhanced-model-memory";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useDebugLog } from "./useDebugLog";

const LEVEL_CLASSES = {
	debug: "text-muted-foreground",
	log: "text-foreground",
	info: "text-foreground",
	warn: "text-amber-600 dark:text-amber-400",
	error: "text-rose-600 dark:text-rose-400",
} as const;

let previousSession: DebugEntry[] | null = null;

/**
 * The log saved by the previous page load, read once per load. Cached at module
 * level because effects and state initialisers can run twice in development,
 * and a second read would find this load's own entries instead.
 */
function previousSessionEntries(): DebugEntry[] {
	previousSession ??= takePersistedEntries(markerStorage());
	return previousSession;
}

function EntryRow({ entry }: { entry: DebugEntry }) {
	return (
		<div
			className={`border-b border-border/40 py-0.5 break-words whitespace-pre-wrap ${LEVEL_CLASSES[entry.level]}`}
		>
			<span className="text-muted-foreground">
				{new Date(entry.time).toLocaleTimeString()} [{entry.source}]
			</span>{" "}
			{entry.text}
		</div>
	);
}

/** What a bug report needs that the worker's own logs do not already say. */
function logEnvironment(): void {
	const nav = navigator as Navigator & { deviceMemory?: number };

	console.info(
		`[debug] ${nav.userAgent} | deviceMemory=${nav.deviceMemory ?? "unknown"}GB cores=${nav.hardwareConcurrency} secureContext=${window.isSecureContext} crossOriginIsolated=${window.crossOriginIsolated} webgpu=${"gpu" in nav} ${ENHANCED_MODEL_MARKER_KEY}=${markerStorage()?.getItem(ENHANCED_MODEL_MARKER_KEY) ?? "unset"}`,
	);
}

/**
 * Floating button and log viewer shown with `?debug=1`. Mirrors the page console
 * itself; worker lines arrive through `useDebugLog` from the worker's host.
 */
export default function DebugPanel() {
	const entries = useDebugLog((state) => state.entries);
	const clear = useDebugLog((state) => state.clear);
	const [isOpen, setIsOpen] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [previous] = useState(previousSessionEntries);
	const endRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const storage = markerStorage();
		const restore = mirrorConsole(console, (level, text) => {
			useDebugLog
				.getState()
				.add({ time: Date.now(), source: "page", level, text });
		});
		// Saved on every line: a crash gives no chance to save at the end.
		const unsubscribe = useDebugLog.subscribe((state) =>
			persistEntries(storage, state.entries),
		);
		logEnvironment();

		return () => {
			unsubscribe();
			restore();
		};
	}, []);

	useEffect(() => {
		if (isOpen && entries.length > 0) {
			endRef.current?.scrollIntoView({ block: "end" });
		}
	}, [isOpen, entries]);

	const errorCount = entries.filter((entry) => entry.level === "error").length;

	const copy = async () => {
		const text =
			previous.length > 0
				? `--- before the last reload ---\n${formatEntries(previous)}\n--- this load ---\n${formatEntries(entries)}`
				: formatEntries(entries);

		try {
			await navigator.clipboard.writeText(text);
			setNotice("Copied");
		} catch {
			setNotice("Copy blocked here. Long-press the log to select it.");
		}
	};

	const resetMarker = () => {
		try {
			markerStorage()?.removeItem(ENHANCED_MODEL_MARKER_KEY);
			setNotice("BEN2 marker cleared. Reload to try BEN2 again.");
		} catch {
			setNotice("Could not reach localStorage.");
		}
	};

	const skipEnhancedModel = () => {
		recordModelFailure(markerStorage(), ENHANCED_BACKGROUND_REMOVAL_MODEL_ID);
		setNotice("BEN2 marked as failed. Reload to use BiRefNet_lite only.");
	};

	return (
		<>
			<Button
				variant="secondary"
				size="sm"
				onClick={() => setIsOpen(true)}
				className="fixed right-4 bottom-4 z-40 shadow-lg"
			>
				<Bug className="w-4 h-4" />
				Debug
				{previous.length > 0 && (
					<span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
						crash log
					</span>
				)}
				{errorCount > 0 && (
					<span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white tabular-nums">
						{errorCount}
					</span>
				)}
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent
					aria-describedby={undefined}
					className="flex h-[85dvh] flex-col gap-3 p-4 sm:max-w-3xl"
				>
					<DialogTitle className="text-sm font-semibold">
						Debug log ({entries.length})
					</DialogTitle>

					<div className="flex flex-wrap gap-2">
						<Button
							size="sm"
							onClick={copy}
							disabled={entries.length === 0 && previous.length === 0}
						>
							Copy all
						</Button>
						<Button size="sm" variant="outline" onClick={clear}>
							Clear
						</Button>
						<Button size="sm" variant="outline" onClick={resetMarker}>
							Reset BEN2 marker
						</Button>
						<Button size="sm" variant="outline" onClick={skipEnhancedModel}>
							Skip BEN2
						</Button>
					</div>
					{notice && <p className="text-xs text-muted-foreground">{notice}</p>}

					<div className="min-h-0 grow overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed select-text">
						{previous.length > 0 && (
							<details
								open
								className="mb-2 rounded border border-amber-500/40 p-1"
							>
								<summary className="cursor-pointer font-sans text-xs font-semibold text-amber-600 dark:text-amber-400">
									Before the last reload ({previous.length}). If the tab
									crashed, the last line is where it died.
								</summary>
								{previous.map((entry, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: fixed list
									<EntryRow key={index} entry={entry} />
								))}
							</details>
						)}
						{entries.length === 0 ? (
							<p className="text-muted-foreground">
								Nothing logged yet. Drop an image to start.
							</p>
						) : (
							entries.map((entry, index) => (
								// Entries are append-only and never reordered.
								// biome-ignore lint/suspicious/noArrayIndexKey: stable order
								<EntryRow key={index} entry={entry} />
							))
						)}
						<div ref={endRef} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
