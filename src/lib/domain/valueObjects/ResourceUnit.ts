/**
 * Immutable value object representing a single resource type and amount.
 */
export class ResourceUnit {
	constructor(
		public readonly resourceType: string,
		public readonly amount: number
	) {
		if (!this.isValid()) {
			throw new Error(
				`Invalid ResourceUnit: resourceType must be non-empty and amount must be >= 0`
			);
		}
	}

	/**
	 * Validates that the resource unit is valid.
	 * - resourceType must be non-empty
	 * - amount must be >= 0
	 */
	isValid(): boolean {
		return (
			this.resourceType !== undefined &&
			this.resourceType !== null &&
			this.resourceType.trim().length > 0 &&
			this.amount >= 0
		);
	}
}

