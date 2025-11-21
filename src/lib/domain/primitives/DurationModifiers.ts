/**
 * Duration Modifiers - Shared utility for duration calculations
 * Provides generic duration modifier interface and calculation function
 * used by all duration-based systems (missions, crafting, tasks)
 *
 * Pattern: Follows primitives/EntityValidation.ts and primitives/TimerHelpers.ts pattern
 */

import { Duration } from '../valueObjects/Duration';

export interface DurationModifier {
	/** Multiplier to apply (e.g., 0.8 for 20% reduction, 1.2 for 20% increase) */
	multiplier: number;
	/** Source/description of the modifier for debugging */
	source: string;
}

/**
 * Calculate effective duration with modifiers applied
 * Generic calculation used by all duration-based systems
 *
 * @param baseDuration Base duration before modifiers
 * @param modifiers Array of duration modifiers to apply
 * @returns Effective duration with modifiers applied (minimum 1 second)
 */
export function calculateEffectiveDuration(
	baseDuration: Duration,
	modifiers: DurationModifier[]
): Duration {
	// Multiplicative stacking
	const totalMultiplier = modifiers.reduce(
		(acc, mod) => acc * mod.multiplier,
		1.0
	);

	// Calculate effective duration
	const effectiveMilliseconds = Math.floor(baseDuration.toMilliseconds() * totalMultiplier);

	// Ensure minimum duration of 1 second
	const finalMilliseconds = Math.max(1000, effectiveMilliseconds);

	return Duration.ofSeconds(finalMilliseconds / 1000);
}

