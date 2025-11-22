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
import { calculateEffectiveCraftingDuration } from './CraftingDurationModifiers';
import { getFacilitiesByType } from '../queries/FacilityQueries';
import { EntityQueryBuilder } from '../queries/EntityQueryBuilder';

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
	const craftingQueues = EntityQueryBuilder.byType<CraftingQueue>('CraftingQueue')(state);
	const craftingQueue = craftingQueues.find((q) => q.state === 'Active');

	if (!craftingQueue) {
		return { actions, events };
	}

	// Get active jobs
	const activeJobIds = craftingQueue.getActiveJobIds();
	const recipes = getDefaultCraftingRecipes();

	// Check for completed jobs
	for (const jobId of activeJobIds) {
		const job = state.entities.get(jobId) as CraftingJob | undefined;
		if (!job) {
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
			if (!job) {
				continue;
			}

			if (job.attributes.status === 'queued') {
				// Start this job
				const recipe = recipes.find((r) => r.id === job.attributes.recipeId);
				if (recipe) {
					// Query for crafting-related facilities (future: Armory/Blacksmith)
					// Note: Current facility types don't include crafting facilities (documented as future)
					// Reference: src/lib/domain/attributes/FacilityAttributes.ts:7
					const craftingFacilities = getFacilitiesByType('Armory', state);
					const facility = craftingFacilities.length > 0 ? craftingFacilities[0] : undefined;

					// Calculate effective duration with modifiers
					const effectiveDuration = calculateEffectiveCraftingDuration(recipe, facility, state);
					actions.push(new StartCraftingAction(jobId, effectiveDuration));
				}
				break; // Only start one job at a time
			}
		}
	}

	return { actions, events };
}

