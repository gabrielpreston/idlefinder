/**
 * GameStateFactory Tests
 */

import { describe, it, expect } from 'vitest';
import { createInitialGameState } from './GameStateFactory';
import { Timestamp } from '../valueObjects/Timestamp';
import { GameConfig } from '../config/GameConfig';
import { EntityQueryBuilder } from '../queries/EntityQueryBuilder';

describe('GameStateFactory', () => {
	describe('createInitialGameState', () => {
		it('should create initial game state with default facilities', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			expect(state.playerId).toBe('player-1');
			expect(state.lastPlayed).toBe(now);
		});

		it('should create initial resources', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			expect(state.resources.get('gold')).toBe(GameConfig.startingResources.gold);
			expect(state.resources.get('fame')).toBe(GameConfig.startingResources.fame);
		});

		it('should create Guildhall facility', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			const facilities = EntityQueryBuilder.byType('Facility')(state);
			const guildhall = facilities.find(f => (f as any).attributes.facilityType === 'Guildhall');
			expect(guildhall).toBeDefined();
		});

		it('should create MissionDoctrine entity', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			const doctrines = EntityQueryBuilder.byType('MissionDoctrine')(state);
			expect(doctrines.length).toBeGreaterThan(0);
		});

		it('should create AutoEquipRules entity', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			const rules = EntityQueryBuilder.byType('AutoEquipRules')(state);
			expect(rules.length).toBeGreaterThan(0);
		});

		it('should create CraftingQueue entity', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			const queues = EntityQueryBuilder.byType('CraftingQueue')(state);
			expect(queues.length).toBeGreaterThan(0);
		});

		it('should create initial resource slot', () => {
			const now = Timestamp.now();
			const state = createInitialGameState('player-1', now);

			const slots = EntityQueryBuilder.byType('ResourceSlot')(state);
			expect(slots.length).toBeGreaterThan(0);
		});
	});
});

