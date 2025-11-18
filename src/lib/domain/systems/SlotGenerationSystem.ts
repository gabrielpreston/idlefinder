/**
 * Slot Generation System - Pure function for processing resource slot generation
 * Per Systems Primitives Spec: Pure function that computes resource generation
 */

import type { GameState } from '../entities/GameState';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { ResourceSlot } from '../entities/ResourceSlot';
import type { Facility } from '../entities/Facility';
import { getTimer } from '../primitives/TimerHelpers';
import { ModifyResourceEffect, SetTimerEffect, type Effect } from '../primitives/Effect';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import type { DomainEvent } from '../primitives/Event';

/**
 * Slot Generation Result - effects and events from slot generation
 */
export interface SlotGenerationResult {
	effects: Effect[];
	events: DomainEvent[];
}

/**
 * Get facility multiplier based on tier
 * Formula: 1 + 0.25 * (tier - 1)
 */
export function getFacilityMultiplier(facility: Facility): number {
	return 1 + 0.25 * (facility.attributes.tier - 1);
}

/**
 * Get worker multiplier based on assignee type
 * Player: 1.0, Adventurer: 1.5
 */
export function getWorkerMultiplier(assigneeType: 'player' | 'adventurer'): number {
	return assigneeType === 'player' ? 1.0 : 1.5;
}

/**
 * Process slot generation for all active slots
 * Pure function: computes resource generation based on elapsed time
 */
export function processSlotGeneration(
	state: GameState,
	now: Timestamp
): SlotGenerationResult {
	const effects: Effect[] = [];
	const events: DomainEvent[] = [];

	// Find all ResourceSlot entities with assignee (occupied or player-assigned)
	const slots = Array.from(state.entities.values()).filter(
		(e) => e.type === 'ResourceSlot' && (e as ResourceSlot).attributes.assigneeType !== 'none'
	) as ResourceSlot[];

	for (const slot of slots) {
		// Get lastTickAt from timers Record
		const lastTickAt = getTimer(slot, 'lastTickAt');
		
		// Get fractional accumulator from metadata (for accumulating fractional resources)
		const fractionalAccumulator = (slot.metadata.fractionalAccumulator as number) || 0;
		
		// Calculate elapsed time (handle null case for first tick)
		const elapsedMs = lastTickAt ? now.value - lastTickAt.value : 0;
		
		if (elapsedMs <= 0) {
			continue; // Skip if no time has elapsed
		}

		// Get facility for multiplier calculation
		const facility = state.entities.get(slot.attributes.facilityId) as Facility | undefined;
		if (!facility || facility.type !== 'Facility') {
			console.warn(`[SlotGenerationSystem] Facility ${slot.attributes.facilityId} not found for slot ${slot.id}`);
			continue;
		}

		// Calculate effective rate
		const workerMultiplier = getWorkerMultiplier(slot.attributes.assigneeType as 'player' | 'adventurer');
		const facilityMultiplier = getFacilityMultiplier(facility);
		const effectiveRatePerMinute = slot.attributes.baseRatePerMinute * workerMultiplier * facilityMultiplier;

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
		
		// Update fractional accumulator in slot metadata
		// Since entities are mutable in the effect system, we can update metadata directly
		// The slot entity in the state's entities map will be updated
		const slotEntity = state.entities.get(slot.id) as ResourceSlot | undefined;
		if (slotEntity) {
			// Update metadata directly (entities are mutable)
			(slotEntity.metadata as Record<string, unknown>).fractionalAccumulator = remainingFraction;
		}
	}

	return { effects, events };
}

