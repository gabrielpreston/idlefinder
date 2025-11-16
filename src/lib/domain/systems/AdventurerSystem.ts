/**
 * Adventurer System - handles adventurer management
 * Recruit, level up, experience management
 */

import type { PlayerState, Adventurer } from '../entities/PlayerState';

/**
 * Adventurer System - handles adventurer management
 */
export class AdventurerSystem {
	/**
	 * Recruit a new adventurer
	 * Returns new state with adventurer added
	 */
	recruit(
		state: PlayerState,
		adventurerId: string,
		name: string,
		traits: string[]
	): PlayerState {
		const adventurer: Adventurer = {
			id: adventurerId,
			name,
			level: 1,
			experience: 0,
			traits,
			status: 'idle',
			assignedMissionId: null
		};

		return {
			...state,
			adventurers: [...state.adventurers, adventurer]
		};
	}

	/**
	 * Apply experience to an adventurer
	 * Returns new state with updated adventurer
	 */
	applyExperience(
		state: PlayerState,
		adventurerId: string,
		experience: number
	): PlayerState {
		const updatedAdventurers = state.adventurers.map((adv) => {
			if (adv.id === adventurerId) {
				const newExperience = adv.experience + experience;
				// Simple level calculation: 100 XP per level
				const newLevel = Math.floor(newExperience / 100) + 1;
				return {
					...adv,
					experience: newExperience,
					level: newLevel > adv.level ? newLevel : adv.level
				};
			}
			return adv;
		});

		return {
			...state,
			adventurers: updatedAdventurers
		};
	}
}

