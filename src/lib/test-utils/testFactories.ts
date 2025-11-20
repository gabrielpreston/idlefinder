/**
 * Test Factories - Fast factories for creating test data
 * Updated for GameState and new entity structure
 */

import type { GameState } from '../domain/entities/GameState';
import { GameState as GameStateImpl } from '../domain/entities/GameState';
import { createInitialGameState } from '../domain/entities/GameStateFactory';
import type { Command, CommandPayload } from '../bus/types';
import { Adventurer as AdventurerEntity } from '../domain/entities/Adventurer';
import { Mission as MissionEntity } from '../domain/entities/Mission';
import { Facility as FacilityEntity } from '../domain/entities/Facility';
import { Identifier } from '../domain/valueObjects/Identifier';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import { Duration } from '../domain/valueObjects/Duration';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../domain/valueObjects/ResourceUnit';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import type { AdventurerAttributes } from '../domain/attributes/AdventurerAttributes';
import type { MissionAttributes } from '../domain/attributes/MissionAttributes';
import type { FacilityAttributes } from '../domain/attributes/FacilityAttributes';
import { setTimer } from '../domain/primitives/TimerHelpers';
import { deriveRoleKey } from '../domain/attributes/RoleKey';

// ============================================================================
// GameState Factories
// ============================================================================

/**
 * Create test GameState with optional overrides
 * Fast: Instant creation, no I/O
 */
export function createTestGameState(overrides?: {
	playerId?: string;
	entities?: Map<string, import('../domain/primitives/Requirement').Entity>;
	resources?: ResourceBundle;
}): GameState {
	// Use Timestamp.now() in test utilities (acceptable for test code)
	const base = createInitialGameState(
		overrides?.playerId || 'test-player',
		Timestamp.now()
	);
	
	// Default test state includes enough gold for common operations (e.g., recruiting adventurers costs 50)
	// If resources are not explicitly overridden, add enough gold for testing
	const defaultResources = overrides?.resources ?? createTestResourceBundle({ gold: 1000 });
	
	return new GameStateImpl(
		overrides?.playerId || base.playerId,
		base.lastPlayed,
		overrides?.entities || base.entities,
		defaultResources
	);
}

/**
 * Create test Adventurer entity with optional overrides
 */
export function createTestAdventurer(overrides?: {
	id?: string;
	name?: string;
	level?: number;
	xp?: number;
	tags?: string[];
	state?: 'Idle' | 'OnMission' | 'Fatigued' | 'Recovering' | 'Dead';
}): AdventurerEntity {
	const id = Identifier.from<'AdventurerId'>(overrides?.id || crypto.randomUUID());
	// Use default Pathfinder class and ancestry (fighter, human) for test fixtures
	const classKey: string = 'fighter';
	const ancestryKey: string = 'human';
	const attributes: AdventurerAttributes = {
		level: overrides?.level ?? 1,
		xp: overrides?.xp ?? 0,
		abilityMods: NumericStatMap.fromMap(new Map([
			['str', 0],
			['dex', 0],
			['con', 0],
			['int', 0],
			['wis', 0],
			['cha', 0]
		])),
		classKey,
		ancestryKey,
		traitTags: [],
		roleKey: deriveRoleKey(classKey),
		baseHP: 10,
		assignedSlotId: null
	};
	
	return new AdventurerEntity(
		id,
		attributes,
		overrides?.tags || [],
		overrides?.state || 'Idle',
		{}, // timers (Record, not Map)
		{ name: overrides?.name || 'Test Adventurer' }
	);
}

/**
 * Create test Mission entity with optional overrides
 */
export function createTestMission(overrides?: {
	id?: string;
	name?: string;
	difficultyTier?: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
	baseDuration?: Duration;
	state?: 'Available' | 'InProgress' | 'Completed' | 'Expired';
	startedAt?: Timestamp;
	endsAt?: Timestamp;
}): MissionEntity {
	const id = Identifier.from<'MissionId'>(overrides?.id || crypto.randomUUID());
	const difficultyTier = overrides?.difficultyTier || 'Easy';
	const dcMap: Record<string, number> = { Easy: 10, Medium: 15, Hard: 20, Legendary: 25 };
	const attributes: MissionAttributes = {
		missionType: 'combat',
		primaryAbility: 'str',
		dc: dcMap[difficultyTier] || 15,
		difficultyTier,
		preferredRole: undefined,
		baseDuration: overrides?.baseDuration || Duration.ofSeconds(60),
		baseRewards: { gold: 50, xp: 10 },
		maxPartySize: 1
	};
	
	const timers: Record<string, number | null> = {};
	const mission = new MissionEntity(
		id,
		attributes,
		[],
		overrides?.state || 'Available',
		timers,
		{ name: overrides?.name || 'Test Mission' }
	);
	
	// Set timers using helper function
	if (overrides?.startedAt) {
		setTimer(mission, 'startedAt', overrides.startedAt);
	}
	if (overrides?.endsAt) {
		setTimer(mission, 'endsAt', overrides.endsAt);
	}
	
	return mission;
}

/**
 * Create test Facility entity with optional overrides
 */
export function createTestFacility(overrides?: {
	id?: string;
	facilityType?: 'Guildhall' | 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot';
	tier?: number;
	name?: string;
}): FacilityEntity {
	const id = Identifier.from<'FacilityId'>(overrides?.id || crypto.randomUUID());
	const attributes: FacilityAttributes = {
		facilityType: overrides?.facilityType || 'Guildhall',
		tier: overrides?.tier ?? 1, // Use ?? instead of || to allow tier 0
		baseCapacity: 1,
		bonusMultipliers: {}
	};
	
	return new FacilityEntity(
		id,
		attributes,
		[],
		'Online',
		{}, // timers (Record, not Map)
		{ name: overrides?.name || 'Test Facility' }
	);
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
// Value Object Helpers
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
// ResourceBundle Helpers
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

