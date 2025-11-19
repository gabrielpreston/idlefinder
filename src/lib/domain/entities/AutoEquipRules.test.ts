/**
 * AutoEquipRules Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { AutoEquipRules } from './AutoEquipRules';
import { Identifier } from '../valueObjects/Identifier';

function createTestRules(overrides?: {
	focus?: 'balanced' | 'offense-first' | 'defense-first';
	allowRareAutoEquip?: boolean;
}): AutoEquipRules {
	const id = Identifier.generate<'AutoEquipRulesId'>();
	return new AutoEquipRules(
		id,
		{
			focus: overrides?.focus || 'balanced',
			allowRareAutoEquip: overrides?.allowRareAutoEquip ?? true,
			rolePriorities: new Map()
		},
		[],
		'Active',
		{},
		{}
	);
}

describe('AutoEquipRules', () => {
	describe('constructor', () => {
		it('should create valid auto-equip rules', () => {
			const rules = createTestRules();
			expect(rules.type).toBe('AutoEquipRules');
			expect(rules.attributes.focus).toBe('balanced');
			expect(rules.state).toBe('Active');
		});
	});

	describe('updateFocus', () => {
		it('should update focus', () => {
			const rules = createTestRules({ focus: 'balanced' });

			rules.updateFocus('offense-first');

			expect(rules.attributes.focus).toBe('offense-first');
		});
	});

	describe('updateAllowRareAutoEquip', () => {
		it('should update allow rare auto-equip setting', () => {
			const rules = createTestRules({ allowRareAutoEquip: true });

			rules.updateAllowRareAutoEquip(false);

			expect(rules.attributes.allowRareAutoEquip).toBe(false);
		});
	});

	describe('updateRolePriorities', () => {
		it('should update role priorities', () => {
			const rules = createTestRules();
			const priorities: Array<'attackBonus' | 'damageBonus' | 'armorClass' | 'damageReduction' | 'skillBonus' | 'critSafety'> = ['attackBonus', 'damageBonus'];

			rules.updateRolePriorities('martial_frontliner', priorities);

			expect(rules.attributes.rolePriorities.get('martial_frontliner')).toEqual(priorities);
		});

		it('should create copy of priorities array', () => {
			const rules = createTestRules();
			const priorities: Array<'attackBonus' | 'damageBonus' | 'armorClass' | 'damageReduction' | 'skillBonus' | 'critSafety'> = ['attackBonus', 'damageBonus'];

			rules.updateRolePriorities('martial_frontliner', priorities);
			priorities.push('armorClass');

			// Original array should not affect stored priorities
			expect(rules.attributes.rolePriorities.get('martial_frontliner')).toEqual(['attackBonus', 'damageBonus']);
		});
	});

	describe('createDefault', () => {
		it('should create default auto-equip rules', () => {
			const id = Identifier.generate<'AutoEquipRulesId'>();
			const rules = AutoEquipRules.createDefault(id);

			expect(rules.attributes.focus).toBe('balanced');
			expect(rules.attributes.allowRareAutoEquip).toBe(true);
			expect(rules.attributes.rolePriorities.size).toBeGreaterThan(0);
			expect(rules.state).toBe('Active');
		});

		it('should include default role priorities', () => {
			const id = Identifier.generate<'AutoEquipRulesId'>();
			const rules = AutoEquipRules.createDefault(id);

			expect(rules.attributes.rolePriorities.has('martial_frontliner')).toBe(true);
			expect(rules.attributes.rolePriorities.has('support_caster')).toBe(true);
			expect(rules.attributes.rolePriorities.has('mobile_striker')).toBe(true);
			expect(rules.attributes.rolePriorities.has('skill_specialist')).toBe(true);
		});
	});
});

