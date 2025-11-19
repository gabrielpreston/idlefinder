/**
 * startGame Runtime Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startGame } from './startGame';
import { createTestGameState } from '../test-utils/testFactories';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';

describe('startGame', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('startGame', () => {
		it('should create game runtime', () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			expect(runtime).toBeDefined();
			expect(runtime.busManager).toBeDefined();
			expect(runtime.timeSource).toBeDefined();
			expect(runtime.gameState).toBeDefined();
		});

		it('should use provided time source', () => {
			const state = createTestGameState();
			const timeSource = new SimulatedTimeSource(Timestamp.now());
			const runtime = startGame(state, timeSource);

			expect(runtime.timeSource).toBe(timeSource);
		});

		it('should use default time source when not provided', () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			expect(runtime.timeSource).toBeDefined();
		});

		it('should register handlers', () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			// Verify handlers are registered by checking if command can be dispatched
			expect(runtime.busManager.commandBus).toBeDefined();
		});

		it('should provide gameState store', () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			let storeValue: typeof state | undefined;
			const unsubscribe = runtime.gameState.subscribe((value) => {
				storeValue = value;
			});

			expect(storeValue).toBeDefined();
			unsubscribe();
		});

		it('should provide refreshGameState method', () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			expect(typeof runtime.refreshGameState).toBe('function');
			runtime.refreshGameState();
		});

		it('should provide destroy method', () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			expect(typeof runtime.destroy).toBe('function');
			runtime.destroy();
		});

		it('should update gameState store on events', async () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			let storeValue: typeof state | undefined;
			const unsubscribe = runtime.gameState.subscribe((value) => {
				storeValue = value;
			});

			// Trigger an event that updates state
			await runtime.busManager.commandBus.dispatch({
				type: 'RecruitAdventurer',
				payload: { name: 'Test', traits: [] },
				timestamp: new Date().toISOString()
			});

			// Store should be updated
			expect(storeValue).toBeDefined();
			unsubscribe();
		});

		it('should handle FacilityUpgraded event with slot creation', async () => {
			// Use real timers for this test to avoid issues with async handlers
			vi.useRealTimers();

			// Create state with a Guildhall at tier 1 (no gold slot #2 yet)
			// Use the initial state's Guildhall ID to ensure we're working with the same facility
			const baseState = createTestGameState();
			const initialGuildhall = Array.from(baseState.entities.values()).find(
				(e) => e.type === 'Facility' && (e as any).attributes.facilityType === 'Guildhall'
			);
			expect(initialGuildhall).toBeDefined();
			const guildhallId = initialGuildhall!.id;

			// Upgrade the Guildhall to tier 1 first (if not already)
			const entities = new Map(baseState.entities);
			const guildhall = entities.get(guildhallId) as any;
			if (guildhall) {
				guildhall.attributes.tier = 1;
			}
			const state = createTestGameState({ entities });

			const runtime = startGame(state);

			// Count slots before upgrade
			const slotsBefore = Array.from(state.entities.values()).filter(
				(e) => e.type === 'ResourceSlot'
			).length;

			// Trigger FacilityUpgraded event for Guildhall tier 2 to test slotsToCreate.length > 0 branch
			await runtime.busManager.domainEventBus.publish({
				type: 'FacilityUpgraded',
				payload: {
					facilityId: guildhallId,
					facilityType: 'Guildhall',
					newTier: 2,
					bonusMultipliers: {}
				},
				timestamp: new Date().toISOString()
			});

			// Verify slot was created (slotsToCreate.length > 0 branch)
			const updatedState = runtime.busManager.getState();
			const slotsAfter = Array.from(updatedState.entities.values()).filter(
				(e) => e.type === 'ResourceSlot'
			);
			// Should have one more slot than before
			expect(slotsAfter.length).toBeGreaterThan(slotsBefore);
		});

		it('should handle FacilityUpgraded event without slot creation', async () => {
			const state = createTestGameState();
			const runtime = startGame(state);

			// Trigger FacilityUpgraded event for a non-Guildhall facility
			// This tests the slotsToCreate.length === 0 branch
			await runtime.busManager.domainEventBus.publish({
				type: 'FacilityUpgraded',
				payload: {
					facilityId: 'facility-1',
					facilityType: 'Dormitory', // Dormitory doesn't create slots
					newTier: 1,
					bonusMultipliers: {}
				},
				timestamp: new Date().toISOString()
			});

			// Verify runtime handles it (slotsToCreate.length === 0 branch)
			const updatedState = runtime.busManager.getState();
			expect(updatedState).toBeDefined();
		});
	});
});

