/**
 * Capacity Interface - Represents current usage vs maximum capacity
 * 
 * Used for mission slots, roster size, resource slots, etc.
 */

export interface Capacity {
	/**
	 * Current usage (e.g., active missions, current roster size)
	 */
	current: number;

	/**
	 * Maximum capacity (e.g., max mission slots, max roster size)
	 */
	max: number;

	/**
	 * Available capacity (max - current, clamped to >= 0)
	 */
	available: number;

	/**
	 * Utilization percentage (current / max, 0-1 range)
	 * Returns 0 if max is 0 to avoid division by zero
	 */
	utilization: number;
}

