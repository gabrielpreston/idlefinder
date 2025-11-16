/**
 * Mission System - handles mission progression
 * Subscribes to tick bus to update mission timers
 */

import type { PlayerState, Mission } from '../entities/PlayerState';
import type { TickHandler } from '../../bus/TickBus';
import type { DomainEventBus } from '../../bus/DomainEventBus';
import type { CommandBus } from '../../bus/CommandBus';

/**
 * Mission System - handles mission progression
 */
export class MissionSystem {
	private stateGetter: () => PlayerState;
	private stateSetter: (state: PlayerState) => void;
	private eventBus: DomainEventBus;
	private commandBus: CommandBus<PlayerState>;

	constructor(
		stateGetter: () => PlayerState,
		stateSetter: (state: PlayerState) => void,
		eventBus: DomainEventBus,
		commandBus: CommandBus<PlayerState>
	) {
		this.stateGetter = stateGetter;
		this.stateSetter = stateSetter;
		this.eventBus = eventBus;
		this.commandBus = commandBus;
	}

	/**
	 * Create tick handler for mission progression
	 */
	createTickHandler(): TickHandler {
		return async (deltaMs: number, timestamp: Date) => {
			const state = this.stateGetter();
			const now = timestamp.getTime();

			for (const mission of state.missions) {
				if (mission.status === 'inProgress') {
					const startTime = new Date(mission.startTime).getTime();
					const elapsed = now - startTime;

					if (elapsed >= mission.duration) {
						// Re-check state before dispatching to prevent duplicate completions
						const currentState = this.stateGetter();
						const currentMission = currentState.missions.find((m) => m.id === mission.id);

						// Only dispatch if mission is still in progress
						if (currentMission && currentMission.status === 'inProgress') {
							// Dispatch CompleteMission command - let the handler do all the work
							await this.commandBus.dispatch({
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
	 * Returns new state with mission added and adventurers updated
	 */
	startMission(
		state: PlayerState,
		missionId: string,
		missionName: string,
		duration: number,
		adventurerIds: string[],
		reward: { resources: { gold: number; supplies: number; relics: number }; fame: number; experience: number }
	): PlayerState {
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
			startTime: new Date().toISOString(),
			assignedAdventurerIds: adventurerIds,
			reward,
			status: 'inProgress'
		};

		return {
			...state,
			missions: [...state.missions, mission],
			adventurers: updatedAdventurers
		};
	}
}

