/**
 * UpdateMissionDoctrine command handler
 * Updates the MissionDoctrine entity in GameState
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { UpdateMissionDoctrineCommand, DomainEvent } from '../bus/types';
import { validateCommand } from '../bus/commandValidation';
import { GameState } from '../domain/entities/GameState';
import { MissionDoctrine } from '../domain/entities/MissionDoctrine';
import { Identifier } from '../domain/valueObjects/Identifier';

/**
 * Create UpdateMissionDoctrine command handler
 */
export function createUpdateMissionDoctrineHandler(): CommandHandler<UpdateMissionDoctrineCommand, GameState> {
	return function(
		payload: UpdateMissionDoctrineCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('UpdateMissionDoctrine', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpdateMissionDoctrine',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as UpdateMissionDoctrineCommand;

		// Find MissionDoctrine entity (should be singleton)
		let doctrineEntity: MissionDoctrine | undefined;
		for (const entity of state.entities.values()) {
			if (entity.type === 'MissionDoctrine') {
				doctrineEntity = entity as MissionDoctrine;
				break;
			}
		}

		// If no doctrine entity exists, create default one
		if (!doctrineEntity) {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			doctrineEntity = MissionDoctrine.createDefault(doctrineId);
			state.entities.set(doctrineEntity.id, doctrineEntity);
		}

		// Update focus if provided
		if (validatedPayload.focus) {
			doctrineEntity.updateFocus(validatedPayload.focus);
		}

		// Update risk tolerance if provided
		if (validatedPayload.riskTolerance) {
			doctrineEntity.updateRiskTolerance(validatedPayload.riskTolerance);
		}

		// Update other attributes if provided
		if (validatedPayload.preferredMissionTypes !== undefined) {
			doctrineEntity.attributes.preferredMissionTypes = validatedPayload.preferredMissionTypes;
		}
		if (validatedPayload.minLevel !== undefined) {
			doctrineEntity.attributes.minLevel = validatedPayload.minLevel;
		}
		if (validatedPayload.maxLevel !== undefined) {
			doctrineEntity.attributes.maxLevel = validatedPayload.maxLevel;
		}

		// Create new state with updated entities
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			state.entities,
			state.resources
		);

		return Promise.resolve({
			newState,
			events: [
				{
					type: 'MissionDoctrineUpdated',
					payload: {
						focus: doctrineEntity.attributes.focus,
						riskTolerance: doctrineEntity.attributes.riskTolerance
					},
					timestamp: new Date().toISOString()
				}
			]
		});
	};
}

