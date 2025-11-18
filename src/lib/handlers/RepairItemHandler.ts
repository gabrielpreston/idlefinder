/**
 * RepairItem command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses RepairItemAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { RepairItemCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { RepairItemAction } from '../domain/actions/RepairItemAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';

/**
 * Create RepairItem command handler using Actions
 */
export function createRepairItemHandler(): CommandHandler<RepairItemCommand, GameState> {
	return async function(
		payload: RepairItemCommand,
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
		const action = new RepairItemAction(payload.itemId);

		// Execute action (validates requirements, computes effects)
		const actionResult = action.execute(requirementContext, {
			itemId: payload.itemId
		});

		if (!actionResult.success) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RepairItem',
							reason: actionResult.error || 'Failed to repair item'
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
				itemId: payload.itemId
			}
		);

		return {
			newState,
			events
		};
	};
}

