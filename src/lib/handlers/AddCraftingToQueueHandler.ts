/**
 * AddCraftingToQueue command handler
 * Adds a crafting job to the queue
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { AddCraftingToQueueCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { CraftingJob } from '../domain/entities/CraftingJob';
import { CraftingQueue } from '../domain/entities/CraftingQueue';
import { Identifier } from '../domain/valueObjects/Identifier';

/**
 * Create AddCraftingToQueue command handler
 */
export function createAddCraftingToQueueHandler(): CommandHandler<AddCraftingToQueueCommand, GameState> {
	return async function(
		payload: AddCraftingToQueueCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Find or create CraftingQueue entity
		let craftingQueue: CraftingQueue | undefined;
		for (const entity of state.entities.values()) {
			if (entity.type === 'CraftingQueue') {
				craftingQueue = entity as CraftingQueue;
				break;
			}
		}

		if (!craftingQueue) {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			craftingQueue = CraftingQueue.createDefault(queueId);
			state.entities.set(craftingQueue.id, craftingQueue);
		}

		// Create crafting job
		const jobId = Identifier.generate<'CraftingJobId'>();
		const job = new CraftingJob(
			jobId,
			{
				recipeId: payload.recipeId,
				status: 'queued'
			},
			[],
			'queued',
			{},
			{}
		);

		// Add job to queue
		craftingQueue.addJob(job.id);

		// Add job to entities
		state.entities.set(job.id, job);

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

