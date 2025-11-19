/**
 * MissionDoctrine Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { MissionDoctrine } from './MissionDoctrine';
import { Identifier } from '../valueObjects/Identifier';

function createTestDoctrine(overrides?: {
	focus?: 'gold' | 'xp' | 'materials' | 'balanced';
	riskTolerance?: 'low' | 'medium' | 'high';
}): MissionDoctrine {
	const id = Identifier.generate<'MissionDoctrineId'>();
	return new MissionDoctrine(
		id,
		{
			focus: overrides?.focus || 'balanced',
			riskTolerance: overrides?.riskTolerance || 'medium'
		},
		[],
		'Active',
		{},
		{}
	);
}

describe('MissionDoctrine', () => {
	describe('constructor', () => {
		it('should create valid mission doctrine', () => {
			const doctrine = createTestDoctrine();
			expect(doctrine.type).toBe('MissionDoctrine');
			expect(doctrine.attributes.focus).toBe('balanced');
			expect(doctrine.attributes.riskTolerance).toBe('medium');
			expect(doctrine.state).toBe('Active');
		});
	});

	describe('updateFocus', () => {
		it('should update focus', () => {
			const doctrine = createTestDoctrine({ focus: 'balanced' });

			doctrine.updateFocus('gold');

			expect(doctrine.attributes.focus).toBe('gold');
		});
	});

	describe('updateRiskTolerance', () => {
		it('should update risk tolerance', () => {
			const doctrine = createTestDoctrine({ riskTolerance: 'medium' });

			doctrine.updateRiskTolerance('high');

			expect(doctrine.attributes.riskTolerance).toBe('high');
		});
	});

	describe('createDefault', () => {
		it('should create default mission doctrine', () => {
			const id = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(id);

			expect(doctrine.attributes.focus).toBe('balanced');
			expect(doctrine.attributes.riskTolerance).toBe('medium');
			expect(doctrine.state).toBe('Active');
		});
	});
});

