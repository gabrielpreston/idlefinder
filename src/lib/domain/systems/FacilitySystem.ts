/**
 * Facility System - handles facility upgrades
 * Facility upgrade logic and effect application
 */

import type { PlayerState, FacilityMap, FacilityLevel } from '../entities/PlayerState';

/**
 * Facility System - handles facility upgrades
 */
export class FacilitySystem {
	/**
	 * Upgrade a facility
	 * Returns new state with facility upgraded
	 */
	upgrade(
		state: PlayerState,
		facility: keyof FacilityMap
	): PlayerState {
		const currentFacility = state.facilities[facility];
		const newLevel = currentFacility.level + 1;

		// Generate effects based on facility and level
		const effects = this.generateEffects(facility, newLevel);

		const updatedFacility: FacilityLevel = {
			level: newLevel,
			effects
		};

		return {
			...state,
			facilities: {
				...state.facilities,
				[facility]: updatedFacility
			}
		};
	}

	/**
	 * Check if a facility can be upgraded
	 */
	canUpgrade(state: PlayerState, facility: keyof FacilityMap): boolean {
		const currentFacility = state.facilities[facility];
		// Simple max level check - can be extended later
		return currentFacility.level < 10;
	}

	/**
	 * Get upgrade cost for a facility
	 */
	getUpgradeCost(facility: keyof FacilityMap, currentLevel: number): {
		gold: number;
		supplies: number;
		relics: number;
	} {
		// Simple cost calculation - can be extended later
		return {
			gold: currentLevel * 100,
			supplies: currentLevel * 10,
			relics: 0
		};
	}

	/**
	 * Generate effects for a facility at a given level
	 */
	private generateEffects(facility: keyof FacilityMap, level: number): string[] {
		const effects: string[] = [];

		switch (facility) {
			case 'tavern':
				effects.push(`Level ${level} tavern - ${level * 2} adventurer capacity`);
				break;
			case 'guildHall':
				effects.push(`Level ${level} guild hall - ${level * 3} mission slots`);
				break;
			case 'blacksmith':
				effects.push(`Level ${level} blacksmith - ${level * 5}% mission reward bonus`);
				break;
		}

		return effects;
	}
}

