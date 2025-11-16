/**
 * RecruitAdventurerHandler Tests - Fast unit tests with mocked AdventurerSystem
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRecruitAdventurerHandler } from './RecruitAdventurerHandler';
import { AdventurerSystem } from '../domain/systems/AdventurerSystem';
import { createTestPlayerState } from '../test-utils';

describe('RecruitAdventurerHandler', () => {
	let adventurerSystem: AdventurerSystem;
	let handler: ReturnType<typeof createRecruitAdventurerHandler>;

	beforeEach(() => {
		adventurerSystem = new AdventurerSystem();
		handler = createRecruitAdventurerHandler(adventurerSystem);
	});

	describe('valid command', () => {
		it('should emit AdventurerRecruited event', async () => {
			const state = createTestPlayerState();

			const result = await handler(
				{
					name: 'Test Adventurer',
					traits: ['brave', 'strong']
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('AdventurerRecruited');
			expect(result.events[0].payload).toMatchObject({
				name: 'Test Adventurer',
				traits: ['brave', 'strong']
			});
		});

		it('should add adventurer to state', async () => {
			const state = createTestPlayerState();

			const result = await handler(
				{
					name: 'Test Adventurer',
					traits: ['brave']
				},
				state
			);

			expect(result.newState.adventurers).toHaveLength(1);
			expect(result.newState.adventurers[0].name).toBe('Test Adventurer');
			expect(result.newState.adventurers[0].traits).toEqual(['brave']);
			expect(result.newState.adventurers[0].status).toBe('idle');
			expect(result.newState.adventurers[0].level).toBe(1);
			expect(result.newState.adventurers[0].experience).toBe(0);
		});

		it('should generate unique adventurer ID', async () => {
			const state = createTestPlayerState();

			const result1 = await handler(
				{
					name: 'Adventurer 1',
					traits: []
				},
				state
			);

			const result2 = await handler(
				{
					name: 'Adventurer 2',
					traits: []
				},
				state
			);

			const id1 = result1.newState.adventurers[0].id;
			const id2 = result2.newState.adventurers[0].id;

			expect(id1).not.toBe(id2);
		});
	});

	describe('error handling', () => {
		it('should emit CommandFailed when name is empty', async () => {
			const state = createTestPlayerState();

			const result = await handler(
				{
					name: '',
					traits: []
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'RecruitAdventurer',
				reason: expect.stringContaining('name is required')
			});
		});

		it('should emit CommandFailed when name is whitespace only', async () => {
			const state = createTestPlayerState();

			const result = await handler(
				{
					name: '   ',
					traits: []
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
		});
	});
});

