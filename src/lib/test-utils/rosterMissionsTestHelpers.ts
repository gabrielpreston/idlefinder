/**
 * Roster and Missions Test Helpers - Utilities for testing Roster and Missions tab components
 */

import type { GameState } from '../domain/entities/GameState';
import type { GameRuntime } from '../runtime/startGame';
import type { Adventurer } from '../domain/entities/Adventurer';
import type { Mission } from '../domain/entities/Mission';
import { createTestGameState } from './testFactories';
import { bootstrapTestGame } from './testBootstrap';

/**
 * Setup game state with adventurers for roster testing
 */
export function setupRosterTestState(adventurers: Adventurer[]): GameState {
	const state = createTestGameState();
	for (const adventurer of adventurers) {
		state.entities.set(adventurer.id, adventurer);
	}
	return state;
}

/**
 * Setup game state with missions for missions testing
 */
export function setupMissionsTestState(missions: Mission[]): GameState {
	const state = createTestGameState();
	for (const mission of missions) {
		state.entities.set(mission.id, mission);
	}
	return state;
}

/**
 * Setup game runtime with initialized gameState store and command dispatcher (for panel-direct testing)
 * Uses bootstrapTestGame to ensure proper initialization sequence matching real game
 * 
 * @param initialState Optional initial game state (uses default if not provided)
 * @returns Fully initialized game runtime
 */
export async function setupGameRuntime(initialState?: GameState): Promise<GameRuntime> {
	// bootstrapTestGame handles all initialization including command dispatcher
	return await bootstrapTestGame({ initialState });
}

