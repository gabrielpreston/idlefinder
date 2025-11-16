/**
 * Domain Time Source - Pluggable time abstraction for domain logic
 * 
 * Separate from UI TimeSource in src/lib/stores/time/timeSource.ts
 * Domain uses Timestamp, UI uses Readable<number> stores
 */

import { Timestamp } from '../domain/valueObjects/Timestamp';
import { Duration } from '../domain/valueObjects/Duration';

/**
 * Domain time source interface for deterministic time access
 */
export interface DomainTimeSource {
	/**
	 * Get current time as Timestamp
	 */
	now(): Timestamp;
}

/**
 * Real-time source using system clock
 */
export class RealTimeSource implements DomainTimeSource {
	now(): Timestamp {
		return Timestamp.from(Date.now());
	}
}

/**
 * Simulated time source for testing and deterministic replay
 */
export class SimulatedTimeSource implements DomainTimeSource {
	constructor(private currentTime: Timestamp) {}

	now(): Timestamp {
		return this.currentTime;
	}

	/**
	 * Advance simulated time by duration
	 */
	advance(duration: Duration): void {
		this.currentTime = this.currentTime.add(duration);
	}

	/**
	 * Set simulated time to specific timestamp
	 */
	setTime(timestamp: Timestamp): void {
		this.currentTime = timestamp;
	}
}

