/**
 * AdventurerSystem Tests - Fast unit tests
 * Speed target: <200ms total
 */

import { describe, it, expect } from 'vitest';
import { AdventurerSystem } from './AdventurerSystem';
import { createTestPlayerState, createTestAdventurer } from '../../test-utils';

describe('AdventurerSystem', () => {
	const system = new AdventurerSystem();

	describe('recruit', () => {
		it('should add new adventurer to state', () => {
			const state = createTestPlayerState({
				adventurers: []
			});

			const newState = system.recruit(state, 'adv-1', 'Test Adventurer', ['brave', 'strong']);

			expect(newState.adventurers).toHaveLength(1);
			expect(newState.adventurers[0].id).toBe('adv-1');
			expect(newState.adventurers[0].name).toBe('Test Adventurer');
			expect(newState.adventurers[0].traits).toEqual(['brave', 'strong']);
			expect(newState.adventurers[0].level).toBe(1);
			expect(newState.adventurers[0].experience).toBe(0);
			expect(newState.adventurers[0].status).toBe('idle');
			expect(newState.adventurers[0].assignedMissionId).toBeNull();
		});

		it('should preserve existing adventurers', () => {
			const existingAdventurer = createTestAdventurer({ id: 'adv-1', name: 'Existing' });
			const state = createTestPlayerState({
				adventurers: [existingAdventurer]
			});

			const newState = system.recruit(state, 'adv-2', 'New Adventurer', []);

			expect(newState.adventurers).toHaveLength(2);
			expect(newState.adventurers.find((a) => a.id === 'adv-1')?.name).toBe('Existing');
			expect(newState.adventurers.find((a) => a.id === 'adv-2')?.name).toBe('New Adventurer');
		});
	});

	describe('applyExperience', () => {
		it('should add experience to adventurer', () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				experience: 50,
				level: 1
			});
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const newState = system.applyExperience(state, 'adv-1', 30);

			const updatedAdventurer = newState.adventurers.find((a) => a.id === 'adv-1');
			expect(updatedAdventurer?.experience).toBe(80);
		});

		it('should level up adventurer when experience threshold reached', () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				experience: 90,
				level: 1
			});
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const newState = system.applyExperience(state, 'adv-1', 20); // 90 + 20 = 110, should level up

			const updatedAdventurer = newState.adventurers.find((a) => a.id === 'adv-1');
			expect(updatedAdventurer?.experience).toBe(110);
			expect(updatedAdventurer?.level).toBe(2); // Level 2 (110 / 100 = 1, + 1 = 2)
		});

		it('should not level up if threshold not reached', () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				experience: 50,
				level: 1
			});
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const newState = system.applyExperience(state, 'adv-1', 30); // 50 + 30 = 80, should not level up

			const updatedAdventurer = newState.adventurers.find((a) => a.id === 'adv-1');
			expect(updatedAdventurer?.experience).toBe(80);
			expect(updatedAdventurer?.level).toBe(1); // Still level 1
		});

		it('should not modify other adventurers', () => {
			const adventurer1 = createTestAdventurer({
				id: 'adv-1',
				experience: 50,
				level: 1
			});
			const adventurer2 = createTestAdventurer({
				id: 'adv-2',
				experience: 100,
				level: 2
			});
			const state = createTestPlayerState({
				adventurers: [adventurer1, adventurer2]
			});

			const newState = system.applyExperience(state, 'adv-1', 30);

			const updatedAdv2 = newState.adventurers.find((a) => a.id === 'adv-2');
			expect(updatedAdv2?.experience).toBe(100);
			expect(updatedAdv2?.level).toBe(2);
		});

		it('should handle multiple level ups', () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				experience: 50,
				level: 1
			});
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const newState = system.applyExperience(state, 'adv-1', 250); // 50 + 250 = 300, should level up to 4

			const updatedAdventurer = newState.adventurers.find((a) => a.id === 'adv-1');
			expect(updatedAdventurer?.experience).toBe(300);
			expect(updatedAdventurer?.level).toBe(4); // Level 4 (Math.floor(300 / 100) + 1 = 4)
		});
	});
});

