import { describe, it, expect } from 'vitest';
import { FacilityTemplate, type EffectDescriptor } from './FacilityTemplate';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';
import type { FacilityTemplateId } from '$lib/domain/valueObjects/Identifier';

describe('FacilityTemplate', () => {
	const createTemplate = (): FacilityTemplate => {
		const id: FacilityTemplateId = Identifier.generate();
		const tier1Config = {
			buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 100)]),
			requiredTracks: new Map<string, number>(),
			effects: [{ effectKey: 'production', value: 10 }] as EffectDescriptor[]
		};
		const tierConfigs = new Map<number, typeof tier1Config>([[1, tier1Config]]);
		return new FacilityTemplate(id, 'workshop', tierConfigs);
	};

	describe('constructor', () => {
		it('should create valid facility template', () => {
			const template = createTemplate();
			expect(template.typeKey).toBe('workshop');
			expect(template.tierConfigs.size).toBe(1);
		});

		it('should throw error if no tier configs', () => {
			const id: FacilityTemplateId = Identifier.generate();
			expect(
				() => new FacilityTemplate(id, 'workshop', new Map())
			).toThrow('FacilityTemplate must have at least one tier configuration');
		});
	});
});

