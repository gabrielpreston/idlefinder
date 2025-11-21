import { describe, it, expect } from 'vitest';
import { MissionAllocation } from './MissionAllocation';
import { MissionAssignment } from './MissionAssignment';

describe('MissionAllocation', () => {
	describe('empty', () => {
		it('should create empty allocation', () => {
			const allocation = MissionAllocation.empty();
			expect(allocation.isEmpty()).toBe(true);
			expect(allocation.getCount()).toBe(0);
			expect(allocation.getTotalScore()).toBe(0);
		});
	});

	describe('fromAssignments', () => {
		it('should create allocation from assignments', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-2', 'adv-2', 200);
			const allocation = MissionAllocation.fromAssignments([assignment1, assignment2]);

			expect(allocation.getCount()).toBe(2);
			expect(allocation.getTotalScore()).toBe(300);
		});

		it('should throw error for duplicate missions', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-1', 'adv-2', 200);

			expect(() => MissionAllocation.fromAssignments([assignment1, assignment2])).toThrow(
				'Invalid MissionAllocation: duplicate mission'
			);
		});

		it('should throw error for duplicate adventurers', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-2', 'adv-1', 200);

			expect(() => MissionAllocation.fromAssignments([assignment1, assignment2])).toThrow(
				'Invalid MissionAllocation: duplicate adventurer'
			);
		});
	});

	describe('add', () => {
		it('should add assignment to allocation', () => {
			const allocation = MissionAllocation.empty();
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);

			const newAllocation = allocation.add(assignment);

			expect(newAllocation.getCount()).toBe(1);
			expect(newAllocation.getTotalScore()).toBe(100);
			expect(newAllocation).not.toBe(allocation); // Immutability check
		});

		it('should return same allocation if mission already assigned', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-1', 'adv-2', 200);
			const allocation = MissionAllocation.fromAssignments([assignment1]);

			const newAllocation = allocation.add(assignment2);

			expect(newAllocation.getCount()).toBe(1);
			expect(newAllocation).toBe(allocation); // Returns same if conflict
		});

		it('should return same allocation if adventurer already assigned', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-2', 'adv-1', 200);
			const allocation = MissionAllocation.fromAssignments([assignment1]);

			const newAllocation = allocation.add(assignment2);

			expect(newAllocation.getCount()).toBe(1);
			expect(newAllocation).toBe(allocation); // Returns same if conflict
		});

		it('should add multiple assignments', () => {
			let allocation = MissionAllocation.empty();
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-2', 'adv-2', 200);

			allocation = allocation.add(assignment1);
			allocation = allocation.add(assignment2);

			expect(allocation.getCount()).toBe(2);
			expect(allocation.getTotalScore()).toBe(300);
		});
	});

	describe('hasMission', () => {
		it('should return true if mission is assigned', () => {
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			const allocation = MissionAllocation.fromAssignments([assignment]);

			expect(allocation.hasMission('mission-1')).toBe(true);
		});

		it('should return false if mission is not assigned', () => {
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			const allocation = MissionAllocation.fromAssignments([assignment]);

			expect(allocation.hasMission('mission-2')).toBe(false);
		});
	});

	describe('hasAdventurer', () => {
		it('should return true if adventurer is assigned', () => {
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			const allocation = MissionAllocation.fromAssignments([assignment]);

			expect(allocation.hasAdventurer('adv-1')).toBe(true);
		});

		it('should return false if adventurer is not assigned', () => {
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			const allocation = MissionAllocation.fromAssignments([assignment]);

			expect(allocation.hasAdventurer('adv-2')).toBe(false);
		});
	});

	describe('getAssignments', () => {
		it('should return all assignments', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-2', 'adv-2', 200);
			const allocation = MissionAllocation.fromAssignments([assignment1, assignment2]);

			const assignments = allocation.getAssignments();

			expect(assignments).toHaveLength(2);
			expect(assignments[0].missionId).toBe('mission-1');
			expect(assignments[1].missionId).toBe('mission-2');
		});
	});

	describe('getCount', () => {
		it('should return correct count', () => {
			const allocation = MissionAllocation.empty();
			expect(allocation.getCount()).toBe(0);

			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			const newAllocation = allocation.add(assignment);
			expect(newAllocation.getCount()).toBe(1);
		});
	});

	describe('isEmpty', () => {
		it('should return true for empty allocation', () => {
			const allocation = MissionAllocation.empty();
			expect(allocation.isEmpty()).toBe(true);
		});

		it('should return false for non-empty allocation', () => {
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			const allocation = MissionAllocation.fromAssignments([assignment]);
			expect(allocation.isEmpty()).toBe(false);
		});
	});

	describe('getTotalScore', () => {
		it('should return sum of all assignment scores', () => {
			const assignment1 = MissionAssignment.create('mission-1', 'adv-1', 100);
			const assignment2 = MissionAssignment.create('mission-2', 'adv-2', 200);
			const allocation = MissionAllocation.fromAssignments([assignment1, assignment2]);

			expect(allocation.getTotalScore()).toBe(300);
		});

		it('should return 0 for empty allocation', () => {
			const allocation = MissionAllocation.empty();
			expect(allocation.getTotalScore()).toBe(0);
		});
	});

	describe('immutability', () => {
		it('should return new allocation when adding assignment', () => {
			const allocation = MissionAllocation.empty();
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);

			const newAllocation = allocation.add(assignment);

			expect(newAllocation).not.toBe(allocation);
			expect(allocation.isEmpty()).toBe(true); // Original unchanged
			expect(newAllocation.isEmpty()).toBe(false);
		});
	});
});

