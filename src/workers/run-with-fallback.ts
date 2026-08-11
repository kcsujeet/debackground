import type { InferenceBackend } from "./select-backend";

export function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export class BackendExhaustedError extends Error {
	readonly failures: string[];

	constructor(failures: string[]) {
		super(
			"This device could not run the AI model. Try a Chromium-based browser, or a smaller image if memory is limited.",
		);
		this.name = "BackendExhaustedError";
		this.failures = failures;
	}
}

export interface FallbackRun<T> {
	result: T;
	backend: InferenceBackend;
}

/**
 * Runs `attempt` against each backend in `queue`, dropping any that fails so later
 * calls skip a known-bad path. `cleanup` releases device resources between attempts.
 *
 * A throwing `cleanup` is recorded and swallowed. It runs precisely when the device
 * has already failed — the case where releasing a session is most likely to reject —
 * and letting it propagate would skip the remaining backends, defeating the fallback
 * it exists to enable.
 */
export async function runWithFallback<T>(
	queue: InferenceBackend[],
	attempt: (backend: InferenceBackend) => Promise<T>,
	cleanup: () => Promise<void>,
): Promise<FallbackRun<T>> {
	const failures: string[] = [];

	while (queue.length > 0) {
		const backend = queue[0];

		try {
			return { result: await attempt(backend), backend };
		} catch (error) {
			failures.push(
				`${backend.device}/${backend.dtype}: ${describeError(error)}`,
			);

			try {
				await cleanup();
			} catch (cleanupError) {
				failures.push(
					`cleanup after ${backend.device}/${backend.dtype}: ${describeError(cleanupError)}`,
				);
			}

			queue.shift();
		}
	}

	throw new BackendExhaustedError(failures);
}
