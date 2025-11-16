/**
 * Test Factories - Fast factories for creating test data
 * Matches existing pattern: inline factories in test files
 */

import type {
	PlayerState,
	Adventurer,
	Mission,
	Reward
} from '../domain/entities/PlayerState';
import { createInitialPlayerState } from '../domain/entities/PlayerState';
import type { Command, CommandPayload } from '../bus/types';

// Domain entities
import { Organization } from '../domain/entities/Organization';
import { TaskInstance } from '../domain/entities/TaskInstance';
import { AgentInstance } from '../domain/entities/AgentInstance';
import { TaskArchetype } from '../domain/entities/TaskArchetype';
import { FacilityInstance } from '../domain/entities/FacilityInstance';
import { AgentTemplate } from '../domain/entities/AgentTemplate';
import { TaskOffer } from '../domain/entities/TaskOffer';
import { ProgressTrack } from '../domain/entities/ProgressTrack';
import { FacilityTemplate } from '../domain/entities/FacilityTemplate';

// Value objects
import { Identifier } from '../domain/valueObjects/Identifier';
import type {
	OrganizationId,
	PlayerId,
	TaskInstanceId,
	AgentId,
	TaskArchetypeId,
	FacilityInstanceId,
	FacilityTemplateId,
	AgentTemplateId,
	TaskOfferId,
	ProgressTrackId
} from '../domain/valueObjects/Identifier';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import { Duration } from '../domain/valueObjects/Duration';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../domain/valueObjects/ResourceUnit';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import type { StatKey } from '../domain/valueObjects/NumericStatMap';
import type { TaskStatus, OutcomeCategory } from '../domain/entities/TaskInstance';
import type { AgentStatus } from '../domain/entities/AgentInstance';
import type { FacilityTierConfig } from '../domain/entities/FacilityTemplate';

/**
 * Create test PlayerState with optional overrides
 * Fast: Instant creation, no I/O
 */
export function createTestPlayerState(overrides?: Partial<PlayerState>): PlayerState {
	const base = createInitialPlayerState('test-player');
	return {
		...base,
		...overrides
	};
}

/**
 * Create test Adventurer with optional overrides
 */
export function createTestAdventurer(overrides?: Partial<Adventurer>): Adventurer {
	return {
		id: crypto.randomUUID(),
		name: 'Test Adventurer',
		level: 1,
		experience: 0,
		traits: [],
		status: 'idle',
		assignedMissionId: null,
		...overrides
	};
}

/**
 * Create test Mission with optional overrides
 */
export function createTestMission(overrides?: Partial<Mission>): Mission {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name: 'Test Mission',
		duration: 60000, // 1 minute
		startTime: now,
		assignedAdventurerIds: [],
		reward: {
			resources: { gold: 50, supplies: 10, relics: 0 },
			fame: 1,
			experience: 10
		},
		status: 'inProgress',
		...overrides
	};
}

/**
 * Create test Reward with optional overrides
 */
export function createTestReward(overrides?: Partial<Reward>): Reward {
	return {
		resources: { gold: 50, supplies: 10, relics: 0 },
		fame: 1,
		experience: 10,
		...overrides
	};
}

/**
 * Create test Command with type and payload
 */
export function createTestCommand<T extends CommandPayload>(
	type: Command['type'],
	payload: T
): Command {
	return {
		type,
		payload,
		timestamp: new Date().toISOString(),
		metadata: {}
	};
}

// ============================================================================
// Value Object Helpers (Phase 4)
// ============================================================================

/**
 * Create test Timestamp with optional offset
 */
export function createTestTimestamp(offsetMinutes: number = 0): Timestamp {
	return Timestamp.now().add(Duration.ofMinutes(offsetMinutes));
}

/**
 * Create test Duration from minutes
 */
export function createTestDuration(minutes: number): Duration {
	return Duration.ofMinutes(minutes);
}

// ============================================================================
// ResourceBundle Helpers (Phase 2)
// ============================================================================

/**
 * Create test ResourceBundle from record of resource types/amounts
 */
export function createTestResourceBundle(amounts: Record<string, number> = { gold: 0 }): ResourceBundle {
	const units = Object.entries(amounts).map(([type, amount]) => 
		new ResourceUnit(type, amount)
	);
	return ResourceBundle.fromArray(units);
}

/**
 * Create test ResourceBundle with gold only
 */
export function createTestGold(amount: number): ResourceBundle {
	return createTestResourceBundle({ gold: amount });
}

// ============================================================================
// Domain Entity Factories (Phase 1)
// ============================================================================

