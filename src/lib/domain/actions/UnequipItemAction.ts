/**
 * UnequipItem Action - Removes item from adventurer
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { UnequipItemEffect } from '../primitives/Effect';
import { entityExistsRequirement, allRequirements } from '../primitives/Requirement';
import type { Item } from '../entities/Item';
import type { Adventurer } from '../entities/Adventurer';

export interface UnequipItemParams {
	itemId: string;
	adventurerId: string;
	slot: 'weapon' | 'armor' | 'offHand' | 'accessory';
}

/**
 * Requirement: Item must be equipped
 */
function itemEquippedRequirement(itemId: string): Requirement {
	return (context: RequirementContext) => {
		const item = context.entities.get(itemId);
		if (!item || item.type !== 'Item') {
			return {
				satisfied: false,
				reason: `Item ${itemId} not found`
			};
		}
		const itemEntity = item as Item;
		if (itemEntity.state !== 'Equipped') {
			return {
				satisfied: false,
				reason: `Item ${itemId} is not equipped (state: ${itemEntity.state})`
			};
		}
		return { satisfied: true };
	};
}

/**
 * UnequipItem Action
 */
export class UnequipItemAction extends Action {
	constructor(
		private readonly itemId: string,
		private readonly adventurerId: string,
		private readonly slot: 'weapon' | 'armor' | 'offHand' | 'accessory'
	) {
		super();
	}

	getRequirements(): Requirement[] {
		return [
			allRequirements(
				entityExistsRequirement(this.itemId, 'Item'),
				entityExistsRequirement(this.adventurerId, 'Adventurer'),
				itemEquippedRequirement(this.itemId)
			)
		];
	}

	computeEffects(
		_context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const unequipParams = params as unknown as UnequipItemParams;
		const itemId = unequipParams?.itemId ?? this.itemId;
		const adventurerId = unequipParams?.adventurerId ?? this.adventurerId;
		const slot = unequipParams?.slot ?? this.slot;

		return [new UnequipItemEffect(itemId, adventurerId, slot)];
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[] {
		const unequipParams = params as unknown as UnequipItemParams;
		const itemId = unequipParams?.itemId ?? this.itemId;
		const adventurerId = unequipParams?.adventurerId ?? this.adventurerId;

		const item = entities.get(itemId) as Item | undefined;
		const adventurer = entities.get(adventurerId) as Adventurer | undefined;

		if (!item || !adventurer) {
			return [];
		}

		return [
			{
				type: 'ItemUnequipped',
				payload: {
					itemId,
					adventurerId
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

