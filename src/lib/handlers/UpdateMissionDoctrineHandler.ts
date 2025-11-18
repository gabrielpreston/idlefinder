/**
 * UpdateMissionDoctrine command handler
 * Updates the MissionDoctrine entity in GameState
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { UpdateMissionDoctrineCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { MissionDoctrine } from '../domain/entities/MissionDoctrine';
import { Identifier } from '../domain/valueObjects/Identifier';

/**
 * Create UpdateMissionDoctrine command handler
 */
export function createUpdateMissionDoctrineHandler(): CommandHandler<UpdateMissionDoctrineCommand, GameState> {
	return async function(
		payload: UpdateMissionDoctrineCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
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
		if (payload.focus) {
			doctrineEntity.updateFocus(payload.focus);
		}

		// Update risk tolerance if provided
		if (payload.riskTolerance) {
			doctrineEntity.updateRiskTolerance(payload.riskTolerance);
		}

		// Update other attributes if provided
		if (payload.preferredMissionTypes !== undefined) {
			doctrineEntity.attributes.preferredMissionTypes = payload.preferredMissionTypes;
		}
		if (payload.minLevel !== undefined) {
			doctrineEntity.attributes.minLevel = payload.minLevel;
		}
		if (payload.maxLevel !== undefined) {
			doctrineEntity.attributes.maxLevel = payload.maxLevel;
		}

		// Create new state with updated entities
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			state.entities,
			state.resources
		);

		return {
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
		};
	};
}

