/**
 * StartMissionHandler Tests - Fast unit tests with mocked MissionSystem
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStartMissionHandler } from './StartMissionHandler';
import { MissionSystem } from '../domain/systems';
import { createTestPlayerState, createTestAdventurer } from '../test-utils';

describe('StartMissionHandler', () => {
	let missionSystem: MissionSystem;
	let handler: ReturnType<typeof createStartMissionHandler>;

	beforeEach(() => {
		// MissionSystem is now pure - no constructor parameters
		missionSystem = new MissionSystem();
		handler = createStartMissionHandler(missionSystem);
	});

	describe('valid command', () => {
		it('should emit MissionStarted event', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', status: 'idle' });
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const result = await handler(
				{
					missionId: 'mission-1',
					adventurerIds: ['adv-1']
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('MissionStarted');
			expect(result.events[0].payload).toMatchObject({
				missionId: expect.stringMatching(/^mission-1-/), // Unique instance ID
				adventurerIds: ['adv-1']
			});
		});

		it('should add mission to state', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', status: 'idle' });
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const result = await handler(
				{
					missionId: 'mission-1',
					adventurerIds: ['adv-1']
				},
				state
			);

		expect(result.newState.missions).toHaveLength(1);
		expect(result.newState.missions[0].id).toMatch(/^mission-1-/); // Unique instance ID
		});

		it('should mark adventurers as onMission', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', status: 'idle' });
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const result = await handler(
				{
					missionId: 'mission-1',
					adventurerIds: ['adv-1']
				},
				state
			);

		const updatedAdventurer = result.newState.adventurers.find((a) => a.id === 'adv-1');
		expect(updatedAdventurer?.status).toBe('onMission');
		expect(updatedAdventurer?.assignedMissionId).toMatch(/^mission-1-/); // Unique instance ID
		});
	});

	describe('error handling', () => {
		it('should emit CommandFailed when adventurer not found', async () => {
			const state = createTestPlayerState({
				adventurers: []
			});

			const result = await handler(
				{
					missionId: 'mission-1',
					adventurerIds: ['invalid-id']
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'StartMission',
				reason: expect.stringContaining('not found')
			});
		});

		it('should emit CommandFailed when adventurer unavailable', async () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				status: 'onMission'
			});
			const state = createTestPlayerState({
				adventurers: [adventurer]
			});

			const result = await handler(
				{
					missionId: 'mission-1',
					adventurerIds: ['adv-1']
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'StartMission',
				reason: expect.stringContaining('not available')
			});
		});
	});
});

