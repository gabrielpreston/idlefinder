/**
 * Message Bus Type Definitions
 * Matches design spec exactly: docs/design/04-api-message-spec.md
 * 
 * Note: DomainEvent and related types are now defined in domain layer (src/lib/domain/primitives/Event.ts)
 * and re-exported here for backward compatibility.
 */

/**
 * Base message envelope - matches design spec exactly
 */
export interface Message {
	type: string;
	payload: unknown;
	timestamp: string; // ISO 8601 UTC
	metadata?: {
		correlationId?: string;
		userId?: string;
		[key: string]: unknown;
	};
}

// Re-export domain event types from domain layer (source of truth)
export type {
	DomainEvent,
	DomainEventType,
	DomainEventPayload,
	ResourceMap,
	MissionStartedEvent,
	MissionCompletedEvent,
	MissionFailedEvent,
	AdventurerRecruitedEvent,
	AdventurerAssignedEvent,
	AdventurerGainedXPEvent,
	AdventurerLeveledUpEvent,
	FacilityUpgradedEvent,
	ResourcesChangedEvent,
	CommandFailedEvent
} from '../domain/primitives/Event';

/**
 * Commands - user intent (one handler per command)
 */
export type CommandType =
	| 'StartMission'
	| 'CompleteMission'
	| 'RecruitAdventurer'
	| 'RefreshRecruitPool'
	| 'UpgradeFacility'
	| 'EquipItem'
	| 'UnequipItem'
	| 'RepairItem'
	| 'SalvageItem'
	| 'UpdateAutoEquipRules'
	| 'TriggerAutoEquip'
	| 'UpdateMissionDoctrine'
	| 'AddCraftingToQueue'
	| 'CancelCraftingJob'
	| 'AssignWorkerToSlot'
	| 'UnassignWorkerFromSlot';

export interface Command extends Message {
	type: CommandType;
	payload: CommandPayload;
}

export type CommandPayload =
	| StartMissionCommand
	| CompleteMissionCommand
	| RecruitAdventurerCommand
	| RefreshRecruitPoolCommand
	| UpgradeFacilityCommand
	| EquipItemCommand
	| UnequipItemCommand
	| RepairItemCommand
	| SalvageItemCommand
	| UpdateAutoEquipRulesCommand
	| TriggerAutoEquipCommand
	| UpdateMissionDoctrineCommand
	| AddCraftingToQueueCommand
	| CancelCraftingJobCommand
	| AssignWorkerToSlotCommand
	| UnassignWorkerFromSlotCommand;

export interface StartMissionCommand {
	missionId: string;
	adventurerIds: string[];
}

export interface CompleteMissionCommand {
	missionId: string;
}

export interface RecruitAdventurerCommand {
	name: string;
	traits: string[];
	previewAdventurerId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RefreshRecruitPoolCommand {
	// Empty payload - uses current state
}

export interface UpgradeFacilityCommand {
	facility: string; // 'tavern' | 'guildHall' | 'blacksmith'
}

export interface EquipItemCommand {
	itemId: string;
	adventurerId: string;
	slot: 'weapon' | 'armor' | 'offHand' | 'accessory';
}

export interface UnequipItemCommand {
	itemId: string;
	adventurerId: string;
	slot: 'weapon' | 'armor' | 'offHand' | 'accessory';
}

export interface RepairItemCommand {
	itemId: string;
}

export interface SalvageItemCommand {
	itemId: string;
	materialsAmount?: number;
}

export interface UpdateAutoEquipRulesCommand {
	focus?: 'balanced' | 'offense-first' | 'defense-first';
	allowRareAutoEquip?: boolean;
	rolePriorities?: Map<string, string[]>; // RoleKey -> StatPriority[]
}

export interface TriggerAutoEquipCommand {
	adventurerId?: string; // If provided, only equip this adventurer; otherwise equip all
}

export interface UpdateMissionDoctrineCommand {
	focus?: 'gold' | 'xp' | 'materials' | 'balanced';
	riskTolerance?: 'low' | 'medium' | 'high';
	preferredMissionTypes?: string[];
	minLevel?: number;
	maxLevel?: number;
}

export interface AddCraftingToQueueCommand {
	recipeId: string;
}

export interface CancelCraftingJobCommand {
	jobId: string;
}

export interface AssignWorkerToSlotCommand {
	slotId: string;
	assigneeType: 'player' | 'adventurer';
	assigneeId?: string; // Required if assigneeType === 'adventurer'
}

export interface UnassignWorkerFromSlotCommand {
	slotId: string;
}

// Domain Events are now defined in domain layer and re-exported above

/**
 * Tick Messages - time progression
 */
export interface TickMessage extends Message {
	type: 'Tick';
	payload: {
		deltaMs: number;
		timestamp: string; // ISO 8601
	};
}

