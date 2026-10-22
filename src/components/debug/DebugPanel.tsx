import { Bug } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatEntries, mirrorConsole } from "@/lib/debug-log";
import {
	ENHANCED_MODEL_MARKER_KEY,
	markerStorage,
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
	const endRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const restore = mirrorConsole(console, (level, text) => {
			useDebugLog
				.getState()
				.add({ time: Date.now(), source: "page", level, text });
		});
		logEnvironment();

		return restore;
	}, []);

	useEffect(() => {
		if (isOpen && entries.length > 0) {
			endRef.current?.scrollIntoView({ block: "end" });
		}
	}, [isOpen, entries]);

	const errorCount = entries.filter((entry) => entry.level === "error").length;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(formatEntries(entries));
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
						<Button size="sm" onClick={copy} disabled={entries.length === 0}>
							Copy all
						</Button>
						<Button size="sm" variant="outline" onClick={clear}>
							Clear
						</Button>
						<Button size="sm" variant="outline" onClick={resetMarker}>
							Reset BEN2 marker
						</Button>
					</div>
					{notice && <p className="text-xs text-muted-foreground">{notice}</p>}

					<div className="min-h-0 grow overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed select-text">
						{entries.length === 0 ? (
							<p className="text-muted-foreground">
								Nothing logged yet. Drop an image to start.
							</p>
						) : (
							entries.map((entry, index) => (
								<div
									// Entries are append-only and never reordered.
									// biome-ignore lint/suspicious/noArrayIndexKey: stable order
									key={index}
									className={`border-b border-border/40 py-0.5 break-words whitespace-pre-wrap ${LEVEL_CLASSES[entry.level]}`}
								>
									<span className="text-muted-foreground">
										{new Date(entry.time).toLocaleTimeString()} [{entry.source}]
									</span>{" "}
									{entry.text}
								</div>
							))
						)}
						<div ref={endRef} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
