/**
 * Missions Panel Test Fixtures - Reusable test scenarios for Missions panel
 */

import type { GameState } from '../../domain/entities/GameState';
import type { Mission } from '../../domain/entities/Mission';
import { createTestGameState, createTestMission } from '../testFactories';
import { setupMissionsTestState } from '../rosterMissionsTestHelpers';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { Duration } from '../../domain/valueObjects/Duration';

/**
 * Create game state with three missions in different states
 */
export function withThreeMissions(): GameState {
	const availableMission = createTestMission({ 
		id: 'mission-1', 
		name: 'Available Mission',
		state: 'Available' 
	});
	const inProgressMission = createTestMission({ 
		id: 'mission-2', 
		name: 'In Progress Mission',
		state: 'InProgress',
		startedAt: Timestamp.now().subtract(Duration.ofMinutes(5))
	});
	const completedMission = createTestMission({ 
		id: 'mission-3', 
		name: 'Completed Mission',
		state: 'Completed',
		startedAt: Timestamp.now().subtract(Duration.ofMinutes(10)),
		endsAt: Timestamp.now().subtract(Duration.ofMinutes(1))
	});
	
	return setupMissionsTestState([availableMission, inProgressMission, completedMission]);
}

/**
 * Create game state with empty missions list
 */
export function withEmptyState(): GameState {
	return createTestGameState();
}

/**
 * Create game state with single in-progress mission
 */
export function withInProgressMission(): GameState {
	const mission = createTestMission({ 
		id: 'mission-1', 
		name: 'In Progress Mission',
		state: 'InProgress',
		startedAt: Timestamp.now().subtract(Duration.ofMinutes(5))
	});
	return setupMissionsTestState([mission]);
}

/**
 * Create game state with multiple available missions
 */
export function withMultipleAvailableMissions(count: number = 5): GameState {
	const missions: Mission[] = [];
	for (let i = 0; i < count; i++) {
		missions.push(createTestMission({ 
			id: `mission-${String(i + 1)}`, 
			name: `Available Mission ${String(i + 1)}`,
			state: 'Available',
			difficultyTier: i % 2 === 0 ? 'Easy' : 'Medium'
		}));
	}
	return setupMissionsTestState(missions);
}

