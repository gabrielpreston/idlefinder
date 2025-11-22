/**
 * Template Literal Utilities
 * Safe conversion of values to strings for use in template literals
 * Fixes TypeScript ESLint restrict-template-expressions rule violations
 */

/**
 * Safely convert any value to a string for template literals
 * Handles null, undefined, numbers, and other types
 */
export function safeString(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch {
			return '[object Object]';
		}
	}
	// At this point, value can only be symbol, bigint, or function
	// All of these have safe string representations
	if (typeof value === 'symbol') {
		return value.toString();
	}
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (typeof value === 'function') {
		return value.name || '[Function]';
	}
	// TypeScript exhaustiveness check - this should never be reached
	// but we need it for type safety
	// At this point, value can only be symbol, bigint, or function (already handled)
	// But TypeScript doesn't narrow this perfectly, so we use a type assertion
	const _exhaustive = value as never;
	return String(_exhaustive);
}

