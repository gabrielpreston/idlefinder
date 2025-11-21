/**
 * Slot System - Handles slot creation and unlocking based on facility upgrades
 * Pure function that determines which slots should be created when facilities upgrade
 */

import type { GameState } from '../entities/GameState';
import type { FacilityUpgradedEvent } from '../primitives/Event';
import { ResourceSlot } from '../entities/ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import { Timestamp } from '../valueObjects/Timestamp';
import { GameConfig } from '../config/GameConfig';

/**
 * Handle facility upgrade and determine which slots should be created
 * Returns array of slots to create (empty if none)
 */
export function handleFacilityUpgrade(
	event: FacilityUpgradedEvent,
	state: GameState,
	now: Timestamp
): ResourceSlot[] {
	const slotsToCreate: ResourceSlot[] = [];

	// Guildhall Tier 2 unlocks Gold Slot #2
	if (event.facilityType === 'Guildhall' && event.newTier === 2) {
		// Check if Gold Slot #2 already exists
		const existingSlots = Array.from(state.entities.values()).filter(
			(e) => e.type === 'ResourceSlot'
		) as ResourceSlot[];

		const goldSlot2Exists = existingSlots.some(
			(slot) =>
				slot.attributes.facilityId === event.facilityId &&
				slot.attributes.resourceType === 'gold' &&
				slot.id !== 'slot-gold-1' // Exclude the first slot
		);

		if (!goldSlot2Exists) {
			// Create Gold Slot #2
			const slotId = Identifier.from<'SlotId'>(`slot-gold-2-${Date.now()}`);
			const attributes: ResourceSlotAttributes = {
				facilityId: event.facilityId,
				resourceType: 'gold',
				baseRatePerMinute: GameConfig.resourceGeneration.initialGoldRatePerMinute,
				assigneeType: 'none',
				assigneeId: null,
				fractionalAccumulator: 0
			};

			const slot = new ResourceSlot(
				slotId,
				attributes,
				['slot:resource', 'slot:gold', 'facility:guildhall'],
				'available',
				{ lastTickAt: now.value }, // Store as milliseconds in timers Record
				{ displayName: 'Gold Generation Slot #2' }
			);

			slotsToCreate.push(slot);
		}
	}

	return slotsToCreate;
}

