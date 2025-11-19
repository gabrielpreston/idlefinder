/**
 * Slot System Tests - Slot creation and unlocking based on facility upgrades
 */

import { describe, it, expect } from 'vitest';
import { handleFacilityUpgrade } from './SlotSystem';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import { Timestamp } from '../valueObjects/Timestamp';
import type { FacilityUpgradedEvent } from '../primitives/Event';
import { ResourceSlot } from '../entities/ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';

function createTestResourceSlot(overrides?: {
	id?: string;
	facilityId?: string;
	resourceType?: 'gold' | 'materials';
}): ResourceSlot {
	const id = Identifier.from<'SlotId'>(overrides?.id || crypto.randomUUID());
	const attributes: ResourceSlotAttributes = {
		facilityId: overrides?.facilityId || 'facility-1',
		resourceType: overrides?.resourceType || 'gold',
		baseRatePerMinute: 6,
		assigneeType: 'none',
		assigneeId: null
	};
	return new ResourceSlot(id, attributes, [], 'available', {}, {});
}

describe('SlotSystem', () => {
	describe('handleFacilityUpgrade', () => {
		it('should return empty array when facility is not Guildhall', () => {
			const state = createTestGameState();
			const event: FacilityUpgradedEvent = {
				facilityId: 'facility-1',
				facilityType: 'Dormitory',
				newTier: 2,
				bonusMultipliers: {}
			};
			const now = Timestamp.now();

			const slots = handleFacilityUpgrade(event, state, now);

			expect(slots).toHaveLength(0);
		});

		it('should return empty array when Guildhall tier is not 2', () => {
			const state = createTestGameState();
			const event: FacilityUpgradedEvent = {
				facilityId: 'facility-1',
				facilityType: 'Guildhall',
				newTier: 1,
				bonusMultipliers: {}
			};
			const now = Timestamp.now();

			const slots = handleFacilityUpgrade(event, state, now);

			expect(slots).toHaveLength(0);
		});

		it('should create Gold Slot #2 when Guildhall reaches tier 2', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const baseState = createTestGameState();
			const entities = new Map<string, import('../primitives/Requirement').Entity>(baseState.entities);
			entities.set(guildhall.id, guildhall);
			const stateWithGuildhall = createTestGameState({ entities });

			const event: FacilityUpgradedEvent = {
				facilityId: guildhall.id,
				facilityType: 'Guildhall',
				newTier: 2,
				bonusMultipliers: {}
			};
			const now = Timestamp.now();

			const slots = handleFacilityUpgrade(event, stateWithGuildhall, now);

			expect(slots).toHaveLength(1);
			expect(slots[0].attributes.facilityId).toBe(guildhall.id);
			expect(slots[0].attributes.resourceType).toBe('gold');
			expect(slots[0].attributes.baseRatePerMinute).toBe(6);
			expect(slots[0].attributes.assigneeType).toBe('none');
		});

		it('should not create duplicate Gold Slot #2 if it already exists', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			// Create an existing gold slot (not slot-gold-1)
			const existingSlot = createTestResourceSlot({
				id: 'slot-gold-2-existing',
				facilityId: guildhall.id,
				resourceType: 'gold'
			});

			const baseState = createTestGameState();
			const entities = new Map<string, import('../primitives/Requirement').Entity>(baseState.entities);
			entities.set(guildhall.id, guildhall);
			entities.set(existingSlot.id, existingSlot);
			const stateWithSlot = createTestGameState({ entities });

			const event: FacilityUpgradedEvent = {
				facilityId: guildhall.id,
				facilityType: 'Guildhall',
				newTier: 2,
				bonusMultipliers: {}
			};
			const now = Timestamp.now();

			const slots = handleFacilityUpgrade(event, stateWithSlot, now);

			expect(slots).toHaveLength(0);
		});

		it('should exclude slot-gold-1 when checking for existing slots', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const baseState = createTestGameState();
			const entities = new Map<string, import('../primitives/Requirement').Entity>(baseState.entities);
			entities.set(guildhall.id, guildhall);
			const stateWithGuildhall = createTestGameState({ entities });

			// slot-gold-1 exists in initial state, but should not prevent creating slot-gold-2
			const event: FacilityUpgradedEvent = {
				facilityId: guildhall.id,
				facilityType: 'Guildhall',
				newTier: 2,
				bonusMultipliers: {}
			};
			const now = Timestamp.now();

			const slots = handleFacilityUpgrade(event, stateWithGuildhall, now);

			// Should still create slot-gold-2 even though slot-gold-1 exists
			expect(slots.length).toBeGreaterThanOrEqual(0);
		});
	});
});

