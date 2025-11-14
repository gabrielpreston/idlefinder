import { describe, it, expect } from 'vitest';
import { NumericStatMap } from './NumericStatMap';
import type { StatKey } from './NumericStatMap';

describe('NumericStatMap', () => {
	describe('get', () => {
		it('should return value for existing stat', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			expect(statMap.get('strength')).toBe(10);
		});

		it('should return 0 for non-existing stat', () => {
			const statMap = new NumericStatMap(new Map<StatKey, number>());
			expect(statMap.get('strength')).toBe(0);
		});
	});

	describe('set', () => {
		it('should set stat value and return new map', () => {
			const statMap = new NumericStatMap(new Map<StatKey, number>());
			const result = statMap.set('strength', 10);

			expect(result.get('strength')).toBe(10);
			expect(result).not.toBe(statMap); // Immutability check
		});

		it('should update existing stat value', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			const result = statMap.set('strength', 20);

			expect(result.get('strength')).toBe(20);
			expect(statMap.get('strength')).toBe(10); // Original unchanged
		});
	});

	describe('add', () => {
		it('should add to existing stat value', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			const result = statMap.add('strength', 5);

			expect(result.get('strength')).toBe(15);
			expect(statMap.get('strength')).toBe(10); // Original unchanged
		});

		it('should add to non-existing stat (treats as 0)', () => {
			const statMap = new NumericStatMap(new Map<StatKey, number>());
			const result = statMap.add('strength', 10);

			expect(result.get('strength')).toBe(10);
		});
	});

	describe('multiply', () => {
		it('should multiply existing stat value', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			const result = statMap.multiply('strength', 2);

			expect(result.get('strength')).toBe(20);
			expect(statMap.get('strength')).toBe(10); // Original unchanged
		});

		it('should multiply non-existing stat (treats as 0)', () => {
			const statMap = new NumericStatMap(new Map<StatKey, number>());
			const result = statMap.multiply('strength', 2);

			expect(result.get('strength')).toBe(0);
		});
	});

	describe('merge', () => {
		it('should merge stats and add values for same keys', () => {
			const stats1 = new Map<StatKey, number>([
				['strength', 10],
				['agility', 5]
			]);
			const stats2 = new Map<StatKey, number>([
				['strength', 5],
				['intelligence', 8]
			]);
			const statMap1 = new NumericStatMap(stats1);
			const statMap2 = new NumericStatMap(stats2);
			const result = statMap1.merge(statMap2);

			expect(result.get('strength')).toBe(15);
			expect(result.get('agility')).toBe(5);
			expect(result.get('intelligence')).toBe(8);
			expect(result).not.toBe(statMap1); // Immutability check
		});
	});

	describe('toMap', () => {
		it('should return copy of underlying map', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			const map = statMap.toMap();

			expect(map.get('strength')).toBe(10);
			expect(map).not.toBe(stats); // Should be a copy
		});
	});

	describe('fromMap', () => {
		it('should create NumericStatMap from Map', () => {
			const stats = new Map<StatKey, number>([
				['strength', 10],
				['agility', 5]
			]);
			const statMap = NumericStatMap.fromMap(stats);

			expect(statMap.get('strength')).toBe(10);
			expect(statMap.get('agility')).toBe(5);
		});
	});

	describe('immutability', () => {
		it('should not mutate original map when setting', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			const originalValue = statMap.get('strength');
			statMap.set('strength', 20);
			expect(statMap.get('strength')).toBe(originalValue);
		});

		it('should not mutate original map when adding', () => {
			const stats = new Map<StatKey, number>([['strength', 10]]);
			const statMap = new NumericStatMap(stats);
			const originalValue = statMap.get('strength');
			statMap.add('strength', 5);
			expect(statMap.get('strength')).toBe(originalValue);
		});

		it('should not mutate original map when merging', () => {
			const stats1 = new Map<StatKey, number>([['strength', 10]]);
			const stats2 = new Map<StatKey, number>([['agility', 5]]);
			const statMap1 = new NumericStatMap(stats1);
			const statMap2 = new NumericStatMap(stats2);
			const originalStrength = statMap1.get('strength');
			statMap1.merge(statMap2);
			expect(statMap1.get('strength')).toBe(originalStrength);
		});
	});
});

