import { beforeEach, expect, test } from "bun:test";
import { useDebugLog } from "../components/debug/useDebugLog";
import {
	type ConsoleLike,
	DEBUG_LOG_STORAGE_KEY,
	type DebugLevel,
	formatConsoleArgs,
	formatEntries,
	isDebugEnabled,
	type LogStorage,
	MAX_DEBUG_ENTRIES,
	MAX_PERSISTED_ENTRIES,
	mirrorConsole,
	persistEntries,
	takePersistedEntries,
} from "../lib/debug-log";

function fakeConsole(): ConsoleLike & { printed: string[] } {
	const printed: string[] = [];
	const print = (...args: unknown[]) => {
		printed.push(args.join(" "));
	};

	return {
		printed,
		debug: print,
		log: print,
		info: print,
		warn: print,
		error: print,
	};
}

beforeEach(() => {
	useDebugLog.getState().clear();
});

test("debug=1 turns the panel on", () => {
	expect(isDebugEnabled("?debug=1")).toBe(true);
	expect(isDebugEnabled("?foo=bar&debug=1")).toBe(true);
});

test("anything else leaves it off", () => {
	expect(isDebugEnabled("")).toBe(false);
	expect(isDebugEnabled("?debug=0")).toBe(false);
	expect(isDebugEnabled("?debug=true")).toBe(false);
});

test("joins arguments and serialises objects", () => {
	expect(formatConsoleArgs(["failed:", ["a", "b"], { n: 1 }])).toBe(
		'failed: ["a","b"] {"n":1}',
	);
});

test("keeps an error's message when it has no stack", () => {
	const error = new Error("Too many storage buffers in shader. Current: 11");
	error.stack = undefined;

	expect(formatConsoleArgs([error])).toBe(
		"Error: Too many storage buffers in shader. Current: 11",
	);
});

test("includes an error's cause, which carries the browser's reason", () => {
	const cause = new Error("The source image could not be decoded.");
	cause.stack = undefined;
	const error = new Error("This image couldn't be read.", { cause });
	error.stack = undefined;

	expect(formatConsoleArgs([error])).toBe(
		"Error: This image couldn't be read.\nCaused by: Error: The source image could not be decoded.",
	);
});

test("falls back to String for values JSON cannot encode", () => {
	const circular: Record<string, unknown> = {};
	circular.self = circular;

	expect(formatConsoleArgs([circular, 10n])).toBe("[object Object] 10");
});

test("strips the ANSI colour codes ONNX Runtime adds", () => {
	expect(formatConsoleArgs(["\u001b[0;93mwarning\u001b[m"])).toBe("warning");
});

test("mirrors every level while still printing", () => {
	const target = fakeConsole();
	const reported: Array<[DebugLevel, string]> = [];

	mirrorConsole(target, (level, text) => reported.push([level, text]));
	target.warn("low", "memory");
	target.error("boom");

	expect(target.printed).toEqual(["low memory", "boom"]);
	expect(reported).toEqual([
		["warn", "low memory"],
		["error", "boom"],
	]);
});

test("a throwing reporter does not break logging", () => {
	const target = fakeConsole();

	mirrorConsole(target, () => {
		throw new Error("reporter failed");
	});

	expect(() => target.log("still fine")).not.toThrow();
	expect(target.printed).toEqual(["still fine"]);
});

test("restoring puts the original methods back", () => {
	const target = fakeConsole();
	const original = target.log;
	const restore = mirrorConsole(target, () => {});

	restore();

	expect(target.log).toBe(original);
});

test("formats entries for copying", () => {
	const text = formatEntries([
		{ time: 0, source: "worker", level: "error", text: "boom" },
	]);

	expect(text).toBe("1970-01-01T00:00:00.000Z [worker] ERROR boom");
});

test("the store keeps only the newest entries", () => {
	const { add } = useDebugLog.getState();

	for (let i = 0; i < MAX_DEBUG_ENTRIES + 5; i++) {
		add({ time: i, source: "page", level: "log", text: String(i) });
	}

	const { entries } = useDebugLog.getState();
	expect(entries).toHaveLength(MAX_DEBUG_ENTRIES);
	expect(entries[0].text).toBe("5");
});

function memoryStorage(): LogStorage & { values: Map<string, string> } {
	const values = new Map<string, string>();

	return {
		values,
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => {
			values.set(key, value);
		},
		removeItem: (key) => {
			values.delete(key);
		},
	};
}

const ENTRY = {
	time: 1,
	source: "worker",
	level: "log",
	text: "[background-removal] running inference",
} as const;

test("entries saved before a crash come back on the next load", () => {
	const storage = memoryStorage();

	persistEntries(storage, [ENTRY]);

	expect(takePersistedEntries(storage)).toEqual([ENTRY]);
});

test("the saved log is shown once, then gone", () => {
	const storage = memoryStorage();

	persistEntries(storage, [ENTRY]);
	takePersistedEntries(storage);

	expect(takePersistedEntries(storage)).toEqual([]);
});

test("only the newest entries are saved", () => {
	const storage = memoryStorage();
	const entries = Array.from({ length: MAX_PERSISTED_ENTRIES + 3 }, (_, i) => ({
		...ENTRY,
		time: i,
	}));

	persistEntries(storage, entries);

	const restored = takePersistedEntries(storage);
	expect(restored).toHaveLength(MAX_PERSISTED_ENTRIES);
	expect(restored[0].time).toBe(3);
});

test("corrupt saved data is ignored", () => {
	const storage = memoryStorage();
	storage.setItem(DEBUG_LOG_STORAGE_KEY, "{not json");

	expect(takePersistedEntries(storage)).toEqual([]);
});

test("malformed entries are dropped", () => {
	const storage = memoryStorage();
	storage.setItem(
		DEBUG_LOG_STORAGE_KEY,
		JSON.stringify([ENTRY, { time: "x" }, null, { ...ENTRY, level: "loud" }]),
	);

	expect(takePersistedEntries(storage)).toEqual([ENTRY]);
});

test("unavailable storage neither throws nor restores anything", () => {
	const throwing: LogStorage = {
		getItem: () => {
			throw new Error("SecurityError");
		},
		setItem: () => {
			throw new Error("QuotaExceededError");
		},
		removeItem: () => {
			throw new Error("SecurityError");
		},
	};

	expect(() => persistEntries(throwing, [ENTRY])).not.toThrow();
	expect(takePersistedEntries(throwing)).toEqual([]);
	expect(takePersistedEntries(null)).toEqual([]);
});
