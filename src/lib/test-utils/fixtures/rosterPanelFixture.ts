/**
 * Roster Panel Test Fixtures - Reusable test scenarios for Roster panel
 */

import type { GameState } from '../../domain/entities/GameState';
import type { Adventurer } from '../../domain/entities/Adventurer';
import { createTestGameState, createTestAdventurer } from '../testFactories';
import { setupRosterTestState } from '../rosterMissionsTestHelpers';

/**
 * Create game state with three adventurers in different states
 */
export function withThreeAdventurers(): GameState {
	const idleAdv = createTestAdventurer({ 
		id: 'adv-1', 
		name: 'Idle Adventurer',
		state: 'Idle',
		level: 5
	});
	const onMissionAdv = createTestAdventurer({ 
		id: 'adv-2', 
		name: 'On Mission Adventurer',
		state: 'OnMission',
		level: 3
	});
	const fatiguedAdv = createTestAdventurer({ 
		id: 'adv-3', 
		name: 'Fatigued Adventurer',
		state: 'Fatigued',
		level: 7
	});
	
	return setupRosterTestState([idleAdv, onMissionAdv, fatiguedAdv]);
}

/**
 * Create game state with empty roster
 */
export function withEmptyRoster(): GameState {
	return createTestGameState();
}

/**
 * Create game state with single idle adventurer
 */
export function withSingleAdventurer(): GameState {
	const adventurer = createTestAdventurer({ 
		id: 'adv-1', 
		name: 'Test Adventurer',
		state: 'Idle',
		level: 1
	});
	return setupRosterTestState([adventurer]);
}

/**
 * Create game state with multiple adventurers of different levels
 */
export function withMultipleAdventurers(count: number = 5): GameState {
	const adventurers: Adventurer[] = [];
	for (let i = 0; i < count; i++) {
		adventurers.push(createTestAdventurer({ 
			id: `adv-${i + 1}`, 
			name: `Adventurer ${i + 1}`,
			state: i % 2 === 0 ? 'Idle' : 'OnMission',
			level: i + 1
		}));
	}
	return setupRosterTestState(adventurers);
}

