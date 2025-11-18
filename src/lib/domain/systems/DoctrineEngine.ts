/**
 * Doctrine Engine - Pure function for selecting missions based on doctrine
 * Per docs/current/09-mission-system.md: Doctrine-driven selection
 */

import type { Mission } from '../entities/Mission';
import type { MissionDoctrine } from '../entities/MissionDoctrine';
import type { Adventurer } from '../entities/Adventurer';

export interface MissionSelection {
	mission: Mission;
	adventurers: Adventurer[];
	score: number;
}

/**
 * Doctrine Engine - Scores and selects missions based on doctrine
 * Per plan Phase 4.2: Pure function that returns mission selection
 */
export function selectMissionByDoctrine(
	availableMissions: Mission[],
	availableAdventurers: Adventurer[],
	doctrine: MissionDoctrine
): MissionSelection | null {
	if (availableMissions.length === 0 || availableAdventurers.length === 0) {
		return null;
	}

	// Filter missions by doctrine preferences
	const filteredMissions = availableMissions.filter((mission) => {
		// Filter by preferred mission types if specified
		if (doctrine.attributes.preferredMissionTypes && 
		    doctrine.attributes.preferredMissionTypes.length > 0) {
			if (!doctrine.attributes.preferredMissionTypes.includes(mission.attributes.missionType)) {
				return false;
			}
		}

		// Filter by level range if specified
		// Note: Mission attributes may not have level, so this is optional
		return true;
	});

	if (filteredMissions.length === 0) {
		return null;
	}

	// Score missions based on doctrine
	const scoredMissions = filteredMissions.map((mission) => ({
		mission,
		score: scoreMission(mission, doctrine)
	}));

	// Sort by score (highest first)
	scoredMissions.sort((a, b) => b.score - a.score);
	const bestMission = scoredMissions[0].mission;

	// Select best available adventurer(s) for mission
	// MVP: Single adventurer per mission
	const bestAdventurer = selectBestAdventurer(bestMission, availableAdventurers);

	if (!bestAdventurer) {
		return null;
	}

	return {
		mission: bestMission,
		adventurers: [bestAdventurer],
		score: scoredMissions[0].score
	};
}

/**
 * Score mission based on doctrine
 */
function scoreMission(mission: Mission, doctrine: MissionDoctrine): number {
	let score = 0;
	const focus = doctrine.attributes.focus;
	const riskTolerance = doctrine.attributes.riskTolerance;

	// Score based on focus
	if (focus === 'gold') {
		score += (mission.attributes.baseRewards?.gold || 0) * 10;
	} else if (focus === 'xp') {
		score += (mission.attributes.baseRewards?.xp || 0) * 10;
	} else if (focus === 'materials') {
		// Materials reward (if available)
		score += (mission.attributes.baseRewards?.materials || 0) * 10;
	} else if (focus === 'balanced') {
		score += ((mission.attributes.baseRewards?.gold || 0) + 
		         (mission.attributes.baseRewards?.xp || 0) * 2) * 5;
	}

	// Score based on risk tolerance
	const dc = mission.attributes.dc || 15; // Default DC
	if (riskTolerance === 'low') {
		// Prefer easier missions (lower DC)
		score += (20 - dc) * 5;
	} else if (riskTolerance === 'high') {
		// Prefer harder missions (higher DC)
		score += dc * 5;
	} else {
		// Medium: balanced
		score += 50;
	}

	return score;
}

/**
 * Select best adventurer for mission
 */
function selectBestAdventurer(
	mission: Mission,
	availableAdventurers: Adventurer[]
): Adventurer | null {
	if (availableAdventurers.length === 0) {
		return null;
	}

	// Filter to idle adventurers
	const idleAdventurers = availableAdventurers.filter((a) => a.state === 'Idle');
	if (idleAdventurers.length === 0) {
		return null;
	}

	// Score adventurers based on mission requirements
	const scoredAdventurers = idleAdventurers.map((adventurer) => {
		let score = 0;
		const primaryAbility = mission.attributes.primaryAbility || 'str';
		
		// Score based on primary ability
		score += adventurer.attributes.abilityMods.get(primaryAbility) || 0;
		
		// Score based on level
		score += adventurer.attributes.level * 10;

		return { adventurer, score };
	});

	// Sort by score (highest first)
	scoredAdventurers.sort((a, b) => b.score - a.score);
	return scoredAdventurers[0].adventurer;
}

