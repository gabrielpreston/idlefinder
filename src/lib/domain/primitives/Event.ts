/**
 * Domain Events - Domain primitives describing what happened
 * Per Systems Primitives Spec section 9: Events are domain primitives (data structures), not infrastructure.
 * The DomainEventBus (infrastructure) publishes these event payloads to subscribers.
 * 
 * Domain systems generate Events; infrastructure (DomainEventBus) transports them.
 */

/**
 * Domain Event Type - all possible event types
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

/**
 * Resource Map - used in events
 */
export interface ResourceMap {
	gold: number;
	supplies: number;
	relics: number;
}

/**
 * Domain Event Payload Types
 */
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
 * Domain Event - immutable fact about state changes
 * Per spec: Events are read-only facts that report what Effects already did.
 */
export interface DomainEvent {
	type: DomainEventType;
	payload: DomainEventPayload;
	timestamp: string; // ISO 8601 UTC
	metadata?: {
		correlationId?: string;
		userId?: string;
		[key: string]: unknown;
	};
}

