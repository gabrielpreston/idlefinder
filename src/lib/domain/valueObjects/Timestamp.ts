import { Duration } from './Duration';

/**
 * Immutable timestamp value object representing absolute time.
 * Wraps milliseconds since epoch (Unix timestamp).
 * 
 * Note: Timestamp.now() is only allowed in value objects, not domain systems.
 * Domain systems should receive timestamps as parameters.
 */
export class Timestamp {
	private constructor(public readonly value: number) {}

	/**
	 * Creates a timestamp representing the current time.
	 * Only allowed in value objects, not domain systems.
	 */
	static now(): Timestamp {
		return new Timestamp(Date.now());
	}

	/**
	 * Creates a timestamp from a number (milliseconds) or Date object.
	 */
	static from(value: number | Date): Timestamp {
		if (value instanceof Date) {
			return new Timestamp(value.getTime());
		}
		return new Timestamp(value);
	}

	/**
	 * Adds a duration to this timestamp, returning a new timestamp.
	 */
	add(duration: Duration): Timestamp {
		return new Timestamp(this.value + duration.toMilliseconds());
	}

	/**
	 * Subtracts a duration from this timestamp, returning a new timestamp.
	 */
	subtract(duration: Duration): Timestamp {
		return new Timestamp(this.value - duration.toMilliseconds());
	}

	/**
	 * Checks if this timestamp is before another timestamp.
	 */
	isBefore(other: Timestamp): boolean {
		return this.value < other.value;
	}

	/**
	 * Checks if this timestamp is after another timestamp.
	 */
	isAfter(other: Timestamp): boolean {
		return this.value > other.value;
	}

	/**
	 * Checks if this timestamp equals another timestamp.
	 */
	equals(other: Timestamp): boolean {
		return this.value === other.value;
	}
}

