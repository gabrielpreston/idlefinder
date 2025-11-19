/**
 * AssignWorkerToSlotHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestAdventurer } from '../test-utils/testFactories';
import { ResourceSlot } from '../domain/entities/ResourceSlot';
import { Identifier } from '../domain/valueObjects/Identifier';
import type { Entity } from '../domain/primitives/Requirement';

describe('AssignWorkerToSlotHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['ResourceSlotAssigned', 'CommandFailed']
		}));
	});

	describe('AssignWorkerToSlot command', () => {
		it('should assign player to slot', async () => {
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'gold',
					baseRatePerMinute: 10,
					assigneeType: 'none',
					assigneeId: null
				},
				[],
				'available',
				{},
				{}
			);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(slot.id, slot);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('AssignWorkerToSlot', {
				slotId: 'slot-1',
				assigneeType: 'player',
				assigneeId: null
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const updatedSlot = state.entities.get('slot-1') as ResourceSlot;
			expect(updatedSlot.attributes.assigneeType).toBe('player');
		});

		it('should assign adventurer to slot', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'gold',
					baseRatePerMinute: 10,
					assigneeType: 'none',
					assigneeId: null
				},
				[],
				'available',
				{},
				{}
			);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(adventurer.id, adventurer);
			entities.set(slot.id, slot);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('AssignWorkerToSlot', {
				slotId: 'slot-1',
				assigneeType: 'adventurer',
				assigneeId: 'adv-1'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const updatedSlot = state.entities.get('slot-1') as ResourceSlot;
			expect(updatedSlot.attributes.assigneeType).toBe('adventurer');
			expect(updatedSlot.attributes.assigneeId).toBe('adv-1');
		});

		it('should fail when slot not found', async () => {
			const command = createTestCommand('AssignWorkerToSlot', {
				slotId: 'nonexistent',
				assigneeType: 'player',
				assigneeId: null
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when adventurer not found', async () => {
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'gold',
					baseRatePerMinute: 10,
					assigneeType: 'none',
					assigneeId: null
				},
				[],
				'available',
				{},
				{}
			);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(slot.id, slot);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('AssignWorkerToSlot', {
				slotId: 'slot-1',
				assigneeType: 'adventurer',
				assigneeId: 'nonexistent'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});
	});
});

