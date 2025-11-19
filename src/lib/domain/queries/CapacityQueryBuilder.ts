/**
 * Capacity Query Builder - Creates capacity queries from max and current queries
 * 
 * Provides unified capacity computation pattern: available = max - current
 */

import type { Capacity } from './Capacity';
import type { Query } from './Query';

/**
 * Capacity Query Builder - Static methods for creating capacity queries
 */
export class CapacityQueryBuilder {
	/**
	 * Create a capacity query from max and current queries
	 * 
	 * @param getMax Query that returns maximum capacity
	 * @param getCurrent Query that returns current usage
	 * @returns Query that returns Capacity with current, max, available, and utilization
	 */
	static create(
		getMax: Query<number>,
		getCurrent: Query<number>
	): Query<Capacity> {
		return (state) => {
			const max = getMax(state);
			const current = getCurrent(state);
			const available = Math.max(0, max - current);
			const utilization = max > 0 ? current / max : 0;

			return {
				current,
				max,
				available,
				utilization
			};
		};
	}
}

