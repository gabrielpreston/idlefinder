/**
 * CancelCraftingJob command handler
 * Removes a crafting job from the queue
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { CancelCraftingJobCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import type { CraftingQueue } from '../domain/entities/CraftingQueue';
import type { CraftingJob } from '../domain/entities/CraftingJob';

/**
 * Create CancelCraftingJob command handler
 */
export function createCancelCraftingJobHandler(): CommandHandler<CancelCraftingJobCommand, GameState> {
	return async function(
		payload: CancelCraftingJobCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		const job = state.entities.get(payload.jobId) as CraftingJob | undefined;
		if (!job || job.type !== 'CraftingJob') {
			return {
				newState: state,
				events: []
			};
		}

		// Only allow canceling queued jobs
		if (job.attributes.status !== 'queued') {
			return {
				newState: state,
				events: []
			};
		}

		// Find crafting queue
		let craftingQueue: CraftingQueue | undefined;
		for (const entity of state.entities.values()) {
			if (entity.type === 'CraftingQueue') {
				craftingQueue = entity as CraftingQueue;
				break;
			}
		}

		if (craftingQueue) {
			craftingQueue.removeJob(payload.jobId);
		}

		// Remove job from entities
		state.entities.delete(payload.jobId);

		// Create new state
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			state.entities,
			state.resources
		);

		return {
			newState,
			events: []
		};
	};
}

