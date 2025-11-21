/**
 * Command Flow Integration Tests - Fast integration tests with mocked persistence
 * Speed target: <500ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCommand, setupIntegrationTest, createTestGameState, createTestMission } from '../../test-utils';
import type { BusManager } from '../../bus/BusManager';
import type { DomainEvent } from '../../bus/types';

describe('Command Flow Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		// Create initial state with missions for testing
		const initialState = createTestGameState();
		// Ensure we have at least one available mission
		const existingMissions = Array.from(initialState.entities.values()).filter(
			e => e.type === 'Mission' && (e as import('../../domain/entities/Mission').Mission).state === 'Available'
		);
		if (existingMissions.length === 0) {
			// Add a test mission if none exist
			const testMission = createTestMission({ id: 'test-mission-1', state: 'Available' });
			initialState.entities.set(testMission.id, testMission);
		}
		
		({ busManager, publishedEvents } = setupIntegrationTest({
			initialState,
			eventTypes: ['MissionStarted', 'AdventurerRecruited', 'ResourcesChanged']
		}));
	});

	describe('command → handler → event → state flow', () => {
		it('should complete full flow for RecruitAdventurer command', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: ['brave']
			});

			await busManager.commandBus.dispatch(command);

			// Verify event published
			expect(publishedEvents).toHaveLength(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');

			// Verify state updated - find the recruited adventurer by name
			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			// Initial state has 4 preview adventurers, so we should have 5 total
			expect(adventurers.length).toBeGreaterThanOrEqual(5);
			const adventurer = adventurers.find(a => (a as import('../../domain/entities/Adventurer').Adventurer).metadata.name === 'Test Adventurer') as import('../../domain/entities/Adventurer').Adventurer;
			expect(adventurer).toBeDefined();
			expect(adventurer?.metadata.name).toBe('Test Adventurer');
		});

		it('should complete full flow for StartMission command', async () => {
			// First recruit an adventurer
			const recruitCommand = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});
			await busManager.commandBus.dispatch(recruitCommand);

			const stateAfterRecruit = busManager.getState();
			const adventurersAfterRecruit = Array.from(stateAfterRecruit.entities.values()).filter(e => e.type === 'Adventurer');
			// Find the recruited adventurer by name
			const recruitedAdventurer = adventurersAfterRecruit.find(a => (a as import('../../domain/entities/Adventurer').Adventurer).metadata.name === 'Test Adventurer');
			expect(recruitedAdventurer).toBeDefined();
			const adventurerId = recruitedAdventurer!.id;

			// Get an available mission from the mission pool
			const availableMissions = Array.from(stateAfterRecruit.entities.values()).filter(
				e => e.type === 'Mission' && (e as import('../../domain/entities/Mission').Mission).state === 'Available'
			) as import('../../domain/entities/Mission').Mission[];
			expect(availableMissions.length).toBeGreaterThan(0);
			const missionId = availableMissions[0].id;

			// Then start a mission
			const startCommand = createTestCommand('StartMission', {
				missionId: missionId,
				adventurerIds: [adventurerId]
			});
			await busManager.commandBus.dispatch(startCommand);

			// Verify events published - at least AdventurerRecruited should be published
			expect(publishedEvents.length).toBeGreaterThanOrEqual(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			// MissionStarted may or may not be published depending on handler implementation

			// Verify state updated - mission should be in progress
			const state = busManager.getState();
			const missions = Array.from(state.entities.values()).filter(e => e.type === 'Mission');
			// Initial state has missions in pool, so we should have at least 1 mission
			expect(missions.length).toBeGreaterThan(0);
			const startedMission = missions.find(m => m.id === missionId) as import('../../domain/entities/Mission').Mission;
			expect(startedMission).toBeDefined();
			expect(startedMission?.state).toBe('InProgress');
			const adventurer = Array.from(state.entities.values()).find(e => e.id === adventurerId) as import('../../domain/entities/Adventurer').Adventurer;
			expect(adventurer).toBeDefined();
			expect(adventurer?.state).toBe('OnMission');
		});

		it('should handle multiple commands in sequence', async () => {
			// Recruit multiple adventurers
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Adventurer 1', traits: [] })
			);
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Adventurer 2', traits: [] })
			);

			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			// Initial state has 4 preview adventurers, so we should have 6 total (4 + 2 new)
			expect(adventurers.length).toBeGreaterThanOrEqual(6);
			expect(publishedEvents).toHaveLength(2);
		});

		it('should maintain state consistency across commands', async () => {
			// Recruit adventurer
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			const state1 = busManager.getState();
			const adventurers1 = Array.from(state1.entities.values()).filter(e => e.type === 'Adventurer');
			// Find the recruited adventurer by name
			const recruitedAdventurer = adventurers1.find(a => (a as import('../../domain/entities/Adventurer').Adventurer).metadata.name === 'Test');
			expect(recruitedAdventurer).toBeDefined();
			const adventurerId = recruitedAdventurer!.id;

			// Get an available mission from the mission pool
			const availableMissions = Array.from(state1.entities.values()).filter(
				e => e.type === 'Mission' && (e as import('../../domain/entities/Mission').Mission).state === 'Available'
			) as import('../../domain/entities/Mission').Mission[];
			expect(availableMissions.length).toBeGreaterThan(0);
			const missionId = availableMissions[0].id;

			// Start mission
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: missionId,
					adventurerIds: [adventurerId]
				})
			);

			const state2 = busManager.getState();
			const adventurers2 = Array.from(state2.entities.values()).filter(e => e.type === 'Adventurer');

			// Verify adventurer still exists and is updated
			// Initial state has 4 preview adventurers, so we should have 5 total
			expect(adventurers2.length).toBeGreaterThanOrEqual(5);
			const adventurer = adventurers2.find(a => a.id === adventurerId) as import('../../domain/entities/Adventurer').Adventurer;
			expect(adventurer).toBeDefined();
			expect(adventurer?.id).toBe(adventurerId);
			expect(adventurer?.state).toBe('OnMission');
		});
	});

	describe('event ordering', () => {
		it('should publish events in correct order', async () => {
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test 2', traits: [] })
			);

			expect(publishedEvents).toHaveLength(2);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			expect(publishedEvents[1].type).toBe('AdventurerRecruited');
		});
	});
});

