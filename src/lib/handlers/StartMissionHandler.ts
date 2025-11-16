/**
 * StartMission command handler
 * Matches design spec: docs/design/04-api-message-spec.md lines 41-50, 83-93
 */

import type { CommandHandler } from '../bus/CommandBus';
import type { StartMissionCommand, DomainEvent } from '../bus/types';
import type { PlayerState } from '../domain/entities/PlayerState';
import { MissionSystem } from '../domain/systems';

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

		// Validation: Check for any existing missions with the same template ID that are still in progress
		// This prevents issues with duplicate IDs (though new missions now have unique IDs)
		const existingInProgress = state.missions.filter(
			(m) => m.id.startsWith(payload.missionId) && m.status === 'inProgress'
		);
		if (existingInProgress.length > 0) {
			// This shouldn't happen with unique IDs, but log a warning if it does
			console.warn(
				`[StartMissionHandler] Found ${existingInProgress.length} existing in-progress mission(s) with similar ID to ${payload.missionId}`
			);
		}

		// For MVP: Simple mission with fixed duration and reward
		// In future: Look up mission template by missionId
		// Generate unique mission instance ID to prevent duplicates
		const missionInstanceId = `${payload.missionId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
		const missionName = `Mission ${payload.missionId}`;
		const duration = 60000; // 1 minute for testing
		const reward = {
			resources: { gold: 50, supplies: 10, relics: 0 },
			fame: 1,
			experience: 10
		};

		// Start mission with unique instance ID
		const startTime = new Date().toISOString();
		const { newState, events } = missionSystem.startMission(
			state,
			missionInstanceId,
			missionName,
			duration,
			payload.adventurerIds,
			reward,
			startTime
		);

		// Return new state and events (CommandBus will dispatch events)
		return {
			newState,
			events
		};
	};
}

