/**
 * GameState Mapper - maps between domain models and DTOs
 * Handles entity map serialization/deserialization
 */

import { GameState } from '../../domain/entities/GameState';
import type { GameStateDTO, EntityDTO } from '../dto/GameStateDTO';
import { Adventurer } from '../../domain/entities/Adventurer';
import { Mission } from '../../domain/entities/Mission';
import { Facility } from '../../domain/entities/Facility';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { ResourceBundle } from '../../domain/valueObjects/ResourceBundle';
import { Identifier } from '../../domain/valueObjects/Identifier';
import { NumericStatMap } from '../../domain/valueObjects/NumericStatMap';
import { Duration } from '../../domain/valueObjects/Duration';
import type { AdventurerAttributes } from '../../domain/attributes/AdventurerAttributes';
import type { MissionAttributes } from '../../domain/attributes/MissionAttributes';
import type { FacilityAttributes } from '../../domain/attributes/FacilityAttributes';

const CURRENT_VERSION = 2; // Version 2 for GameState (Version 1 was PlayerState)

/**
 * Convert domain GameState to DTO
 */
export function domainToDTO(gameState: GameState): GameStateDTO {
	const entities: EntityDTO[] = [];

	for (const entity of gameState.entities.values()) {
		const entityDTO: EntityDTO = {
			id: entity.id,
			type: entity.type,
			attributes: serializeAttributes(entity),
			tags: serializeTags(entity),
			state: serializeState(entity),
			timers: serializeTimers(entity),
			metadata: serializeMetadata(entity)
		};
		entities.push(entityDTO);
	}

	return {
		version: CURRENT_VERSION,
		playerId: gameState.playerId,
		lastPlayed: gameState.lastPlayed.value.toString(),
		entities,
		resources: {
			resources: serializeResources(gameState.resources)
		}
	};
}

/**
 * Convert DTO to domain GameState
 */
export function dtoToDomain(dto: GameStateDTO): GameState {
	// Handle version migration
	if (dto.version !== CURRENT_VERSION) {
		return migrateDTO(dto);
	}

	// Validate and provide defaults
	const entities = new Map<string, import('../../domain/primitives/Requirement').Entity>();
	for (const entityDTO of dto.entities || []) {
		const entity = deserializeEntity(entityDTO);
		if (entity && 'id' in entity) {
			entities.set(entity.id, entity);
		}
	}

	const resources = deserializeResources(dto.resources || { resources: {} });
	const lastPlayed = dto.lastPlayed
		? Timestamp.from(new Date(dto.lastPlayed))
		: Timestamp.now();

	return new GameState(dto.playerId || 'player-1', lastPlayed, entities, resources);
}

/**
 * Serialize entity attributes
 */
function serializeAttributes(entity: import('../../domain/primitives/Requirement').Entity): Record<string, unknown> {
	if (entity.type === 'Adventurer') {
		const adventurer = entity as Adventurer;
		return {
			level: adventurer.attributes.level,
			xp: adventurer.attributes.xp,
			abilityMods: adventurer.attributes.abilityMods.toMap(),
			classKey: adventurer.attributes.classKey,
			ancestryKey: adventurer.attributes.ancestryKey,
			roleTag: adventurer.attributes.roleTag,
			baseHP: adventurer.attributes.baseHP
		};
	} else if (entity.type === 'Mission') {
		const mission = entity as Mission;
		return {
			difficultyTier: mission.attributes.difficultyTier,
			primaryAbility: mission.attributes.primaryAbility,
			baseDuration: mission.attributes.baseDuration.toMilliseconds(),
			baseRewards: mission.attributes.baseRewards,
			maxPartySize: mission.attributes.maxPartySize
		};
	} else if (entity.type === 'Facility') {
		const facility = entity as Facility;
		return {
			facilityType: facility.attributes.facilityType,
			tier: facility.attributes.tier,
			baseCapacity: facility.attributes.baseCapacity,
			bonusMultipliers: facility.attributes.bonusMultipliers
		};
	}
	return {};
}

/**
 * Deserialize entity from DTO
 */
