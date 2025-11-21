/**
 * Timer Helpers - Convert between Record<string, number | null> and Timestamp
 * Per Systems Primitives Spec: timers are Record<string, number | null> (milliseconds)
 * Helper functions allow entity methods to continue using Timestamp objects
 */

import { Timestamp } from '../valueObjects/Timestamp';
import type { Entity } from './Requirement';
import { validateTimerValue } from './TimerValidator';

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
	const value = entity.timers[key];
	if (value === null || value === undefined) {
		return null;
	}
	
	if (validate) {
		const validation = validateTimerValue(value);
		if (!validation.isValid) {
			throw new Error(`Invalid timer value for key "${key}": ${validation.error}`);
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
			throw new Error(`Invalid timer value for key "${key}": ${validation.error}`);
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

