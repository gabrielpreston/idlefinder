/**
 * Mission Automation System - Pure function for automatic mission selection and starting
 * Per plan Phase 4.3: Returns actions/effects that IdleLoop processes (not commands)
 */

import type { GameState } from '../entities/GameState';
import { selectMissionByDoctrine } from './DoctrineEngine';
import { StartMissionAction } from '../actions/StartMissionAction';
import type { MissionDoctrine } from '../entities/MissionDoctrine';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';

export interface AutomationResult {
	actions: StartMissionAction[];
}

/**
 * Mission Automation System - Pure function that selects and returns actions
 * Per plan Phase 4.3: Returns StartMissionAction[] for IdleLoop to process
 */
export function automateMissionSelection(
	state: GameState
): AutomationResult {
	const actions: StartMissionAction[] = [];

	// Find MissionDoctrine entity
	let doctrine: MissionDoctrine | undefined;
	for (const entity of state.entities.values()) {
		if (entity.type === 'MissionDoctrine') {
			doctrine = entity as MissionDoctrine;
			break;
		}
	}

	if (!doctrine || doctrine.state !== 'Active') {
		return { actions };
	}

	// Get available missions (Available state)
	const availableMissions = Array.from(state.entities.values())
		.filter((e) => e.type === 'Mission' && (e as Mission).state === 'Available')
		.map((e) => e as Mission);

	// Get available adventurers (Idle state)
	const availableAdventurers = Array.from(state.entities.values())
		.filter((e) => e.type === 'Adventurer' && (e as Adventurer).state === 'Idle')
		.map((e) => e as Adventurer);

	if (availableMissions.length === 0 || availableAdventurers.length === 0) {
		return { actions };
	}

	// Select mission using doctrine engine
	const selection = selectMissionByDoctrine(
		availableMissions,
		availableAdventurers,
		doctrine
	);

	if (selection && selection.adventurers.length > 0) {
		// Create StartMissionAction (MVP: single adventurer per mission)
		actions.push(
			new StartMissionAction(
				selection.mission.id,
				selection.adventurers[0].id
			)
		);
	}

	return { actions };
}

