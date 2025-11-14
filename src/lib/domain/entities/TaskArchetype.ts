import type { TaskArchetypeId } from '$lib/domain/valueObjects/Identifier';
import { Duration } from '$lib/domain/valueObjects/Duration';
import type { ResourceBundle } from '$lib/domain/valueObjects/ResourceBundle';
import type { StatKey } from '$lib/domain/valueObjects/NumericStatMap';

/**
 * Static template for task types.
 * Defines task requirements, duration, costs, and rewards.
 */
export class TaskArchetype {
	constructor(
		public readonly id: TaskArchetypeId,
		public readonly category: string,
		public readonly baseDuration: Duration,
		public readonly minAgents: number,
		public readonly maxAgents: number,
		public readonly primaryStatKey: StatKey,
		public readonly secondaryStatKeys: StatKey[],
		public readonly entryCost: ResourceBundle,
		public readonly baseReward: ResourceBundle,
		public readonly requiredTrackThresholds: Map<string, number>
	) {
		if (minAgents < 1) {
			throw new Error(`minAgents must be at least 1, got ${minAgents}`);
		}
		if (maxAgents < minAgents) {
			throw new Error(`maxAgents (${maxAgents}) must be >= minAgents (${minAgents})`);
		}
	}
}

