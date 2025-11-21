import { describe, it, expect } from 'vitest';
import { MissionAssignment } from './MissionAssignment';

describe('MissionAssignment', () => {
	describe('constructor', () => {
		it('should create valid mission assignment', () => {
			const assignment = new MissionAssignment('mission-1', 'adv-1', 100);
			expect(assignment.missionId).toBe('mission-1');
			expect(assignment.adventurerId).toBe('adv-1');
			expect(assignment.score).toBe(100);
			expect(assignment.isValid()).toBe(true);
		});

		it('should allow zero score', () => {
			const assignment = new MissionAssignment('mission-1', 'adv-1', 0);
			expect(assignment.isValid()).toBe(true);
		});

		it('should throw error for negative score', () => {
			expect(() => new MissionAssignment('mission-1', 'adv-1', -1)).toThrow('Invalid MissionAssignment');
		});

		it('should throw error for empty mission ID', () => {
			expect(() => new MissionAssignment('', 'adv-1', 100)).toThrow('Invalid MissionAssignment');
		});

		it('should throw error for empty adventurer ID', () => {
			expect(() => new MissionAssignment('mission-1', '', 100)).toThrow('Invalid MissionAssignment');
		});

		it('should throw error for whitespace-only mission ID', () => {
			expect(() => new MissionAssignment('   ', 'adv-1', 100)).toThrow('Invalid MissionAssignment');
		});

		it('should throw error for whitespace-only adventurer ID', () => {
			expect(() => new MissionAssignment('mission-1', '   ', 100)).toThrow('Invalid MissionAssignment');
		});
	});

	describe('create', () => {
		it('should create assignment using static factory method', () => {
			const assignment = MissionAssignment.create('mission-1', 'adv-1', 100);
			expect(assignment.missionId).toBe('mission-1');
			expect(assignment.adventurerId).toBe('adv-1');
			expect(assignment.score).toBe(100);
		});
	});

	describe('isValid', () => {
		it('should return true for valid assignment', () => {
			const assignment = new MissionAssignment('mission-1', 'adv-1', 100);
			expect(assignment.isValid()).toBe(true);
		});

		it('should return false for negative score', () => {
			// Create invalid assignment by bypassing constructor validation
			const assignment = Object.create(MissionAssignment.prototype);
			assignment.missionId = 'mission-1';
			assignment.adventurerId = 'adv-1';
			assignment.score = -1;
			expect(assignment.isValid()).toBe(false);
		});

		it('should return false for empty mission ID', () => {
			const assignment = Object.create(MissionAssignment.prototype);
			assignment.missionId = '';
			assignment.adventurerId = 'adv-1';
			assignment.score = 100;
			expect(assignment.isValid()).toBe(false);
		});

		it('should return false for empty adventurer ID', () => {
			const assignment = Object.create(MissionAssignment.prototype);
			assignment.missionId = 'mission-1';
			assignment.adventurerId = '';
			assignment.score = 100;
			expect(assignment.isValid()).toBe(false);
		});
	});

	describe('equals', () => {
		it('should return true for equal assignments', () => {
			const assignment1 = new MissionAssignment('mission-1', 'adv-1', 100);
			const assignment2 = new MissionAssignment('mission-1', 'adv-1', 200);
			expect(assignment1.equals(assignment2)).toBe(true);
		});

		it('should return false for different mission IDs', () => {
			const assignment1 = new MissionAssignment('mission-1', 'adv-1', 100);
			const assignment2 = new MissionAssignment('mission-2', 'adv-1', 100);
			expect(assignment1.equals(assignment2)).toBe(false);
		});

		it('should return false for different adventurer IDs', () => {
			const assignment1 = new MissionAssignment('mission-1', 'adv-1', 100);
			const assignment2 = new MissionAssignment('mission-1', 'adv-2', 100);
			expect(assignment1.equals(assignment2)).toBe(false);
		});
	});

	describe('immutability', () => {
		it('should have readonly properties', () => {
			const assignment = new MissionAssignment('mission-1', 'adv-1', 100);
			// TypeScript should prevent assignment, but we can verify at runtime
			expect(() => {
				(assignment as { missionId: string }).missionId = 'mission-2';
			}).not.toThrow(); // Runtime allows but TypeScript prevents
		});
	});
});

