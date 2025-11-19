/**
 * UnassignWorkerFromSlotHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestAdventurer } from '../test-utils/testFactories';
import { ResourceSlot } from '../domain/entities/ResourceSlot';
import { Identifier } from '../domain/valueObjects/Identifier';
import type { Entity } from '../domain/primitives/Requirement';

describe('UnassignWorkerFromSlotHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['ResourceSlotUnassigned', 'CommandFailed']
		}));
	});

	describe('UnassignWorkerFromSlot command', () => {
		it('should unassign player from slot', async () => {
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'gold',
					baseRatePerMinute: 10,
					assigneeType: 'player',
					assigneeId: null
				},
				[],
				'occupied',
				{},
				{}
			);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(slot.id, slot);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('UnassignWorkerFromSlot', {
				slotId: 'slot-1'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const updatedSlot = state.entities.get('slot-1') as ResourceSlot;
			expect(updatedSlot.attributes.assigneeType).toBe('none');
			expect(updatedSlot.attributes.assigneeId).toBeNull();
		});

		it('should unassign adventurer from slot', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			// Use assignToSlot method to properly set up the relationship
			adventurer.assignToSlot(Identifier.from<'SlotId'>('slot-1'));
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'gold',
					baseRatePerMinute: 10,
					assigneeType: 'adventurer',
					assigneeId: 'adv-1'
				},
				[],
				'occupied', // Must be 'occupied' for handler to accept
				{},
				{}
			);
			// Create fresh entities map without initial state
			const entities = new Map<string, Entity>();
			entities.set(adventurer.id, adventurer);
			entities.set(slot.id, slot);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('UnassignWorkerFromSlot', {
				slotId: 'slot-1'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const updatedSlot = state.entities.get('slot-1') as ResourceSlot;
			// Handler mutates slot directly, so attributes should be updated
			expect(updatedSlot).toBeDefined();
			expect(updatedSlot.attributes.assigneeType).toBe('none');
			expect(updatedSlot.state).toBe('available');
			const updatedAdventurer = state.entities.get('adv-1') as import('../domain/entities/Adventurer').Adventurer;
			expect(updatedAdventurer).toBeDefined();
			expect(updatedAdventurer.attributes.assignedSlotId).toBeNull();
		});

		it('should fail when slot not found', async () => {
			const command = createTestCommand('UnassignWorkerFromSlot', {
				slotId: 'nonexistent'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when slot has no assignee', async () => {
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

			const command = createTestCommand('UnassignWorkerFromSlot', {
				slotId: 'slot-1'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});
	});
});

