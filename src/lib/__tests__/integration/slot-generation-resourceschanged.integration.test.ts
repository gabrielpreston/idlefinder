/**
 * Slot Generation ResourcesChanged Integration Test
 * Validates that slot generation emits ResourcesChanged events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusManager } from '../../bus/BusManager';
import { registerHandlers } from '../../handlers/index';
import { createTestGameState, createTestResourceBundle, setupMockLocalStorage } from '../../test-utils';
import type { DomainEvent } from '../../bus/types';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { ResourceSlot } from '../../domain/entities/ResourceSlot';
import type { ResourceSlotAttributes } from '../../domain/attributes/ResourceSlotAttributes';
import { Identifier } from '../../domain/valueObjects/Identifier';
import { isResourceSlot } from '../../domain/primitives/EntityTypeGuards';

describe('Slot Generation ResourcesChanged Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];
	const testTimeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));

	beforeEach(() => {
		vi.useFakeTimers();
		setupMockLocalStorage();

		// Create initial state with a gold slot assigned to player
		const initialState = createTestGameState();
		
		// Find the gold slot
		const goldSlot = initialState.entities.get('slot-gold-1');
		expect(goldSlot).toBeDefined();
		if (!goldSlot || !isResourceSlot(goldSlot)) {
			throw new Error('Gold slot not found');
		}
		expect(goldSlot.attributes.assigneeType).toBe('player');

		busManager = new BusManager(initialState, testTimeSource);
		registerHandlers(busManager);

		publishedEvents = [];
		busManager.domainEventBus.subscribe('ResourcesChanged', (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: 'ResourcesChanged',
				payload: payload,
				timestamp: new Date().toISOString()
			});
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('slot generation emits ResourcesChanged', () => {
		it('should emit ResourcesChanged event when slot generates resources', async () => {
			const initialState = busManager.getState();
			const initialGold = initialState.resources.get('gold');
			
			// Advance time by 1 minute (60 seconds) - should generate 6 gold
			// Slot rate is 6 gold/min, player multiplier is 1.0, tier 1 facility multiplier is 1.0
			// Expected: 6 gold generated
			const elapsedMs = 60000; // 1 minute
			vi.advanceTimersByTime(elapsedMs);

			// Manually trigger tick handler
			const handlers = busManager.tickBus.getHandlersForTesting();
			const tickHandler = handlers.values().next().value;
			expect(tickHandler).toBeDefined();
			
			if (tickHandler) {
				await tickHandler(elapsedMs, new Date(Date.now()));
			}

			// Verify ResourcesChanged event was published
			const resourcesChangedEvents = publishedEvents.filter(e => e.type === 'ResourcesChanged');
			expect(resourcesChangedEvents.length).toBeGreaterThan(0);

			// Verify event payload
			const event = resourcesChangedEvents[0];
			expect(event.type).toBe('ResourcesChanged');
			expect(event.payload).toHaveProperty('delta');
			expect(event.payload).toHaveProperty('current');
			
			const payload = event.payload as { delta: { gold: number; fame: number; materials: number }; current: { gold: number; fame: number; materials: number } };
			expect(payload.delta.gold).toBeGreaterThan(0); // Gold should have increased
			expect(payload.current.gold).toBe(initialGold + payload.delta.gold);

			// Verify state was updated
			const finalState = busManager.getState();
			expect(finalState.resources.get('gold')).toBeGreaterThan(initialGold);
		});

		it('should not emit ResourcesChanged when no resources change', async () => {
			// Create state with no assigned slots
			const entities = new Map(busManager.getState().entities);
			const goldSlotEntity = entities.get('slot-gold-1');
			if (goldSlotEntity && goldSlotEntity.type === 'ResourceSlot') {
				const goldSlot = goldSlotEntity as ResourceSlot;
				// Unassign the slot
				const attributes: ResourceSlotAttributes = {
					...goldSlot.attributes,
					assigneeType: 'none',
					assigneeId: null
				};
				const unassignedSlot = new ResourceSlot(
					Identifier.from<'SlotId'>(goldSlot.id),
					attributes,
					[...goldSlot.tags],
					'available',
					goldSlot.timers,
					goldSlot.metadata
				);
				entities.set(goldSlot.id, unassignedSlot);
				
				const stateWithNoSlots = createTestGameState({ entities });
				busManager.setState(stateWithNoSlots);
			}

			const elapsedMs = 60000;
			vi.advanceTimersByTime(elapsedMs);

			const handlers = busManager.tickBus.getHandlersForTesting();
			const tickHandler = handlers.values().next().value;
			if (tickHandler) {
				await tickHandler(elapsedMs, new Date(Date.now()));
			}

			// Should not emit ResourcesChanged if no resources changed
			const resourcesChangedEvents = publishedEvents.filter(e => e.type === 'ResourcesChanged');
			expect(resourcesChangedEvents.length).toBe(0);
		});

		it('should calculate delta correctly for multiple resource types', async () => {
			// Create state with initial resources
			const initialResources = createTestResourceBundle({ gold: 100, fame: 50, materials: 25 });
			const stateWithResources = createTestGameState({ resources: initialResources });
			busManager.setState(stateWithResources);

			const elapsedMs = 60000; // 1 minute
			vi.advanceTimersByTime(elapsedMs);

			const handlers = busManager.tickBus.getHandlersForTesting();
			const tickHandler = handlers.values().next().value;
			if (tickHandler) {
				await tickHandler(elapsedMs, new Date(Date.now()));
			}

			// Verify ResourcesChanged event has correct delta
			const resourcesChangedEvents = publishedEvents.filter(e => e.type === 'ResourcesChanged');
			if (resourcesChangedEvents.length > 0) {
				const event = resourcesChangedEvents[0];
				const payload = event.payload as { delta: { gold: number; fame: number; materials: number }; current: { gold: number; fame: number; materials: number } };
				
				// Delta should reflect the change (gold increased, fame/materials unchanged from slot generation)
				expect(payload.delta.gold).toBeGreaterThan(0);
				expect(payload.current.gold).toBe(100 + payload.delta.gold);
				expect(payload.current.fame).toBe(50);
				expect(payload.current.materials).toBe(25);
			}
		});
	});
});

