/**
 * RepairItem Action - Repairs item durability
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { RepairItemEffect } from '../primitives/Effect';
import { entityExistsRequirement } from '../primitives/Requirement';
import type { Item } from '../entities/Item';

/**
 * Requirement: Item must not be at full durability
 */
function itemNeedsRepairRequirement(itemId: string): Requirement {
	return (context: RequirementContext) => {
		const item = context.entities.get(itemId);
		if (!item || item.type !== 'Item') {
			return {
				satisfied: false,
				reason: `Item ${itemId} not found`
			};
		}
		const itemEntity = item as Item;
		if (itemEntity.attributes.durability >= itemEntity.attributes.maxDurability) {
			return {
				satisfied: false,
				reason: `Item ${itemId} is already at full durability`
			};
		}
		return { satisfied: true };
	};
}

/**
 * RepairItem Action
 */
export class RepairItemAction extends Action {
	constructor(private readonly itemId: string) {
		super();
	}

	getRequirements(): Requirement[] {
		return [
			entityExistsRequirement(this.itemId, 'Item'),
			itemNeedsRepairRequirement(this.itemId)
		];
	}

	computeEffects(
		_context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const repairParams = params as unknown as { itemId?: string };
		const itemId = repairParams.itemId ?? this.itemId;

		return [new RepairItemEffect(itemId)];
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		_params: Record<string, unknown>
	): DomainEvent[] {
		const item = entities.get(this.itemId) as Item | undefined;

		if (!item) {
			return [];
		}

		return [
			{
				type: 'ItemRepaired',
				payload: {
					itemId: this.itemId,
					durability: item.attributes.durability,
					maxDurability: item.attributes.maxDurability
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

