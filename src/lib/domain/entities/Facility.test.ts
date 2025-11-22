import { describe, it, expect } from 'vitest';
import { Facility } from './Facility';
import { Identifier } from '../valueObjects/Identifier';
import type { FacilityId } from './Facility';
import type { FacilityAttributes } from '../attributes/FacilityAttributes';
import { getTimer, setTimer } from '../primitives/TimerHelpers';
import { Timestamp } from '../valueObjects/Timestamp';

describe('Facility', () => {
	const createFacility = (overrides?: {
		facilityType?: 'Guildhall' | 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot';
		tier?: number;
		tags?: string[];
		loreTags?: string[];
		state?: 'Online' | 'UnderConstruction' | 'Disabled';
		metadata?: Record<string, unknown>;
		bonusMultipliers?: Record<string, number>;
	}): Facility => {
		const id: FacilityId = Identifier.from('facility-1');
		const attributes: FacilityAttributes = {
			facilityType: overrides?.facilityType || 'Guildhall',
			tier: overrides?.tier ?? 1,
			baseCapacity: 1,
			bonusMultipliers: overrides?.bonusMultipliers || {}
		};

		const metadata = overrides?.loreTags
			? { ...(overrides.metadata || {}), loreTags: overrides.loreTags }
			: overrides?.metadata || {};
		return new Facility(
			id,
			attributes,
			overrides?.tags || [],
			overrides?.state || 'Online',
			{},
			metadata
		);
	};

	describe('constructor', () => {
		it('should create valid facility with all attributes', () => {
			const facility = createFacility({
				facilityType: 'Dormitory',
				tier: 2,
				tags: ['storage', 'housing'],
				loreTags: ['gothic', 'stonework']
			});

			expect(facility.id).toBe('facility-1');
			expect(facility.type).toBe('Facility');
			expect(facility.attributes.facilityType).toBe('Dormitory');
			expect(facility.attributes.tier).toBe(2);
			expect(facility.tags).toEqual(['storage', 'housing']);
			expect(facility.metadata.loreTags).toEqual(['gothic', 'stonework']);
			expect(facility.state).toBe('Online');
		});

		it('should create facility without loreTags', () => {
			const facility = createFacility({
				facilityType: 'TrainingGrounds',
				tags: ['training']
			});

			expect(facility.metadata.loreTags).toBeUndefined();
		});

		it('should create facility with EntityMetadata structure', () => {
			const metadata = {
				displayName: 'Test Guildhall',
				description: 'A test facility',
				visualKey: 'guildhall-1'
			};
			const facility = createFacility({ metadata });

			expect(facility.metadata.displayName).toBe('Test Guildhall');
			expect(facility.metadata.description).toBe('A test facility');
			expect(facility.metadata.visualKey).toBe('guildhall-1');
		});

		it('should use Record<string, number | null> for timers (not Map)', () => {
			const facility = createFacility();

			expect(facility.timers).toBeInstanceOf(Object);
			expect(facility.timers).not.toBeInstanceOf(Map);
			expect(typeof facility.timers).toBe('object');
		});

		it('should copy tags array for immutability', () => {
			const tags = ['storage', 'housing'];
			const facility = createFacility({ tags });

			// Modify original array
			tags.push('new-tag');

			// Facility tags should not be affected
			expect(facility.tags).toEqual(['storage', 'housing']);
		});

		it('should copy loreTags array for immutability', () => {
			const loreTags = ['gothic', 'stonework'];
			const facility = createFacility({ loreTags });

			// Modify original array
			loreTags.push('new-lore');

			// Facility metadata.loreTags should not be affected
			expect(facility.metadata.loreTags).toEqual(['gothic', 'stonework']);
		});

		it('should copy metadata object for immutability', () => {
			const metadata = { name: 'Test Facility' };
			const facility = createFacility({ metadata });

			// Modify original object
			metadata.name = 'Modified';

			// Facility metadata should not be affected
			expect(facility.metadata.name).toBe('Test Facility');
		});
	});

	describe('upgrade', () => {
		it('should increment tier', () => {
			const facility = createFacility({ tier: 1, state: 'Online' });

			facility.upgrade();

			expect(facility.attributes.tier).toBe(2);
		});

		it('should increment tier multiple times', () => {
			const facility = createFacility({ tier: 1, state: 'Online' });

			facility.upgrade();
			facility.upgrade();
			facility.upgrade();

			expect(facility.attributes.tier).toBe(4);
		});

		it('should throw error if facility is not Online', () => {
			const facility = createFacility({ state: 'UnderConstruction' });

			expect(() => { facility.upgrade(); }).toThrow(
				'Cannot upgrade facility: facility state is UnderConstruction'
			);
		});

		it('should throw error if facility is Disabled', () => {
			const facility = createFacility({ state: 'Disabled' });

			expect(() => { facility.upgrade(); }).toThrow(
				'Cannot upgrade facility: facility state is Disabled'
			);
		});
	});

	describe('getActiveEffects', () => {
		it('should return rosterCap for Dormitory', () => {
			const facility = createFacility({
				facilityType: 'Dormitory',
				tier: 2,
				state: 'Online'
			});

			const effects = facility.getActiveEffects();

			expect(effects.rosterCap).toBe(11); // baseCapacity (1) + tier (2) * 5
			expect(effects.maxActiveMissions).toBeUndefined();
			expect(effects.trainingMultiplier).toBeUndefined();
			expect(effects.resourceStorageCap).toBeUndefined();
		});

		it('should return maxActiveMissions for MissionCommand', () => {
			const facility = createFacility({
				facilityType: 'MissionCommand',
				tier: 3,
				state: 'Online'
			});

			const effects = facility.getActiveEffects();

			expect(effects.maxActiveMissions).toBe(4); // baseCapacity (1) + tier (3)
			expect(effects.rosterCap).toBeUndefined();
			expect(effects.trainingMultiplier).toBeUndefined();
			expect(effects.resourceStorageCap).toBeUndefined();
		});

		it('should return trainingMultiplier for TrainingGrounds', () => {
			const facility = createFacility({
				facilityType: 'TrainingGrounds',
				tier: 1,
				state: 'Online',
				bonusMultipliers: { xp: 1.5 }
			});

			const effects = facility.getActiveEffects();

			expect(effects.trainingMultiplier).toBe(1.5);
			expect(effects.rosterCap).toBeUndefined();
			expect(effects.maxActiveMissions).toBeUndefined();
			expect(effects.resourceStorageCap).toBeUndefined();
		});

		it('should return resourceStorageCap for ResourceDepot', () => {
			const facility = createFacility({
				facilityType: 'ResourceDepot',
				tier: 2,
				state: 'Online'
			});

			const effects = facility.getActiveEffects();

			expect(effects.resourceStorageCap).toBe(201); // baseCapacity (1) + tier (2) * 100
			expect(effects.rosterCap).toBeUndefined();
			expect(effects.maxActiveMissions).toBeUndefined();
			expect(effects.trainingMultiplier).toBeUndefined();
		});

		it('should return empty effects for Guildhall', () => {
			const facility = createFacility({
				facilityType: 'Guildhall',
				tier: 1,
				state: 'Online'
			});

			const effects = facility.getActiveEffects();

			expect(effects.rosterCap).toBeUndefined();
			expect(effects.maxActiveMissions).toBeUndefined();
			expect(effects.trainingMultiplier).toBeUndefined();
			expect(effects.resourceStorageCap).toBeUndefined();
		});
	});

	describe('timer helpers', () => {
		it('should work with getTimer and setTimer using Record format', () => {
			const facility = createFacility();
			const timestamp = Timestamp.from(Date.now() + 3600000); // 1 hour from now

			setTimer(facility, 'constructionCompleteAt', timestamp);

			const retrieved = getTimer(facility, 'constructionCompleteAt');
			expect(retrieved).not.toBeNull();
			expect(retrieved?.value).toBe(timestamp.value);
			expect(facility.timers['constructionCompleteAt']).toBe(timestamp.value);
		});

		it('should handle null timer values', () => {
			const facility = createFacility();

			setTimer(facility, 'constructionCompleteAt', null);

			expect(facility.timers['constructionCompleteAt']).toBeNull();
			expect(getTimer(facility, 'constructionCompleteAt')).toBeNull();
		});

		it('should return null for missing timer keys', () => {
			const facility = createFacility();

			expect(getTimer(facility, 'nonexistent')).toBeNull();
		});
	});
});

