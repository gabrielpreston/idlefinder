/**
 * Composable Value Stores
 * 
 * Pre-composed value stores for common patterns.
 * Combines update strategies with value transformers.
 */

import { derived, type Readable } from 'svelte/store';
import type { TimeSource } from '../time/timeSource';
import {
	continuousInterpolation,
	type DurationConfig
} from './updateStrategies';
import { toPercentage, formatTimeRemaining, clamp } from './valueTransformers';

/**
 * Duration Progress Store
 * 
 * Combines continuous interpolation with percentage formatting.
 * Use this for any duration-based progress (missions, tasks, cooldowns).
 * 
 * @param config Store containing duration configuration
 * @param timeSource Time source for current time
 * @returns Object with progress stores and computed values
 */
export function createDurationProgressStore(
	config: Readable<DurationConfig>,
	timeSource: TimeSource
) {
	const progress = clamp(
		continuousInterpolation(config, timeSource),
		0,
		1
	);
	const progressPercent = toPercentage(progress);

	const remaining = derived([config, timeSource.now], ([cfg, now]) => {
		const elapsed = now - cfg.startTime;
		return Math.max(0, cfg.duration - elapsed);
	});

	const timeRemaining = formatTimeRemaining(remaining);

	const isComplete = derived(progress, (p) => p >= 1);
	const isNearComplete = derived(progress, (p) => p >= 0.9);

	return {
		/** Progress value (0-1) */
		progress,
		/** Progress percentage (0-100) */
		progressPercent,
		/** Remaining time in milliseconds */
		remaining,
		/** Formatted time remaining string (e.g., "5m 30s") */
		timeRemaining,
		/** Whether progress is complete (>= 100%) */
		isComplete,
		/** Whether progress is near complete (>= 90%) */
		isNearComplete
	};
}

/**
 * Resource Store
 * 
 * Event-driven resource value with formatting.
 * Use this for gold, supplies, relics, etc.
 * 
 * @param source Source store with resource value
 * @param unit Optional unit string (e.g., "gold")
 * @returns Object with value and formatted stores
 */
export function createResourceStore(source: Readable<number>, _unit?: string) {
	// Formatting handled at component level for flexibility
	return {
		/** Raw resource value */
		value: source,
		/** Formatted resource value (same as value for now) */
		formatted: source
	};
}

