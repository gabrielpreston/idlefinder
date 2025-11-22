/**
 * Recruit Pool System - Generates preview adventurers for recruitment pool
 * Creates temporary Adventurer entities with state: 'Preview' for player selection
 */

import { Adventurer } from '../entities/Adventurer';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import type { AdventurerAttributes } from '../attributes/AdventurerAttributes';
import { deriveRoleKey } from '../attributes/RoleKey';
import {
	getRandomPathfinderClassKey,
	getRandomPathfinderAncestryKey
} from '../data/pathfinder';

/**
 * Generate a pool of preview adventurers for recruitment
 * 
 * @param count Number of preview adventurers to generate (default: 4)
 * @returns Array of Adventurer entities with state: 'Preview'
 */
export function generateRecruitPool(count: number = 4): Adventurer[] {
	const previewAdventurers: Adventurer[] = [];

	for (let i = 0; i < count; i++) {
		// Generate adventurer ID
		const adventurerId = crypto.randomUUID();
		const id = Identifier.from<'AdventurerId'>(adventurerId);

		// Create default attributes for preview adventurer (level 1, 0 XP)
		// Assign random Pathfinder class and ancestry
		const classKey = getRandomPathfinderClassKey();
		const ancestryKey = getRandomPathfinderAncestryKey();
		const attributes: AdventurerAttributes = {
			level: 1,
			xp: 0,
			abilityMods: NumericStatMap.fromMap(new Map([
				['str', 0],
				['dex', 0],
				['con', 0],
				['int', 0],
				['wis', 0],
				['cha', 0]
			])),
			classKey,
			ancestryKey,
			traitTags: [], // No traits for previews
			roleKey: deriveRoleKey(classKey), // Derive from classKey
			baseHP: 10,
			assignedSlotId: null
		};

		// Create preview Adventurer entity
		const previewAdventurer = new Adventurer(
			id,
			attributes,
			[], // No tags
			'Preview', // Preview state
			{}, // No timers
			{ 
				name: `Recruit ${String(i + 1)}`, // Temporary name
				isPreview: true // Mark as preview in metadata
			}
		);

		previewAdventurers.push(previewAdventurer);
	}

	return previewAdventurers;
}

