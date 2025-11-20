/**
 * CompleteCrafting Action - Finishes crafting and creates item
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import { CreateItemEffect, SetEntityAttributeEffect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { entityExistsRequirement } from '../primitives/Requirement';
import type { CraftingJob } from '../entities/CraftingJob';
import { Item } from '../entities/Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { getDefaultCraftingRecipes } from '../data/crafting/recipes';
import { GameConfig } from '../config/GameConfig';

/**
 * CompleteCrafting Action
 */
export class CompleteCraftingAction extends Action {
	constructor(private readonly jobId: string) {
		super();
	}

	getRequirements(): Requirement[] {
		return [entityExistsRequirement(this.jobId, 'CraftingJob')];
	}

	computeEffects(
		context: RequirementContext,
		_params: Record<string, unknown>
	): Effect[] {
		const job = context.entities.get(this.jobId) as CraftingJob | undefined;
		if (!job) {
			throw new Error(`CraftingJob ${this.jobId} not found`);
		}

		// Find recipe
		const recipes = getDefaultCraftingRecipes();
		const recipe = recipes.find((r) => r.id === job.attributes.recipeId);
		if (!recipe) {
			throw new Error(`Recipe ${job.attributes.recipeId} not found`);
		}

		// Create item from recipe output
		const itemId = Identifier.generate<'ItemId'>();
		const statsMap = new Map<string, number>();
		for (const [key, value] of Object.entries(recipe.output.baseStats)) {
			statsMap.set(key, value);
		}

		const item = new Item(
			itemId,
			{
				itemType: recipe.output.itemType,
				rarity: recipe.output.rarity,
				stats: NumericStatMap.fromMap(statsMap),
				durability: GameConfig.items.maxDurability,
				maxDurability: GameConfig.items.maxDurability,
				baseValue: recipe.output.baseValue
			},
			[recipe.output.rarity, recipe.output.itemType],
			'InArmory',
			{},
			{ displayName: `${recipe.output.rarity} ${recipe.output.itemType}` }
		);

		// Create effect to add item to entities
		return [
			new CreateItemEffect(item),
			// Mark job as completed (via SetEntityAttributeEffect)
			new SetEntityAttributeEffect(
				this.jobId,
				'attributes.status',
				'completed'
			)
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		_resources: ResourceBundle,
		_effects: Effect[],
		_params: Record<string, unknown>
	): DomainEvent[] {
		const job = entities.get(this.jobId) as CraftingJob | undefined;
		if (!job) {
			return [];
		}

		// Find created item
		const items = Array.from(entities.values()).filter((e) => e.type === 'Item');
		const createdItem = items[items.length - 1] as Item | undefined;

		return [
			{
				type: 'CraftingCompleted',
				payload: {
					jobId: this.jobId,
					recipeId: job.attributes.recipeId,
					itemId: createdItem?.id || ''
				},
				timestamp: new Date().toISOString()
			},
			...(createdItem ? [{
				type: 'ItemCreated' as const,
				payload: {
					itemId: createdItem.id,
					itemType: createdItem.attributes.itemType,
					rarity: createdItem.attributes.rarity
				},
				timestamp: new Date().toISOString()
			}] : [])
		];
	}
}

