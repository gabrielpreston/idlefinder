/**
 * StartMission command handler
 * Matches design spec: docs/design/04-api-message-spec.md lines 41-50, 83-93
 */

import type { CommandHandler } from '../bus/CommandBus';
import type { StartMissionCommand, DomainEvent } from '../bus/types';
import type { PlayerState } from '../domain/entities/PlayerState';
import { MissionSystem } from '../domain/systems/MissionSystem';

/**
 * Create StartMission command handler
 */
export function createStartMissionHandler(
	missionSystem: MissionSystem
): CommandHandler<StartMissionCommand, PlayerState> {
	return async (
		payload: StartMissionCommand,
		state: PlayerState
	): Promise<{ newState: PlayerState; events: DomainEvent[] }> => {
		// Validation: Check if adventurers exist
		const adventurers = state.adventurers.filter((a) =>
			payload.adventurerIds.includes(a.id)
		);

		if (adventurers.length !== payload.adventurerIds.length) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: 'One or more adventurers not found'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Validation: Check if adventurers are available
		const unavailable = adventurers.filter((a) => a.status !== 'idle');
		if (unavailable.length > 0) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: 'One or more adventurers are not available'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// For MVP: Simple mission with fixed duration and reward
		// In future: Look up mission template by missionId
		const missionName = `Mission ${payload.missionId}`;
		const duration = 60000; // 1 minute for testing
		const reward = {
			resources: { gold: 50, supplies: 10, relics: 0 },
			fame: 1,
			experience: 10
		};

		// Start mission
		const newState = missionSystem.startMission(
			state,
			payload.missionId,
			missionName,
			duration,
			payload.adventurerIds,
			reward
		);

		const mission = newState.missions.find((m) => m.id === payload.missionId)!;

		// Emit MissionStarted event
		const missionStartedEvent: DomainEvent = {
			type: 'MissionStarted',
			payload: {
				missionId: payload.missionId,
				adventurerIds: payload.adventurerIds,
				startTime: mission.startTime,
				duration: mission.duration
			},
			timestamp: new Date().toISOString()
		};

		return {
			newState,
			events: [missionStartedEvent]
		};
	};
}

