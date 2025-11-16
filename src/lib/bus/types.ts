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
	| 'AdventurerRecruited'
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
	| AdventurerRecruitedEvent
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
	reward: {
		resources: ResourceMap;
		fame: number;
		experience: number;
	};
}

export interface AdventurerRecruitedEvent {
	adventurerId: string;
	name: string;
	traits: string[];
}

export interface FacilityUpgradedEvent {
	facility: string;
	newLevel: number;
	effects: string[];
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

