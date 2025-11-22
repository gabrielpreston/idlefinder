/**
 * Immutable value object representing a single mission-to-adventurer assignment.
 * Represents the domain concept: "Adventurer X assigned to Mission Y"
 */

export class MissionAssignment {
	constructor(
		public readonly missionId: string,
		public readonly adventurerId: string,
		public readonly score: number // Match quality score
	) {
		if (!this.isValid()) {
			throw new Error(
				`Invalid MissionAssignment: missionId and adventurerId must be non-empty, score must be >= 0`
			);
		}
	}

	/**
	 * Creates a mission assignment with validation.
	 */
	static create(missionId: string, adventurerId: string, score: number): MissionAssignment {
		return new MissionAssignment(missionId, adventurerId, score);
	}

	/**
	 * Validates that the mission assignment is valid.
	 * - missionId must be non-empty
	 * - adventurerId must be non-empty
	 * - score must be >= 0
	 */
	isValid(): boolean {
		return (
			this.missionId.trim().length > 0 &&
			this.adventurerId.trim().length > 0 &&
			this.score >= 0
		);
	}

	/**
	 * Checks if this assignment equals another assignment.
	 */
	equals(other: MissionAssignment): boolean {
		return this.missionId === other.missionId && this.adventurerId === other.adventurerId;
	}
}

