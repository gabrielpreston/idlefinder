/**
 * Adventurer Queries Tests - Adventurer count and detection queries
 */

import { describe, it, expect } from 'vitest';
import {
	getAdventurerCount,
	hasAnyAdventurers,
	isFirstAdventurer
} from './AdventurerQueries';
import { createTestGameState, createTestAdventurer } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';

describe('AdventurerQueries', () => {
	describe('getAdventurerCount', () => {
		it('should return 0 when no adventurers exist', () => {
			const state = createTestGameState();
			expect(getAdventurerCount(state)).toBe(0);
		});

		it('should return correct count for single adventurer', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			expect(getAdventurerCount(state)).toBe(1);
		});

		it('should return correct count for multiple adventurers', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2' });
			const adventurer3 = createTestAdventurer({ id: 'adv-3' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2],
				[adventurer3.id, adventurer3]
			]);
			const state = createTestGameState({ entities });

			expect(getAdventurerCount(state)).toBe(3);
		});

		it('should only count Adventurer entities', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			// Should still return 1 even if other entity types exist
			expect(getAdventurerCount(state)).toBe(1);
		});
	});

	describe('hasAnyAdventurers', () => {
		it('should return false when no adventurers exist', () => {
			const state = createTestGameState();
			expect(hasAnyAdventurers(state)).toBe(false);
		});

		it('should return true when at least one adventurer exists', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			expect(hasAnyAdventurers(state)).toBe(true);
		});

		it('should return true for multiple adventurers', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2]
			]);
			const state = createTestGameState({ entities });

			expect(hasAnyAdventurers(state)).toBe(true);
		});
	});

	describe('isFirstAdventurer', () => {
		it('should return false when no adventurers exist', () => {
			const state = createTestGameState();
			expect(isFirstAdventurer(state)).toBe(false);
		});

		it('should return true when exactly one adventurer exists', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			expect(isFirstAdventurer(state)).toBe(true);
		});

		it('should return false when multiple adventurers exist', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2]
			]);
			const state = createTestGameState({ entities });

			expect(isFirstAdventurer(state)).toBe(false);
		});
	});
});

