/**
 * CompleteMission command handler
 * Matches design spec: docs/design/04-api-message-spec.md lines 51-58, 94-105
 * 
 * Note: This is typically invoked by the mission system when time elapses,
 * but can also be called manually for testing or special cases.
 */

import type { CommandHandler } from '../bus/CommandBus';
import type { CompleteMissionCommand, DomainEvent } from '../bus/types';
import type { PlayerState } from '../domain/entities/PlayerState';
import { AdventurerSystem } from '../domain/systems';

/**
 * Create CompleteMission command handler
 */
export function createCompleteMissionHandler(
	adventurerSystem: AdventurerSystem
): CommandHandler<CompleteMissionCommand, PlayerState> {
	return async (
		payload: CompleteMissionCommand,
		state: PlayerState
	): Promise<{ newState: PlayerState; events: DomainEvent[] }> => {
		// Find mission
		const mission = state.missions.find((m) => m.id === payload.missionId);

		if (!mission) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'CompleteMission',
							reason: `Mission ${payload.missionId} not found`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		if (mission.status === 'completed') {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'CompleteMission',
							reason: `Mission ${payload.missionId} is already completed`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Mark mission as completed
		const updatedMissions = state.missions.map((m) =>
			m.id === payload.missionId ? { ...m, status: 'completed' as const } : m
		);

		// Free adventurers
		let updatedState: PlayerState = {
			...state,
			missions: updatedMissions
		};

		for (const adventurerId of mission.assignedAdventurerIds) {
			updatedState = {
				...updatedState,
				adventurers: updatedState.adventurers.map((adv) =>
					adv.id === adventurerId
						? { ...adv, status: 'idle' as const, assignedMissionId: null }
						: adv
				)
			};
		}

		// Apply rewards
		updatedState = {
			...updatedState,
			resources: {
				gold: updatedState.resources.gold + mission.reward.resources.gold,
				supplies: updatedState.resources.supplies + mission.reward.resources.supplies,
				relics: updatedState.resources.relics + mission.reward.resources.relics
			},
			fame: updatedState.fame + mission.reward.fame,
			completedMissionIds: [...updatedState.completedMissionIds, mission.id]
		};

		// Apply experience to adventurers
		for (const adventurerId of mission.assignedAdventurerIds) {
			updatedState = adventurerSystem.applyExperience(
				updatedState,
				adventurerId,
				mission.reward.experience
			);
		}

		// Emit MissionCompleted event
		const missionCompletedEvent: DomainEvent = {
			type: 'MissionCompleted',
			payload: {
				missionId: payload.missionId,
				adventurerIds: mission.assignedAdventurerIds,
				outcome: 'Success',
				rewards: {
					gold: mission.reward.resources.gold,
					xp: mission.reward.experience,
					fame: mission.reward.fame
				}
			},
			timestamp: new Date().toISOString()
		};

		// Emit ResourcesChanged event
		const resourcesChangedEvent: DomainEvent = {
			type: 'ResourcesChanged',
			payload: {
				delta: mission.reward.resources,
				current: updatedState.resources
			},
			timestamp: new Date().toISOString()
		};

		return {
			newState: updatedState,
			events: [missionCompletedEvent, resourcesChangedEvent]
		};
	};
}

