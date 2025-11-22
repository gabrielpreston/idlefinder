/**
 * Mission Pool Management System - Pure function for processing mission pool generation and expiration
 * Per Systems Primitives Spec: Pure function that computes mission generation and expiration
 */

import type { GameState } from '../entities/GameState';
import { Timestamp } from '../valueObjects/Timestamp';
import { getTimer } from '../primitives/TimerHelpers';
import { SetTimerEffect, SetEntityStateEffect, CreateMissionEffect, type Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import { formatEventTimestamp } from '../primitives/Event';
import { success, type SystemResult } from '../primitives/SystemResult';
import { GameConfig } from '../config/GameConfig';
import { generateMissionPool } from './MissionGenerationSystem';
import { getAvailableMissionCount, getExpiredMissions, getTargetPoolSize } from '../queries/MissionPoolQueries';
import { getUnlockedMissionTiers } from '../queries/UnlockQueries';
import { getWorkerMultiplier } from './ResourceRateCalculator';
import { getFacilitiesByType } from '../queries/FacilityQueries';
import { getAvailableSlotsForFacility } from '../queries/FacilityEffectQueries';
import type { ResourceSlot } from '../entities/ResourceSlot';

/**
 * Mission Pool Result - effects and events from mission pool management
 */
export interface MissionPoolResult {
	effects: Effect[];
	events: DomainEvent[];
}

/**
 * Process mission pool generation and expiration
 * Pure function: computes mission generation and expiration based on elapsed time
 */
export function processMissionPool(
	state: GameState,
	now: Timestamp
): SystemResult<MissionPoolResult> {
	const effects: Effect[] = [];
	const events: DomainEvent[] = [];
	const warnings: string[] = [];

	// Find Mission Command facilities
	const missionCommandFacilities = getFacilitiesByType('MissionCommand', state);
	if (missionCommandFacilities.length === 0) {
		// No Mission Command facility found - return empty result
		return success({ effects, events });
	}

	// Use first Mission Command facility (single facility assumption for MVP)
	const facility = missionCommandFacilities[0];

	// Find durationModifier slots for this facility
	const slots = getAvailableSlotsForFacility(facility.id, state)
		.filter((slot): slot is ResourceSlot => slot.attributes.resourceType === 'durationModifier');

	// Find assigned slot (if any)
	const assignedSlot = slots.find(slot => slot.attributes.assigneeType !== 'none');

	// Get worker multiplier (1.0 if no assignment, otherwise from slot)
	const workerMultiplier = assignedSlot 
		? getWorkerMultiplier(assignedSlot.attributes.assigneeType as 'player' | 'adventurer')
		: 1.0;

	// Get last generation time from timer (stored on facility)
	const lastGenerationAt = getTimer(facility, 'lastGenerationAt');
	
	// Calculate elapsed time since last generation (or use now if first run)
	const elapsedMs = lastGenerationAt ? now.value - lastGenerationAt.value : GameConfig.missionPool.generationCadenceSeconds * 1000;
	const cadenceMs = GameConfig.missionPool.generationCadenceSeconds * 1000;
	
	// Apply speed multiplier: reduce cadence time (faster generation)
	// If multiplier is 1.5x, cadence is reduced to 1/1.5 = 0.667x (40 seconds instead of 60)
	const effectiveCadenceMs = cadenceMs / workerMultiplier;

	// Check if generation cadence has elapsed (with speed multiplier)
	if (elapsedMs >= effectiveCadenceMs) {
		// Query current available mission count
		const availableCount = getAvailableMissionCount(state);
		
		// Calculate target pool size
		const targetCount = getTargetPoolSize(state);
		
		// Calculate deficit
		const deficit = targetCount - availableCount;
		
		if (deficit > 0) {
			// Generate missions to fill gap (up to batch size)
			const missionsToGenerate = Math.min(deficit, GameConfig.missionPool.generationBatchSize);
			
			// Calculate expiration time for new missions
			const expirationAgeMs = GameConfig.missionPool.expirationAgeSeconds * 1000;
			const expiresAt = Timestamp.from(now.value + expirationAgeMs);
			
			// Generate missions - generate enough to cover the deficit
			// generateMissionPool generates missions per tier, so we calculate countPerTier
			// to get approximately the number we need
			const unlockedTiers = getUnlockedMissionTiers(state);
			const tiersCount = Math.max(1, unlockedTiers.length); // At least tier 0
			const countPerTier = Math.ceil(missionsToGenerate / tiersCount);
			
			const tempMissions = generateMissionPool(state, countPerTier, expiresAt);
			const missionsToAdd = tempMissions.slice(0, missionsToGenerate);
			
			// Create CreateMissionEffect for each new mission
			for (const mission of missionsToAdd) {
				effects.push(new CreateMissionEffect(mission));
			}
			
			// Update last generation timer (on facility)
			effects.push(new SetTimerEffect(facility.id, 'lastGenerationAt', now));
		} else {
			// Pool is at or above target - still update timer for next check
			effects.push(new SetTimerEffect(facility.id, 'lastGenerationAt', now));
		}
	}

	// Find and expire old missions
	const expiredMissions = getExpiredMissions(state, now);
	for (const mission of expiredMissions) {
		// Create SetEntityStateEffect to expire mission
		effects.push(new SetEntityStateEffect(mission.id, 'Expired'));
		
		// Emit MissionExpired event
		const expiredEvent: DomainEvent = {
			type: 'MissionExpired',
			payload: {
				missionId: mission.id
			},
			timestamp: formatEventTimestamp(now)
		};
		events.push(expiredEvent);
	}

	return success({ effects, events }, warnings.length > 0 ? warnings : undefined);
}

