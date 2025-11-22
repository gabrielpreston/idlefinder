/**
 * GameState Mapper - maps between domain models and DTOs
 * Handles entity map serialization/deserialization
 */

import { GameState } from '../../domain/entities/GameState';
import type { GameStateDTO } from '../dto/GameStateDTO';
import type { EntityDTO } from '../schemas/EntitySchema';
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
import { GameStateDTOSchema } from '../schemas/GameStateSchema';
import { EntityDTOSchema } from '../schemas/EntitySchema';
import {
	AdventurerAttributesSchema,
	MissionAttributesSchema,
	FacilityAttributesSchema,
	ResourceSlotAttributesSchema
} from '../schemas/EntityAttributeSchemas';

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
	// Handle version migration before validation
	if (dto.version !== CURRENT_VERSION) {
		return migrateDTO(dto);
	}

	// Validate DTO structure using Zod
	const validationResult = GameStateDTOSchema.safeParse(dto);
	if (!validationResult.success) {
		// If validation fails, throw error with details
		const errorMessage = `[Persistence] Invalid GameStateDTO: ${validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
		throw new Error(errorMessage);
	}

	// Use validated and normalized DTO
	const validatedDto = validationResult.data;

	// Validate and deserialize entities
	const entities = new Map<string, import('../../domain/primitives/Requirement').Entity>();
	for (const entityDTO of validatedDto.entities) {
		// Validate individual entity DTO
		const entityValidationResult = EntityDTOSchema.safeParse(entityDTO);
		if (!entityValidationResult.success) {
			// Skip invalid entity but continue processing other entities
			continue;
		}

		const entity = deserializeEntity(entityValidationResult.data);
		if (entity && 'id' in entity) {
			entities.set(entity.id, entity);
		}
	}

	const resources = deserializeResources(validatedDto.resources);
	const lastPlayed = validatedDto.lastPlayed
		? Timestamp.from(Number(validatedDto.lastPlayed)) // Parse string number directly
		: Timestamp.now();

	return new GameState(validatedDto.playerId, lastPlayed, entities, resources);
}

/**
 * Serialize entity attributes
 */
function serializeAttributes(entity: import('../../domain/primitives/Requirement').Entity): Record<string, unknown> {
	if (entity.type === 'Adventurer') {
		const adventurer = entity as Adventurer;
		// Convert Map to plain object for serialization (Zod expects record, not Map)
		const abilityModsMap = adventurer.attributes.abilityMods.toMap();
		const abilityModsRecord: Record<string, number> = {};
		for (const [key, value] of abilityModsMap.entries()) {
			abilityModsRecord[key] = value;
		}
		return {
			level: adventurer.attributes.level,
			xp: adventurer.attributes.xp,
			abilityMods: abilityModsRecord,
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
		// Validate attributes using Zod schema
		const attributesResult = AdventurerAttributesSchema.safeParse(dto.attributes);
		const validatedAttributes = attributesResult.success 
			? attributesResult.data 
			: AdventurerAttributesSchema.parse({});
		const classKey = validatedAttributes.classKey || '';
		const attributes: AdventurerAttributes = {
			level: validatedAttributes.level,
			xp: validatedAttributes.xp,
			abilityMods: NumericStatMap.fromMap(new Map(Object.entries(validatedAttributes.abilityMods))),
			classKey,
			ancestryKey: validatedAttributes.ancestryKey,
			traitTags: validatedAttributes.traitTags,
			roleKey: validatedAttributes.roleKey ? (validatedAttributes.roleKey as import('../../domain/attributes/RoleKey').RoleKey) : deriveRoleKey(classKey),
			baseHP: validatedAttributes.baseHP,
			assignedSlotId: validatedAttributes.assignedSlotId
		};
		const id = Identifier.from<'AdventurerId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		const state = (dto.state as 'Idle' | 'OnMission' | 'AssignedToSlot' | 'Fatigued' | 'Recovering' | 'Dead' | undefined) ?? 'Idle';
		return new Adventurer(
			id,
			attributes,
			dto.tags,
			state,
			timers,
			dto.metadata
		);
	} else if (dto.type === 'Mission') {
		// Validate attributes using Zod schema
		const attributesResult = MissionAttributesSchema.safeParse(dto.attributes);
		const validatedAttributes = attributesResult.success 
			? attributesResult.data 
			: MissionAttributesSchema.parse({});
		const attributes: MissionAttributes = {
			missionType: validatedAttributes.missionType,
			primaryAbility: validatedAttributes.primaryAbility,
			dc: validatedAttributes.dc,
			difficultyTier: validatedAttributes.difficultyTier,
			preferredRole: validatedAttributes.preferredRole as import('../../domain/attributes/RoleKey').RoleKey | undefined,
			baseDuration: Duration.ofSeconds(validatedAttributes.baseDuration / 1000), // Convert from milliseconds
			baseRewards: validatedAttributes.baseRewards,
			maxPartySize: validatedAttributes.maxPartySize
		};
		const id = Identifier.from<'MissionId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		const state = (dto.state as 'Available' | 'InProgress' | 'Completed' | 'Expired' | undefined) ?? 'Available';
		return new Mission(
			id,
			attributes,
			dto.tags,
			state,
			timers,
			dto.metadata
		);
	} else if (dto.type === 'Facility') {
		// Validate attributes using Zod schema
		const attributesResult = FacilityAttributesSchema.safeParse(dto.attributes);
		if (!attributesResult.success) {
			console.warn(`[Persistence] Invalid Facility attributes: ${attributesResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
		}
		const validatedAttributes = attributesResult.success 
			? attributesResult.data 
			: FacilityAttributesSchema.parse({});
		const attributes: FacilityAttributes = {
			facilityType: validatedAttributes.facilityType,
			tier: validatedAttributes.tier,
			baseCapacity: validatedAttributes.baseCapacity,
			bonusMultipliers: validatedAttributes.bonusMultipliers
		};
		const id = Identifier.from<'FacilityId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		const state = (dto.state as 'Online' | 'UnderConstruction' | 'Disabled' | undefined) ?? 'Online';
		return new Facility(
			id,
			attributes,
			dto.tags,
			state,
			timers,
			dto.metadata
		);
	} else if (dto.type === 'ResourceSlot') {
		// Validate attributes using Zod schema
		// Handle fractionalAccumulator which might be in metadata
		const attributesToValidate = {
			...dto.attributes,
			fractionalAccumulator: (dto.attributes.fractionalAccumulator as number | undefined) ?? (dto.metadata.fractionalAccumulator as number | undefined) ?? 0
		};
		const attributesResult = ResourceSlotAttributesSchema.safeParse(attributesToValidate);
		if (!attributesResult.success) {
			console.warn(`[Persistence] Invalid ResourceSlot attributes: ${attributesResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
		}
		const validatedAttributes = attributesResult.success 
			? attributesResult.data 
			: ResourceSlotAttributesSchema.parse({});
		const attributes: ResourceSlotAttributes = {
			facilityId: validatedAttributes.facilityId,
			resourceType: validatedAttributes.resourceType,
			baseRatePerMinute: validatedAttributes.baseRatePerMinute,
			assigneeType: validatedAttributes.assigneeType,
			assigneeId: validatedAttributes.assigneeId,
			fractionalAccumulator: validatedAttributes.fractionalAccumulator
		};
		const id = Identifier.from<'SlotId'>(dto.id);
		const timers = deserializeTimers(dto.timers);
		const state = (dto.state as 'locked' | 'available' | 'occupied' | 'disabled' | undefined) ?? 'available';
		return new ResourceSlot(
			id,
			attributes,
			dto.tags,
			state,
			timers,
			dto.metadata
		);
	}
	return null;
}

/**
 * Serialize tags
 */
function serializeTags(entity: import('../../domain/primitives/Requirement').Entity): string[] {
	if ('tags' in entity && Array.isArray(entity.tags)) {
		return (entity.tags as string[]).slice();
	}
	return [];
}

/**
 * Serialize state
 */
function serializeState(entity: import('../../domain/primitives/Requirement').Entity): string {
	// All concrete entities have state property, but base Entity interface doesn't guarantee it
	return (entity as { state?: string }).state ?? '';
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
			if (value !== null && typeof value === 'number') {
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
	// resources is guaranteed to exist after Zod validation (default: {})
	for (const [resourceType, amount] of Object.entries(resourcesDTO.resources)) {
		resourceMap.set(resourceType, amount);
	}
	return new ResourceBundle(resourceMap);
}

/**
 * Migrate DTO from older versions
 */
function migrateDTO(dto: GameStateDTO): GameState {
	// For now, just handle version 1 (old GameState format) migration
	if (dto.version === 1) {
		// TODO: Implement migration from PlayerStateDTO to GameStateDTO
		// For now, return empty GameState
		return new GameState('player-1', Timestamp.now(), new Map(), new ResourceBundle(new Map()));
	}
	// Unknown version - return empty state
	return new GameState('player-1', Timestamp.now(), new Map(), new ResourceBundle(new Map()));
}

