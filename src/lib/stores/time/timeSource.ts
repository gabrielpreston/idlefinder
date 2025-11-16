/**
 * Time Source Store - Unified source of "now" for all time-based calculations
 * 
 * Provides a reliable, performant time source that:
 * - Updates continuously for smooth UI animations
 * - Pauses when tab is hidden to save resources
 * - Handles SSR safely (no browser APIs during server-side rendering)
 */

import { readable, type Readable } from 'svelte/store';
import { startVisualTick } from '../visualTick';

/**
 * Time source interface
 */
export interface TimeSource {
	/** Current time in milliseconds since epoch */
	readonly now: Readable<number>;

	/** Whether the time source is actively updating */
	readonly isActive: Readable<boolean>;
}

/**
 * Creates a time source that updates continuously.
 * Automatically pauses when tab is hidden for performance.
 * 
 * @param interval Update interval in milliseconds (default: 100ms)
 * @returns TimeSource with now and isActive stores
 */
export function createContinuousTimeSource(interval: number = 100): TimeSource {
	let isTabVisible = true;

	// Track tab visibility with SSR safety check
	if (typeof document !== 'undefined') {
		const handleVisibilityChange = () => {
			isTabVisible = !document.hidden;
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
	}

	const now = readable(Date.now(), (set) => {
		return startVisualTick(() => {
			// Only update when tab is visible
			if (isTabVisible) {
				set(Date.now());
			}
		}, interval);
	});

	const isActive = readable(true);

	return { now, isActive };
}

/**
 * Creates a time source synchronized with server time.
 * Accounts for clock drift between client and server.
 * 
 * @param serverTimeBaseline Store containing server timestamp baseline
 * @param interval Update interval in milliseconds
 * @returns TimeSource synchronized with server time
 */
export function createSynchronizedTimeSource(
	serverTimeBaseline: Readable<number>,
	interval: number = 100
): TimeSource {
	// For MVP: Use client time directly
	// Future: Apply clock drift correction: baseline + (clientNow - clientBaseline)
	const now = readable(Date.now(), (set) => {
		return startVisualTick(() => {
			set(Date.now());
		}, interval);
	});

	const isActive = readable(true);

	return {
		now,
		isActive
	};
}

/**
 * Global time source instance
 * Use this for most continuous updates
 */
export const gameTime = createContinuousTimeSource(100);

