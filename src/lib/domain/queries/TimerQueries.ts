/**
 * Timer Queries
 * 
 * Queries for finding and aggregating active timers across entities.
 * Used for Dashboard display of upcoming completions (missions, recovery, crafting).
 */

import type { GameState } from '../entities/GameState';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';
import type { CraftingJob } from '../entities/CraftingJob';
import type { CraftingQueue } from '../entities/CraftingQueue';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { getTimer } from '../primitives/TimerHelpers';
import { getDefaultCraftingRecipes } from '../data/crafting/recipes';

/**
 * Active mission timer information
 */
export interface MissionTimerInfo {
	missionId: string;
	missionName: string;
	endsAt: number;
	timeRemaining: number;
}

/**
 * Active adventurer recovery timer information
 */
export interface AdventurerRecoveryTimerInfo {
	adventurerId: string;
	adventurerName: string;
	recoveryUntil: number;
	timeRemaining: number;
	type: 'fatigue' | 'recovery';
}

/**
 * Active crafting timer information
 */
export interface CraftingTimerInfo {
	jobId: string;
	jobName: string;
	completeAt: number;
	timeRemaining: number;
}

/**
 * Aggregated timer information for display
 */
export interface TimerInfo {
	id: string;
	label: string;
	timeRemaining: number;
	type: 'mission' | 'recovery' | 'crafting' | 'upgrade';
}

/**
 * Get active mission timers (missions with endsAt timer)
 * 
 * @param state GameState
 * @param now Current time in milliseconds
 * @returns Array of active mission timers
 */
export function getActiveMissionTimers(state: GameState, now: number): MissionTimerInfo[] {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	const activeTimers: MissionTimerInfo[] = [];

	for (const mission of missions) {
		if (mission.state !== 'InProgress') {
			continue;
		}

		const endsAtTimer = getTimer(mission, 'endsAt');
		if (!endsAtTimer) {
			continue;
		}

		const endsAt = endsAtTimer.value;
		const timeRemaining = Math.max(0, endsAt - now);

		// Only include timers that haven't expired
		if (timeRemaining > 0) {
			const missionName = (mission.metadata.name as string) || `Mission ${mission.id.slice(0, 8)}`;
			activeTimers.push({
				missionId: mission.id,
				missionName,
				endsAt,
				timeRemaining
			});
		}
	}

	return activeTimers;
}

/**
 * Get active adventurer recovery timers (fatigueUntil or recoveryUntil)
 * 
 * @param state GameState
 * @param now Current time in milliseconds
 * @returns Array of active recovery timers
 */
export function getAdventurerRecoveryTimers(
	state: GameState,
	now: number
): AdventurerRecoveryTimerInfo[] {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	const activeTimers: AdventurerRecoveryTimerInfo[] = [];

	for (const adventurer of adventurers) {
		// Check fatigueUntil timer
		const fatigueUntilTimer = getTimer(adventurer, 'fatigueUntil');
		if (fatigueUntilTimer) {
			const recoveryUntil = fatigueUntilTimer.value;
			const timeRemaining = Math.max(0, recoveryUntil - now);

			if (timeRemaining > 0) {
				const adventurerName =
					(adventurer.metadata.displayName as string) ||
					(adventurer.metadata.name as string) ||
					`Adventurer ${adventurer.id.slice(0, 8)}`;
				activeTimers.push({
					adventurerId: adventurer.id,
					adventurerName,
					recoveryUntil,
					timeRemaining,
					type: 'fatigue'
				});
			}
		}

		// Check recoveryUntil timer
		const recoveryUntilTimer = getTimer(adventurer, 'recoveryUntil');
		if (recoveryUntilTimer) {
			const recoveryUntil = recoveryUntilTimer.value;
			const timeRemaining = Math.max(0, recoveryUntil - now);

			if (timeRemaining > 0) {
				const adventurerName =
					(adventurer.metadata.displayName as string) ||
					(adventurer.metadata.name as string) ||
					`Adventurer ${adventurer.id.slice(0, 8)}`;
				activeTimers.push({
					adventurerId: adventurer.id,
					adventurerName,
					recoveryUntil,
					timeRemaining,
					type: 'recovery'
				});
			}
		}
	}

	return activeTimers;
}

/**
 * Get active crafting timers (crafting jobs with completeAt timer)
 * 
 * @param state GameState
 * @param now Current time in milliseconds
 * @returns Array of active crafting timers
 */
export function getActiveCraftingTimers(state: GameState, now: number): CraftingTimerInfo[] {
	// Find CraftingQueue entity
	let craftingQueue: CraftingQueue | undefined;
	for (const entity of state.entities.values()) {
		if (entity.type === 'CraftingQueue') {
			craftingQueue = entity as CraftingQueue;
			break;
		}
	}

	if (!craftingQueue || craftingQueue.state !== 'Active') {
		return [];
	}

	// Get active job IDs
	const activeJobIds = craftingQueue.getActiveJobIds();
	const recipes = getDefaultCraftingRecipes();
	const activeTimers: CraftingTimerInfo[] = [];

	for (const jobId of activeJobIds) {
		const job = state.entities.get(jobId) as CraftingJob | undefined;
		if (!job || job.type !== 'CraftingJob') {
			continue;
		}

		// Only include in-progress jobs
		if (job.attributes.status !== 'in-progress') {
			continue;
		}

		const completeAtTimer = getTimer(job, 'completeAt');
		if (!completeAtTimer) {
			continue;
		}

		const completeAt = completeAtTimer.value;
		const timeRemaining = Math.max(0, completeAt - now);

		if (timeRemaining > 0) {
			// Derive job name from recipe
			const recipe = recipes.find((r) => r.id === job.attributes.recipeId);
			const jobName = recipe
				? `${recipe.rarity} ${recipe.itemType}`
				: `Crafting Job ${job.id.slice(0, 8)}`;

			activeTimers.push({
				jobId: job.id,
				jobName,
				completeAt,
				timeRemaining
			});
		}
	}

	return activeTimers;
}

/**
 * Get all active timers aggregated for display
 * 
 * @param state GameState
 * @param now Current time in milliseconds
 * @returns Array of all active timers, sorted by time remaining (soonest first)
 */
export function getAllActiveTimers(state: GameState, now: number): TimerInfo[] {
	const timers: TimerInfo[] = [];

	// Mission timers
	const missionTimers = getActiveMissionTimers(state, now);
	for (const timer of missionTimers) {
		timers.push({
			id: timer.missionId,
			label: timer.missionName,
			timeRemaining: timer.timeRemaining,
			type: 'mission'
		});
	}

	// Recovery timers
	const recoveryTimers = getAdventurerRecoveryTimers(state, now);
	for (const timer of recoveryTimers) {
		timers.push({
			id: timer.adventurerId,
			label: `${timer.adventurerName} (${timer.type})`,
			timeRemaining: timer.timeRemaining,
			type: 'recovery'
		});
	}

	// Crafting timers
	const craftingTimers = getActiveCraftingTimers(state, now);
	for (const timer of craftingTimers) {
		timers.push({
			id: timer.jobId,
			label: timer.jobName,
			timeRemaining: timer.timeRemaining,
			type: 'crafting'
		});
	}

	// Sort by time remaining (soonest first)
	timers.sort((a, b) => a.timeRemaining - b.timeRemaining);

	return timers;
}

