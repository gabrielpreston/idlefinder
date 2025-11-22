/**
 * Entity Attribute Schemas - Zod validation schemas for entity attributes
 * Used for deserializing entity attributes from DTOs
 */

import { z } from 'zod';

/**
 * AdventurerAttributes Schema
 */
export const AdventurerAttributesSchema = z.object({
	level: z.number().int().min(1).default(1),
	xp: z.number().min(0).default(0),
	abilityMods: z.record(z.string(), z.number()).default({}),
	classKey: z.string().default(''),
	ancestryKey: z.string().default(''),
	traitTags: z.array(z.string()).default([]),
	roleKey: z.string().optional(),
	baseHP: z.number().int().min(1).default(10),
	assignedSlotId: z.string().nullable().default(null)
});

/**
 * MissionAttributes Schema
 */
export const MissionAttributesSchema = z.object({
	missionType: z.enum(['combat', 'exploration', 'investigation', 'diplomacy', 'resource']).default('combat'),
	primaryAbility: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']).default('str'),
	dc: z.number().int().min(1).default(15),
	difficultyTier: z.enum(['Easy', 'Medium', 'Hard', 'Legendary']).default('Easy'),
	preferredRole: z.string().optional(),
	baseDuration: z.number().int().min(1).default(60000), // milliseconds
	baseRewards: z.object({
		gold: z.number().min(0).default(0),
		xp: z.number().min(0).default(0),
		fame: z.number().min(0).optional()
	}).default({ gold: 0, xp: 0 }),
	maxPartySize: z.number().int().min(1).default(1)
});

/**
 * FacilityAttributes Schema
 */
export const FacilityAttributesSchema = z.object({
	facilityType: z.enum(['Guildhall', 'Dormitory', 'MissionCommand', 'TrainingGrounds', 'ResourceDepot']).default('Guildhall'),
	tier: z.number().int().min(0).default(1),
	baseCapacity: z.number().int().min(1).default(1),
	bonusMultipliers: z.object({
		xp: z.number().optional(),
		resourceGen: z.number().optional(),
		missionSlots: z.number().optional()
	}).default({})
});

/**
 * ResourceSlotAttributes Schema
 */
export const ResourceSlotAttributesSchema = z.object({
	facilityId: z.string().default(''),
	resourceType: z.enum(['gold', 'materials', 'durationModifier']).default('gold'),
	baseRatePerMinute: z.number().min(0).default(6),
	assigneeType: z.enum(['player', 'adventurer', 'none']).default('none'),
	assigneeId: z.string().nullable().default(null),
	fractionalAccumulator: z.number().min(0).default(0)
});

/**
 * Inferred types
 */
export type AdventurerAttributesDTO = z.infer<typeof AdventurerAttributesSchema>;
export type MissionAttributesDTO = z.infer<typeof MissionAttributesSchema>;
export type FacilityAttributesDTO = z.infer<typeof FacilityAttributesSchema>;
export type ResourceSlotAttributesDTO = z.infer<typeof ResourceSlotAttributesSchema>;

