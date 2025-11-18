/**
 * SalvageItem Action - Converts item to materials/rare essence
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { SalvageItemEffect } from '../primitives/Effect';
import { entityExistsRequirement } from '../primitives/Requirement';
import type { Item } from '../entities/Item';

export interface SalvageItemParams {
	itemId: string;
	materialsAmount?: number;
	rareEssenceAmount?: number;
}

/**
 * Calculate salvage yields based on item rarity and base value
 */
function calculateSalvageYields(item: Item): { materials: number; rareEssence: number } {
	const baseValue = item.attributes.baseValue;
	const rarity = item.attributes.rarity;

	// Base materials yield: 50% of base value
	const materials = Math.floor(baseValue * 0.5);

	// Rare essence: only for rare items, 10% of base value
	const rareEssence = rarity === 'rare' ? Math.floor(baseValue * 0.1) : 0;

	return { materials, rareEssence };
}

/**
 * SalvageItem Action
 */
export class SalvageItemAction extends Action {
	constructor(
		private readonly itemId: string,
		private readonly materialsAmount?: number,
		private readonly rareEssenceAmount?: number
	) {
		super();
	}

	getRequirements(): Requirement[] {
		return [entityExistsRequirement(this.itemId, 'Item')];
	}

	computeEffects(
		context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const salvageParams = params as unknown as SalvageItemParams;
		const itemId = salvageParams?.itemId ?? this.itemId;

		const item = context.entities.get(itemId) as Item | undefined;
		if (!item) {
			throw new Error(`Item ${itemId} not found`);
		}

		// Calculate yields if not provided
		const yields = salvageParams?.materialsAmount !== undefined
			? {
					materials: salvageParams.materialsAmount ?? 0,
					rareEssence: salvageParams.rareEssenceAmount ?? 0
				}
			: calculateSalvageYields(item);

		return [
			new SalvageItemEffect(itemId, yields.materials, yields.rareEssence)
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		resources: ResourceBundle,
		_effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[] {
		const salvageParams = params as unknown as SalvageItemParams;
		const itemId = salvageParams?.itemId ?? this.itemId;

		// Item should be removed by SalvageItemEffect, so we check resources instead
		const materials = resources.get('materials') ?? 0;
		const rareEssence = resources.get('rareEssence') ?? 0;

		return [
			{
				type: 'ItemSalvaged',
				payload: {
					itemId,
					materials,
					rareEssence
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

