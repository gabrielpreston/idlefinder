/**
 * Entity Validation Utilities - Reusable validation functions for entity constructors
 * Provides consistent validation patterns across all entities
 */

/**
 * Validate entity has non-empty ID and type
 * @throws Error if validation fails
 */
export function validateEntity(id: string, type: string): void {
	if (!id || id.trim() === '') {
		throw new Error(`Entity ID cannot be empty (type: ${type})`);
	}
	if (!type || type.trim() === '') {
		throw new Error(`Entity type cannot be empty (id: ${id})`);
	}
}

/**
 * Validate numeric value is within range
 * @throws Error if validation fails
 */
export function validateRange(
	value: number,
	min: number,
	max: number,
	fieldName: string
): void {
	if (value < min || value > max) {
		throw new Error(
			`${fieldName} (${value}) must be between ${min} and ${max}`
		);
	}
}

/**
 * Validate numeric value is non-negative
 * @throws Error if validation fails
 */
export function validateNonNegative(value: number, fieldName: string): void {
	if (value < 0) {
		throw new Error(`${fieldName} (${value}) must be non-negative`);
	}
}

