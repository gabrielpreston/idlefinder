/**
 * Mission System - handles mission progression
 * Pure domain system - no bus dependencies
 */

import type { PlayerState, Mission } from '../entities/PlayerState';
import type { TickHandler } from '../../bus/TickBus';
import type { CommandBus } from '../../bus/CommandBus';
import type { DomainEvent } from '../../bus/types';

/**
 * Mission System - handles mission progression
 * Pure functional system - returns events, doesn't emit them
 */
export class MissionSystem {
	/**
	 * Create tick handler for mission progression
	 * Handler closure captures commandBus parameter (doesn't store in MissionSystem)
	 */
	createTickHandler(commandBus: CommandBus<PlayerState>, stateGetter: () => PlayerState): TickHandler {
		return async (deltaMs: number, timestamp: Date) => {
			const state = stateGetter();
			const now = timestamp.getTime();

			for (const mission of state.missions) {
				if (mission.status === 'inProgress') {
					const startTime = new Date(mission.startTime).getTime();
					const elapsed = now - startTime;

					if (elapsed >= mission.duration) {
						// Re-check state before dispatching to prevent duplicate completions
						const currentState = stateGetter();
						const currentMission = currentState.missions.find((m) => m.id === mission.id);

						// Only dispatch if mission is still in progress
						if (currentMission && currentMission.status === 'inProgress') {
							// Dispatch CompleteMission command - let the handler do all the work
							await commandBus.dispatch({
								type: 'CompleteMission',
								payload: {
									missionId: mission.id
								},
								timestamp: timestamp.toISOString()
							});
						}
					}
				}
			}
		};
	}

	/**
	 * Start a mission
	 * Returns new state and events (doesn't emit events)
	 */
	startMission(
		state: PlayerState,
		missionId: string,
		missionName: string,
		duration: number,
		adventurerIds: string[],
		reward: { resources: { gold: number; supplies: number; relics: number }; fame: number; experience: number },
		startTime: string // ISO timestamp - passed from handler
	): { newState: PlayerState; events: DomainEvent[] } {
		// Update adventurers
		const updatedAdventurers = state.adventurers.map((adv) =>
			adventurerIds.includes(adv.id)
				? { ...adv, status: 'onMission' as const, assignedMissionId: missionId }
				: adv
		);

		// Create mission
		const mission: Mission = {
			id: missionId,
			name: missionName,
			duration,
			startTime,
			assignedAdventurerIds: adventurerIds,
			reward,
			status: 'inProgress'
		};

		const newState = {
			...state,
			missions: [...state.missions, mission],
			adventurers: updatedAdventurers
		};

		// Return events (handler will dispatch them)
		const events: DomainEvent[] = [
			{
				type: 'MissionStarted',
				payload: {
					missionId,
					adventurerIds,
					startTime: mission.startTime,
					duration: mission.duration
				},
				timestamp: startTime
			}
		];

		return { newState, events };
	}
}

