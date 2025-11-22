/**
 * CancelCraftingJob command handler
 * Removes a crafting job from the queue
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { CancelCraftingJobCommand, DomainEvent } from '../bus/types';
import { validateCommand } from '../bus/commandValidation';
import { GameState } from '../domain/entities/GameState';
import type { CraftingQueue } from '../domain/entities/CraftingQueue';
import type { CraftingJob } from '../domain/entities/CraftingJob';

/**
 * Create CancelCraftingJob command handler
 */
export function createCancelCraftingJobHandler(): CommandHandler<CancelCraftingJobCommand, GameState> {
	return function(
		payload: CancelCraftingJobCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('CancelCraftingJob', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'CancelCraftingJob',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as CancelCraftingJobCommand;

		const job = state.entities.get(validatedPayload.jobId) as CraftingJob | undefined;
		if (!job) {
			return Promise.resolve({
				newState: state,
				events: []
			});
		}

		// Only allow canceling queued jobs
		if (job.attributes.status !== 'queued') {
			return Promise.resolve({
				newState: state,
				events: []
			});
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
			craftingQueue.removeJob(validatedPayload.jobId);
		}

		// Remove job from entities
		state.entities.delete(validatedPayload.jobId);

		// Create new state
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			state.entities,
			state.resources
		);

		return Promise.resolve({
			newState,
			events: []
		});
	};
}

