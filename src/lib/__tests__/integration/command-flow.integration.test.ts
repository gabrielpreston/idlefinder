/**
 * Command Flow Integration Tests - Fast integration tests with mocked persistence
 * Speed target: <500ms total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCommand, setupIntegrationTest } from '../../test-utils';
import type { BusManager } from '../../bus/BusManager';
import type { DomainEvent } from '../../bus/types';

describe('Command Flow Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
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

			// Verify state updated
			const state = busManager.getState();
			expect(state.adventurers).toHaveLength(1);
			expect(state.adventurers[0].name).toBe('Test Adventurer');
		});

		it('should complete full flow for StartMission command', async () => {
			// First recruit an adventurer
			const recruitCommand = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});
			await busManager.commandBus.dispatch(recruitCommand);

			const adventurerId = busManager.getState().adventurers[0].id;

			// Then start a mission
			const startCommand = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: [adventurerId]
			});
			await busManager.commandBus.dispatch(startCommand);

			// Verify events published
			expect(publishedEvents).toHaveLength(2);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			expect(publishedEvents[1].type).toBe('MissionStarted');

			// Verify state updated
			const state = busManager.getState();
			expect(state.missions).toHaveLength(1);
			expect(state.adventurers[0].status).toBe('onMission');
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
			expect(state.adventurers).toHaveLength(2);
			expect(publishedEvents).toHaveLength(2);
		});

		it('should maintain state consistency across commands', async () => {
			// Recruit adventurer
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			const state1 = busManager.getState();
			const adventurerId = state1.adventurers[0].id;

			// Start mission
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-1',
					adventurerIds: [adventurerId]
				})
			);

			const state2 = busManager.getState();

			// Verify adventurer still exists and is updated
			expect(state2.adventurers).toHaveLength(1);
			expect(state2.adventurers[0].id).toBe(adventurerId);
			expect(state2.adventurers[0].status).toBe('onMission');
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

