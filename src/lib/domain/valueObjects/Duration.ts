import { Timestamp } from './Timestamp';

/**
 * Immutable duration value object representing a time quantity.
 * Wraps milliseconds as the internal representation.
 */
export class Duration {
	private constructor(public readonly milliseconds: number) {}

	/**
	 * Creates a duration from seconds.
	 */
	static ofSeconds(seconds: number): Duration {
		return new Duration(seconds * 1000);
	}

	/**
	 * Creates a duration from minutes.
	 */
	static ofMinutes(minutes: number): Duration {
		return new Duration(minutes * 60 * 1000);
	}

	/**
	 * Creates a duration from hours.
	 */
	static ofHours(hours: number): Duration {
		return new Duration(hours * 60 * 60 * 1000);
	}

	/**
	 * Creates a duration from days.
	 */
	static ofDays(days: number): Duration {
		return new Duration(days * 24 * 60 * 60 * 1000);
	}

	/**
	 * Computes the duration between two timestamps.
	 */
	static between(t1: Timestamp, t2: Timestamp): Duration {
		return new Duration(Math.abs(t2.value - t1.value));
	}

	/**
	 * Adds another duration to this duration, returning a new duration.
	 */
	add(other: Duration): Duration {
		return new Duration(this.milliseconds + other.milliseconds);
	}

	/**
	 * Subtracts another duration from this duration, returning a new duration.
	 */
	subtract(other: Duration): Duration {
		return new Duration(this.milliseconds - other.milliseconds);
	}

	/**
	 * Returns the duration in milliseconds.
	 */
	toMilliseconds(): number {
		return this.milliseconds;
	}

	/**
	 * Returns the duration in seconds.
	 */
	toSeconds(): number {
		return this.milliseconds / 1000;
	}
}

