/**
 * @deprecated PlayerState is deprecated. Use GameState with Entity map structure instead.
 * This file is kept for migration support only and will be removed in a future version.
 * 
 * PlayerState Entity - matches design doc exactly
 * Reference: docs/design/03-data-and-persistence-design.md lines 14-89
 */

import type { ResourceMap } from '../primitives/Event';

/**
 * @deprecated Use GameState instead. PlayerState - single source of truth
 * Matches design doc exactly
 */
export interface PlayerState {
	playerId: string;
	lastPlayed: string; // ISO timestamp UTC
	resources: ResourceMap;
	adventurers: Adventurer[];
	missions: Mission[];
	facilities: FacilityMap;
	fame: number;
	completedMissionIds: string[];
}

export interface Adventurer {
	id: string;
	name: string;
	level: number;
	experience: number;
	traits: string[];
	status: 'idle' | 'onMission';
	assignedMissionId: string | null;
}

export interface Mission {
	id: string;
	name: string;
	duration: number; // milliseconds
	startTime: string; // ISO timestamp UTC
	assignedAdventurerIds: string[];
	reward: Reward;
	status: 'inProgress' | 'completed';
}

export interface Reward {
	resources: ResourceMap;
	fame: number;
	experience: number;
}

export interface FacilityMap {
	tavern: FacilityLevel;
	guildHall: FacilityLevel;
	blacksmith: FacilityLevel;
}

export interface FacilityLevel {
	level: number;
	effects: string[]; // Human-readable descriptions
}

/**
 * Create initial player state
 */
export function createInitialPlayerState(playerId: string): PlayerState {
	return {
		playerId,
		lastPlayed: new Date().toISOString(),
		resources: {
			gold: 100,
			supplies: 0,
			relics: 0
		},
		adventurers: [],
		missions: [],
		facilities: {
			tavern: { level: 1, effects: ['Basic adventurer recruitment'] },
			guildHall: { level: 1, effects: ['Basic mission board'] },
			blacksmith: { level: 1, effects: ['Basic equipment'] }
		},
		fame: 0,
		completedMissionIds: []
	};
}

