/**
 * SalvageItem command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses SalvageItemAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { SalvageItemCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { SalvageItemAction } from '../domain/actions/SalvageItemAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';

/**
 * Create SalvageItem command handler using Actions
 */
export function createSalvageItemHandler(): CommandHandler<SalvageItemCommand, GameState> {
	return async function(
		payload: SalvageItemCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: state.entities,
			resources: state.resources,
			currentTime: context.currentTime
		};

		// Create action
		const action = new SalvageItemAction(
			payload.itemId,
			payload.materialsAmount
		);

		// Execute action (validates requirements, computes effects)
		const actionResult = action.execute(requirementContext, {
			itemId: payload.itemId,
			materialsAmount: payload.materialsAmount
		});

		if (!actionResult.success) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'SalvageItem',
							reason: actionResult.error || 'Failed to salvage item'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Apply effects
		const effectResult = applyEffects(actionResult.effects, state.entities, state.resources);

		// Update state
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			effectResult.entities,
			effectResult.resources
		);

		// Generate events (with updated state)
		const events = action.generateEvents(
			effectResult.entities,
			effectResult.resources,
			actionResult.effects,
			{
				itemId: payload.itemId,
				materialsAmount: payload.materialsAmount
			}
		);

		return {
			newState,
			events
		};
	};
}

