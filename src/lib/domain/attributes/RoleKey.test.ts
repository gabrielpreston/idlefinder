import { describe, it, expect } from 'vitest';
import { deriveRoleKey, type RoleKey } from './RoleKey';

describe('RoleKey', () => {
	describe('deriveRoleKey', () => {
		it('should return martial_frontliner for fighter', () => {
			expect(deriveRoleKey('fighter')).toBe('martial_frontliner');
		});

  it('should return martial_frontliner for barbarian', () => {
    expect(deriveRoleKey('barbarian')).toBe('martial_frontliner');
  });

  it('should return support_caster for bard', () => {
    expect(deriveRoleKey('bard')).toBe('support_caster');
  });

		it('should return skill_specialist for rogue', () => {
			expect(deriveRoleKey('rogue')).toBe('skill_specialist');
		});

		it('should return support_caster for cleric', () => {
			expect(deriveRoleKey('cleric')).toBe('support_caster');
		});

		it('should return utility_caster for wizard', () => {
			expect(deriveRoleKey('wizard')).toBe('utility_caster');
		});

		it('should return ranged_combatant for ranger', () => {
			expect(deriveRoleKey('ranger')).toBe('ranged_combatant');
		});

		it('should be case-insensitive', () => {
			expect(deriveRoleKey('FIGHTER')).toBe('martial_frontliner');
			expect(deriveRoleKey('Fighter')).toBe('martial_frontliner');
			expect(deriveRoleKey('FiGhTeR')).toBe('martial_frontliner');
		});

		it('should return default skill_specialist for unknown classKey', () => {
			expect(deriveRoleKey('unknown-class')).toBe('skill_specialist');
		});

		it('should return default skill_specialist for empty string', () => {
			expect(deriveRoleKey('')).toBe('skill_specialist');
		});

		it('should return default skill_specialist for whitespace', () => {
			expect(deriveRoleKey('   ')).toBe('skill_specialist');
		});
	});

	describe('RoleKey type', () => {
		it('should accept all valid role key types', () => {
			const validRoles: RoleKey[] = [
				'martial_frontliner',
				'mobile_striker',
				'support_caster',
				'skill_specialist',
				'ranged_combatant',
				'utility_caster'
			];

			validRoles.forEach((role) => {
				expect(typeof role).toBe('string');
				expect(role.length).toBeGreaterThan(0);
			});
		});
	});
});

