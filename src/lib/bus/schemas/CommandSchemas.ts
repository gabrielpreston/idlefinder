/**
 * Command Payload Schemas - Zod validation schemas for command payloads
 */

import { z } from 'zod';

/**
 * StartMissionCommand Schema
 */
export const StartMissionCommandSchema = z.object({
	missionId: z.string().min(1, 'Mission ID is required'),
	adventurerIds: z.array(z.string().min(1)).min(1, 'At least one adventurer ID is required')
});

/**
 * CompleteMissionCommand Schema
 */
export const CompleteMissionCommandSchema = z.object({
	missionId: z.string().min(1, 'Mission ID is required')
});

/**
 * RecruitAdventurerCommand Schema
 */
export const RecruitAdventurerCommandSchema = z.object({
	name: z.string().optional(),
	traits: z.array(z.string()).default([]),
	previewAdventurerId: z.string().optional()
});

/**
 * RefreshRecruitPoolCommand Schema
 */
export const RefreshRecruitPoolCommandSchema = z.object({});

/**
 * UpgradeFacilityCommand Schema
 * Note: facility can be either a facility ID (any string) or facilityType ('tavern' | 'guildHall' | 'blacksmith')
 * The handler will try to find by ID first, then by facilityType
 */
export const UpgradeFacilityCommandSchema = z.object({
	facility: z.string().min(1, 'Facility ID or type is required')
});

/**
 * ConstructFacilityCommand Schema
 */
export const ConstructFacilityCommandSchema = z.object({
	facilityType: z.enum(['Dormitory', 'MissionCommand', 'TrainingGrounds', 'ResourceDepot'])
});

/**
 * EquipItemCommand Schema
 */
export const EquipItemCommandSchema = z.object({
	itemId: z.string().min(1, 'Item ID is required'),
	adventurerId: z.string().min(1, 'Adventurer ID is required'),
	slot: z.enum(['weapon', 'armor', 'offHand', 'accessory'])
});

/**
 * UnequipItemCommand Schema
 */
export const UnequipItemCommandSchema = z.object({
	itemId: z.string().min(1, 'Item ID is required'),
	adventurerId: z.string().min(1, 'Adventurer ID is required'),
	slot: z.enum(['weapon', 'armor', 'offHand', 'accessory'])
});

/**
 * RepairItemCommand Schema
 */
export const RepairItemCommandSchema = z.object({
	itemId: z.string().min(1, 'Item ID is required')
});

/**
 * SalvageItemCommand Schema
 */
export const SalvageItemCommandSchema = z.object({
	itemId: z.string().min(1, 'Item ID is required'),
	materialsAmount: z.number().optional()
});

/**
 * UpdateAutoEquipRulesCommand Schema
 */
export const UpdateAutoEquipRulesCommandSchema = z.object({
	focus: z.enum(['balanced', 'offense-first', 'defense-first']).optional(),
	allowRareAutoEquip: z.boolean().optional(),
	rolePriorities: z.record(z.string(), z.array(z.string())).optional()
});

/**
 * TriggerAutoEquipCommand Schema
 */
export const TriggerAutoEquipCommandSchema = z.object({
	adventurerId: z.string().optional()
});

/**
 * UpdateMissionDoctrineCommand Schema
 */
export const UpdateMissionDoctrineCommandSchema = z.object({
	focus: z.enum(['gold', 'xp', 'materials', 'balanced']).optional(),
	riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
	preferredMissionTypes: z.array(z.string()).optional(),
	minLevel: z.number().int().min(1).optional(),
	maxLevel: z.number().int().min(1).optional()
});

/**
 * AddCraftingToQueueCommand Schema
 */
export const AddCraftingToQueueCommandSchema = z.object({
	recipeId: z.string().min(1, 'Recipe ID is required')
});

/**
 * CancelCraftingJobCommand Schema
 */
export const CancelCraftingJobCommandSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required')
});

/**
 * AssignWorkerToSlotCommand Schema
 */
export const AssignWorkerToSlotCommandSchema = z.object({
	slotId: z.string().min(1, 'Slot ID is required'),
	assigneeType: z.enum(['player', 'adventurer']),
	assigneeId: z.string().nullable().optional()
}).refine(
	(data) => {
		if (data.assigneeType === 'adventurer') {
			return data.assigneeId !== undefined && data.assigneeId !== null && data.assigneeId.length > 0;
		}
		return true;
	},
	{
		message: 'Assignee ID is required when assigneeType is adventurer',
		path: ['assigneeId']
	}
);

/**
 * UnassignWorkerFromSlotCommand Schema
 */
export const UnassignWorkerFromSlotCommandSchema = z.object({
	slotId: z.string().min(1, 'Slot ID is required')
});

/**
 * Command schema registry
 */
export const CommandSchemas = {
	StartMission: StartMissionCommandSchema,
	CompleteMission: CompleteMissionCommandSchema,
	RecruitAdventurer: RecruitAdventurerCommandSchema,
	RefreshRecruitPool: RefreshRecruitPoolCommandSchema,
	UpgradeFacility: UpgradeFacilityCommandSchema,
	ConstructFacility: ConstructFacilityCommandSchema,
	EquipItem: EquipItemCommandSchema,
	UnequipItem: UnequipItemCommandSchema,
	RepairItem: RepairItemCommandSchema,
	SalvageItem: SalvageItemCommandSchema,
	UpdateAutoEquipRules: UpdateAutoEquipRulesCommandSchema,
	TriggerAutoEquip: TriggerAutoEquipCommandSchema,
	UpdateMissionDoctrine: UpdateMissionDoctrineCommandSchema,
	AddCraftingToQueue: AddCraftingToQueueCommandSchema,
	CancelCraftingJob: CancelCraftingJobCommandSchema,
	AssignWorkerToSlot: AssignWorkerToSlotCommandSchema,
	UnassignWorkerFromSlot: UnassignWorkerFromSlotCommandSchema
} as const;

