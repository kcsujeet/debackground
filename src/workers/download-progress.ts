export interface FileDownload {
	loaded: number;
	total: number;
}

export interface DownloadProgress {
	percent: number;
	loaded: number;
	total: number;
}

const PERCENT_MAX = 100;

const EMPTY_PROGRESS: DownloadProgress = { percent: 0, loaded: 0, total: 0 };

/**
 * Combines per-file download state into a single figure for the progress bar.
 *
 * Transformers.js reports progress per file, and the model repo is one large
 * weights file alongside a few tiny JSON configs. Summing the byte counts keeps
 * the bar monotonic instead of restarting it for every config file.
 */
export function aggregateProgress(
	files: Iterable<FileDownload>,
): DownloadProgress {
	let loaded = 0;
	let total = 0;

	for (const file of files) {
		loaded += file.loaded;
		total += file.total;
	}

	if (total <= 0) {
		return EMPTY_PROGRESS;
	}

	const ratio = loaded / total;
	const percent = Math.min(
		PERCENT_MAX,
		Math.max(0, Math.round(ratio * PERCENT_MAX)),
	);

	return { percent, loaded, total };
}
