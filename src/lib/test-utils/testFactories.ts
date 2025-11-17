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
	const base = createInitialGameState(overrides?.playerId || 'test-player');
	
	if (overrides?.entities || overrides?.resources) {
		return new GameStateImpl(
			overrides?.playerId || base.playerId,
			base.lastPlayed,
			overrides?.entities || base.entities,
			overrides?.resources || base.resources
		);
	}
	
	return base;
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
	state?: 'Idle' | 'OnMission' | 'Recovering' | 'Dead';
}): AdventurerEntity {
	const id = Identifier.from<'AdventurerId'>(overrides?.id || crypto.randomUUID());
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
		classKey: '',
		ancestryKey: '',
		roleTag: '',
		baseHP: 10
	};
	
	return new AdventurerEntity(
		id,
		attributes,
		overrides?.tags || [],
		overrides?.state || 'Idle',
		new Map(),
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
	const attributes: MissionAttributes = {
		difficultyTier: overrides?.difficultyTier || 'Easy',
		primaryAbility: 'str',
		baseDuration: overrides?.baseDuration || Duration.ofSeconds(60),
		baseRewards: { gold: 50, xp: 10 },
		maxPartySize: 1
	};
	
	const timers = new Map<string, Timestamp>();
	if (overrides?.startedAt) {
		timers.set('startedAt', overrides.startedAt);
	}
	if (overrides?.endsAt) {
		timers.set('endsAt', overrides.endsAt);
	}
	
	return new MissionEntity(
		id,
		attributes,
		[],
		overrides?.state || 'Available',
		timers,
		{ name: overrides?.name || 'Test Mission' }
	);
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
		tier: overrides?.tier || 1,
		baseCapacity: 1,
		bonusMultipliers: {}
	};
	
	return new FacilityEntity(
		id,
		attributes,
		[],
		'Online',
		new Map(),
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

// ============================================================================
// Legacy PlayerState Support (for migration period)
// ============================================================================

/**
 * @deprecated Use createTestGameState instead
 * Create test PlayerState with optional overrides
 * Kept for backward compatibility during migration
 */
export function createTestPlayerState(overrides?: Partial<import('../domain/entities/PlayerState').PlayerState>): import('../domain/entities/PlayerState').PlayerState {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { createInitialPlayerState } = require('../domain/entities/PlayerState');
	const base = createInitialPlayerState('test-player');
	return {
		...base,
		...overrides
	};
}

// Legacy types for backward compatibility
export type Adventurer = import('../domain/entities/PlayerState').Adventurer;
export type Mission = import('../domain/entities/PlayerState').Mission;
export type Reward = import('../domain/entities/PlayerState').Reward;
