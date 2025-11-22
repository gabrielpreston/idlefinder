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
import { validateCommand } from '../bus/commandValidation';

/**
 * Create RepairItem command handler using Actions
 */
export function createRepairItemHandler(): CommandHandler<RepairItemCommand, GameState> {
	return function(
		payload: RepairItemCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('RepairItem', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RepairItem',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as RepairItemCommand;

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: state.entities,
			resources: state.resources,
			currentTime: context.currentTime
		};

		// Create action
		const action = new RepairItemAction(validatedPayload.itemId);

		// Execute action (validates requirements, computes effects)
		const actionResult = action.execute(requirementContext, {
			itemId: validatedPayload.itemId
		});

		if (!actionResult.success) {
			return Promise.resolve({
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
			});
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
				itemId: validatedPayload.itemId
			},
			context.currentTime
		);

		return Promise.resolve({
			newState,
			events
		});
	};
}

