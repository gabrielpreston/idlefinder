/**
 * GameState Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { GameState } from './GameState';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { createTestAdventurer, createTestMission } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';
import { EntityQueryBuilder } from '../queries/EntityQueryBuilder';

describe('GameState', () => {
	describe('constructor', () => {
		it('should create valid game state', () => {
			const state = new GameState('player-1', Timestamp.now());

			expect(state.playerId).toBe('player-1');
			expect(state.entities.size).toBe(0);
			expect(state.resources).toBeInstanceOf(ResourceBundle);
		});

		it('should create copy of entities map', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = new GameState('player-1', Timestamp.now(), entities);

			// Modify original map
			entities.set('test', adventurer);

			// State should not be affected
			expect(state.entities.size).toBe(1);
			expect(state.entities.has('test')).toBe(false);
		});
	});

	describe('getEntity', () => {
		it('should return entity by ID', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = new GameState('player-1', Timestamp.now(), entities);

			const found = state.getEntity(adventurer.id);

			expect(found).toBe(adventurer);
		});

		it('should return undefined for non-existent entity', () => {
			const state = new GameState('player-1', Timestamp.now());

			const found = state.getEntity('nonexistent');

			expect(found).toBeUndefined();
		});
	});

	describe('getEntitiesByType', () => {
		it('should return all entities of specific type', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2' });
			const mission = createTestMission({ id: 'mission-1' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2],
				[mission.id, mission]
			]);
			const state = new GameState('player-1', Timestamp.now(), entities);

			const adventurers = EntityQueryBuilder.byType('Adventurer')(state);

			expect(adventurers).toHaveLength(2);
		});

		it('should return empty array when no entities of type', () => {
			const state = new GameState('player-1', Timestamp.now());

			const missions = EntityQueryBuilder.byType('Mission')(state);

			expect(missions).toHaveLength(0);
		});
	});

	describe('setEntity', () => {
		it('should add entity to state', () => {
			const state = new GameState('player-1', Timestamp.now());
			const adventurer = createTestAdventurer({ id: 'adv-1' });

			state.setEntity(adventurer);

			expect(state.entities.has(adventurer.id)).toBe(true);
		});

		it('should update existing entity', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer1.id, adventurer1]]);
			const state = new GameState('player-1', Timestamp.now(), entities);
			const adventurer2 = createTestAdventurer({ id: 'adv-1' });

			state.setEntity(adventurer2);

			expect(state.entities.size).toBe(1);
			expect(state.entities.get('adv-1')).toBe(adventurer2);
		});
	});

	describe('removeEntity', () => {
		it('should remove entity from state', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = new GameState('player-1', Timestamp.now(), entities);

			state.removeEntity(adventurer.id);

			expect(state.entities.has(adventurer.id)).toBe(false);
		});
	});

	describe('updateResources', () => {
		it('should return new GameState with updated resources', () => {
			const state = new GameState('player-1', Timestamp.now());
			const newResources = ResourceBundle.fromArray([]);

			const updated = state.updateResources(newResources);

			expect(updated.resources).toBe(newResources);
			expect(updated).not.toBe(state);
		});

		it('should preserve other state properties', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = new GameState('player-1', Timestamp.now(), entities);
			const newResources = ResourceBundle.fromArray([]);

			const updated = state.updateResources(newResources);

			expect(updated.playerId).toBe(state.playerId);
			expect(updated.entities.size).toBe(state.entities.size);
		});
	});

	describe('updateLastPlayed', () => {
		it('should return new GameState with updated timestamp', () => {
			const now = Timestamp.now();
			const state = new GameState('player-1', now);
			const newTime = Timestamp.from(now.value + 1000);

			const updated = state.updateLastPlayed(newTime);

			expect(updated.lastPlayed).toBe(newTime);
			expect(updated).not.toBe(state);
		});
	});
});

