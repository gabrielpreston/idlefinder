/**
 * EquipItem command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses EquipItemAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { EquipItemCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { EquipItemAction } from '../domain/actions/EquipItemAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';

/**
 * Create EquipItem command handler using Actions
 */
export function createEquipItemHandler(): CommandHandler<EquipItemCommand, GameState> {
	return async function(
		payload: EquipItemCommand,
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
		const action = new EquipItemAction(
			payload.itemId,
			payload.adventurerId,
			payload.slot
		);

		// Execute action (validates requirements, computes effects)
		const actionResult = action.execute(requirementContext, {
			itemId: payload.itemId,
			adventurerId: payload.adventurerId,
			slot: payload.slot
		});

		if (!actionResult.success) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'EquipItem',
							reason: actionResult.error || 'Failed to equip item'
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
				adventurerId: payload.adventurerId,
				slot: payload.slot
			}
		);

		return {
			newState,
			events
		};
	};
}

