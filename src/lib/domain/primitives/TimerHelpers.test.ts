import { describe, it, expect } from 'vitest';
import { getTimer, setTimer } from './TimerHelpers';
import { Timestamp } from '../valueObjects/Timestamp';
import { Adventurer } from '../entities/Adventurer';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { deriveRoleKey } from '../attributes/RoleKey';
import type { AdventurerAttributes } from '../attributes/AdventurerAttributes';

describe('TimerHelpers', () => {
	const createEntityWithTimers = (timers: Record<string, number | null> = {}): Adventurer => {
		const id = Identifier.from<'AdventurerId'>('adv-1');
		const attributes: AdventurerAttributes = {
			level: 1,
			xp: 0,
			abilityMods: NumericStatMap.fromMap(new Map([
				['str', 0],
				['dex', 0],
				['con', 0],
				['int', 0],
				['wis', 0],
				['cha', 0]
			])),
			classKey: 'fighter',
			ancestryKey: 'human',
			traitTags: [],
			roleKey: deriveRoleKey('fighter'),
			baseHP: 10
		};

		return new Adventurer(id, attributes, [], 'Idle', timers, {});
	};

	describe('getTimer', () => {
		it('should convert number to Timestamp', () => {
			const entity = createEntityWithTimers({ fatigueUntil: 1000 });

			const result = getTimer(entity, 'fatigueUntil');

			expect(result).not.toBeNull();
			expect(result?.value).toBe(1000);
		});

		it('should return null for null values', () => {
			const entity = createEntityWithTimers({ fatigueUntil: null });

			const result = getTimer(entity, 'fatigueUntil');

			expect(result).toBeNull();
		});

		it('should return null for missing keys', () => {
			const entity = createEntityWithTimers();

			const result = getTimer(entity, 'nonexistent');

			expect(result).toBeNull();
		});

		it('should return null for undefined values', () => {
			const entity = createEntityWithTimers({ fatigueUntil: undefined as unknown as null });

			const result = getTimer(entity, 'fatigueUntil');

			expect(result).toBeNull();
		});

		it('should handle zero values', () => {
			const entity = createEntityWithTimers({ fatigueUntil: 0 });

			const result = getTimer(entity, 'fatigueUntil');

			expect(result).not.toBeNull();
			expect(result?.value).toBe(0);
		});

		it('should handle large timestamp values', () => {
			const largeValue = Date.now() + 86400000; // 1 day from now
			const entity = createEntityWithTimers({ fatigueUntil: largeValue });

			const result = getTimer(entity, 'fatigueUntil');

			expect(result).not.toBeNull();
			expect(result?.value).toBe(largeValue);
		});
	});

	describe('setTimer', () => {
		it('should convert Timestamp to number and store as milliseconds', () => {
			const entity = createEntityWithTimers();
			const timestamp = Timestamp.from(5000);

			setTimer(entity, 'fatigueUntil', timestamp);

			expect(entity.timers['fatigueUntil']).toBe(5000);
			expect(typeof entity.timers['fatigueUntil']).toBe('number');
		});

		it('should store null correctly', () => {
			const entity = createEntityWithTimers({ fatigueUntil: 1000 });

			setTimer(entity, 'fatigueUntil', null);

			expect(entity.timers['fatigueUntil']).toBeNull();
		});

		it('should overwrite existing timer values', () => {
			const entity = createEntityWithTimers({ fatigueUntil: 1000 });
			const newTimestamp = Timestamp.from(2000);

			setTimer(entity, 'fatigueUntil', newTimestamp);

			expect(entity.timers['fatigueUntil']).toBe(2000);
		});

		it('should handle zero timestamp values', () => {
			const entity = createEntityWithTimers();
			const zeroTimestamp = Timestamp.from(0);

			setTimer(entity, 'fatigueUntil', zeroTimestamp);

			expect(entity.timers['fatigueUntil']).toBe(0);
		});

		it('should handle large timestamp values', () => {
			const entity = createEntityWithTimers();
			const largeValue = Date.now() + 86400000; // 1 day from now
			const largeTimestamp = Timestamp.from(largeValue);

			setTimer(entity, 'fatigueUntil', largeTimestamp);

			expect(entity.timers['fatigueUntil']).toBe(largeValue);
		});
	});

	describe('getTimer and setTimer integration', () => {
		it('should round-trip Timestamp through getTimer and setTimer', () => {
			const entity = createEntityWithTimers();
			const originalTimestamp = Timestamp.from(12345);

			setTimer(entity, 'fatigueUntil', originalTimestamp);
			const retrieved = getTimer(entity, 'fatigueUntil');

			expect(retrieved).not.toBeNull();
			expect(retrieved?.value).toBe(originalTimestamp.value);
		});

		it('should round-trip null through getTimer and setTimer', () => {
			const entity = createEntityWithTimers({ fatigueUntil: 1000 });

			setTimer(entity, 'fatigueUntil', null);
			const retrieved = getTimer(entity, 'fatigueUntil');

			expect(retrieved).toBeNull();
		});

		it('should handle multiple timer keys', () => {
			const entity = createEntityWithTimers();
			const timestamp1 = Timestamp.from(1000);
			const timestamp2 = Timestamp.from(2000);

			setTimer(entity, 'fatigueUntil', timestamp1);
			setTimer(entity, 'availableAt', timestamp2);

			expect(getTimer(entity, 'fatigueUntil')?.value).toBe(1000);
			expect(getTimer(entity, 'availableAt')?.value).toBe(2000);
		});
	});
});

