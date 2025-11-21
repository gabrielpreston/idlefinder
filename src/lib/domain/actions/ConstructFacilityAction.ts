/**
 * ConstructFacility Action - Per Systems Primitives Spec section 10.3
 * Requirements: gate unlocked (canBuildFacility), facility doesn't exist, sufficient resources
 * Effects: Create Facility entity at tier 1, consume construction cost (gold)
 * Events: FacilityConstructed
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import {
	allRequirements
} from '../primitives/Requirement';
import {
	CreateFacilityEffect,
	CreateResourceSlotEffect,
	ModifyResourceEffect,
	type Effect
} from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Identifier } from '../valueObjects/Identifier';
import { Facility } from '../entities/Facility';
import { ResourceSlot } from '../entities/ResourceSlot';
import type { FacilityAttributes } from '../attributes/FacilityAttributes';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import type { GameState } from '../entities/GameState';
import { canBuildFacility } from '../queries/UnlockQueries';
import { hasFacility } from '../queries/FacilityQueries';
import { calculateFacilityConstructionCost } from '../queries/CostQueries';

/**
 * Get base capacity for facility type
 * All constructed facilities start with baseCapacity 0 (bonuses come from tier scaling)
 */
function getBaseCapacityForFacilityType(_facilityType: string): number {
	return 0;
}

/**
 * Get bonus multipliers for facility type
 */
function getBonusMultipliersForFacilityType(facilityType: string): {
	xp?: number;
	resourceGen?: number;
	missionSlots?: number;
} {
	switch (facilityType) {
		case 'TrainingGrounds':
			// TrainingGrounds tier 1: +10% XP gain (1.1 multiplier)
			return { xp: 1.1 };
		default:
			return {};
	}
}

/**
 * Get display name for facility type
 */
function getFacilityDisplayName(facilityType: string): string {
	const names: Record<string, string> = {
		Dormitory: 'Dormitory',
		MissionCommand: 'Mission Command',
		TrainingGrounds: 'Training Grounds',
		ResourceDepot: 'Resource Depot'
	};
	return names[facilityType] || facilityType;
}

/**
 * Requirement: gate is unlocked
 */
function gateUnlockedRequirement(facilityType: string): Requirement {
	return (context: RequirementContext) => {
		// Create temporary state for gate check
		const tempState = {
			entities: context.entities,
			resources: context.resources,
			playerId: '',
			lastPlayed: context.currentTime
		} as GameState;
		
		if (!canBuildFacility(facilityType, tempState)) {
			return {
				satisfied: false,
				reason: `Facility ${facilityType} construction is not unlocked`
			};
		}
		return { satisfied: true };
	};
}

/**
 * Requirement: facility doesn't already exist
 */
function facilityNotExistsRequirement(facilityType: string): Requirement {
	return (context: RequirementContext) => {
		// Create temporary state for facility check
		const tempState = {
			entities: context.entities,
			resources: context.resources,
			playerId: '',
			lastPlayed: context.currentTime
		} as GameState;
		
		if (hasFacility(facilityType, tempState)) {
			return {
				satisfied: false,
				reason: `Facility ${facilityType} already exists`
			};
		}
		return { satisfied: true };
	};
}

/**
 * Requirement: player has enough gold
 */
function hasEnoughGoldRequirement(cost: number): Requirement {
	return (context: RequirementContext) => {
		const gold = context.resources.get('gold') || 0;
		if (gold < cost) {
			return {
				satisfied: false,
				reason: `Insufficient gold: need ${cost}, have ${gold}`
			};
		}
		return { satisfied: true };
	};
}

/**
 * ConstructFacility Action
 */
export class ConstructFacilityAction extends Action {
	private facilityId: string | null = null;

	constructor(private readonly facilityType: 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot') {
		super();
	}

	getRequirements(): Requirement[] {
		const cost = calculateFacilityConstructionCost(this.facilityType);

		return [
			allRequirements(
				gateUnlockedRequirement(this.facilityType),
				facilityNotExistsRequirement(this.facilityType),
				hasEnoughGoldRequirement(cost)
			)
		];
	}

	computeEffects(
		context: RequirementContext,
		_params: Record<string, unknown>
	): Effect[] {
		// Generate facility ID
		const facilityIdObj = Identifier.generate<'FacilityId'>();
		this.facilityId = facilityIdObj.value;

		// Determine baseCapacity and bonusMultipliers based on facilityType
		const attributes: FacilityAttributes = {
			facilityType: this.facilityType,
			tier: 1, // Start at tier 1
			baseCapacity: getBaseCapacityForFacilityType(this.facilityType),
			bonusMultipliers: getBonusMultipliersForFacilityType(this.facilityType)
		};

		// Create facility entity
		const facility = new Facility(
			facilityIdObj,
			attributes,
			[], // No tags initially
			'Online', // Instant construction for MVP
			{}, // No timers
			{ name: getFacilityDisplayName(this.facilityType) }
		);

		// Get construction cost
		const cost = calculateFacilityConstructionCost(this.facilityType);

		// Verify we have enough gold
		const currentGold = context.resources.get('gold') || 0;
		if (currentGold < cost) {
			throw new Error(`Insufficient gold: need ${cost}, have ${currentGold}`);
		}

		const effects: Effect[] = [
			new CreateFacilityEffect(facility), // Add facility to entities
			new ModifyResourceEffect([new ResourceUnit('gold', cost)], 'subtract')
		];

		// Create Mission Command slot if MissionCommand facility
		if (this.facilityType === 'MissionCommand') {
			const slotId = Identifier.generate<'SlotId'>();
			const slotAttributes: ResourceSlotAttributes = {
				facilityId: facilityIdObj.value,
				resourceType: 'durationModifier',
				baseRatePerMinute: 1.0,
				assigneeType: 'none',
				assigneeId: null,
				fractionalAccumulator: 0
			};
			const slot = new ResourceSlot(
				slotId,
				slotAttributes,
				['slot:resource', 'slot:durationModifier', 'facility:missionCommand'],
				'available',
				{},
				{ displayName: 'Mission Generation Speed Slot' }
			);
			effects.push(new CreateResourceSlotEffect(slot));
		}

		return effects;
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		_params: Record<string, unknown>
	): DomainEvent[] {
		if (!this.facilityId) {
			return [];
		}

		const facility = entities.get(this.facilityId) as Facility | undefined;

		if (!facility) {
			return [];
		}

		return [
			{
				type: 'FacilityConstructed',
				payload: {
					facilityId: this.facilityId,
					facilityType: facility.attributes.facilityType,
					tier: facility.attributes.tier,
					baseCapacity: facility.attributes.baseCapacity,
					bonusMultipliers: facility.attributes.bonusMultipliers
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

