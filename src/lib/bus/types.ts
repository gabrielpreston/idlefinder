/**
 * Message Bus Type Definitions
 * Matches design spec exactly: docs/design/04-api-message-spec.md
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

/**
 * Resource Map - matches design spec
 */
export interface ResourceMap {
	gold: number;
	supplies: number;
	relics: number;
}

/**
 * Commands - user intent (one handler per command)
 */
export type CommandType =
	| 'StartMission'
	| 'CompleteMission'
	| 'RecruitAdventurer'
	| 'UpgradeFacility';

export interface Command extends Message {
	type: CommandType;
	payload: CommandPayload;
}

export type CommandPayload =
	| StartMissionCommand
	| CompleteMissionCommand
	| RecruitAdventurerCommand
	| UpgradeFacilityCommand;

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
}

export interface UpgradeFacilityCommand {
	facility: string; // 'tavern' | 'guildHall' | 'blacksmith'
}

/**
 * Domain Events - facts about state changes (multiple listeners)
 */
export type DomainEventType =
	| 'MissionStarted'
	| 'MissionCompleted'
	| 'MissionFailed'
	| 'AdventurerRecruited'
	| 'AdventurerAssigned'
	| 'AdventurerGainedXP'
	| 'AdventurerLeveledUp'
	| 'FacilityUpgraded'
	| 'ResourcesChanged'
	| 'CommandFailed';

export interface DomainEvent extends Message {
	type: DomainEventType;
	payload: DomainEventPayload;
}

export type DomainEventPayload =
	| MissionStartedEvent
	| MissionCompletedEvent
	| MissionFailedEvent
	| AdventurerRecruitedEvent
	| AdventurerAssignedEvent
	| AdventurerGainedXPEvent
	| AdventurerLeveledUpEvent
	| FacilityUpgradedEvent
	| ResourcesChangedEvent
	| CommandFailedEvent;

export interface MissionStartedEvent {
	missionId: string;
	adventurerIds: string[];
	startTime: string; // ISO timestamp
	duration: number; // milliseconds
}

export interface MissionCompletedEvent {
	missionId: string;
	adventurerIds: string[];
	outcome: 'CriticalSuccess' | 'Success' | 'Failure' | 'CriticalFailure';
	rewards: {
		gold: number;
		xp: number;
		fame?: number;
	};
}

export interface MissionFailedEvent {
	missionId: string;
	adventurerIds: string[];
	reason: string;
}

export interface AdventurerRecruitedEvent {
	adventurerId: string;
	name: string;
	traits: string[];
}

export interface FacilityUpgradedEvent {
	facilityId: string;
	facilityType: string;
	newTier: number;
	bonusMultipliers: {
		xp?: number;
		resourceGen?: number;
		missionSlots?: number;
	};
}

export interface AdventurerAssignedEvent {
	adventurerId: string;
	missionId: string;
}

export interface AdventurerGainedXPEvent {
	adventurerId: string;
	amount: number;
	newTotalXP: number;
}

export interface AdventurerLeveledUpEvent {
	adventurerId: string;
	newLevel: number;
	abilityMods: Record<string, number>;
}

export interface ResourcesChangedEvent {
	delta: ResourceMap;
	current: ResourceMap;
}

export interface CommandFailedEvent {
	commandType: string;
	reason: string;
}

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

