/**
 * @deprecated PlayerStateDTO is deprecated. Use GameStateDTO with Entity map structure instead.
 * This file is kept for migration support only and will be removed in a future version.
 * 
 * PlayerState DTO - Data Transfer Object for persistence
 * Separates domain models from serialization
 */

/**
 * @deprecated Use GameStateDTO instead. PlayerState DTO - serializable representation of PlayerState
 */
export interface PlayerStateDTO {
	version: number;
	playerId: string;
	lastPlayed: string; // ISO timestamp UTC
	resources: ResourceMapDTO;
	adventurers: AdventurerDTO[];
	missions: MissionDTO[];
	facilities: FacilityMapDTO;
	fame: number;
	completedMissionIds: string[];
}

export interface ResourceMapDTO {
	gold: number;
	supplies: number;
	relics: number;
}

export interface AdventurerDTO {
	id: string;
	name: string;
	level: number;
	experience: number;
	traits: string[];
	status: 'idle' | 'onMission';
	assignedMissionId: string | null;
}

export interface MissionDTO {
	id: string;
	name: string;
	duration: number; // milliseconds
	startTime: string; // ISO timestamp UTC
	assignedAdventurerIds: string[];
	reward: RewardDTO;
	status: 'inProgress' | 'completed';
}

export interface RewardDTO {
	resources: ResourceMapDTO;
	fame: number;
	experience: number;
}

export interface FacilityMapDTO {
	tavern: FacilityLevelDTO;
	guildHall: FacilityLevelDTO;
	blacksmith: FacilityLevelDTO;
}

export interface FacilityLevelDTO {
	level: number;
	effects: string[]; // Human-readable descriptions
}

