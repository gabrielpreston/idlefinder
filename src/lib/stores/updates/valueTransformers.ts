/**
 * Value Transformer Primitives
 * 
 * Transforms raw values into display-ready formats.
 * Handles formatting, animation, validation.
 */

import { derived, type Readable } from 'svelte/store';

/**
 * Options for number formatting
 */
export interface NumberFormatOptions {
	/** Locale for number formatting (e.g., 'en-US') */
	locale?: string;
	/** Minimum number of fraction digits */
	minimumFractionDigits?: number;
	/** Maximum number of fraction digits */
	maximumFractionDigits?: number;
	/** Whether to use grouping separators (e.g., 1,000) */
	useGrouping?: boolean;
	/** Unit suffix (e.g., "gold", "s", "%") */
	unit?: string;
}

/**
 * Transformer 1: Number Formatting
 * Formats numbers with locale, decimals, units
 * 
 * @param source Source store with number value
 * @param options Formatting options
 * @returns Readable store with formatted string
 */
export function formatNumber(
	source: Readable<number>,
	options: NumberFormatOptions = {}
): Readable<string> {
	return derived(source, (value) => {
		const formatted = value.toLocaleString(options.locale, {
			minimumFractionDigits: options.minimumFractionDigits,
			maximumFractionDigits: options.maximumFractionDigits,
			useGrouping: options.useGrouping ?? true
		});
		return options.unit ? `${formatted} ${options.unit}` : formatted;
	});
}

/**
 * Transformer 2: Progress Percentage
 * Converts 0-1 progress to 0-100 percentage
 * 
 * @param source Source store with progress value (0-1)
 * @returns Readable store with percentage (0-100)
 */
export function toPercentage(source: Readable<number>): Readable<number> {
	return derived(source, (value) => {
		// Handle invalid values
		if (isNaN(value) || !isFinite(value)) {
			return 0;
		}
		return Math.round(value * 100);
	});
}

/**
 * Transformer 3: Time Remaining
 * Converts milliseconds to human-readable time string
 * 
 * @param remainingMs Store with remaining milliseconds
 * @returns Readable store with formatted time string (e.g., "5m 30s")
 */
export function formatTimeRemaining(
	remainingMs: Readable<number>
): Readable<string> {
	return derived(remainingMs, (ms) => {
		// Handle invalid values
		if (isNaN(ms) || !isFinite(ms)) {
			return '0s';
		}
		
		// Handle negative values
		if (ms < 0) {
			const totalSeconds = Math.floor(Math.abs(ms) / 1000);
			return `-${String(totalSeconds)}s`;
		}
		
		const totalSeconds = Math.floor(ms / 1000);
		
		if (totalSeconds < 60) {
			return `${String(totalSeconds)}s`;
		}
		
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		
		if (minutes < 60) {
			return seconds > 0 ? `${String(minutes)}m ${String(seconds)}s` : `${String(minutes)}m`;
		}
		
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${String(hours)}h ${String(mins)}m` : `${String(hours)}h`;
	});
}

/**
 * Transformer 4: Clamp Value
 * Ensures value stays within bounds
 * 
 * @param source Source store with number value
 * @param min Minimum value
 * @param max Maximum value
 * @returns Readable store with clamped value
 */
export function clamp(
	source: Readable<number>,
	min: number,
	max: number
): Readable<number> {
	return derived(source, (value) => Math.min(Math.max(value, min), max));
}

/**
 * Formats a number as an integer (rounds during animation)
 * Use for: Gold, Fame, Materials, counts, tiers
 */
export function formatInteger(n: number): string {
	return Math.floor(n).toLocaleString();
}

/**
 * Formats a number with specified decimal places
 * Use for: Rates, percentages, averages
 * 
 * @param n Number to format
 * @param decimals Number of decimal places (default: 1)
 */
export function formatDecimal(n: number, decimals: number = 1): string {
	return n.toLocaleString(undefined, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
		useGrouping: true
	});
}

