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
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			expect(adventurers).toHaveLength(1);
			const adventurer = adventurers[0] as import('../../domain/entities/Adventurer').Adventurer;
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
			const adventurersAfterRecruit = Array.from(stateAfterRecruit.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurerId = adventurersAfterRecruit[0].id;

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
			const missions = Array.from(state.entities.values()).filter(e => e.type === 'Mission');
			expect(missions).toHaveLength(1);
			const adventurer = Array.from(state.entities.values()).find(e => e.id === adventurerId) as import('../../domain/entities/Adventurer').Adventurer;
			expect(adventurer.state).toBe('OnMission');
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
			expect(adventurers).toHaveLength(2);
			expect(publishedEvents).toHaveLength(2);
		});

		it('should maintain state consistency across commands', async () => {
			// Recruit adventurer
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			const state1 = busManager.getState();
			const adventurers1 = Array.from(state1.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurerId = adventurers1[0].id;

			// Start mission
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-1',
					adventurerIds: [adventurerId]
				})
			);

			const state2 = busManager.getState();
			const adventurers2 = Array.from(state2.entities.values()).filter(e => e.type === 'Adventurer');

			// Verify adventurer still exists and is updated
			expect(adventurers2).toHaveLength(1);
			expect(adventurers2[0].id).toBe(adventurerId);
			const adventurer = adventurers2[0] as import('../../domain/entities/Adventurer').Adventurer;
			expect(adventurer.state).toBe('OnMission');
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

