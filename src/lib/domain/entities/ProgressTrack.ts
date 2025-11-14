import type { ProgressTrackId, OrganizationId } from '$lib/domain/valueObjects/Identifier';

/**
 * Domain entity representing a progress track for an organization.
 * Tracks progression toward various thresholds and unlocks.
 */
export class ProgressTrack {
	constructor(
		public readonly id: ProgressTrackId,
		public readonly ownerOrganizationId: OrganizationId,
		public readonly trackKey: string,
		public currentValue: number
	) {
		if (currentValue < 0) {
			throw new Error(`ProgressTrack currentValue cannot be negative: ${currentValue}`);
		}
	}

	/**
	 * Increments the current value by the specified amount.
	 */
	increment(amount: number): void {
		if (amount < 0) {
			throw new Error(`Cannot increment by negative amount: ${amount}`);
		}
		this.currentValue += amount;
	}

	/**
	 * Sets the current value to the specified value.
	 * Validates that the value is non-negative.
	 */
	setValue(value: number): void {
		if (value < 0) {
			throw new Error(`ProgressTrack value cannot be negative: ${value}`);
		}
		this.currentValue = value;
	}

	/**
	 * Checks if the track has reached or exceeded the specified threshold.
	 */
	hasReachedThreshold(threshold: number): boolean {
		return this.currentValue >= threshold;
	}
}

