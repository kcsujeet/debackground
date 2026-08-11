import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const BYTES_PER_MEGABYTE = 1024 * 1024;

export function formatMegabytes(bytes: number) {
	return `${Math.round(bytes / BYTES_PER_MEGABYTE)} MB`;
}
