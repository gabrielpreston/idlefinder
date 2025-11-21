/**
 * Immutable value object representing a collection of mission assignments.
 * Represents "optimal allocation of available resources"
 * All operations return new instances to maintain immutability.
 */

import { MissionAssignment } from './MissionAssignment';

export class MissionAllocation {
	private constructor(private readonly assignments: ReadonlyArray<MissionAssignment>) {
		// Validate no duplicate missions or adventurers
		const missionIds = new Set<string>();
		const adventurerIds = new Set<string>();

		for (const assignment of assignments) {
			if (missionIds.has(assignment.missionId)) {
				throw new Error(
					`Invalid MissionAllocation: duplicate mission ${assignment.missionId}`
				);
			}
			if (adventurerIds.has(assignment.adventurerId)) {
				throw new Error(
					`Invalid MissionAllocation: duplicate adventurer ${assignment.adventurerId}`
				);
			}
			missionIds.add(assignment.missionId);
			adventurerIds.add(assignment.adventurerId);
		}
	}

	/**
	 * Creates an empty allocation.
	 */
	static empty(): MissionAllocation {
		return new MissionAllocation([]);
	}

	/**
	 * Creates an allocation from an array of assignments.
	 */
	static fromAssignments(assignments: MissionAssignment[]): MissionAllocation {
		return new MissionAllocation([...assignments]);
	}

	/**
	 * Adds an assignment to this allocation, returning a new allocation.
	 * Returns the same allocation if the assignment would create a conflict.
	 */
	add(assignment: MissionAssignment): MissionAllocation {
		// Check for conflicts before adding
		if (this.hasMission(assignment.missionId) || this.hasAdventurer(assignment.adventurerId)) {
			return this; // Immutable - return same if conflict
		}
		return new MissionAllocation([...this.assignments, assignment]);
	}

	/**
	 * Checks if a mission is already assigned in this allocation.
	 */
	hasMission(missionId: string): boolean {
		return this.assignments.some((a) => a.missionId === missionId);
	}

	/**
	 * Checks if an adventurer is already assigned in this allocation.
	 */
	hasAdventurer(adventurerId: string): boolean {
		return this.assignments.some((a) => a.adventurerId === adventurerId);
	}

	/**
	 * Gets all assignments in this allocation.
	 */
	getAssignments(): ReadonlyArray<MissionAssignment> {
		return this.assignments;
	}

	/**
	 * Gets the number of assignments in this allocation.
	 */
	getCount(): number {
		return this.assignments.length;
	}

	/**
	 * Checks if this allocation is empty.
	 */
	isEmpty(): boolean {
		return this.assignments.length === 0;
	}

	/**
	 * Gets the total score of all assignments in this allocation.
	 */
	getTotalScore(): number {
		return this.assignments.reduce((sum, a) => sum + a.score, 0);
	}
}

