/**
 * Remembers, per browser, which inference backends have proven unusable here.
 *
 * Each backend (model + device) gets its own record, written as "attempting"
 * before every run and removed once it succeeds. A thrown error turns it into
 * "failed". A tab the browser kills mid-run cannot report anything, so a record
 * still reading "attempting" on the next load means that run took the tab down;
 * `settleCrashedAttempts` turns it into "failed" then.
 *
 * Every access is guarded: storage is missing or throws in private windows and
 * with site data blocked, and the cost there is only a retried attempt.
 */

export type MemoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface BackendIdentity {
	model: string;
	device: string;
}

type Outcome = "attempting" | "failed";
type Outcomes = Record<string, Outcome>;

export const BACKEND_MEMORY_KEY = "debackground:backend-outcomes";

/** BEN2-only marker this replaced. Mostly left behind by a since-fixed decode bug. */
const LEGACY_ENHANCED_MODEL_KEY = "debackground:enhanced-model";

/** fp16 and fp32 share a device and fail together, so dtype is not part of it. */
export function backendKey(backend: BackendIdentity): string {
	return `${backend.model} ${backend.device}`;
}

/** `localStorage`, or null where merely touching it throws. */
export function safeLocalStorage(): MemoryStorage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function isOutcome(value: unknown): value is Outcome {
	return value === "attempting" || value === "failed";
}

function read(storage: MemoryStorage | null): Outcomes {
	try {
		const saved = storage?.getItem(BACKEND_MEMORY_KEY);
		if (!saved) return {};

		const parsed: unknown = JSON.parse(saved);
		if (typeof parsed !== "object" || parsed === null) return {};

		return Object.fromEntries(
			Object.entries(parsed).filter(([, outcome]) => isOutcome(outcome)),
		);
	} catch {
		return {};
	}
}

function write(storage: MemoryStorage | null, outcomes: Outcomes): void {
	try {
		if (Object.keys(outcomes).length === 0) {
			storage?.removeItem(BACKEND_MEMORY_KEY);
		} else {
			storage?.setItem(BACKEND_MEMORY_KEY, JSON.stringify(outcomes));
		}
	} catch {
		// Unwritable storage only costs a retried attempt on the next visit.
	}
}

function update(
	storage: MemoryStorage | null,
	change: (outcomes: Outcomes) => void,
): void {
	const outcomes = read(storage);
	change(outcomes);
	write(storage, outcomes);
}

/** Keys of every backend that failed or crashed the tab on this browser. */
export function failedBackendKeys(storage: MemoryStorage | null): string[] {
	return Object.keys(read(storage));
}

/** All saved records, for the debug panel. */
export function describeBackendMemory(storage: MemoryStorage | null): string {
	const outcomes = Object.entries(read(storage));

	return outcomes.length === 0
		? "none"
		: outcomes.map(([key, outcome]) => `${key}=${outcome}`).join(", ");
}

export function recordAttempt(
	storage: MemoryStorage | null,
	key: string,
): void {
	update(storage, (outcomes) => {
		outcomes[key] = "attempting";
	});
}

export function recordFailure(
	storage: MemoryStorage | null,
	key: string,
): void {
	update(storage, (outcomes) => {
		outcomes[key] = "failed";
	});
}

export function recordSuccess(
	storage: MemoryStorage | null,
	key: string,
): void {
	update(storage, (outcomes) => {
		delete outcomes[key];
	});
}

export function forgetAllBackends(storage: MemoryStorage | null): void {
	write(storage, {});
}

/**
 * Turns attempts the previous page load never finished into failures, and drops
 * the legacy BEN2 marker. Must run when the page loads, before anything else
 * touches the records: left as "attempting", the next `pagehide` would clear
 * them as if the user had walked away, and the backend that crashed the tab
 * would be tried again.
 */
export function settleCrashedAttempts(storage: MemoryStorage | null): void {
	try {
		storage?.removeItem(LEGACY_ENHANCED_MODEL_KEY);
	} catch {
		// Harmless to leave behind: nothing reads it any more.
	}

	update(storage, (outcomes) => {
		for (const key of Object.keys(outcomes)) {
			if (outcomes[key] === "attempting") outcomes[key] = "failed";
		}
	});
}

/**
 * Clears attempts the user walked away from, for a `pagehide` listener. A tab
 * killed by the OS never gets the event, which is the split needed. Only sees
 * this page's own attempts, because `settleCrashedAttempts` already resolved any
 * earlier ones. Browsers also skip it sometimes on a normal exit, mostly on
 * mobile; that only drops the device to a later backend, not broken.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event
 */
export function clearInterruptedAttempts(storage: MemoryStorage | null): void {
	update(storage, (outcomes) => {
		for (const key of Object.keys(outcomes)) {
			if (outcomes[key] === "attempting") delete outcomes[key];
		}
	});
}