function deserializeEntity(dto: EntityDTO): import('../../domain/primitives/Requirement').Entity | null {

	if (dto.type === 'Adventurer') {
		const attributes: AdventurerAttributes = {
			level: (dto.attributes.level as number) || 1,
			xp: (dto.attributes.xp as number) || 0,
			abilityMods: NumericStatMap.fromMap(
				new Map(Object.entries((dto.attributes.abilityMods as Record<string, number>) || {}))
			),
			classKey: (dto.attributes.classKey as string) || '',
			ancestryKey: (dto.attributes.ancestryKey as string) || '',
			roleTag: (dto.attributes.roleTag as string) || '',
			baseHP: (dto.attributes.baseHP as number) || 10
		};
		const id = Identifier.from<'AdventurerId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		return new Adventurer(
			id,
			attributes,
			dto.tags || [],
			(dto.state as 'Idle' | 'OnMission' | 'Recovering' | 'Dead') || 'Idle',
			timers,
			dto.metadata || {}
		);
	} else if (dto.type === 'Mission') {
		const attributes: MissionAttributes = {
			difficultyTier: (dto.attributes.difficultyTier as 'Easy' | 'Medium' | 'Hard' | 'Legendary') || 'Easy',
			primaryAbility: (dto.attributes.primaryAbility as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') || 'str',
			baseDuration: Duration.ofSeconds((dto.attributes.baseDuration as number) || 60),
			baseRewards: (dto.attributes.baseRewards as { gold: number; xp: number; fame?: number }) || {
				gold: 0,
				xp: 0
			},
			maxPartySize: (dto.attributes.maxPartySize as number) || 1
		};
		const id = Identifier.from<'MissionId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		return new Mission(
			id,
			attributes,
			dto.tags || [],
			(dto.state as 'Available' | 'InProgress' | 'Completed' | 'Expired') || 'Available',
			timers,
			dto.metadata || {}
		);
	} else if (dto.type === 'Facility') {
		const attributes: FacilityAttributes = {
			facilityType: (dto.attributes.facilityType as 'Guildhall' | 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot') || 'Guildhall',
			tier: (dto.attributes.tier as number) || 1,
			baseCapacity: (dto.attributes.baseCapacity as number) || 1,
			bonusMultipliers: (dto.attributes.bonusMultipliers as {
				xp?: number;
				resourceGen?: number;
				missionSlots?: number;
			}) || {}
		};
		const id = Identifier.from<'FacilityId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		return new Facility(
			id,
			attributes,
			dto.tags || [],
			(dto.state as 'Online' | 'UnderConstruction' | 'Disabled') || 'Online',
			timers,
			dto.metadata || {}
		);
	}
	return null;
}

/**
 * Serialize tags
 */
function serializeTags(entity: import('../../domain/primitives/Requirement').Entity): string[] {
	if ('tags' in entity && Array.isArray(entity.tags)) {
		return [...entity.tags];
	}
	return [];
}

/**
 * Serialize state
 */
function serializeState(entity: import('../../domain/primitives/Requirement').Entity): string {
	if ('state' in entity && typeof entity.state === 'string') {
		return entity.state;
	}
	return '';
}

/**
 * Serialize timers
 */
function serializeTimers(entity: import('../../domain/primitives/Requirement').Entity): Record<string, number> {
	const timers: Record<string, number> = {};
	if ('timers' in entity && entity.timers instanceof Map) {
		for (const [key, timestamp] of entity.timers.entries()) {
			if (timestamp && 'value' in timestamp && typeof timestamp.value === 'number') {
				timers[key] = timestamp.value;
			}
		}
	}
	return timers;
}

/**
 * Deserialize timers
 */
function deserializeTimers(timersDTO: Record<string, number>): Map<string, Timestamp> {
	const timers = new Map<string, Timestamp>();
	for (const [key, value] of Object.entries(timersDTO)) {
		timers.set(key, Timestamp.from(value));
	}
	return timers;
}

/**
 * Serialize metadata
 */
function serializeMetadata(entity: import('../../domain/primitives/Requirement').Entity): Record<string, unknown> {
	if ('metadata' in entity && typeof entity.metadata === 'object' && entity.metadata !== null) {
		return { ...(entity.metadata as Record<string, unknown>) };
	}
	return {};
}

/**
 * Serialize resources
 */
function serializeResources(resources: ResourceBundle): Record<string, number> {
	const resourceMap: Record<string, number> = {};
	// ResourceBundle doesn't expose internal map directly, need to use toArray()
	for (const unit of resources.toArray()) {
		resourceMap[unit.resourceType] = unit.amount;
	}
	return resourceMap;
}

/**
 * Deserialize resources
 */
function deserializeResources(resourcesDTO: { resources: Record<string, number> }): ResourceBundle {
	const resourceMap = new Map<string, number>();
	for (const [resourceType, amount] of Object.entries(resourcesDTO.resources || {})) {
		resourceMap.set(resourceType, amount);
	}
	return new ResourceBundle(resourceMap);
}

/**
 * Migrate DTO from older versions
 */
function migrateDTO(dto: GameStateDTO): GameState {
	// For now, just handle version 1 (old PlayerState) migration
	if (dto.version === 1) {
		// TODO: Implement migration from PlayerStateDTO to GameStateDTO
		// For now, return empty GameState
		return new GameState('player-1', Timestamp.now(), new Map(), new ResourceBundle(new Map()));
	}
	// Unknown version - return empty state
	return new GameState('player-1', Timestamp.now(), new Map(), new ResourceBundle(new Map()));
}

