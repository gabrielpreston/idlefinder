/**
 * Test Fixtures - Reusable test state configurations
 * Common scenarios for tests
 */

import type { GameState } from '../domain/entities/GameState';
import { TestStateBuilder } from './testStateBuilder';
import { createTestAdventurer, createTestMission } from './testFactories';

/**
 * Create state with unlocked recruitment (Guildhall tier 1)
 * @returns GameState with Guildhall at tier 1
 */
export function createStateWithUnlockedRecruitment(): GameState {
	return new TestStateBuilder()
		.withGuildhallTier(1)
		.build();
}

/**
 * Create state ready for missions (Tier 1 + adventurer + mission)
 * @returns GameState with Guildhall tier 1, at least one adventurer, and at least one available mission
 */
export function createStateReadyForMissions(): GameState {
	const adventurer = createTestAdventurer({ id: 'adv-1', name: 'Test Adventurer' });
	const mission = createTestMission({ id: 'mission-1', state: 'Available' });
	
	return new TestStateBuilder()
		.withGuildhallTier(1)
		.withAdventurer(adventurer)
		.withMission(mission)
		.build();
}

/**
 * Create state with Guildhall at specific tier
 * @param tier Guildhall tier (0, 1, 2, etc.)
 * @returns GameState with Guildhall at specified tier
 */
export function createStateWithGuildhallTier(tier: number): GameState {
	return new TestStateBuilder()
		.withGuildhallTier(tier)
		.build();
}