/**
 * Create test Organization with optional overrides
 */
export function createTestOrganization(overrides?: {
	id?: OrganizationId;
	ownerPlayerId?: PlayerId;
	createdAt?: Timestamp;
	lastActiveAt?: Timestamp;
	progressTracks?: Map<string, ProgressTrack>;
	economyState?: { wallet: ResourceBundle | null };
	lastSimulatedAt?: Timestamp;
}): Organization {
	const id = overrides?.id ?? Identifier.generate();
	const ownerPlayerId = overrides?.ownerPlayerId ?? Identifier.generate();
	const createdAt = overrides?.createdAt ?? Timestamp.now();
	const lastActiveAt = overrides?.lastActiveAt ?? createdAt;
	const progressTracks = overrides?.progressTracks ?? new Map();
	const wallet = overrides?.economyState?.wallet !== undefined
		? overrides.economyState.wallet
		: createTestGold(100);
	const lastSimulatedAt = overrides?.lastSimulatedAt ?? createdAt;

	return new Organization(
		id,
		ownerPlayerId,
		createdAt,
		lastActiveAt,
		progressTracks,
		{ wallet: wallet as ResourceBundle },
		lastSimulatedAt
	);
}

/**
 * Create test TaskInstance with optional overrides
 */
export function createTestTaskInstance(overrides?: {
	id?: TaskInstanceId;
	organizationId?: OrganizationId;
	taskArchetypeId?: TaskArchetypeId;
	startedAt?: Timestamp;
	expectedCompletionAt?: Timestamp;
	status?: TaskStatus;
	originOfferId?: TaskOfferId;
	assignedAgentIds?: AgentId[];
	completedAt?: Timestamp;
	outcomeCategory?: OutcomeCategory;
	outcomeDetails?: unknown;
}): TaskInstance {
	const id = overrides?.id ?? Identifier.generate();
	const organizationId = overrides?.organizationId ?? Identifier.generate();
	const taskArchetypeId = overrides?.taskArchetypeId ?? Identifier.generate();
	const startedAt = overrides?.startedAt ?? Timestamp.now();
	const expectedCompletionAt = overrides?.expectedCompletionAt ?? startedAt.add(Duration.ofMinutes(5));
	const status = overrides?.status ?? 'IN_PROGRESS';

	return new TaskInstance(
		id,
		organizationId,
		taskArchetypeId,
		startedAt,
		expectedCompletionAt,
		status,
		overrides?.originOfferId,
		overrides?.assignedAgentIds ?? [],
		overrides?.completedAt,
		overrides?.outcomeCategory,
		overrides?.outcomeDetails
	);
}

/**
 * Create test AgentInstance with optional overrides
 */
export function createTestAgentInstance(overrides?: {
	id?: AgentId;
	organizationId?: OrganizationId;
	templateId?: AgentTemplateId;
	level?: number;
	experience?: number;
	effectiveStats?: NumericStatMap;
	status?: AgentStatus;
	currentTaskId?: TaskInstanceId;
}): AgentInstance {
	const id = overrides?.id ?? Identifier.generate();
	const organizationId = overrides?.organizationId ?? Identifier.generate();
	const templateId = overrides?.templateId ?? Identifier.generate();
	const level = overrides?.level ?? 1;
	const experience = overrides?.experience ?? 0;
	const effectiveStats = overrides?.effectiveStats ?? NumericStatMap.fromMap(new Map([['strength', 10]]));
	const status = overrides?.status ?? 'IDLE';

	return new AgentInstance(
		id,
		organizationId,
		templateId,
		level,
		experience,
		effectiveStats,
		status,
		overrides?.currentTaskId
	);
}

/**
 * Create test TaskArchetype with optional overrides
 */
export function createTestTaskArchetype(overrides?: {
	id?: TaskArchetypeId;
	category?: string;
	baseDuration?: Duration;
	minAgents?: number;
	maxAgents?: number;
	primaryStatKey?: StatKey;
	secondaryStatKeys?: StatKey[];
	entryCost?: ResourceBundle;
	baseReward?: ResourceBundle;
	requiredTrackThresholds?: Map<string, number>;
}): TaskArchetype {
	const id = overrides?.id ?? Identifier.generate();
	const category = overrides?.category ?? 'test-category';
	const baseDuration = overrides?.baseDuration ?? Duration.ofMinutes(5);
	const minAgents = overrides?.minAgents ?? 1;
	const maxAgents = overrides?.maxAgents ?? 3;
	const primaryStatKey = overrides?.primaryStatKey ?? 'strength';
	const secondaryStatKeys = overrides?.secondaryStatKeys ?? [];
	const entryCost = overrides?.entryCost ?? createTestGold(10);
	const baseReward = overrides?.baseReward ?? createTestGold(50);
	const requiredTrackThresholds = overrides?.requiredTrackThresholds ?? new Map();

	return new TaskArchetype(
		id,
		category,
		baseDuration,
		minAgents,
		maxAgents,
		primaryStatKey,
		secondaryStatKeys,
		entryCost,
		baseReward,
		requiredTrackThresholds
	);
}

