/**
 * Doctrine Engine - Pure function for allocating missions based on doctrine
 * Per docs/current/09-mission-system.md: Doctrine-driven selection
 */

import type { Mission } from '../entities/Mission';
import type { MissionDoctrine } from '../entities/MissionDoctrine';
import type { Adventurer } from '../entities/Adventurer';
import { MissionAllocation } from '../valueObjects/MissionAllocation';
import { MissionAssignment } from '../valueObjects/MissionAssignment';

/**
 * Doctrine Engine - Allocates missions based on doctrine using greedy algorithm
 * Returns optimal allocation of missions to adventurers
 */
export function allocateMissionsByDoctrine(
	availableMissions: Mission[],
	availableAdventurers: Adventurer[],
	doctrine: MissionDoctrine,
	maxAssignments: number // Available slots
): MissionAllocation {
	if (availableMissions.length === 0 || availableAdventurers.length === 0 || maxAssignments <= 0) {
		return MissionAllocation.empty();
	}

	// Filter missions by doctrine preferences
	const filteredMissions = availableMissions.filter((mission) => {
		// Filter by preferred mission types if specified
		const preferredTypes = doctrine.attributes.preferredMissionTypes;
		if (preferredTypes && preferredTypes.length > 0) {
			if (!preferredTypes.includes(mission.attributes.missionType)) {
				return false;
			}
		}

		// Filter by level range if specified
		// Note: Mission attributes may not have level, so this is optional
		return true;
	});

	if (filteredMissions.length === 0) {
		return MissionAllocation.empty();
	}

	// Filter to idle adventurers only
	const idleAdventurers = availableAdventurers.filter((a) => a.state === 'Idle');
	if (idleAdventurers.length === 0) {
		return MissionAllocation.empty();
	}

	// Generate all valid mission-adventurer pairs with combined scores
	const pairs: Array<{mission: Mission, adventurer: Adventurer, score: number}> = [];
	
	for (const mission of filteredMissions) {
		const missionScore = scoreMission(mission, doctrine);
		
		for (const adventurer of idleAdventurers) {
			const adventurerScore = scoreAdventurerForMission(adventurer, mission);
			
			// Skip invalid scores (non-idle adventurers)
			if (adventurerScore < 0) {
				continue;
			}
			
			const totalScore = missionScore + adventurerScore;
			pairs.push({ mission, adventurer, score: totalScore });
		}
	}

	// Sort pairs by total score (highest first)
	pairs.sort((a, b) => b.score - a.score);

	// Greedily assign highest-scoring pairs, avoiding conflicts
	let allocation = MissionAllocation.empty();
	const usedMissions = new Set<string>();
	const usedAdventurers = new Set<string>();

	for (const pair of pairs) {
		if (allocation.getCount() >= maxAssignments) {
			break;
		}
		
		// Skip if mission or adventurer already assigned
		if (usedMissions.has(pair.mission.id) || usedAdventurers.has(pair.adventurer.id)) {
			continue;
		}
		
		// Create assignment and add to allocation
		const assignment = MissionAssignment.create(
			pair.mission.id,
			pair.adventurer.id,
			pair.score
		);
		
		// Add assignment (returns new allocation if successful, same if conflict)
		const newAllocation = allocation.add(assignment);
		// Check if assignment was actually added (no conflict)
		if (newAllocation.getCount() > allocation.getCount()) {
			allocation = newAllocation;
			usedMissions.add(pair.mission.id);
			usedAdventurers.add(pair.adventurer.id);
		}
	}

	return allocation;
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
		score += mission.attributes.baseRewards.gold * 10;
	} else if (focus === 'xp') {
		score += mission.attributes.baseRewards.xp * 10;
	} else if (focus === 'materials') {
		// Materials reward (if available)
		score += (mission.attributes.baseRewards.materials ?? 0) * 10;
	} else {
		// focus === 'balanced' (only remaining value)
		score += (mission.attributes.baseRewards.gold + 
		         mission.attributes.baseRewards.xp * 2) * 5;
	}

	// Score based on risk tolerance
	const dc = mission.attributes.dc;
	if (riskTolerance === 'low') {
		// Prefer easier missions (lower DC)
		score += (20 - dc) * 5;
	} else if (riskTolerance === 'high') {
		// Prefer harder missions (higher DC)
		score += dc * 5;
	} else {
		// riskTolerance === 'medium' (only remaining value)
		// Medium: balanced
		score += 50;
	}

	return score;
}

/**
 * Score adventurer for a specific mission
 * Extracted from selectBestAdventurer() for reuse in greedy algorithm
 */
function scoreAdventurerForMission(
	adventurer: Adventurer,
	mission: Mission
): number {
	// Only score idle adventurers
	if (adventurer.state !== 'Idle') {
		return -1; // Invalid score for non-idle adventurers
	}
	
	let score = 0;
	const primaryAbility = mission.attributes.primaryAbility;
	
	// Score based on primary ability
	score += adventurer.attributes.abilityMods.get(primaryAbility) || 0;
	
	// Score based on level
	score += adventurer.attributes.level * 10;
	
	return score;
}
