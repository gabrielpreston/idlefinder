/**
 * PlayerState Mapper - maps between domain models and DTOs
 */

import type { PlayerState, Adventurer, Mission, Reward, FacilityMap } from '../../domain/entities/PlayerState';
import type {
	PlayerStateDTO,
	AdventurerDTO,
	MissionDTO,
	RewardDTO,
	FacilityMapDTO
} from '../dto/PlayerStateDTO';

const CURRENT_VERSION = 1;

/**
 * Convert domain PlayerState to DTO
 */
export function domainToDTO(state: PlayerState): PlayerStateDTO {
	return {
		version: CURRENT_VERSION,
		playerId: state.playerId,
		lastPlayed: state.lastPlayed,
		resources: {
			gold: state.resources.gold,
			supplies: state.resources.supplies,
			relics: state.resources.relics
		},
		adventurers: state.adventurers.map(adventurerToDTO),
		missions: state.missions.map(missionToDTO),
		facilities: facilityMapToDTO(state.facilities),
		fame: state.fame,
		completedMissionIds: [...state.completedMissionIds]
	};
}

/**
 * Convert DTO to domain PlayerState
 */
export function dtoToDomain(dto: PlayerStateDTO): PlayerState {
	// Validate DTO structure - handle malformed or incomplete data
	if (!dto || typeof dto !== 'object') {
		throw new Error('[Persistence] Invalid DTO: not an object');
	}

	// Handle version migration
	if (dto.version !== CURRENT_VERSION) {
		return migrateDTO(dto);
	}

	// Validate and provide defaults for required fields
	const resources = dto.resources || { gold: 0, supplies: 0, relics: 0 };
	const adventurers = Array.isArray(dto.adventurers) ? dto.adventurers : [];
	const missions = Array.isArray(dto.missions) ? dto.missions : [];
	const facilities = dto.facilities || {
		tavern: { level: 1, effects: [] },
		guildHall: { level: 1, effects: [] },
		blacksmith: { level: 1, effects: [] }
	};
	const completedMissionIds = Array.isArray(dto.completedMissionIds) ? dto.completedMissionIds : [];

	return {
		playerId: dto.playerId || 'player-1',
		lastPlayed: dto.lastPlayed || new Date().toISOString(),
		resources: {
			gold: typeof resources.gold === 'number' ? resources.gold : 0,
			supplies: typeof resources.supplies === 'number' ? resources.supplies : 0,
			relics: typeof resources.relics === 'number' ? resources.relics : 0
		},
		adventurers: adventurers.map(adventurerFromDTO),
		missions: missions.map(missionFromDTO),
		facilities: facilityMapFromDTO(facilities),
		fame: typeof dto.fame === 'number' ? dto.fame : 0,
		completedMissionIds: [...completedMissionIds]
	};
}

/**
 * Migrate DTO from older versions
 */
function migrateDTO(dto: PlayerStateDTO): PlayerState {
	// For now, just map current version
	// Future: Add version-specific migration logic
	if (dto.version < CURRENT_VERSION) {
		// Migration logic for older versions would go here
		console.warn(`[Persistence] Migrating from version ${dto.version} to ${CURRENT_VERSION}`);
	}
	return dtoToDomain({ ...dto, version: CURRENT_VERSION });
}

// Helper functions for individual entity mapping

function adventurerToDTO(adventurer: Adventurer): AdventurerDTO {
	return {
		id: adventurer.id,
		name: adventurer.name,
		level: adventurer.level,
		experience: adventurer.experience,
		traits: [...adventurer.traits],
		status: adventurer.status,
		assignedMissionId: adventurer.assignedMissionId
	};
}

function adventurerFromDTO(dto: AdventurerDTO | Partial<AdventurerDTO>): Adventurer {
	return {
		id: dto.id || '',
		name: dto.name || '',
		level: typeof dto.level === 'number' ? dto.level : 1,
		experience: typeof dto.experience === 'number' ? dto.experience : 0,
		traits: Array.isArray(dto.traits) ? [...dto.traits] : [],
		status: (dto.status === 'idle' || dto.status === 'onMission') ? dto.status : 'idle',
		assignedMissionId: dto.assignedMissionId ?? null
	};
}

function missionToDTO(mission: Mission): MissionDTO {
	return {
		id: mission.id,
		name: mission.name,
		duration: mission.duration,
		startTime: mission.startTime,
		assignedAdventurerIds: [...mission.assignedAdventurerIds],
		reward: rewardToDTO(mission.reward),
		status: mission.status
	};
}

function missionFromDTO(dto: MissionDTO | Partial<MissionDTO>): Mission {
	const defaultReward: RewardDTO = {
		resources: { gold: 0, supplies: 0, relics: 0 },
		fame: 0,
		experience: 0
	};

	return {
		id: dto.id || '',
		name: dto.name || '',
		duration: typeof dto.duration === 'number' ? dto.duration : 0,
		startTime: dto.startTime || new Date().toISOString(),
		assignedAdventurerIds: Array.isArray(dto.assignedAdventurerIds) ? [...dto.assignedAdventurerIds] : [],
		reward: dto.reward ? rewardFromDTO(dto.reward) : rewardFromDTO(defaultReward),
		status: (dto.status === 'inProgress' || dto.status === 'completed') ? dto.status : 'inProgress'
	};
}

function rewardToDTO(reward: Reward): RewardDTO {
	return {
		resources: {
			gold: reward.resources.gold,
			supplies: reward.resources.supplies,
			relics: reward.resources.relics
		},
		fame: reward.fame,
		experience: reward.experience
	};
}

function rewardFromDTO(dto: RewardDTO | Partial<RewardDTO>): Reward {
	const resources = dto.resources || { gold: 0, supplies: 0, relics: 0 };
	return {
		resources: {
			gold: typeof resources.gold === 'number' ? resources.gold : 0,
			supplies: typeof resources.supplies === 'number' ? resources.supplies : 0,
			relics: typeof resources.relics === 'number' ? resources.relics : 0
		},
		fame: typeof dto.fame === 'number' ? dto.fame : 0,
		experience: typeof dto.experience === 'number' ? dto.experience : 0
	};
}

function facilityMapToDTO(facilities: FacilityMap): FacilityMapDTO {
	return {
		tavern: {
			level: facilities.tavern.level,
			effects: [...facilities.tavern.effects]
		},
		guildHall: {
			level: facilities.guildHall.level,
			effects: [...facilities.guildHall.effects]
		},
		blacksmith: {
			level: facilities.blacksmith.level,
			effects: [...facilities.blacksmith.effects]
		}
	};
}

function facilityMapFromDTO(dto: FacilityMapDTO | Partial<FacilityMapDTO>): FacilityMap {
	const defaultFacility = { level: 1, effects: [] };
	const tavern = dto.tavern || defaultFacility;
	const guildHall = dto.guildHall || defaultFacility;
	const blacksmith = dto.blacksmith || defaultFacility;

	return {
		tavern: {
			level: typeof tavern.level === 'number' ? tavern.level : 1,
			effects: Array.isArray(tavern.effects) ? [...tavern.effects] : []
		},
		guildHall: {
			level: typeof guildHall.level === 'number' ? guildHall.level : 1,
			effects: Array.isArray(guildHall.effects) ? [...guildHall.effects] : []
		},
		blacksmith: {
			level: typeof blacksmith.level === 'number' ? blacksmith.level : 1,
			effects: Array.isArray(blacksmith.effects) ? [...blacksmith.effects] : []
		}
	};
}

