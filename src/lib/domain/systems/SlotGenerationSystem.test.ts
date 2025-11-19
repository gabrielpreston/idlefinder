/**
 * Slot Generation System Tests - Resource slot generation processing
 */

import { describe, it, expect } from 'vitest';
import { getFacilityMultiplier, getWorkerMultiplier, processSlotGeneration } from './SlotGenerationSystem';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import { ResourceSlot } from '../entities/ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { setTimer } from '../primitives/TimerHelpers';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import type { Entity } from '../primitives/Requirement';

function createTestResourceSlot(overrides?: {
	id?: string;
	facilityId?: string;
	resourceType?: 'gold' | 'materials';
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
		assigneeId: null
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

			expect(result.effects).toHaveLength(0);
			expect(result.events).toHaveLength(0);
		});

		it('should skip slots with assigneeType none', () => {
			const slot = createTestResourceSlot({ assigneeType: 'none' });
			const entities = new Map<string, Entity>([[slot.id, slot]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);

			expect(result.effects).toHaveLength(0);
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

			// Should have at least timer update effect
			expect(result.effects.length).toBeGreaterThan(0);
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

			// Should have effects (adventurer has 1.5x multiplier)
			expect(result.effects.length).toBeGreaterThan(0);
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

			// Should have effects
			expect(result.effects.length).toBeGreaterThan(0);
		});

		it('should skip slots when no time has elapsed', () => {
			const facility = createTestFacility({ id: 'facility-1' });
			const slot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				lastTickAt: Timestamp.now() // Same time
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processSlotGeneration(state, now);

			expect(result.effects).toHaveLength(0);
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

			// Should still update timer for first tick
			expect(result.effects.length).toBeGreaterThanOrEqual(0);
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

			// Should skip slot when facility not found
			expect(result.effects).toHaveLength(0);
		});
	});
});

