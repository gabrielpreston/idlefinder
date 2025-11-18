/**
 * Timer Helpers - Convert between Record<string, number | null> and Timestamp
 * Per Systems Primitives Spec: timers are Record<string, number | null> (milliseconds)
 * Helper functions allow entity methods to continue using Timestamp objects
 */

import { Timestamp } from '../valueObjects/Timestamp';
import type { Entity } from './Requirement';

/**
 * Get timer value as Timestamp (for entity method calls)
 * Converts number | null → Timestamp | null
 */
export function getTimer(
	entity: Entity & { timers: Record<string, number | null> },
	key: string
): Timestamp | null {
	const value = entity.timers[key];
	if (value === null || value === undefined) {
		return null;
	}
	return Timestamp.from(value);
}

/**
 * Set timer value (stores as number)
 * Converts Timestamp | null → stores as number | null
 */
export function setTimer(
	entity: Entity & { timers: Record<string, number | null> },
	key: string,
	timestamp: Timestamp | null
): void {
	if (timestamp === null) {
		entity.timers[key] = null;
	} else {
		entity.timers[key] = timestamp.value;
	}
}

