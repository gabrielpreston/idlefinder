/**
 * Update Strategy Primitives
 * 
 * Defines how values change over time.
 * Strategies are composable and can be combined.
 */

import { derived, type Readable } from 'svelte/store';
import type { TimeSource } from '../time/timeSource';

/**
 * Strategy 1: Event-Driven Updates
 * Value changes only when source store changes.
 * Perfect for: Gold, resources, counts, status flags
 * 
 * @param source Source store to pass through
 * @returns Readable store that updates only on source changes
 */
export function eventDriven<T>(source: Readable<T>): Readable<T> {
	return source; // Already event-driven
}

/**
 * Configuration for duration-based interpolation
 */
export interface DurationConfig {
	/** Timestamp when duration started (milliseconds since epoch) */
	startTime: number;
	/** Total duration in milliseconds */
	duration: number;
}

/**
 * Strategy 2: Continuous Time-Based Interpolation
 * Value interpolates continuously based on time.
 * Perfect for: Mission progress, cooldowns, timers
 * 
 * @param config Store containing duration configuration
 * @param timeSource Time source for current time
 * @returns Readable store with progress value (0-1)
 */
export function continuousInterpolation(
	config: Readable<DurationConfig>,
	timeSource: TimeSource
): Readable<number> {
	return derived([config, timeSource.now], ([cfg, now]) => {
		const elapsed = now - cfg.startTime;
		
		// Handle edge cases
		if (cfg.duration <= 0) {
			// Zero or negative duration means already complete
			return 1.0;
		}
		
		const progress = elapsed / cfg.duration;
		
		// Clamp between 0 and 1
		return Math.min(Math.max(progress, 0), 1);
	});
}

/**
 * Strategy 3: Throttled Continuous
 * Updates continuously but throttled to reduce computation.
 * Perfect for: Multiple progress bars, expensive calculations
 * 
 * Note: This is a placeholder - actual throttling is handled
 * by the time source interval. This function exists for
 * future extensibility.
 * 
 * @param source Source store
 * @param timeSource Time source
 * @param throttleMs Throttle interval in milliseconds
 * @returns Readable store with throttled updates
 */
export function throttledContinuous<T>(
	source: Readable<T>,
	_timeSource: TimeSource,
	_throttleMs: number
): Readable<T> {
	// For now, just pass through - throttling handled by time source
	return source;
}

