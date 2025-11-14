/**
 * Stat key type for numeric stat maps.
 */
export type StatKey = string;

/**
 * Immutable value object representing a map of stat keys to numeric values.
 * All operations return new instances to maintain immutability.
 */
export class NumericStatMap {
	constructor(private stats: Map<StatKey, number>) {}

	/**
	 * Gets the value for a stat key.
	 * Returns 0 if the key is not present.
	 */
	get(key: StatKey): number {
		return this.stats.get(key) ?? 0;
	}

	/**
	 * Sets a stat value, returning a new NumericStatMap.
	 */
	set(key: StatKey, value: number): NumericStatMap {
		const newStats = new Map<StatKey, number>(this.stats);
		newStats.set(key, value);
		return new NumericStatMap(newStats);
	}

	/**
	 * Adds an amount to a stat value, returning a new NumericStatMap.
	 */
	add(key: StatKey, amount: number): NumericStatMap {
		const currentValue = this.get(key);
		return this.set(key, currentValue + amount);
	}

	/**
	 * Multiplies a stat value by a factor, returning a new NumericStatMap.
	 */
	multiply(key: StatKey, factor: number): NumericStatMap {
		const currentValue = this.get(key);
		return this.set(key, currentValue * factor);
	}

	/**
	 * Merges another NumericStatMap into this one, returning a new NumericStatMap.
	 * Values for the same keys are added together.
	 */
	merge(other: NumericStatMap): NumericStatMap {
		const newStats = new Map<StatKey, number>(this.stats);
		for (const [key, value] of other.stats.entries()) {
			const currentValue = newStats.get(key) ?? 0;
			newStats.set(key, currentValue + value);
		}
		return new NumericStatMap(newStats);
	}

	/**
	 * Returns the underlying Map of stats.
	 */
	toMap(): Map<StatKey, number> {
		return new Map<StatKey, number>(this.stats);
	}

	/**
	 * Creates a NumericStatMap from a Map of stats.
	 */
	static fromMap(map: Map<StatKey, number>): NumericStatMap {
		return new NumericStatMap(new Map<StatKey, number>(map));
	}
}

