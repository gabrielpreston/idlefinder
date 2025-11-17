/**
 * GainXP Action - Per Systems Primitives Spec section 10.1
 * Requirements: adventurer exists
 * Effects: adventurer.attributes.xp += amount
 * Events: AdventurerGainedXP
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import { entityExistsRequirement } from '../primitives/Requirement';
import { SetEntityAttributeEffect, type Effect } from '../primitives/Effect';
import type { DomainEvent } from '../../bus/types';
import type { Adventurer } from '../entities/Adventurer';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';

export interface GainXPParams {
	adventurerId: string;
	amount: number;
}

/**
 * GainXP Action - Per spec lines 333, 340-342
 */
export class GainXPAction extends Action {
	constructor(
		private readonly adventurerId: string,
		private readonly amount: number
	) {
		super();
	}

	getRequirements(): Requirement[] {
		return [entityExistsRequirement(this.adventurerId, 'Adventurer')];
	}

	computeEffects(
		context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const gainParams = params as unknown as GainXPParams;
		const amount = gainParams?.amount ?? this.amount;

		if (amount <= 0) {
			throw new Error(`XP amount must be positive: ${amount}`);
		}

		// Get current XP and add amount
		const adventurer = context.entities.get(this.adventurerId) as Adventurer;
		if (!adventurer) {
			throw new Error(`Adventurer ${this.adventurerId} not found`);
		}

		const newXP = adventurer.attributes.xp + amount;

		return [
			new SetEntityAttributeEffect(this.adventurerId, 'attributes.xp', newXP)
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		resources: ResourceBundle,
		effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[] {
		const gainParams = params as unknown as GainXPParams;
		const adventurer = entities.get(this.adventurerId) as Adventurer;

		if (!adventurer) {
			return [];
		}

		const amount = gainParams?.amount ?? this.amount;

		return [
			{
				type: 'AdventurerGainedXP',
				payload: {
					adventurerId: this.adventurerId,
					amount,
					newTotalXP: adventurer.attributes.xp
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

