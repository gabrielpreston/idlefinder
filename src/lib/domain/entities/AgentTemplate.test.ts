import { describe, it, expect } from 'vitest';
import { AgentTemplate } from './AgentTemplate';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { NumericStatMap } from '$lib/domain/valueObjects/NumericStatMap';
import type { AgentTemplateId } from '$lib/domain/valueObjects/Identifier';

describe('AgentTemplate', () => {
	const createTemplate = (): AgentTemplate => {
		const id: AgentTemplateId = Identifier.generate();
		const baseStats = NumericStatMap.fromMap(
			new Map([
				['strength', 10],
				['agility', 5]
			])
		);
		const growthProfile = new Map<number, NumericStatMap>();
		return new AgentTemplate(id, baseStats, growthProfile, []);
	};

	describe('constructor', () => {
		it('should create valid agent template', () => {
			const template = createTemplate();
			expect(template.id).toBeDefined();
			expect(template.baseStats).toBeDefined();
			expect(template.tags).toEqual([]);
		});
	});

	describe('computeStatsAtLevel', () => {
		it('should return base stats at level 1', () => {
			const template = createTemplate();
			const stats = template.computeStatsAtLevel(1);
			expect(stats.get('strength')).toBe(10);
			expect(stats.get('agility')).toBe(5);
		});

		it('should apply growth profile bonuses', () => {
			const id: AgentTemplateId = Identifier.generate();
			const baseStats = NumericStatMap.fromMap(new Map([['strength', 10]]));
			const level2Bonuses = NumericStatMap.fromMap(new Map([['strength', 5]]));
			const level3Bonuses = NumericStatMap.fromMap(new Map([['strength', 3]]));
			const growthProfile = new Map<number, NumericStatMap>([
				[2, level2Bonuses],
				[3, level3Bonuses]
			]);
			const template = new AgentTemplate(id, baseStats, growthProfile, []);

			const statsLevel2 = template.computeStatsAtLevel(2);
			expect(statsLevel2.get('strength')).toBe(15); // 10 + 5

			const statsLevel3 = template.computeStatsAtLevel(3);
			expect(statsLevel3.get('strength')).toBe(18); // 10 + 5 + 3
		});

		it('should throw error for level less than 1', () => {
			const template = createTemplate();
			expect(() => template.computeStatsAtLevel(0)).toThrow('Level must be at least 1');
			expect(() => template.computeStatsAtLevel(-1)).toThrow('Level must be at least 1');
		});
	});
});

