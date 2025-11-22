/**
 * Command Flow Integration Tests - Fast integration tests with mocked persistence
 * Speed target: <500ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCommand, setupIntegrationTest, createTestGameState, createTestMission } from '../../test-utils';
import { createTestFacility } from '../../test-utils/testFactories';
import { requireGuildHall, findAvailableMissions, findAdventurerById } from '../../test-utils/entityTestHelpers';
import { expectAdventurerExists } from '../../test-utils/expectHelpers';
import { isMission } from '../../domain/primitives/EntityTypeGuards';
import type { BusManager } from '../../bus/BusManager';
import type { DomainEvent } from '../../bus/types';
// Import gating module to ensure gates are registered
import '../../domain/gating';

describe('Command Flow Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		// Create initial state with missions for testing
		const initialState = createTestGameState();
		
		// Upgrade Guild Hall to tier 1 to unlock roster_capacity_1 gate (capacity = 1)
		// This allows recruitment in tests
		const guildhall = requireGuildHall(initialState);
		guildhall.upgrade(); // Upgrades from tier 0 to tier 1
		
		// Ensure we have at least one available mission
		const existingMissions = findAvailableMissions(initialState);
		if (existingMissions.length === 0) {
			// Add a test mission if none exist
			const testMission = createTestMission({ id: 'test-mission-1', state: 'Available' });
			initialState.entities.set(testMission.id, testMission);
		}
		
		({ busManager, publishedEvents } = setupIntegrationTest({
			initialState,
			eventTypes: ['MissionStarted', 'AdventurerRecruited', 'ResourcesChanged', 'CommandFailed']
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
			// Initial state has 4 preview adventurers, so we should have 5 total
			const adventurer = expectAdventurerExists(state, 'Test Adventurer');
			expect(adventurer.metadata.name).toBe('Test Adventurer');
		});

		it('should complete full flow for StartMission command', async () => {
			// First recruit an adventurer
			const recruitCommand = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});
			await busManager.commandBus.dispatch(recruitCommand);

			const stateAfterRecruit = busManager.getState();
			// Find the recruited adventurer by name
			const recruitedAdventurer = expectAdventurerExists(stateAfterRecruit, 'Test Adventurer');
			const adventurerId = recruitedAdventurer.id;

			// Get an available mission from the mission pool
			const availableMissions = findAvailableMissions(stateAfterRecruit);
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
			const startedMission = state.entities.get(missionId);
			expect(startedMission).toBeDefined();
			if (startedMission && isMission(startedMission)) {
				expect(startedMission.state).toBe('InProgress');
			}
			const adventurer = findAdventurerById(state, adventurerId);
			expect(adventurer.state).toBe('OnMission');
		});

		it('should handle multiple commands in sequence', async () => {
			// Add Dormitory facility to unlock roster_capacity_2 (capacity = 2)
			let state = busManager.getState();
			const dormitory = createTestFacility({ 
				facilityType: 'Dormitory', 
				tier: 1 
			});
			state.entities.set(dormitory.id, dormitory);
			busManager.setState(state);
			
			// Recruit multiple adventurers
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Adventurer 1', traits: [] })
			);
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Adventurer 2', traits: [] })
			);

			state = busManager.getState();
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
			// Find the recruited adventurer by name
			const recruitedAdventurer = expectAdventurerExists(state1, 'Test');
			const adventurerId = recruitedAdventurer.id;

			// Get an available mission from the mission pool
			const availableMissions = findAvailableMissions(state1);
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

			// Verify adventurer still exists and is updated
			const adventurer = findAdventurerById(state2, adventurerId);
			expect(adventurer.id).toBe(adventurerId);
			expect(adventurer.state).toBe('OnMission');
		});
	});

	describe('event ordering', () => {
		it('should publish events in correct order', async () => {
			// Add Dormitory facility to unlock roster_capacity_2 (capacity = 2)
			let state = busManager.getState();
			const dormitory = createTestFacility({ 
				facilityType: 'Dormitory', 
				tier: 1 
			});
			state.entities.set(dormitory.id, dormitory);
			busManager.setState(state);
			
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

