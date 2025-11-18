/**
 * Slot Generation ResourcesChanged Integration Test
 * Validates that slot generation emits ResourcesChanged events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusManager } from '../../bus/BusManager';
import { registerHandlersV2 } from '../../handlers/indexV2';
import { createTestGameState, createTestResourceBundle, setupMockLocalStorage } from '../../test-utils';
import type { DomainEvent } from '../../bus/types';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { ResourceSlot } from '../../domain/entities/ResourceSlot';
import { Facility } from '../../domain/entities/Facility';
import { Identifier } from '../../domain/valueObjects/Identifier';

describe('Slot Generation ResourcesChanged Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];
	const testTimeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));

	beforeEach(() => {
		vi.useFakeTimers();
		setupMockLocalStorage();

		// Create initial state with a gold slot assigned to player
		const initialState = createTestGameState();
		
		// Find the guildhall facility
		const guildhall = Array.from(initialState.entities.values()).find(
			e => e.type === 'Facility' && (e as Facility).attributes.facilityType === 'Guildhall'
		) as Facility;
		
		expect(guildhall).toBeDefined();
		
		// Find the gold slot
		const goldSlot = Array.from(initialState.entities.values()).find(
			e => e.type === 'ResourceSlot' && e.id === 'slot-gold-1'
		) as ResourceSlot;
		
		expect(goldSlot).toBeDefined();
		expect(goldSlot.attributes.assigneeType).toBe('player');

		busManager = new BusManager(initialState, testTimeSource);
		registerHandlersV2(busManager);

		publishedEvents = [];
		busManager.domainEventBus.subscribe('ResourcesChanged', (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: 'ResourcesChanged',
				payload: payload as DomainEvent['payload'],
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const tickHandler = (busManager as any).tickBus.handlers.values().next().value;
			expect(tickHandler).toBeDefined();
			
			await tickHandler(elapsedMs, new Date(Date.now()));

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
			const goldSlot = Array.from(entities.values()).find(
				e => e.type === 'ResourceSlot' && e.id === 'slot-gold-1'
			) as ResourceSlot;
			
			if (goldSlot) {
				// Unassign the slot
				const unassignedSlot = new ResourceSlot(
					Identifier.from<'SlotId'>(goldSlot.id),
					{
						...goldSlot.attributes,
						assigneeType: 'none',
						assigneeId: null
					},
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

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const tickHandler = (busManager as any).tickBus.handlers.values().next().value;
			await tickHandler(elapsedMs, new Date(Date.now()));

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

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const tickHandler = (busManager as any).tickBus.handlers.values().next().value;
			await tickHandler(elapsedMs, new Date(Date.now()));

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

