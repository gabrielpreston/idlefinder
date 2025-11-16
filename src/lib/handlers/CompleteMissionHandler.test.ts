/**
 * CompleteMissionHandler Tests - Fast unit tests
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCompleteMissionHandler } from './CompleteMissionHandler';
import { AdventurerSystem } from '../domain/systems';
import { createTestPlayerState, createTestMission, createTestAdventurer } from '../test-utils';

describe('CompleteMissionHandler', () => {
	let adventurerSystem: AdventurerSystem;
	let handler: ReturnType<typeof createCompleteMissionHandler>;

	beforeEach(() => {
		adventurerSystem = new AdventurerSystem();
		handler = createCompleteMissionHandler(adventurerSystem);
	});

	describe('valid command', () => {
		it('should emit MissionCompleted and ResourcesChanged events', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				status: 'inProgress',
				reward: {
					resources: { gold: 50, supplies: 10, relics: 0 },
					fame: 1,
					experience: 10
				}
			});
			const state = createTestPlayerState({
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			expect(result.events).toHaveLength(2);
			expect(result.events[0].type).toBe('MissionCompleted');
			expect(result.events[1].type).toBe('ResourcesChanged');
		});

		it('should mark mission as completed', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				status: 'inProgress'
			});
			const state = createTestPlayerState({
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			const completedMission = result.newState.missions.find((m) => m.id === 'mission-1');
			expect(completedMission?.status).toBe('completed');
		});

		it('should apply rewards to resources', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				status: 'inProgress',
				reward: {
					resources: { gold: 50, supplies: 10, relics: 0 },
					fame: 1,
					experience: 10
				}
			});
			const state = createTestPlayerState({
				resources: { gold: 100, supplies: 20, relics: 0 },
				fame: 0,
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			expect(result.newState.resources.gold).toBe(150);
			expect(result.newState.resources.supplies).toBe(30);
			expect(result.newState.fame).toBe(1);
		});

		it('should reset adventurer status to idle', async () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				status: 'onMission',
				assignedMissionId: 'mission-1'
			});
			const mission = createTestMission({
				id: 'mission-1',
				status: 'inProgress',
				assignedAdventurerIds: ['adv-1']
			});
			const state = createTestPlayerState({
				adventurers: [adventurer],
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			const updatedAdventurer = result.newState.adventurers.find((a) => a.id === 'adv-1');
			expect(updatedAdventurer?.status).toBe('idle');
			expect(updatedAdventurer?.assignedMissionId).toBeNull();
		});

		it('should apply experience to adventurers', async () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				experience: 0,
				level: 1
			});
			const mission = createTestMission({
				id: 'mission-1',
				status: 'inProgress',
				assignedAdventurerIds: ['adv-1'],
				reward: {
					resources: { gold: 50, supplies: 10, relics: 0 },
					fame: 1,
					experience: 50
				}
			});
			const state = createTestPlayerState({
				adventurers: [adventurer],
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			const updatedAdventurer = result.newState.adventurers.find((a) => a.id === 'adv-1');
			expect(updatedAdventurer?.experience).toBe(50);
		});

		it('should add mission ID to completedMissionIds', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				status: 'inProgress'
			});
			const state = createTestPlayerState({
				completedMissionIds: [],
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			expect(result.newState.completedMissionIds).toContain('mission-1');
		});
	});

	describe('error handling', () => {
		it('should emit CommandFailed when mission not found', async () => {
			const state = createTestPlayerState({
				missions: []
			});

			const result = await handler(
				{
					missionId: 'invalid-mission'
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'CompleteMission',
				reason: expect.stringContaining('not found')
			});
		});

		it('should emit CommandFailed when mission already completed', async () => {
			const mission = createTestMission({
				id: 'mission-1',
				status: 'completed'
			});
			const state = createTestPlayerState({
				missions: [mission]
			});

			const result = await handler(
				{
					missionId: 'mission-1'
				},
				state
			);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CommandFailed');
			expect(result.events[0].payload).toMatchObject({
				commandType: 'CompleteMission',
				reason: expect.stringContaining('already completed')
			});
		});
	});
});

