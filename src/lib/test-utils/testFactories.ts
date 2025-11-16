/**
 * Test Factories - Fast factories for creating test data
 * Matches existing pattern: inline factories in test files
 */

import type {
	PlayerState,
	Adventurer,
	Mission,
	Reward
} from '../domain/entities/PlayerState';
import { createInitialPlayerState } from '../domain/entities/PlayerState';
import type { Command, CommandPayload } from '../bus/types';

/**
 * Create test PlayerState with optional overrides
 * Fast: Instant creation, no I/O
 */
export function createTestPlayerState(overrides?: Partial<PlayerState>): PlayerState {
	const base = createInitialPlayerState('test-player');
	return {
		...base,
		...overrides
	};
}

/**
 * Create test Adventurer with optional overrides
 */
export function createTestAdventurer(overrides?: Partial<Adventurer>): Adventurer {
	return {
		id: crypto.randomUUID(),
		name: 'Test Adventurer',
		level: 1,
		experience: 0,
		traits: [],
		status: 'idle',
		assignedMissionId: null,
		...overrides
	};
}

/**
 * Create test Mission with optional overrides
 */
export function createTestMission(overrides?: Partial<Mission>): Mission {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name: 'Test Mission',
		duration: 60000, // 1 minute
		startTime: now,
		assignedAdventurerIds: [],
		reward: {
			resources: { gold: 50, supplies: 10, relics: 0 },
			fame: 1,
			experience: 10
		},
		status: 'inProgress',
		...overrides
	};
}

/**
 * Create test Reward with optional overrides
 */
export function createTestReward(overrides?: Partial<Reward>): Reward {
	return {
		resources: { gold: 50, supplies: 10, relics: 0 },
		fame: 1,
		experience: 10,
		...overrides
	};
}

/**
 * Create test Command with type and payload
 */
export function createTestCommand<T extends CommandPayload>(
	type: Command['type'],
	payload: T
): Command {
	return {
		type,
		payload,
		timestamp: new Date().toISOString(),
		metadata: {}
	};
}

