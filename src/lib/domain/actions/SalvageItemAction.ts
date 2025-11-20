/**
 * SalvageItem Action - Converts item to materials
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
}

/**
 * Calculate salvage yields based on item rarity and base value
 */
function calculateSalvageYields(item: Item): { materials: number } {
	const baseValue = item.attributes.baseValue;
	const rarity = item.attributes.rarity;

	// Materials yield: 50% for common/uncommon, 60% for rare items
	const materialsMultiplier = rarity === 'rare' ? 0.6 : 0.5;
	const materials = Math.floor(baseValue * materialsMultiplier);

	return { materials };
}

/**
 * SalvageItem Action
 */
export class SalvageItemAction extends Action {
	constructor(
		private readonly itemId: string,
		private readonly materialsAmount?: number
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
					materials: salvageParams.materialsAmount ?? 0
				}
			: calculateSalvageYields(item);

		return [
			new SalvageItemEffect(itemId, yields.materials)
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

		return [
			{
				type: 'ItemSalvaged',
				payload: {
					itemId,
					materials
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

