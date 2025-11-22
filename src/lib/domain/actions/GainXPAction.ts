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
import type { DomainEvent } from '../primitives/Event';
import type { Adventurer } from '../entities/Adventurer';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { requireEntityAs, isAdventurer } from '../primitives/EntityTypeGuards';

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
		const amount = gainParams.amount;

		if (amount <= 0) {
			throw new Error(`XP amount must be positive: ${String(amount)}`);
		}

		// Get current XP and add amount
		const adventurer = requireEntityAs<Adventurer>(context.entities, this.adventurerId, isAdventurer);

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
		const adventurer = requireEntityAs<Adventurer>(entities, this.adventurerId, isAdventurer);

		const amount = (gainParams.amount as number | undefined) ?? this.amount;

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

