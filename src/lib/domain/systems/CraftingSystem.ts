/**
 * Crafting System - Pure function for processing crafting queue
 * Per plan Phase 3.5: Returns actions/effects that IdleLoop processes
 */

import type { GameState } from '../entities/GameState';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { CraftingQueue } from '../entities/CraftingQueue';
import type { CraftingJob } from '../entities/CraftingJob';
import { getTimer } from '../primitives/TimerHelpers';
import { getDefaultCraftingRecipes } from '../data/crafting/recipes';
import type { DomainEvent } from '../primitives/Event';
import { CompleteCraftingAction } from '../actions/CompleteCraftingAction';
import { StartCraftingAction } from '../actions/StartCraftingAction';

export interface CraftingResult {
	actions: Array<CompleteCraftingAction | StartCraftingAction>;
	events: DomainEvent[];
}

/**
 * Crafting System - Pure function that processes crafting queue
 * Per plan Phase 3.5: Called from IdleLoop.processIdleProgression() after mission processing
 */
export function processCraftingQueue(
	state: GameState,
	now: Timestamp
): CraftingResult {
	const actions: Array<CompleteCraftingAction | StartCraftingAction> = [];
	const events: DomainEvent[] = [];

	// Find CraftingQueue entity
	let craftingQueue: CraftingQueue | undefined;
	for (const entity of state.entities.values()) {
		if (entity.type === 'CraftingQueue') {
			craftingQueue = entity as CraftingQueue;
			break;
		}
	}

	if (!craftingQueue || craftingQueue.state !== 'Active') {
		return { actions, events };
	}

	// Get active jobs
	const activeJobIds = craftingQueue.getActiveJobIds();
	const recipes = getDefaultCraftingRecipes();

	// Check for completed jobs
	for (const jobId of activeJobIds) {
		const job = state.entities.get(jobId) as CraftingJob | undefined;
		if (!job || job.type !== 'CraftingJob') {
			continue;
		}

		const completeAt = getTimer(job, 'completeAt');
		if (completeAt && now.value >= completeAt.value) {
			// Job is complete - create CompleteCraftingAction
			actions.push(new CompleteCraftingAction(jobId));
		}
	}

	// Start next job if slot available
	if (craftingQueue.hasAvailableSlot()) {
		const queue = craftingQueue.getQueue();
		for (const jobId of queue) {
			const job = state.entities.get(jobId) as CraftingJob | undefined;
			if (!job || job.type !== 'CraftingJob') {
				continue;
			}

			if (job.attributes.status === 'queued') {
				// Start this job
				const recipe = recipes.find((r) => r.id === job.attributes.recipeId);
				if (recipe) {
					actions.push(new StartCraftingAction(jobId, recipe.duration));
				}
				break; // Only start one job at a time
			}
		}
	}

	return { actions, events };
}

