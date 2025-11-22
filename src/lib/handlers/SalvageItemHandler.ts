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
import { validateCommand } from '../bus/commandValidation';

/**
 * Create SalvageItem command handler using Actions
 */
export function createSalvageItemHandler(): CommandHandler<SalvageItemCommand, GameState> {
	return function(
		payload: SalvageItemCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('SalvageItem', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'SalvageItem',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as SalvageItemCommand;

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: state.entities,
			resources: state.resources,
			currentTime: context.currentTime
		};

		// Create action
		const action = new SalvageItemAction(
			validatedPayload.itemId,
			validatedPayload.materialsAmount
		);

		// Execute action (validates requirements, computes effects)
		const actionResult = action.execute(requirementContext, {
			itemId: validatedPayload.itemId,
			materialsAmount: validatedPayload.materialsAmount
		});

		if (!actionResult.success) {
			return Promise.resolve({
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
				materialsAmount: validatedPayload.materialsAmount
			},
			context.currentTime
		);

		return Promise.resolve({
			newState,
			events
		});
	};
}

