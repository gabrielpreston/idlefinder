/**
 * Test State Builder - Fluent interface for building test game states
 * Replaces repeated setup patterns in test files
 */

import type { GameState } from '../domain/entities/GameState';
import type { Adventurer } from '../domain/entities/Adventurer';
import type { Mission } from '../domain/entities/Mission';
import { createTestGameState, createTestMission } from './testFactories';
import { requireGuildHall, findAvailableMissions } from './entityTestHelpers';

/**
 * Test State Builder - Fluent interface for building test game states
 */
export class TestStateBuilder {
	private state: GameState;

	constructor(state?: GameState) {
		this.state = state ?? createTestGameState();
	}

	/**
	 * Upgrade guildhall to specified tier
	 * @param tier Target tier (0, 1, 2, etc.)
	 * @returns Builder instance for chaining
	 */
	withGuildhallTier(tier: number): this {
		const guildhall = requireGuildHall(this.state);
		const currentTier = guildhall.attributes.tier;
		
		// Upgrade from current tier to target tier
		for (let i = currentTier; i < tier; i++) {
			guildhall.upgrade();
		}
		
		return this;
	}

	/**
	 * Add adventurer to state
	 * @param adventurer Adventurer entity to add
	 * @returns Builder instance for chaining
	 */
	withAdventurer(adventurer: Adventurer): this {
		this.state.entities.set(adventurer.id, adventurer);
		return this;
	}

	/**
	 * Add multiple adventurers to state
	 * @param adventurers Array of Adventurer entities to add
	 * @returns Builder instance for chaining
	 */
	withAdventurers(adventurers: Adventurer[]): this {
		for (const adventurer of adventurers) {
			this.state.entities.set(adventurer.id, adventurer);
		}
		return this;
	}

	/**
	 * Add mission to state
	 * @param mission Mission entity to add
	 * @returns Builder instance for chaining
	 */
	withMission(mission: Mission): this {
		this.state.entities.set(mission.id, mission);
		return this;
	}

	/**
	 * Add multiple missions to state
	 * @param missions Array of Mission entities to add
	 * @returns Builder instance for chaining
	 */
	withMissions(missions: Mission[]): this {
		for (const mission of missions) {
			this.state.entities.set(mission.id, mission);
		}
		return this;
	}

	/**
	 * Ensure at least one available mission exists
	 * Creates a test mission if none exist
	 * @returns Builder instance for chaining
	 */
	withAtLeastOneAvailableMission(): this {
		const availableMissions = findAvailableMissions(this.state);
		if (availableMissions.length === 0) {
			const testMission = createTestMission({ id: 'test-mission-1', state: 'Available' });
			this.state.entities.set(testMission.id, testMission);
		}
		return this;
	}

	/**
	 * Build and return final game state
	 * @returns GameState instance
	 */
	build(): GameState {
		return this.state;
	}
}

