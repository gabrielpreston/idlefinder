import type { Organization } from '../entities/Organization';
import { ProgressTrack } from '../entities/ProgressTrack';
import { UnlockRule } from '../entities/UnlockRule';
import { Identifier } from '../valueObjects/Identifier';
import type {
	TaskArchetypeId,
	FacilityTemplateId,
	AgentTemplateId
} from '../valueObjects/Identifier';

/**
 * Track change interface for progression system.
 */
export interface TrackChange {
	trackKey: string;
	amount: number;
}

/**
 * Result of processing unlocks.
 */
export interface UnlockResult {
	ruleId: string;
	newlyUnlocked: {
		taskArchetypes?: TaskArchetypeId[];
		facilityTemplates?: FacilityTemplateId[];
		agentTemplates?: AgentTemplateId[];
	};
}

/**
 * Domain system for managing progress tracks and unlocks.
 */
export class ProgressionSystem {
	/**
	 * Applies multiple track changes to the organization.
	 */
	applyTrackChanges(org: Organization, changes: TrackChange[]): void {
		for (const change of changes) {
			this.incrementTrack(org, change.trackKey, change.amount);
		}
	}

	/**
	 * Increments a progress track, creating it if it doesn't exist.
	 */
	incrementTrack(org: Organization, trackKey: string, amount: number): void {
		let track = org.getProgressTrack(trackKey);
		if (!track) {
			const trackId = Identifier.generate();
			track = new ProgressTrack(trackId, org.id, trackKey, 0);
			org.progressTracks.set(trackKey, track);
		}
		track.increment(amount);
	}

	/**
	 * Processes unlock rules and returns newly crossed thresholds.
	 * Does not mutate unlock rules (read-only check).
	 */
	processUnlocks(org: Organization, unlockRules: UnlockRule[]): UnlockResult[] {
		const results: UnlockResult[] = [];

		for (const rule of unlockRules) {
			const track = org.getProgressTrack(rule.trackKey);
			if (!track) {
				continue;
			}

			// Check if threshold was just crossed (track value >= threshold)
			if (track.hasReachedThreshold(rule.thresholdValue)) {
				const newlyUnlocked: UnlockResult['newlyUnlocked'] = {};

				if (rule.effects.newTaskArchetypes) {
					newlyUnlocked.taskArchetypes = rule.effects.newTaskArchetypes;
				}
				if (rule.effects.newFacilityTemplates) {
					newlyUnlocked.facilityTemplates = rule.effects.newFacilityTemplates;
				}
				if (rule.effects.newAgentTemplates) {
					newlyUnlocked.agentTemplates = rule.effects.newAgentTemplates;
				}

				results.push({
					ruleId: rule.id,
					newlyUnlocked
				});
			}
		}

		return results;
	}
}

