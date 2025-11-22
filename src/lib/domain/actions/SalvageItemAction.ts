/**
 * SalvageItem Action - Converts item to materials
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import { formatEventTimestamp } from '../primitives/Event';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { SalvageItemEffect } from '../primitives/Effect';
import { entityExistsRequirement } from '../primitives/Requirement';
import type { Item } from '../entities/Item';
import { isItem } from '../primitives/EntityTypeGuards';

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

		const itemEntity = context.entities.get(this.itemId);
		if (!itemEntity || !isItem(itemEntity)) {
			throw new Error(`Item ${this.itemId} not found`);
		}
		const item = itemEntity;

		// Calculate yields if not provided
		const yields = salvageParams.materialsAmount !== undefined
			? {
					materials: salvageParams.materialsAmount
				}
			: calculateSalvageYields(item);

		return [
			new SalvageItemEffect(this.itemId, yields.materials)
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		resources: ResourceBundle,
		_effects: Effect[],
		params: Record<string, unknown>,
		currentTime: Timestamp
	): DomainEvent[] {
		const salvageParams = params as unknown as SalvageItemParams;
		const itemId = salvageParams.itemId;

		// Item should be removed by SalvageItemEffect, so we check resources instead
		const materials = resources.get('materials');

		return [
			{
				type: 'ItemSalvaged',
				payload: {
					itemId,
					materials
				},
				timestamp: formatEventTimestamp(currentTime)
			}
		];
	}
}

