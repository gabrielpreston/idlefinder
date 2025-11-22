/**
 * StartMission command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses StartMissionAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { StartMissionCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { StartMissionAction } from '../domain/actions/StartMissionAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';
import { validateCommand } from '../bus/commandValidation';

/**
 * Create StartMission command handler using Actions
 */
export function createStartMissionHandler(): CommandHandler<StartMissionCommand, GameState> {
	return function(
		payload: StartMissionCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('StartMission', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as StartMissionCommand;

		// MVP: Single adventurer per mission
		if (validatedPayload.adventurerIds.length !== 1) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: 'MVP supports single adventurer per mission'
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const adventurerId = validatedPayload.adventurerIds[0];
		const now = context.currentTime;

		// Mission must already exist in the mission pool
		// Mission pool system provides all Available missions
		const existingMission = state.entities.get(validatedPayload.missionId);
		if (!existingMission || existingMission.type !== 'Mission') {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: `Mission ${validatedPayload.missionId} not found in mission pool`
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		// Use existing mission from pool
		const workingState = state;

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: workingState.entities,
			resources: workingState.resources,
			currentTime: now
		};

		// Execute action
		const action = new StartMissionAction(validatedPayload.missionId, adventurerId);
		const result = action.execute(requirementContext, {
			missionId: validatedPayload.missionId,
			adventurerId,
			startedAt: now
		});

		if (!result.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: result.error || 'Action execution failed'
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		// Apply effects
		const effectResult = applyEffects(result.effects, workingState.entities, workingState.resources);

		// Create new GameState
		const newState = new GameState(
			workingState.playerId,
			workingState.lastPlayed,
			effectResult.entities,
			effectResult.resources
		);

		// Generate events
		const events = action.generateEvents(
			effectResult.entities,
			effectResult.resources,
			result.effects,
			{ missionId: payload.missionId, adventurerId, startedAt: now },
			context.currentTime
		);

		return Promise.resolve({
			newState,
			events
		});
	};
}

