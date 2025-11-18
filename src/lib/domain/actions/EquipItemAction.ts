/**
 * EquipItem Action - Equips item to adventurer slot
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { EquipItemEffect } from '../primitives/Effect';
import { entityExistsRequirement, allRequirements } from '../primitives/Requirement';
import type { Item } from '../entities/Item';
import type { Adventurer } from '../entities/Adventurer';

export interface EquipItemParams {
	itemId: string;
	adventurerId: string;
	slot: 'weapon' | 'armor' | 'offHand' | 'accessory';
}

/**
 * Requirement: Item must be in InArmory state
 */
function itemInArmoryRequirement(itemId: string): Requirement {
	return (context: RequirementContext) => {
		const item = context.entities.get(itemId);
		if (!item || item.type !== 'Item') {
			return {
				satisfied: false,
				reason: `Item ${itemId} not found`
			};
		}
		const itemEntity = item as Item;
		if (itemEntity.state !== 'InArmory') {
			return {
				satisfied: false,
				reason: `Item ${itemId} is not in armory (state: ${itemEntity.state})`
			};
		}
		if (itemEntity.isBroken()) {
			return {
				satisfied: false,
				reason: `Item ${itemId} is broken and cannot be equipped`
			};
		}
		return { satisfied: true };
	};
}

/**
 * Requirement: Item type must match slot
 */
function itemTypeMatchesSlotRequirement(itemId: string, slot: string): Requirement {
	return (context: RequirementContext) => {
		const item = context.entities.get(itemId);
		if (!item || item.type !== 'Item') {
			return {
				satisfied: false,
				reason: `Item ${itemId} not found`
			};
		}
		const itemEntity = item as Item;
		// Map slot to itemType
		const slotToItemType: Record<string, string> = {
			weapon: 'weapon',
			armor: 'armor',
			offHand: 'offHand',
			accessory: 'accessory'
		};
		const expectedItemType = slotToItemType[slot];
		if (itemEntity.attributes.itemType !== expectedItemType) {
			return {
				satisfied: false,
				reason: `Item type ${itemEntity.attributes.itemType} does not match slot ${slot}`
			};
		}
		return { satisfied: true };
	};
}

/**
 * EquipItem Action
 */
export class EquipItemAction extends Action {
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
				itemInArmoryRequirement(this.itemId),
				itemTypeMatchesSlotRequirement(this.itemId, this.slot)
			)
		];
	}

	computeEffects(
		_context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const equipParams = params as unknown as EquipItemParams;
		const itemId = equipParams?.itemId ?? this.itemId;
		const adventurerId = equipParams?.adventurerId ?? this.adventurerId;
		const slot = equipParams?.slot ?? this.slot;

		return [new EquipItemEffect(itemId, adventurerId, slot)];
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[] {
		const equipParams = params as unknown as EquipItemParams;
		const itemId = equipParams?.itemId ?? this.itemId;
		const adventurerId = equipParams?.adventurerId ?? this.adventurerId;
		const slot = equipParams?.slot ?? this.slot;

		const item = entities.get(itemId) as Item | undefined;
		const adventurer = entities.get(adventurerId) as Adventurer | undefined;

		if (!item || !adventurer) {
			return [];
		}

		return [
			{
				type: 'ItemEquipped',
				payload: {
					itemId,
					adventurerId,
					slot
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

