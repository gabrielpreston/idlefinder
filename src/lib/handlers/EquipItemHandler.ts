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
import { validateCommand } from '../bus/commandValidation';

/**
 * Create EquipItem command handler using Actions
 */
export function createEquipItemHandler(): CommandHandler<EquipItemCommand, GameState> {
	return function(
		payload: EquipItemCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('EquipItem', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'EquipItem',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as EquipItemCommand;

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: state.entities,
			resources: state.resources,
			currentTime: context.currentTime
		};

		// Create action
		const action = new EquipItemAction(
			validatedPayload.itemId,
			validatedPayload.adventurerId,
			validatedPayload.slot
		);

		// Execute action (validates requirements, computes effects)
		const actionResult = action.execute(requirementContext, {
			itemId: validatedPayload.itemId,
			adventurerId: validatedPayload.adventurerId,
			slot: validatedPayload.slot
		});

		if (!actionResult.success) {
			return Promise.resolve({
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
				itemId: validatedPayload.itemId,
				adventurerId: validatedPayload.adventurerId,
				slot: validatedPayload.slot
			},
			context.currentTime
		);

		return Promise.resolve({
			newState,
			events
		});
	};
}

