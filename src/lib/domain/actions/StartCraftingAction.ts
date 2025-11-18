/**
 * StartCrafting Action - Begins a crafting job
 * Per Systems Primitives Spec: Requirements -> Effects -> Events lifecycle
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import type { Effect } from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { SetTimerEffect, ModifyResourceEffect } from '../primitives/Effect';
import { entityExistsRequirement } from '../primitives/Requirement';
import type { CraftingJob } from '../entities/CraftingJob';
import { Duration } from '../valueObjects/Duration';
import { Timestamp } from '../valueObjects/Timestamp';
import { getDefaultCraftingRecipes } from '../data/crafting/recipes';

export interface StartCraftingParams {
	jobId: string;
	duration: Duration;
	startedAt: Timestamp;
}

/**
 * StartCrafting Action
 */
export class StartCraftingAction extends Action {
	constructor(
		private readonly jobId: string,
		private readonly duration: Duration
	) {
		super();
	}

	getRequirements(): Requirement[] {
		return [entityExistsRequirement(this.jobId, 'CraftingJob')];
	}

	computeEffects(
		context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const startParams = params as unknown as StartCraftingParams;
		const job = context.entities.get(this.jobId) as CraftingJob | undefined;
		if (!job) {
			throw new Error(`CraftingJob ${this.jobId} not found`);
		}

		const startedAt = startParams?.startedAt || context.currentTime;
		const duration = startParams?.duration || this.duration;
		const completeAt = Timestamp.from(startedAt.value + duration.milliseconds);

		// Find recipe and subtract resources
		const recipes = getDefaultCraftingRecipes();
		const recipe = recipes.find((r) => r.id === job.attributes.recipeId);
		if (!recipe) {
			throw new Error(`Recipe ${job.attributes.recipeId} not found`);
		}

		const effects: Effect[] = [
			// Set timers
			new SetTimerEffect(this.jobId, 'startedAt', startedAt),
			new SetTimerEffect(this.jobId, 'completeAt', completeAt),
			// Subtract resources
			new ModifyResourceEffect(
				recipe.input.toArray(),
				'subtract'
			)
		];

		return effects;
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

		return [
			{
				type: 'CraftingStarted',
				payload: {
					jobId: this.jobId,
					recipeId: job.attributes.recipeId
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

