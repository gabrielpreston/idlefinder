import type {
	TaskArchetypeId,
	FacilityTemplateId,
	AgentTemplateId
} from '../valueObjects/Identifier';

/**
 * Domain entity representing an unlock rule.
 * Defines what becomes available when a progress track crosses a threshold.
 */
export class UnlockRule {
	constructor(
		public readonly id: string,
		public readonly trackKey: string,
		public readonly thresholdValue: number,
		public readonly effects: {
			newTaskArchetypes?: TaskArchetypeId[];
			newFacilityTemplates?: FacilityTemplateId[];
			newAgentTemplates?: AgentTemplateId[];
		}
	) {
		if (thresholdValue < 0) {
			throw new Error(`UnlockRule thresholdValue cannot be negative: ${thresholdValue}`);
		}
	}
}

