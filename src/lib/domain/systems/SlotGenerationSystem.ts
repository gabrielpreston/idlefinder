/**
 * Slot Generation System - Pure function for processing resource slot generation
 * Per Systems Primitives Spec: Pure function that computes resource generation
 */

import type { GameState } from '../entities/GameState';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { ResourceSlot } from '../entities/ResourceSlot';
import { getTimer } from '../primitives/TimerHelpers';
import { ModifyResourceEffect, SetTimerEffect, SetEntityAttributeEffect, type Effect } from '../primitives/Effect';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import type { DomainEvent } from '../primitives/Event';
import { getEntityAs, isFacility } from '../primitives/EntityTypeGuards';
import { success, type SystemResult } from '../primitives/SystemResult';
import { getSlotEffectiveRate } from '../queries/FacilityEffectQueries';

/**
 * Slot Generation Result - effects and events from slot generation
 */
export interface SlotGenerationResult {
	effects: Effect[];
	events: DomainEvent[];
}

/**
 * Process slot generation for all active slots
 * Pure function: computes resource generation based on elapsed time
 */
export function processSlotGeneration(
	state: GameState,
	now: Timestamp
): SystemResult<SlotGenerationResult> {
	const effects: Effect[] = [];
	const events: DomainEvent[] = [];
	const warnings: string[] = [];

	// Find all ResourceSlot entities with assignee (occupied or player-assigned)
	// Filter out durationModifier slots - they don't generate resources, they modify mission speed
	const slots = Array.from(state.entities.values()).filter(
		(e) => e.type === 'ResourceSlot' 
			&& (e as ResourceSlot).attributes.assigneeType !== 'none'
			&& (e as ResourceSlot).attributes.resourceType !== 'durationModifier'
	) as ResourceSlot[];

	for (const slot of slots) {
		// Get lastTickAt from timers Record
		const lastTickAt = getTimer(slot, 'lastTickAt');
		
		// Get fractional accumulator from attributes (for accumulating fractional resources)
		const fractionalAccumulator = slot.attributes.fractionalAccumulator || 0;
		
		// Calculate elapsed time (handle null case for first tick)
		const elapsedMs = lastTickAt ? now.value - lastTickAt.value : 0;
		
		if (elapsedMs <= 0) {
			continue; // Skip if no time has elapsed
		}

		// Get facility for multiplier calculation
		const facility = getEntityAs(state.entities, slot.attributes.facilityId, isFacility);
		if (!facility) {
			warnings.push(`Facility ${slot.attributes.facilityId} not found for slot ${slot.id}`);
			continue;
		}

		// Calculate effective rate using single source of truth
		const effectiveRatePerMinute = getSlotEffectiveRate(
			slot,
			slot.attributes.assigneeType as 'player' | 'adventurer',
			state
		);

		// Calculate generated amount (including fractional part)
		const elapsedMinutes = elapsedMs / 60000;
		const generated = effectiveRatePerMinute * elapsedMinutes;
		
		// Add to fractional accumulator
		const newAccumulator = fractionalAccumulator + generated;
		
		// Calculate whole units to add (floor of accumulator)
		const wholeUnits = Math.floor(newAccumulator);
		
		// Remaining fractional part
		const remainingFraction = newAccumulator - wholeUnits;

		// Create resource effect if we have whole units to add
		if (wholeUnits > 0) {
			const effect = new ModifyResourceEffect(
				[new ResourceUnit(slot.attributes.resourceType, wholeUnits)],
				'add'
			);
			effects.push(effect);
		}

		// Update lastTickAt timer
		effects.push(new SetTimerEffect(slot.id, 'lastTickAt', now));
		
		// Update fractional accumulator in slot attributes via effect (maintains system purity)
		effects.push(new SetEntityAttributeEffect(slot.id, 'attributes.fractionalAccumulator', remainingFraction));
	}

	return success({ effects, events }, warnings.length > 0 ? warnings : undefined);
}

