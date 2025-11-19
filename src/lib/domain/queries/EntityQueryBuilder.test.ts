/**
 * Entity Query Builder Tests - Standardized entity filtering queries
 */

import { describe, it, expect } from 'vitest';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { createTestGameState, createTestAdventurer, createTestMission, createTestFacility } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';
import type { Adventurer } from '../entities/Adventurer';
import type { Mission } from '../entities/Mission';
import type { Facility } from '../entities/Facility';

describe('EntityQueryBuilder', () => {
	describe('byType', () => {
		it('should return all entities of specified type', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2' });
			const mission = createTestMission({ id: 'mission-1' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2],
				[mission.id, mission]
			]);
			const state = createTestGameState({ entities });

			const query = EntityQueryBuilder.byType<Adventurer>('Adventurer');
			const result = query(state);

			expect(result).toHaveLength(2);
			expect(result.map(e => e.id)).toContain('adv-1');
			expect(result.map(e => e.id)).toContain('adv-2');
		});

		it('should return empty array when no entities of type exist', () => {
			const state = createTestGameState();
			const query = EntityQueryBuilder.byType<Adventurer>('Adventurer');
			const result = query(state);

			expect(result).toHaveLength(0);
		});

		it('should filter by exact type match', () => {
			const mission = createTestMission({ id: 'mission-1' });
			const state = createTestGameState({
				entities: new Map([[mission.id, mission]])
			});

			const query = EntityQueryBuilder.byType<Mission>('Mission');
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('mission-1');
		});
	});

	describe('byState', () => {
		it('should return entities in specified state', () => {
			const idleAdventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const onMissionAdventurer = createTestAdventurer({ id: 'adv-2', state: 'OnMission' });
			const state = createTestGameState({
				entities: new Map([
					[idleAdventurer.id, idleAdventurer],
					[onMissionAdventurer.id, onMissionAdventurer]
				])
			});

			const query = EntityQueryBuilder.byState<Adventurer>('Idle');
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('adv-1');
		});

		it('should return empty array when no entities in state', () => {
			const adventurer = createTestAdventurer({ state: 'Idle' });
			const state = createTestGameState({
				entities: new Map([[adventurer.id, adventurer]])
			});

			const query = EntityQueryBuilder.byState<Adventurer>('OnMission');
			const result = query(state);

			expect(result).toHaveLength(0);
		});

		it('should handle entities without state property', () => {
			const state = createTestGameState();
			const query = EntityQueryBuilder.byState<Entity>('SomeState');
			const result = query(state);

			expect(result).toHaveLength(0);
		});
	});

	describe('byAttribute', () => {
		it('should return entities with matching attribute value', () => {
			const facility1 = createTestFacility({ id: 'fac-1', tier: 1 });
			const facility2 = createTestFacility({ id: 'fac-2', tier: 2 });
			const state = createTestGameState({
				entities: new Map([
					[facility1.id, facility1],
					[facility2.id, facility2]
				])
			});

			const query = EntityQueryBuilder.byAttribute<Facility>('attributes.tier', 1);
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('fac-1');
		});

		it('should handle nested attribute paths', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', level: 5 });
			const state = createTestGameState({
				entities: new Map([[adventurer.id, adventurer]])
			});

			const query = EntityQueryBuilder.byAttribute<Adventurer>('attributes.level', 5);
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('adv-1');
		});

		it('should return empty array when attribute does not exist', () => {
			const state = createTestGameState();
			const query = EntityQueryBuilder.byAttribute<Entity>('attributes.nonexistent', 'value');
			const result = query(state);

			expect(result).toHaveLength(0);
		});

		it('should return empty array when attribute value does not match', () => {
			const facility = createTestFacility({ tier: 1 });
			const state = createTestGameState({
				entities: new Map([[facility.id, facility]])
			});

			const query = EntityQueryBuilder.byAttribute<Facility>('attributes.tier', 5);
			const result = query(state);

			expect(result).toHaveLength(0);
		});
	});

	describe('where', () => {
		it('should return entities matching type guard predicate', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const mission = createTestMission({ id: 'mission-1' });
			const entities = new Map<string, Entity>([
				[adventurer.id, adventurer],
				[mission.id, mission]
			]);
			const state = createTestGameState({ entities });

			const query = EntityQueryBuilder.where<Adventurer>(
				(entity): entity is Adventurer => entity.type === 'Adventurer'
			);
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('adv-1');
		});

		it('should return empty array when no entities match predicate', () => {
			const state = createTestGameState();
			const query = EntityQueryBuilder.where<Adventurer>(
				(entity): entity is Adventurer => entity.type === 'Adventurer' && entity.id === 'nonexistent'
			);
			const result = query(state);

			expect(result).toHaveLength(0);
		});
	});

	describe('filter', () => {
		it('should return entities matching predicate', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1', level: 1 });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', level: 5 });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2]
			]);
			const state = createTestGameState({ entities });

			const query = EntityQueryBuilder.filter<Adventurer>(
				(entity) => entity.type === 'Adventurer' && (entity as Adventurer).attributes.level > 1
			);
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('adv-2');
		});

		it('should handle complex predicates', () => {
			const mission1 = createTestMission({ id: 'mission-1', state: 'Available' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'InProgress' });
			const state = createTestGameState({
				entities: new Map([
					[mission1.id, mission1],
					[mission2.id, mission2]
				])
			});

			const query = EntityQueryBuilder.filter<Mission>(
				(entity) => entity.type === 'Mission' && (entity as Mission).state === 'Available'
			);
			const result = query(state);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('mission-1');
		});
	});
});

