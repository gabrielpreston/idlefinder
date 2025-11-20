/**
 * System Result - Standardized result type for domain systems
 * Provides structured success/failure with optional warnings and errors
 * Maintains domain purity by returning data instead of performing side effects
 */

/**
 * System Result interface
 * @template T The data type returned on success
 */
export interface SystemResult<T> {
	/**
	 * Whether the operation succeeded
	 */
	success: boolean;
	/**
	 * Data returned on success (only present if success is true)
	 */
	data?: T;
	/**
	 * Warnings encountered during processing (non-fatal)
	 */
	warnings?: string[];
	/**
	 * Errors encountered during processing (fatal if success is false)
	 */
	errors?: string[];
}

/**
 * Create a successful result
 */
export function success<T>(data: T, warnings?: string[]): SystemResult<T> {
	return {
		success: true,
		data,
		...(warnings && warnings.length > 0 ? { warnings } : {})
	};
}

/**
 * Create a failed result
 */
export function failure<T>(errors: string[], warnings?: string[]): SystemResult<T> {
	return {
		success: false,
		errors,
		...(warnings && warnings.length > 0 ? { warnings } : {})
	};
}

