/**
 * UpgradeFacility Action - Per Systems Primitives Spec section 10.3
 * Requirements: gold >= costFor(tier + 1), facility.tier == currentTier
 * Effects: facility.attributes.tier++, consume gold
 * Events: FacilityUpgraded
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import {
	entityExistsRequirement,
	allRequirements
} from '../primitives/Requirement';
import {
	SetEntityAttributeEffect,
	ModifyResourceEffect,
	type Effect
} from '../primitives/Effect';
import type { DomainEvent } from '../../bus/types';
import type { Facility } from '../entities/Facility';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';

/**
 * Calculate upgrade cost for facility tier
 * Simple progression: tier * 100
 */
function costFor(tier: number): number {
	return tier * 100;
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
 * Requirement: facility is at expected tier
 */
function facilityTierRequirement(facilityId: string, expectedTier: number): Requirement {
	return (context: RequirementContext) => {
		const facility = context.entities.get(facilityId) as Facility | undefined;
		if (!facility) {
			return { satisfied: false, reason: `Facility ${facilityId} not found` };
		}
		if (facility.attributes.tier !== expectedTier) {
			return {
				satisfied: false,
				reason: `Facility ${facilityId} tier mismatch: expected ${expectedTier}, got ${facility.attributes.tier}`
			};
		}
		return { satisfied: true };
	};
}

/**
 * UpgradeFacility Action - Per spec lines 465
 */
export class UpgradeFacilityAction extends Action {
	constructor(private readonly facilityId: string) {
		super();
	}

	getRequirements(): Requirement[] {
		const facility = this.getFacilityFromContext();
		if (!facility) {
			return [entityExistsRequirement(this.facilityId, 'Facility')];
		}

		const newTier = facility.attributes.tier + 1;
		const cost = costFor(newTier);

		return [
			allRequirements(
				entityExistsRequirement(this.facilityId, 'Facility'),
				facilityTierRequirement(this.facilityId, facility.attributes.tier),
				hasEnoughGoldRequirement(cost)
			)
		];
	}

	private getFacilityFromContext(): Facility | null {
		// This is a helper - in practice, context will be provided
		// For now, return null and let computeEffects handle it
		return null;
	}

	computeEffects(
		context: RequirementContext,
		_params: Record<string, unknown>
	): Effect[] {
		const facility = context.entities.get(this.facilityId) as Facility;
		if (!facility) {
			throw new Error(`Facility ${this.facilityId} not found`);
		}

		const newTier = facility.attributes.tier + 1;
		const cost = costFor(newTier);

		// Verify we have enough gold
		const currentGold = context.resources.get('gold') || 0;
		if (currentGold < cost) {
			throw new Error(`Insufficient gold: need ${cost}, have ${currentGold}`);
		}

		return [
			// Increment facility tier
			new SetEntityAttributeEffect(this.facilityId, 'attributes.tier', newTier),
			// Consume gold
			new ModifyResourceEffect([new ResourceUnit('gold', cost)], 'subtract')
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		_params: Record<string, unknown>
	): DomainEvent[] {
		const facility = entities.get(this.facilityId) as Facility;

		if (!facility) {
			return [];
		}

		return [
			{
				type: 'FacilityUpgraded',
				payload: {
					facilityId: this.facilityId,
					facilityType: facility.attributes.facilityType,
					newTier: facility.attributes.tier,
					bonusMultipliers: facility.attributes.bonusMultipliers
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

