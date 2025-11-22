/**
 * Expect Helpers - Type-safe assertion helpers for tests
 * Combines vitest expect with entity finding for cleaner test code
 */

import { expect } from 'vitest';
import type { GameState } from '../domain/entities/GameState';
import type { Adventurer } from '../domain/entities/Adventurer';
import { findAdventurerByName, findAdventurerById } from './entityTestHelpers';

/**
 * Expect adventurer exists by name and return it
 * @param state GameState
 * @param name Adventurer name
 * @returns Adventurer entity
 * @throws Error if adventurer not found (via findAdventurerByName)
 */
export function expectAdventurerExists(state: GameState, name: string): Adventurer {
	const adventurer = findAdventurerByName(state, name);
	expect(adventurer).toBeDefined();
	expect(adventurer.metadata.name).toBe(name);
	return adventurer;
}

/**
 * Expect adventurer exists by ID and return it
 * @param state GameState
 * @param id Adventurer ID
 * @returns Adventurer entity
 * @throws Error if adventurer not found (via findAdventurerById)
 */
export function expectAdventurerExistsById(state: GameState, id: string): Adventurer {
	const adventurer = findAdventurerById(state, id);
	expect(adventurer).toBeDefined();
	expect(adventurer.id).toBe(id);
	return adventurer;
}

