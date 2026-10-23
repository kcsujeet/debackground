import { ENHANCED_BACKGROUND_REMOVAL_MODEL_ID } from "./constants";

/**
 * Remembers, per browser, whether the enhanced model has proven unusable here.
 *
 * The marker is written before every enhanced attempt and cleared once it
 * succeeds. Safari kills a tab that runs out of memory rather than throwing, so a
 * marker still reading "attempting" on the next load means that attempt took the
 * tab down with it. Either outcome keeps the device on the fallback model.
 *
 * Every access is guarded: storage is missing or throws in private windows and
 * with site data blocked, and the cost there is only a retried attempt.
 */

export type MarkerStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const ENHANCED_MODEL_MARKER_KEY = "debackground:enhanced-model";

const ATTEMPTING = "attempting";
const FAILED = "failed";

function read(storage: MarkerStorage | null): string | null {
	try {
		return storage?.getItem(ENHANCED_MODEL_MARKER_KEY) ?? null;
	} catch {
		return null;
	}
}

function write(storage: MarkerStorage | null, value: string | null): void {
	try {
		if (value === null) {
			storage?.removeItem(ENHANCED_MODEL_MARKER_KEY);
		} else {
			storage?.setItem(ENHANCED_MODEL_MARKER_KEY, value);
		}
	} catch {
		// Unwritable storage only costs a retried attempt on the next visit.
	}
}

function isEnhanced(model: string): boolean {
	return model === ENHANCED_BACKGROUND_REMOVAL_MODEL_ID;
}

/** `localStorage`, or null where merely touching it throws. */
export function markerStorage(): MarkerStorage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

export function hasEnhancedModelFailed(storage: MarkerStorage | null): boolean {
	const marker = read(storage);

	return marker === ATTEMPTING || marker === FAILED;
}

export function recordModelAttempt(
	storage: MarkerStorage | null,
	model: string,
): void {
	if (isEnhanced(model)) write(storage, ATTEMPTING);
}

export function recordModelFailure(
	storage: MarkerStorage | null,
	model: string,
): void {
	if (isEnhanced(model)) write(storage, FAILED);
}

export function recordModelSuccess(
	storage: MarkerStorage | null,
	model: string,
): void {
	if (isEnhanced(model)) write(storage, null);
}

/**
 * Turns an attempt the previous page load never finished into a failure. Must run
 * when the page loads, before anything else touches the marker: left as
 * "attempting", the next `pagehide` would clear it as if the user had walked
 * away, and the model that crashed the tab would be tried again.
 */
export function settleCrashedAttempt(storage: MarkerStorage | null): void {
	if (read(storage) === ATTEMPTING) write(storage, FAILED);
}

/**
 * Clears an attempt the user walked away from, for a `pagehide` listener. A tab
 * killed by the OS never gets the event, which is the split needed. Only sees
 * this page's own attempts, because `settleCrashedAttempt` already resolved any
 * earlier one. Browsers also skip it sometimes on a normal exit, mostly on
 * mobile; that only leaves the device on the fallback model, not broken.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event
 */
export function clearInterruptedAttempt(storage: MarkerStorage | null): void {
	if (read(storage) === ATTEMPTING) write(storage, null);
}
