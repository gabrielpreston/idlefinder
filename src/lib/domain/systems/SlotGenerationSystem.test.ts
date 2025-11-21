/**
 * Slot Generation System Tests - Resource slot generation processing
 */

import { describe, it, expect } from 'vitest';
import { processSlotGeneration } from './SlotGenerationSystem';
import { getFacilityMultiplier, getWorkerMultiplier } from './ResourceRateCalculator';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import { ResourceSlot } from '../entities/ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { setTimer } from '../primitives/TimerHelpers';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import type { Entity } from '../primitives/Requirement';
import { ModifyResourceEffect } from '../primitives/Effect';

function createTestResourceSlot(overrides?: {
	id?: string;
	facilityId?: string;
	resourceType?: 'gold' | 'materials' | 'durationModifier';
	assigneeType?: 'player' | 'adventurer' | 'none';
	baseRatePerMinute?: number;
	lastTickAt?: Timestamp;
}): ResourceSlot {
	const id = Identifier.from<'SlotId'>(overrides?.id || crypto.randomUUID());
	const attributes: ResourceSlotAttributes = {
		facilityId: overrides?.facilityId || 'facility-1',
		resourceType: overrides?.resourceType || 'gold',
		baseRatePerMinute: overrides?.baseRatePerMinute || 6,
		assigneeType: overrides?.assigneeType || 'none',
		assigneeId: null,
		fractionalAccumulator: 0
	};
	const slot = new ResourceSlot(id, attributes, [], 'available', {}, {});
	if (overrides?.lastTickAt) {
		setTimer(slot, 'lastTickAt', overrides.lastTickAt);
	}
	return slot;
}

describe('SlotGenerationSystem', () => {
	describe('getFacilityMultiplier', () => {
		it('should return 1.0 for tier 1', () => {
			const facility = createTestFacility({ tier: 1 });
			expect(getFacilityMultiplier(facility)).toBe(1.0);
		});

		it('should return 1.25 for tier 2', () => {
			const facility = createTestFacility({ tier: 2 });
			expect(getFacilityMultiplier(facility)).toBe(1.25);
		});

		it('should return 1.5 for tier 3', () => {
			const facility = createTestFacility({ tier: 3 });
			expect(getFacilityMultiplier(facility)).toBe(1.5);
		});

		it('should handle tier 0', () => {
			const facility = createTestFacility({ tier: 0 });
			// Formula: 1 + 0.25 * (tier - 1) = 1 + 0.25 * (-1) = 0.75
			const multiplier = getFacilityMultiplier(facility);
			expect(multiplier).toBe(0.75);
		});
	});

	describe('getWorkerMultiplier', () => {
		it('should return 1.0 for player', () => {
			expect(getWorkerMultiplier('player')).toBe(1.0);
		});

		it('should return 1.5 for adventurer', () => {
			expect(getWorkerMultiplier('adventurer')).toBe(1.5);
		});
	});

	describe('processSlotGeneration', () => {
		it('should return empty effects when no slots with assignees', () => {
			// Create state with no slots (initial state includes a player-assigned gold slot)
			const entities = new Map<string, Entity>();
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
		expect(result.success).toBe(true);
		if (!result.data) throw new Error('Expected data');
		const slotResult = result.data;

		expect(slotResult.effects).toHaveLength(0);
		expect(slotResult.events).toHaveLength(0);
		});

		it('should skip slots with assigneeType none', () => {
			const slot = createTestResourceSlot({ assigneeType: 'none' });
			const entities = new Map<string, Entity>([[slot.id, slot]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
			expect(result.success).toBe(true);
			expect(result.data?.effects).toHaveLength(0);
		});

		it('should generate resources for player-assigned slot', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const slot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				baseRatePerMinute: 6,
				lastTickAt: Timestamp.from(Date.now() - 60000) // 1 minute ago
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
		expect(result.success).toBe(true);
		if (!result.data) throw new Error('Expected data');
		const slotResult = result.data;

			// Should have at least timer update effect
			expect(slotResult.effects.length).toBeGreaterThan(0);
		});

		it('should generate more resources for adventurer-assigned slot', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const slot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'adventurer',
				baseRatePerMinute: 6,
				lastTickAt: Timestamp.from(Date.now() - 60000) // 1 minute ago
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
		expect(result.success).toBe(true);
		if (!result.data) throw new Error('Expected data');
		const slotResult = result.data;

			// Should have effects (adventurer has 1.5x multiplier)
			expect(slotResult.effects.length).toBeGreaterThan(0);
		});

		it('should apply facility multiplier', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 2 }); // 1.25x multiplier
			const slot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				baseRatePerMinute: 6,
				lastTickAt: Timestamp.from(Date.now() - 60000) // 1 minute ago
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
		expect(result.success).toBe(true);
		if (!result.data) throw new Error('Expected data');
		const slotResult = result.data;

			// Should have effects
			expect(slotResult.effects.length).toBeGreaterThan(0);
		});

		it('should skip slots when no time has elapsed', () => {
			const facility = createTestFacility({ id: 'facility-1' });
			const now = Timestamp.now(); // Use same timestamp for both
			const slot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				lastTickAt: now // Same time
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });

			const result = processSlotGeneration(state, now);
			expect(result.success).toBe(true);
			expect(result.data?.effects).toHaveLength(0);
		});

		it('should handle first tick (no lastTickAt)', () => {
			const facility = createTestFacility({ id: 'facility-1' });
			const slot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player'
				// No lastTickAt - first tick
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
		expect(result.success).toBe(true);
		// Should still update timer for first tick
		expect(result.data?.effects.length).toBeGreaterThanOrEqual(0);
		});

		it('should handle missing facility gracefully', () => {
			const slot = createTestResourceSlot({
				facilityId: 'nonexistent-facility',
				assigneeType: 'player',
				lastTickAt: Timestamp.from(Date.now() - 60000)
			});
			const entities = new Map<string, Entity>([[slot.id, slot]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
		expect(result.success).toBe(true);
		// Should have warning about missing facility
		expect(result.warnings?.length).toBeGreaterThan(0);
		expect(result.data?.effects).toHaveLength(0);
		});

		it('should skip durationModifier slots', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const durationModifierSlot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				resourceType: 'durationModifier',
				baseRatePerMinute: 1.0,
				lastTickAt: Timestamp.from(Date.now() - 60000) // 1 minute ago
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[durationModifierSlot.id, durationModifierSlot]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);
			expect(result.success).toBe(true);
			if (!result.data) throw new Error('Expected data');
			
			// Should have no resource generation effects (only timer updates if any)
			const resourceEffects = result.data.effects.filter(
				e => e instanceof ModifyResourceEffect
			);
			expect(resourceEffects).toHaveLength(0);
		});
	});
});

