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

