/**
 * MissionSystem Tests - Fast unit tests
 * Speed target: <200ms total
 */

import { describe, it, expect, vi } from 'vitest';
import { MissionSystem } from './MissionSystem';
import { createTestPlayerState, createTestAdventurer, createTestMission } from '../../test-utils';
import type { CommandBus } from '../../bus/CommandBus';
import type { PlayerState } from '../entities/PlayerState';

describe('MissionSystem', () => {
	const system = new MissionSystem();

	describe('startMission', () => {
		it('should create mission and update adventurers', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1', status: 'idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', status: 'idle' });
			const state = createTestPlayerState({
				adventurers: [adventurer1, adventurer2]
			});

			const startTime = new Date().toISOString();
			const { newState, events } = system.startMission(
				state,
				'mission-1',
				'Test Mission',
				60000,
				['adv-1', 'adv-2'],
				{
					resources: { gold: 50, supplies: 10, relics: 0 },
					fame: 1,
					experience: 10
				},
				startTime
			);

			// Mission should be added
			expect(newState.missions).toHaveLength(1);
			expect(newState.missions[0].id).toBe('mission-1');
			expect(newState.missions[0].status).toBe('inProgress');
			expect(newState.missions[0].assignedAdventurerIds).toEqual(['adv-1', 'adv-2']);

			// Adventurers should be updated
			const updatedAdv1 = newState.adventurers.find((a) => a.id === 'adv-1');
			const updatedAdv2 = newState.adventurers.find((a) => a.id === 'adv-2');
			expect(updatedAdv1?.status).toBe('onMission');
			expect(updatedAdv1?.assignedMissionId).toBe('mission-1');
			expect(updatedAdv2?.status).toBe('onMission');
			expect(updatedAdv2?.assignedMissionId).toBe('mission-1');

			// Should return MissionStarted event
			expect(events).toHaveLength(1);
			expect(events[0].type).toBe('MissionStarted');
			expect(events[0].payload).toMatchObject({
				missionId: 'mission-1',
				adventurerIds: ['adv-1', 'adv-2']
			});
		});

		it('should not modify unassigned adventurers', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1', status: 'idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', status: 'idle' });
			const state = createTestPlayerState({
				adventurers: [adventurer1, adventurer2]
			});

			const startTime = new Date().toISOString();
			const { newState } = system.startMission(
				state,
				'mission-1',
				'Test Mission',
				60000,
				['adv-1'], // Only assign adv-1
				{
					resources: { gold: 50, supplies: 10, relics: 0 },
					fame: 1,
					experience: 10
				},
				startTime
			);

			// adv-2 should remain idle
			const updatedAdv2 = newState.adventurers.find((a) => a.id === 'adv-2');
			expect(updatedAdv2?.status).toBe('idle');
			expect(updatedAdv2?.assignedMissionId).toBeNull();
		});
	});

	describe('createTickHandler', () => {
		it('should dispatch CompleteMission command when mission duration elapsed', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				duration: 5000, // 5 seconds
				startTime: new Date(Date.now() - 10000).toISOString(), // Started 10 seconds ago
				status: 'inProgress'
			});
			const state = createTestPlayerState({
				missions: [mission]
			});

			const commandBus = {
				dispatch: vi.fn().mockResolvedValue(undefined)
			} as unknown as CommandBus<PlayerState>;

			const stateGetter = () => state;
			const tickHandler = system.createTickHandler(commandBus, stateGetter);

			// Trigger tick with current time (mission should be complete)
			const now = new Date();
			await tickHandler(1000, now);

			// Should dispatch CompleteMission command
			expect(commandBus.dispatch).toHaveBeenCalledWith({
				type: 'CompleteMission',
				payload: {
					missionId: 'mission-1'
				},
				timestamp: now.toISOString()
			});
		});

		it('should not dispatch command if mission not yet complete', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				duration: 5000, // 5 seconds
				startTime: new Date().toISOString(), // Just started
				status: 'inProgress'
			});
			const state = createTestPlayerState({
				missions: [mission]
			});

			const commandBus = {
				dispatch: vi.fn().mockResolvedValue(undefined)
			} as unknown as CommandBus<PlayerState>;

			const stateGetter = () => state;
			const tickHandler = system.createTickHandler(commandBus, stateGetter);

			// Trigger tick with current time (mission should not be complete)
			const now = new Date();
			await tickHandler(1000, now);

			// Should not dispatch command
			expect(commandBus.dispatch).not.toHaveBeenCalled();
		});

		it('should not dispatch command if mission already completed', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				duration: 5000,
				startTime: new Date(Date.now() - 10000).toISOString(),
				status: 'completed' // Already completed
			});
			const state = createTestPlayerState({
				missions: [mission]
			});

			const commandBus = {
				dispatch: vi.fn().mockResolvedValue(undefined)
			} as unknown as CommandBus<PlayerState>;

			const stateGetter = () => state;
			const tickHandler = system.createTickHandler(commandBus, stateGetter);

			const now = new Date();
			await tickHandler(1000, now);

			// Should not dispatch command
			expect(commandBus.dispatch).not.toHaveBeenCalled();
		});
	});
});

