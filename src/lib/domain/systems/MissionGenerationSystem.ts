/**
 * Mission Generation System - Generates available missions for mission pool
 * Creates Mission entities with state: 'Available' for doctrine-driven automation
 */

import { Mission } from '../entities/Mission';
import { Identifier } from '../valueObjects/Identifier';
import { Duration } from '../valueObjects/Duration';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { MissionAttributes } from '../attributes/MissionAttributes';
import type { RoleKey } from '../attributes/RoleKey';
import type { GameState } from '../entities/GameState';
import { getUnlockedMissionTiers } from '../queries/UnlockQueries';
import { GameConfig } from '../config/GameConfig';

/**
 * Mission name templates by type and tier
 */
const MISSION_NAME_TEMPLATES: Record<string, string[]> = {
	'combat_tier_0': ['Patrol Village', 'Guard Post', 'Clear Bandits', 'Defend Outpost'],
	'exploration_tier_0': ['Scout Forest', 'Map Region', 'Explore Ruins', 'Survey Territory'],
	'investigation_tier_0': ['Gather Information', 'Question Locals', 'Search Archives', 'Investigate Rumors'],
	'diplomacy_tier_0': ['Negotiate Trade', 'Mediate Dispute', 'Establish Contact', 'Gather Support'],
	'resource_tier_0': ['Gather Materials', 'Mine Ore', 'Harvest Crops', 'Collect Supplies'],
	// Tier 1+ can reuse tier 0 templates for now, or expand later
	'combat_tier_1': ['Patrol Village', 'Guard Post', 'Clear Bandits', 'Defend Outpost'],
	'exploration_tier_1': ['Scout Forest', 'Map Region', 'Explore Ruins', 'Survey Territory'],
	'investigation_tier_1': ['Gather Information', 'Question Locals', 'Search Archives', 'Investigate Rumors'],
	'diplomacy_tier_1': ['Negotiate Trade', 'Mediate Dispute', 'Establish Contact', 'Gather Support'],
	'resource_tier_1': ['Gather Materials', 'Mine Ore', 'Harvest Crops', 'Collect Supplies']
};

/**
 * Mission type to primary ability mapping
 */
const MISSION_TYPE_ABILITIES: Record<string, ('str' | 'dex' | 'con' | 'int' | 'wis' | 'cha')[]> = {
	combat: ['str', 'dex'],
	exploration: ['wis', 'int'],
	investigation: ['int', 'wis'],
	diplomacy: ['cha'],
	resource: ['str', 'dex', 'con', 'int', 'wis'] // Resource missions can use various abilities
};

/**
 * Available mission types
 */
const MISSION_TYPES: Array<'combat' | 'exploration' | 'investigation' | 'diplomacy' | 'resource'> = [
	'combat',
	'exploration',
	'investigation',
	'diplomacy',
	'resource'
];

/**
 * Available role keys for preferredRole assignment
 */
const ROLE_KEYS: RoleKey[] = [
	'martial_frontliner',
	'support_caster',
	'skill_specialist',
	'ranged_combatant',
	'utility_caster'
];

/**
 * Map DC to difficulty tier
 */
function getDifficultyTier(dc: number): 'Easy' | 'Medium' | 'Hard' | 'Legendary' {
	if (dc <= 10) return 'Easy';
	if (dc <= 15) return 'Medium';
	if (dc <= 20) return 'Hard';
	return 'Legendary';
}

/**
 * Get random element from array
 */
function randomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate mission name from templates
 */
function generateMissionName(missionType: string, tier: number): string {
	const key = `${missionType}_tier_${tier}`;
	const templates = MISSION_NAME_TEMPLATES[key] || MISSION_NAME_TEMPLATES[`${missionType}_tier_0`] || [`${missionType} Mission`];
	return randomElement(templates);
}

/**
 * Generate a pool of available missions
 * 
 * @param state GameState to query unlocked tiers
 * @param countPerTier Number of missions to generate per unlocked tier (default: 3)
 * @param expiresAt Optional expiration timestamp for generated missions
 * @returns Array of Mission entities with state: 'Available'
 */
export function generateMissionPool(state: GameState, countPerTier: number = 3, expiresAt?: Timestamp): Mission[] {
	const missions: Mission[] = [];
	
	// Get unlocked tiers
	const unlockedTiers = getUnlockedMissionTiers(state);
	
	// Generate missions for each unlocked tier
	for (const tier of unlockedTiers) {
		for (let i = 0; i < countPerTier; i++) {
			// Generate unique mission ID
			const missionId = `mission-${tier}-${randomElement(MISSION_TYPES)}-${crypto.randomUUID()}`;
			const id = Identifier.from<'MissionId'>(missionId);
			
			// Select random mission type
			const missionType = randomElement(MISSION_TYPES);
			
			// Select primary ability based on mission type
			const abilityOptions = MISSION_TYPE_ABILITIES[missionType] || ['str'];
			const primaryAbility = randomElement(abilityOptions);
			
			// Calculate DC using GameConfig
			const dc = GameConfig.missionGeneration.calculateDC(tier);
			
			// Calculate rewards using GameConfig
			const gold = GameConfig.missionGeneration.calculateGold(tier);
			const xp = GameConfig.missionGeneration.calculateXP(tier);
			const fame = GameConfig.missionGeneration.calculateFame(tier);
			
			// Calculate duration using GameConfig
			const durationSeconds = GameConfig.missionGeneration.calculateDurationSeconds(tier);
			
			// Randomly assign preferredRole (30% chance)
			const preferredRole: RoleKey | undefined = Math.random() < 0.3 ? randomElement(ROLE_KEYS) : undefined;
			
			// Get difficulty tier from DC
			const difficultyTier = getDifficultyTier(dc);
			
			// Generate mission name
			const missionName = generateMissionName(missionType, tier);
			
			// Create mission attributes
			const attributes: MissionAttributes = {
				missionType,
				primaryAbility,
				dc,
				difficultyTier,
				preferredRole,
				baseDuration: Duration.ofSeconds(durationSeconds),
				baseRewards: {
					gold,
					xp,
					fame,
					materials: missionType === 'resource' ? Math.floor(tier * 5) : undefined
				},
				maxPartySize: 1
			};
			
			// Create timers object with optional expiresAt
			const timers: Record<string, number | null> = {};
			if (expiresAt) {
				timers['expiresAt'] = expiresAt.value; // Store as milliseconds
			}

			// Create Mission entity
			const mission = new Mission(
				id,
				attributes,
				[], // No tags initially
				'Available', // Available state
				timers,
				{ name: missionName } // Store name in metadata
			);
			
			missions.push(mission);
		}
	}
	
	return missions;
}

