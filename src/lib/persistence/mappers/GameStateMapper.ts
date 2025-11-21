/**
 * GameState Mapper - maps between domain models and DTOs
 * Handles entity map serialization/deserialization
 */

import { GameState } from '../../domain/entities/GameState';
import type { GameStateDTO, EntityDTO } from '../dto/GameStateDTO';
import { Adventurer } from '../../domain/entities/Adventurer';
import { Mission } from '../../domain/entities/Mission';
import { Facility } from '../../domain/entities/Facility';
import { ResourceSlot } from '../../domain/entities/ResourceSlot';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { ResourceBundle } from '../../domain/valueObjects/ResourceBundle';
import { Identifier } from '../../domain/valueObjects/Identifier';
import { NumericStatMap } from '../../domain/valueObjects/NumericStatMap';
import { Duration } from '../../domain/valueObjects/Duration';
import type { AdventurerAttributes } from '../../domain/attributes/AdventurerAttributes';
import type { MissionAttributes } from '../../domain/attributes/MissionAttributes';
import type { FacilityAttributes } from '../../domain/attributes/FacilityAttributes';
import type { ResourceSlotAttributes } from '../../domain/attributes/ResourceSlotAttributes';
import { deriveRoleKey } from '../../domain/attributes/RoleKey';

const CURRENT_VERSION = 3; // Version 3: Added ResourceSlot support

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
		? Timestamp.from(Number(dto.lastPlayed)) // Parse string number directly
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
			traitTags: adventurer.attributes.traitTags,
			roleKey: adventurer.attributes.roleKey,
			baseHP: adventurer.attributes.baseHP
		};
	} else if (entity.type === 'Mission') {
		const mission = entity as Mission;
		return {
			missionType: mission.attributes.missionType,
			primaryAbility: mission.attributes.primaryAbility,
			dc: mission.attributes.dc,
			difficultyTier: mission.attributes.difficultyTier,
			preferredRole: mission.attributes.preferredRole,
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
	} else if (entity.type === 'ResourceSlot') {
		const slot = entity as ResourceSlot;
		return {
			facilityId: slot.attributes.facilityId,
			resourceType: slot.attributes.resourceType,
			baseRatePerMinute: slot.attributes.baseRatePerMinute,
			assigneeType: slot.attributes.assigneeType,
			assigneeId: slot.attributes.assigneeId
		};
	}
	return {};
}

/**
 * Deserialize entity from DTO
 */
function deserializeEntity(dto: EntityDTO): import('../../domain/primitives/Requirement').Entity | null {

	if (dto.type === 'Adventurer') {
		const classKey = (dto.attributes.classKey as string) || '';
		const attributes: AdventurerAttributes = {
			level: (dto.attributes.level as number) || 1,
			xp: (dto.attributes.xp as number) || 0,
			abilityMods: NumericStatMap.fromMap(
				new Map(Object.entries((dto.attributes.abilityMods as Record<string, number>) || {}))
			),
			classKey,
			ancestryKey: (dto.attributes.ancestryKey as string) || '',
			traitTags: (dto.attributes.traitTags as string[]) || [],
			roleKey: (dto.attributes.roleKey as import('../../domain/attributes/RoleKey').RoleKey) || deriveRoleKey(classKey),
			baseHP: (dto.attributes.baseHP as number) || 10,
			assignedSlotId: (dto.attributes.assignedSlotId as string | null) || null
		};
		const id = Identifier.from<'AdventurerId'>(dto.id);
		const timers = deserializeTimers(dto.timers || {});
		return new Adventurer(
			id,
			attributes,
			dto.tags || [],
			(dto.state as 'Idle' | 'OnMission' | 'AssignedToSlot' | 'Fatigued' | 'Recovering' | 'Dead') || 'Idle',
			timers,
			dto.metadata || {}
		);
	} else if (dto.type === 'Mission') {
		const difficultyTier = (dto.attributes.difficultyTier as 'Easy' | 'Medium' | 'Hard' | 'Legendary') || 'Easy';
		// Derive DC from difficultyTier if not provided (backward compatibility)
		const dcMap: Record<string, number> = { Easy: 10, Medium: 15, Hard: 20, Legendary: 25 };
		const attributes: MissionAttributes = {
			missionType: (dto.attributes.missionType as 'combat' | 'exploration' | 'investigation' | 'diplomacy' | 'resource') || 'combat',
			primaryAbility: (dto.attributes.primaryAbility as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') || 'str',
			dc: (dto.attributes.dc as number) || dcMap[difficultyTier] || 15,
			difficultyTier,
			preferredRole: (dto.attributes.preferredRole as import('../../domain/attributes/RoleKey').RoleKey) || undefined,
			baseDuration: Duration.ofSeconds((dto.attributes.baseDuration as number) || 60),
			baseRewards: (dto.attributes.baseRewards as { gold: number; xp: number; fame?: number }) || {
				gold: 0,
				xp: 0
			},
			maxPartySize: (dto.attributes.maxPartySize as number) || 1
		};
		const id = Identifier.from<'MissionId'>(dto.id);
		const timers = deserializeTimers(dto.timers || {});
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
		const timers = deserializeTimers(dto.timers || {});
		return new Facility(
			id,
			attributes,
			dto.tags || [],
			(dto.state as 'Online' | 'UnderConstruction' | 'Disabled') || 'Online',
			timers,
			dto.metadata || {}
		);
	} else if (dto.type === 'ResourceSlot') {
		const attributes: ResourceSlotAttributes = {
			facilityId: (dto.attributes.facilityId as string) || '',
			resourceType: (dto.attributes.resourceType as 'gold' | 'materials' | 'durationModifier') || 'gold',
			baseRatePerMinute: (dto.attributes.baseRatePerMinute as number) || 6,
			assigneeType: (dto.attributes.assigneeType as 'player' | 'adventurer' | 'none') || 'none',
			assigneeId: (dto.attributes.assigneeId as string | null) || null,
			fractionalAccumulator: (dto.attributes.fractionalAccumulator as number) ?? (dto.metadata?.fractionalAccumulator as number) ?? 0
		};
		const id = Identifier.from<'SlotId'>(dto.id);
		const timers = deserializeTimers(dto.timers || {});
		return new ResourceSlot(
			id,
			attributes,
			dto.tags || [],
			(dto.state as 'locked' | 'available' | 'occupied' | 'disabled') || 'available',
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
 * Per spec: timers are Record<string, number | null> (milliseconds)
 */
function serializeTimers(entity: import('../../domain/primitives/Requirement').Entity): Record<string, number> {
	const timers: Record<string, number> = {};
	if ('timers' in entity && typeof entity.timers === 'object' && entity.timers !== null) {
		const timersRecord = entity.timers as Record<string, number | null>;
		for (const [key, value] of Object.entries(timersRecord)) {
			if (value !== null && value !== undefined && typeof value === 'number') {
				timers[key] = value;
			}
		}
	}
	return timers;
}

/**
 * Deserialize timers
 * Per spec: timers are Record<string, number | null> (milliseconds)
 */
function deserializeTimers(timersDTO: Record<string, number>): Record<string, number | null> {
	const timers: Record<string, number | null> = {};
	for (const [key, value] of Object.entries(timersDTO)) {
		timers[key] = value; // Already milliseconds, no conversion needed
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

