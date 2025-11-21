/**
 * RefreshRecruitPool command handler
 * Regenerates the recruit pool by removing existing preview entities and creating new ones
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { RefreshRecruitPoolCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../domain/valueObjects/ResourceUnit';
import { GameConfig } from '../domain/config/GameConfig';
import { generateRecruitPool } from '../domain/systems/RecruitPoolSystem';
import type { Adventurer } from '../domain/entities/Adventurer';

/**
 * Create RefreshRecruitPool command handler
 */
export function createRefreshRecruitPoolHandler(): CommandHandler<RefreshRecruitPoolCommand, GameState> {
	return async function(
		_payload: RefreshRecruitPoolCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validation: Check if player has enough gold
		const refreshCost = GameConfig.costs.refreshRecruitPool;
		const currentGold = state.resources.get('gold') || 0;
		if (currentGold < refreshCost) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RefreshRecruitPool',
							reason: `Insufficient gold: need ${refreshCost}, have ${currentGold}`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Create new entities map
		const newEntities = new Map(state.entities);

		// Remove existing preview entities
		for (const [id, entity] of state.entities.entries()) {
			if (entity.type === 'Adventurer') {
				const adventurer = entity as Adventurer;
				if (adventurer.state === 'Preview') {
					newEntities.delete(id);
				}
			}
		}

		// Generate new pool of 4 preview adventurers
		const newPreviewAdventurers = generateRecruitPool(4);

		// Add new preview adventurers to entities map
		for (const previewAdventurer of newPreviewAdventurers) {
			newEntities.set(previewAdventurer.id, previewAdventurer);
		}

		// Deduct refresh cost from resources
		const costBundle = ResourceBundle.fromArray([new ResourceUnit('gold', refreshCost)]);
		const newResources = state.resources.subtract(costBundle);

		// Create new GameState
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			newEntities,
			newResources
		);

		// Emit RecruitPoolRefreshed event
		const recruitPoolRefreshedEvent: DomainEvent = {
			type: 'RecruitPoolRefreshed',
			payload: {},
			timestamp: new Date().toISOString()
		};

		return {
			newState,
			events: [recruitPoolRefreshedEvent]
		};
	};
}

