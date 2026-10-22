import { create } from "zustand";
import { type DebugEntry, MAX_DEBUG_ENTRIES } from "@/lib/debug-log";

interface DebugLogState {
	entries: DebugEntry[];
	add: (entry: DebugEntry) => void;
	clear: () => void;
}

export const useDebugLog = create<DebugLogState>((set) => ({
	entries: [],
	add: (entry) =>
		set((state) => ({
			entries: [...state.entries, entry].slice(-MAX_DEBUG_ENTRIES),
		})),
	clear: () => set({ entries: [] }),
}));
