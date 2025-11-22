/**
 * ConstructFacility command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses ConstructFacilityAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { ConstructFacilityCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { ConstructFacilityAction } from '../domain/actions/ConstructFacilityAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';
import { validateCommand } from '../bus/commandValidation';

/**
 * Create ConstructFacility command handler using Actions
 */
export function createConstructFacilityHandler(): CommandHandler<ConstructFacilityCommand, GameState> {
	return function(
		payload: ConstructFacilityCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('ConstructFacility', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'ConstructFacility',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		// Use validated payload (type assertion needed for TypeScript narrowing)
		const validatedPayload = validation.data as ConstructFacilityCommand;

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: state.entities,
			resources: state.resources,
			currentTime: context.currentTime
		};

		// Execute action
		const action = new ConstructFacilityAction(validatedPayload.facilityType);
		const result = action.execute(requirementContext, {});

		if (!result.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'ConstructFacility',
							reason: result.error || 'Action execution failed'
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		// Apply effects
		const effectResult = applyEffects(result.effects, state.entities, state.resources);

		// Create new GameState
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			effectResult.entities,
			effectResult.resources
		);

		// Generate events
		const events = action.generateEvents(
			effectResult.entities,
			effectResult.resources,
			result.effects,
			{},
			context.currentTime
		);

		return Promise.resolve({
			newState,
			events
		});
	};
}

