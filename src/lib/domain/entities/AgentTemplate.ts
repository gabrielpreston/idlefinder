import type { AgentTemplateId } from '$lib/domain/valueObjects/Identifier';
import { NumericStatMap } from '$lib/domain/valueObjects/NumericStatMap';

/**
 * Static blueprint for agent types.
 * Defines base stats and growth profile for leveling.
 */
export class AgentTemplate {
	constructor(
		public readonly id: AgentTemplateId,
		public readonly baseStats: NumericStatMap,
		public readonly growthProfile: Map<number, NumericStatMap>, // level -> stat bonuses
		public readonly tags: string[]
	) {}

	/**
	 * Computes the effective stats for this template at the specified level.
	 * Combines base stats with all growth profile bonuses up to the level.
	 */
	computeStatsAtLevel(level: number): NumericStatMap {
		if (level < 1) {
			throw new Error(`Level must be at least 1, got ${level}`);
		}

		let stats = this.baseStats;
		for (let l = 1; l <= level; l++) {
			const bonuses = this.growthProfile.get(l);
			if (bonuses) {
				stats = stats.merge(bonuses);
			}
		}
		return stats;
	}
}

