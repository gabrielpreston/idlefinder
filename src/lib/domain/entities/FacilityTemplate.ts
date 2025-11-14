import type { FacilityTemplateId } from '$lib/domain/valueObjects/Identifier';
import type { ResourceBundle } from '$lib/domain/valueObjects/ResourceBundle';

/**
 * Describes an effect that a facility provides.
 */
export interface EffectDescriptor {
	effectKey: string;
	value: number;
	scope?: string;
}

/**
 * Configuration for a facility tier.
 */
export interface FacilityTierConfig {
	buildCost: ResourceBundle;
	requiredTracks: Map<string, number>;
	effects: EffectDescriptor[];
}

/**
 * Static template for facility types.
 * Defines tiered configurations with costs, requirements, and effects.
 */
export class FacilityTemplate {
	constructor(
		public readonly id: FacilityTemplateId,
		public readonly typeKey: string,
		public readonly tierConfigs: Map<number, FacilityTierConfig>
	) {
		if (tierConfigs.size === 0) {
			throw new Error('FacilityTemplate must have at least one tier configuration');
		}
	}
}

