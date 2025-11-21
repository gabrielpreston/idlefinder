/**
 * Timer Validator - Validation utilities for timer values
 * Validates timer values and relationships to ensure data integrity
 */

import { Timestamp } from '../valueObjects/Timestamp';

/**
 * Validation result for timer operations
 */
export interface TimerValidationResult {
	isValid: boolean;
	error?: string;
}

/**
 * Validate that a timer value is a valid timestamp
 * Checks: non-negative, finite, within reasonable range
 */
export function validateTimerValue(value: number | null): TimerValidationResult {
	if (value === null) {
		return { isValid: true }; // null is valid (timer not set)
	}

	if (!isFinite(value)) {
		return {
			isValid: false,
			error: `Timer value must be finite, got: ${value}`
		};
	}

	if (value < 0) {
		return {
			isValid: false,
			error: `Timer value cannot be negative, got: ${value}`
		};
	}

	// Check reasonable range: between year 2000 and year 2100
	const year2000 = 946684800000; // Jan 1, 2000
	const year2100 = 4102444800000; // Jan 1, 2100

	if (value < year2000 || value > year2100) {
		return {
			isValid: false,
			error: `Timer value out of reasonable range (2000-2100), got: ${value}`
		};
	}

	return { isValid: true };
}

/**
 * Validate timer relationship (e.g., endsAt > startedAt)
 */
export function validateTimerRelationship(
	startTimer: Timestamp | null,
	endTimer: Timestamp | null,
	relationship: 'before' | 'after' = 'before'
): TimerValidationResult {
	if (startTimer === null || endTimer === null) {
		return { isValid: true }; // Cannot validate relationship if either is null
	}

	const startValue = startTimer.value;
	const endValue = endTimer.value;

	// Validate individual timer values first
	const startValidation = validateTimerValue(startValue);
	if (!startValidation.isValid) {
		return startValidation;
	}

	const endValidation = validateTimerValue(endValue);
	if (!endValidation.isValid) {
		return endValidation;
	}

	// Validate relationship
	if (relationship === 'before') {
		if (startValue >= endValue) {
			return {
				isValid: false,
				error: `Start timer (${startValue}) must be before end timer (${endValue})`
			};
		}
	} else if (relationship === 'after') {
		if (startValue <= endValue) {
			return {
				isValid: false,
				error: `Start timer (${startValue}) must be after end timer (${endValue})`
			};
		}
	}

	return { isValid: true };
}

/**
 * Validate timer value from entity timers record
 * Convenience function that validates and converts to Timestamp
 */
export function validateAndGetTimer(
	timerValue: number | null | undefined
): { isValid: boolean; timestamp: Timestamp | null; error?: string } {
	if (timerValue === null || timerValue === undefined) {
		return { isValid: true, timestamp: null };
	}

	const validation = validateTimerValue(timerValue);
	if (!validation.isValid) {
		return {
			isValid: false,
			timestamp: null,
			error: validation.error
		};
	}

	return {
		isValid: true,
		timestamp: Timestamp.from(timerValue)
	};
}

