/**
 * Timer Helpers - Convert between Record<string, number | null> and Timestamp
 * Per Systems Primitives Spec: timers are Record<string, number | null> (milliseconds)
 * Helper functions allow entity methods to continue using Timestamp objects
 */

import { Timestamp } from '../valueObjects/Timestamp';
import type { Entity } from './Requirement';
import { validateTimerValue } from './TimerValidator';
import { safeString } from '../../utils/templateLiterals';

/**
 * Get timer value as Timestamp (for entity method calls)
 * Converts number | null → Timestamp | null
 * 
 * @param entity Entity with timers
 * @param key Timer key
 * @param validate Optional: if true, validates timer value before conversion
 * @returns Timestamp or null
 * @throws Error if validation enabled and timer value is invalid
 */
export function getTimer(
	entity: Entity & { timers: Record<string, number | null> },
	key: string,
	validate: boolean = false
): Timestamp | null {
	// Guard against missing timers object (runtime safety check)
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!entity.timers) {
		return null;
	}
	
	// Check if key exists in timers object (handles undefined at runtime)
	if (!(key in entity.timers)) {
		return null;
	}
	
	const value = entity.timers[key];
	// Handle both null and undefined (undefined can occur at runtime even though TypeScript doesn't allow it)
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (value === null || value === undefined) {
		return null;
	}
	
	// Ensure value is a number before creating Timestamp
	// Check for NaN as well to prevent invalid timestamps
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return null;
	}
	
	if (validate) {
		const validation = validateTimerValue(value);
		if (!validation.isValid) {
			throw new Error(`Invalid timer value for key "${safeString(key)}": ${validation.error ?? 'unknown error'}`);
		}
	}
	
	return Timestamp.from(value);
}

/**
 * Set timer value (stores as number)
 * Converts Timestamp | null → stores as number | null
 * 
 * @param entity Entity with timers
 * @param key Timer key
 * @param timestamp Timestamp or null
 * @param validate Optional: if true, validates timer value before storing
 * @throws Error if validation enabled and timer value is invalid
 */
export function setTimer(
	entity: Entity & { timers: Record<string, number | null> },
	key: string,
	timestamp: Timestamp | null,
	validate: boolean = false
): void {
	if (timestamp === null) {
		entity.timers[key] = null;
		return;
	}
	
	if (validate) {
		const validation = validateTimerValue(timestamp.value);
		if (!validation.isValid) {
			throw new Error(`Invalid timer value for key "${safeString(key)}": ${validation.error ?? 'unknown error'}`);
		}
	}
	
	entity.timers[key] = timestamp.value;
}

/**
 * Validate timer value for an entity
 * 
 * @param entity Entity with timers
 * @param key Timer key
 * @returns Validation result
 */
export function validateTimer(
	entity: Entity & { timers: Record<string, number | null> },
	key: string
): { isValid: boolean; error?: string } {
	const value = entity.timers[key];
	return validateTimerValue(value);
}

