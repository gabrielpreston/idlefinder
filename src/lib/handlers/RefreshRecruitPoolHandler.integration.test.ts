/**
 * RefreshRecruitPoolHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState, createTestResourceBundle } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { GameConfig } from '../domain/config/GameConfig';
import type { Adventurer } from '../domain/entities/Adventurer';

describe('RefreshRecruitPoolHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		// Create initial state with sufficient gold for refresh
		const refreshCost = GameConfig.costs.refreshRecruitPool;
		const initialState = createTestGameState({
			resources: createTestResourceBundle({ gold: refreshCost + 100 }) // Enough for refresh
		});
		
		({ busManager, publishedEvents } = setupIntegrationTest({
			initialState,
			eventTypes: ['RecruitPoolRefreshed', 'CommandFailed']
		}));
	});

	describe('RefreshRecruitPool command', () => {
		it('should refresh pool with sufficient gold', async () => {
			const initialState = busManager.getState();
			const initialGold = initialState.resources.get('gold') || 0;
			const refreshCost = GameConfig.costs.refreshRecruitPool;
			
			// Count initial preview adventurers
			const initialPreviewAdventurers = Array.from(initialState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			);

			const command = createTestCommand('RefreshRecruitPool', {});

			await busManager.commandBus.dispatch(command);

			// Verify RecruitPoolRefreshed event published
			const refreshEvents = publishedEvents.filter(e => e.type === 'RecruitPoolRefreshed');
			expect(refreshEvents.length).toBe(1);

			// Verify state updated - preview adventurers should be refreshed
			const finalState = busManager.getState();
			const finalPreviewAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			);
			
			// Should have exactly 4 preview adventurers (as per RecruitPoolSystem)
			expect(finalPreviewAdventurers.length).toBe(4);
			
			// Verify old preview adventurers are removed (IDs should be different)
			const initialIds = new Set(initialPreviewAdventurers.map(a => a.id));
			const finalIds = new Set(finalPreviewAdventurers.map(a => a.id));
			// All IDs should be different (pool was refreshed)
			for (const id of finalIds) {
				expect(initialIds.has(id)).toBe(false);
			}

			// Verify gold deducted
			const finalGold = finalState.resources.get('gold') || 0;
			expect(finalGold).toBe(initialGold - refreshCost);
		});

		it('should fail when insufficient gold', async () => {
			const refreshCost = GameConfig.costs.refreshRecruitPool;
			
			// Set state with insufficient gold
			const initialState = createTestGameState({
				resources: createTestResourceBundle({ gold: refreshCost - 1 }) // Not enough
			});
			busManager.setState(initialState);

			const command = createTestCommand('RefreshRecruitPool', {});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.commandType).toBe('RefreshRecruitPool');
				expect(payload.reason).toContain('Insufficient gold');
				expect(payload.reason).toContain(`need ${refreshCost}`);
			}

			// Verify state unchanged - no gold deducted
			const finalState = busManager.getState();
			const initialGold = refreshCost - 1;
			const finalGold = finalState.resources.get('gold') || 0;
			expect(finalGold).toBe(initialGold);
		});

		it('should remove all existing preview adventurers', async () => {
			const initialState = busManager.getState();
			
			// Count initial preview adventurers
			const initialPreviewAdventurers = Array.from(initialState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			);
			const initialPreviewIds = new Set(initialPreviewAdventurers.map(a => a.id));
			expect(initialPreviewIds.size).toBeGreaterThan(0); // Should have some preview adventurers

			const command = createTestCommand('RefreshRecruitPool', {});

			await busManager.commandBus.dispatch(command);

			// Verify all old preview adventurers are gone
			const finalState = busManager.getState();
			const finalPreviewAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			);
			
			// None of the old IDs should exist
			for (const adventurer of finalPreviewAdventurers) {
				expect(initialPreviewIds.has(adventurer.id)).toBe(false);
			}
		});

		it('should generate exactly 4 new preview adventurers', async () => {
			const command = createTestCommand('RefreshRecruitPool', {});

			await busManager.commandBus.dispatch(command);

			const finalState = busManager.getState();
			const previewAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			) as Adventurer[];

			// Should have exactly 4 preview adventurers
			expect(previewAdventurers.length).toBe(4);
			
			// All should be in Preview state
			for (const adventurer of previewAdventurers) {
				expect(adventurer.state).toBe('Preview');
			}
		});

		it('should not affect non-preview adventurers', async () => {
			const initialState = busManager.getState();
			
			// Get initial non-preview adventurers (if any)
			const initialNonPreviewAdventurers = Array.from(initialState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state !== 'Preview'
			);
			const initialNonPreviewIds = new Set(initialNonPreviewAdventurers.map(a => a.id));

			const command = createTestCommand('RefreshRecruitPool', {});

			await busManager.commandBus.dispatch(command);

			// Verify non-preview adventurers are unchanged
			const finalState = busManager.getState();
			const finalNonPreviewAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state !== 'Preview'
			);
			
			// All initial non-preview adventurers should still exist
			for (const id of initialNonPreviewIds) {
				const stillExists = finalNonPreviewAdventurers.some(a => a.id === id);
				expect(stillExists).toBe(true);
			}
		});
	});
});

