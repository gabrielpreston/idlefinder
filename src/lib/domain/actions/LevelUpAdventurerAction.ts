/**
 * LevelUpAdventurer Action - Per Systems Primitives Spec section 10.1
 * Requirements: adventurer exists, adventurer.attributes.xp >= xpThresholdFor(level)
 * Effects: adventurer.attributes.level++, recalculate abilityMods
 * Events: AdventurerLeveledUp
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import { entityExistsRequirement, allRequirements } from '../primitives/Requirement';
import { SetEntityAttributeEffect, type Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import { formatEventTimestamp } from '../primitives/Event';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { Adventurer } from '../entities/Adventurer';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';

/**
 * Calculate XP threshold for a level
 * Simple progression: level * 100
 */
function xpThresholdFor(level: number): number {
	return level * 100;
}

/**
 * Requirement: adventurer has enough XP to level up
 */
function hasEnoughXPRequirement(adventurerId: string): Requirement {
	return (context: RequirementContext) => {
		const adventurer = context.entities.get(adventurerId) as Adventurer | undefined;
		if (!adventurer) {
			return { satisfied: false, reason: `Adventurer ${adventurerId} not found` };
		}
		const threshold = xpThresholdFor(adventurer.attributes.level);
		if (adventurer.attributes.xp < threshold) {
			return {
				satisfied: false,
				reason: `Adventurer ${adventurerId} needs ${String(threshold)} XP to level up, has ${String(adventurer.attributes.xp)}`
			};
		}
		return { satisfied: true };
	};
}

/**
 * LevelUpAdventurer Action - Per spec lines 334, 344-346
 */
export class LevelUpAdventurerAction extends Action {
	constructor(private readonly adventurerId: string) {
		super();
	}

	getRequirements(): Requirement[] {
		return [
			allRequirements(
				entityExistsRequirement(this.adventurerId, 'Adventurer'),
				hasEnoughXPRequirement(this.adventurerId)
			)
		];
	}

	computeEffects(
		context: RequirementContext,
		_params: Record<string, unknown>
	): Effect[] {
		// Adventurer existence is guaranteed by requirements check
		const adventurer = context.entities.get(this.adventurerId) as Adventurer;

		const newLevel = adventurer.attributes.level + 1;

		// TODO: Recalculate abilityMods based on PF2E progression curves
		// For now, just increment level
		return [
			new SetEntityAttributeEffect(this.adventurerId, 'attributes.level', newLevel)
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		_params: Record<string, unknown>,
		currentTime: Timestamp
	): DomainEvent[] {
		// Adventurer existence is guaranteed by requirements check in computeEffects
		const adventurer = entities.get(this.adventurerId) as Adventurer;

		// Convert Map to Record
		const abilityModsRecord: Record<string, number> = {};
		for (const [key, value] of adventurer.attributes.abilityMods.toMap().entries()) {
			abilityModsRecord[key] = value;
		}

		return [
			{
				type: 'AdventurerLeveledUp',
				payload: {
					adventurerId: this.adventurerId,
					newLevel: adventurer.attributes.level,
					abilityMods: abilityModsRecord
				},
				timestamp: formatEventTimestamp(currentTime)
			}
		];
	}
}

