import { describe, it, expect } from 'vitest';
import { FacilityInstance } from './FacilityInstance';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { FacilityTemplate } from './FacilityTemplate';
import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';
import type {
	FacilityInstanceId,
	OrganizationId,
	FacilityTemplateId
} from '$lib/domain/valueObjects/Identifier';

describe('FacilityInstance', () => {
	const createFacility = (tier: number = 1): FacilityInstance => {
		const id: FacilityInstanceId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const templateId: FacilityTemplateId = Identifier.generate();
		const constructedAt = Timestamp.now();
		return new FacilityInstance(
			id,
			orgId,
			templateId,
			tier,
			constructedAt,
			constructedAt
		);
	};

	describe('constructor', () => {
		it('should create valid facility instance', () => {
			const facility = createFacility();
			expect(facility.currentTier).toBe(1);
		});

		it('should throw error for negative tier', () => {
			expect(() => createFacility(-1)).toThrow('Facility currentTier cannot be negative');
		});
	});

	describe('getActiveEffects', () => {
		it('should return empty array if no template', () => {
			const facility = createFacility();
			expect(facility.getActiveEffects()).toEqual([]);
		});

		it('should return effects for current tier', () => {
			const facility = createFacility(1);
			const templateId: FacilityTemplateId = Identifier.generate();
			const tier1Config = {
				buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 100)]),
				requiredTracks: new Map<string, number>(),
				effects: [{ effectKey: 'production', value: 10 }]
			};
			const tierConfigs = new Map([[1, tier1Config]]);
			const template = new FacilityTemplate(templateId, 'workshop', tierConfigs);
			facility.setTemplate(template);

			const effects = facility.getActiveEffects();
			expect(effects.length).toBe(1);
			expect(effects[0].effectKey).toBe('production');
			expect(effects[0].value).toBe(10);
		});
	});

	describe('canUpgrade', () => {
		it('should return false if no template', () => {
			const facility = createFacility();
			expect(facility.canUpgrade()).toBe(false);
		});

		it('should return true if next tier exists', () => {
			const facility = createFacility(1);
			const templateId: FacilityTemplateId = Identifier.generate();
			const tier1Config = {
				buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 100)]),
				requiredTracks: new Map<string, number>(),
				effects: []
			};
			const tier2Config = {
				buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 200)]),
				requiredTracks: new Map<string, number>(),
				effects: []
			};
			const tierConfigs = new Map([
				[1, tier1Config],
				[2, tier2Config]
			]);
			const template = new FacilityTemplate(templateId, 'workshop', tierConfigs);
			facility.setTemplate(template);

			expect(facility.canUpgrade()).toBe(true);
		});

		it('should return false if next tier does not exist', () => {
			const facility = createFacility(2);
			const templateId: FacilityTemplateId = Identifier.generate();
			const tier1Config = {
				buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 100)]),
				requiredTracks: new Map<string, number>(),
				effects: []
			};
			const tier2Config = {
				buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 200)]),
				requiredTracks: new Map<string, number>(),
				effects: []
			};
			const tierConfigs = new Map([
				[1, tier1Config],
				[2, tier2Config]
			]);
			const template = new FacilityTemplate(templateId, 'workshop', tierConfigs);
			facility.setTemplate(template);

			expect(facility.canUpgrade()).toBe(false);
		});
	});
});