/**
 * Create test FacilityInstance with optional overrides
 */
export function createTestFacilityInstance(overrides?: {
	id?: FacilityInstanceId;
	organizationId?: OrganizationId;
	facilityTemplateId?: FacilityTemplateId;
	currentTier?: number;
	constructedAt?: Timestamp;
	lastUpgradeAt?: Timestamp;
}): FacilityInstance {
	const id = overrides?.id ?? Identifier.generate();
	const organizationId = overrides?.organizationId ?? Identifier.generate();
	const facilityTemplateId = overrides?.facilityTemplateId ?? Identifier.generate();
	const currentTier = overrides?.currentTier ?? 1;
	const constructedAt = overrides?.constructedAt ?? Timestamp.now();
	const lastUpgradeAt = overrides?.lastUpgradeAt ?? constructedAt;

	return new FacilityInstance(
		id,
		organizationId,
		facilityTemplateId,
		currentTier,
		constructedAt,
		lastUpgradeAt
	);
}

/**
 * Create test AgentTemplate with optional overrides
 */
export function createTestAgentTemplate(overrides?: {
	id?: AgentTemplateId;
	baseStats?: NumericStatMap;
	growthProfile?: Map<number, NumericStatMap>;
	tags?: string[];
}): AgentTemplate {
	const id = overrides?.id ?? Identifier.generate();
	const baseStats = overrides?.baseStats ?? NumericStatMap.fromMap(
		new Map([
			['strength', 10],
			['agility', 5]
		])
	);
	const growthProfile = overrides?.growthProfile ?? new Map();
	const tags = overrides?.tags ?? [];

	return new AgentTemplate(id, baseStats, growthProfile, tags);
}

/**
 * Create test TaskOffer with optional overrides
 */
export function createTestTaskOffer(overrides?: {
	id?: TaskOfferId;
	organizationId?: OrganizationId;
	taskArchetypeId?: TaskArchetypeId;
	createdAt?: Timestamp;
	expiresAt?: Timestamp;
	isTaken?: boolean;
	assignedTaskInstanceId?: TaskInstanceId;
}): TaskOffer {
	const id = overrides?.id ?? Identifier.generate();
	const organizationId = overrides?.organizationId ?? Identifier.generate();
	const taskArchetypeId = overrides?.taskArchetypeId ?? Identifier.generate();
	const createdAt = overrides?.createdAt ?? Timestamp.now();
	const expiresAt = overrides?.expiresAt; // undefined by default

	return new TaskOffer(
		id,
		organizationId,
		taskArchetypeId,
		createdAt,
		expiresAt,
		overrides?.isTaken ?? false,
		overrides?.assignedTaskInstanceId
	);
}

/**
 * Create test ProgressTrack with optional overrides
 */
export function createTestProgressTrack(overrides?: {
	id?: ProgressTrackId;
	ownerOrganizationId?: OrganizationId;
	trackKey?: string;
	currentValue?: number;
}): ProgressTrack {
	const id = overrides?.id ?? Identifier.generate();
	const ownerOrganizationId = overrides?.ownerOrganizationId ?? Identifier.generate();
	const trackKey = overrides?.trackKey ?? 'test-track';
	const currentValue = overrides?.currentValue ?? 0;

	return new ProgressTrack(id, ownerOrganizationId, trackKey, currentValue);
}

/**
 * Create test FacilityTemplate with optional overrides
 */
export function createTestFacilityTemplate(overrides?: {
	id?: FacilityTemplateId;
	typeKey?: string;
	tierConfigs?: Map<number, FacilityTierConfig>;
}): FacilityTemplate {
	const id = overrides?.id ?? Identifier.generate();
	const typeKey = overrides?.typeKey ?? 'workshop';
	const tierConfigs = overrides?.tierConfigs ?? new Map([
		[1, {
			buildCost: createTestGold(100),
			requiredTracks: new Map<string, number>(),
			effects: []
		}]
	]);

	return new FacilityTemplate(id, typeKey, tierConfigs);
}

