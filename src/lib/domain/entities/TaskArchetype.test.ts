import { describe, it, expect } from 'vitest';
import { TaskArchetype } from './TaskArchetype';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Duration } from '$lib/domain/valueObjects/Duration';
import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';
import type { TaskArchetypeId } from '$lib/domain/valueObjects/Identifier';

describe('TaskArchetype', () => {
	const createArchetype = (): TaskArchetype => {
		const id: TaskArchetypeId = Identifier.generate();
		const entryCost = ResourceBundle.fromArray([new ResourceUnit('gold', 10)]);
		const baseReward = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
		return new TaskArchetype(
			id,
			'test-category',
			Duration.ofMinutes(5),
			1,
			3,
			'strength',
			['agility'],
			entryCost,
			baseReward,
			new Map()
		);
	};

	describe('constructor', () => {
		it('should create valid task archetype', () => {
			const archetype = createArchetype();
			expect(archetype.category).toBe('test-category');
			expect(archetype.minAgents).toBe(1);
			expect(archetype.maxAgents).toBe(3);
		});

		it('should throw error if minAgents < 1', () => {
			const id: TaskArchetypeId = Identifier.generate();
			const entryCost = ResourceBundle.fromArray([new ResourceUnit('gold', 10)]);
			const baseReward = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			expect(
				() =>
					new TaskArchetype(
						id,
						'test',
						Duration.ofMinutes(5),
						0,
						3,
						'strength',
						[],
						entryCost,
						baseReward,
						new Map()
					)
			).toThrow('minAgents must be at least 1');
		});

		it('should throw error if maxAgents < minAgents', () => {
			const id: TaskArchetypeId = Identifier.generate();
			const entryCost = ResourceBundle.fromArray([new ResourceUnit('gold', 10)]);
			const baseReward = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			expect(
				() =>
					new TaskArchetype(
						id,
						'test',
						Duration.ofMinutes(5),
						3,
						1,
						'strength',
						[],
						entryCost,
						baseReward,
						new Map()
					)
			).toThrow('maxAgents (1) must be >= minAgents (3)');
		});
	});
});

