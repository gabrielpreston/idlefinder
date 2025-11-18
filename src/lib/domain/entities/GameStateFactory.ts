/**
 * GameState Factory - Creates initial GameState
 * Replaces createInitialPlayerState for new entity-based architecture
 */

import { GameState } from './GameState';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Facility } from './Facility';
import { Identifier } from '../valueObjects/Identifier';
import type { FacilityAttributes } from '../attributes/FacilityAttributes';

/**
 * Create initial GameState with default facilities
 * @param playerId Player identifier
 * @param currentTime Current time (from DomainTimeSource) - required for determinism
 */
export function createInitialGameState(
	playerId: string,
	currentTime: Timestamp
): GameState {
	const lastPlayed = currentTime;
	
	// Create initial resources (100 gold)
	const resources = ResourceBundle.fromArray([
		new ResourceUnit('gold', 100),
		new ResourceUnit('fame', 0)
	]);

	// Create initial facilities
	const entities = new Map<string, import('../primitives/Requirement').Entity>();

	// Guildhall (basic mission board)
	const guildhallId = Identifier.from<'FacilityId'>('facility-guildhall-1');
	const guildhallAttributes: FacilityAttributes = {
		facilityType: 'Guildhall',
		tier: 1,
		baseCapacity: 1,
		bonusMultipliers: {}
	};
	const guildhall = new Facility(
		guildhallId,
		guildhallAttributes,
		['mission-control'],
		'Online',
		{}, // timers (Record, not Map)
		{ name: 'Guildhall' }
	);
	entities.set(guildhall.id, guildhall);

	// Dormitory (adventurer capacity)
	const dormitoryId = Identifier.from<'FacilityId'>('facility-dormitory-1');
	const dormitoryAttributes: FacilityAttributes = {
		facilityType: 'Dormitory',
		tier: 1,
		baseCapacity: 5, // Can hold 5 adventurers
		bonusMultipliers: {}
	};
	const dormitory = new Facility(
		dormitoryId,
		dormitoryAttributes,
		['storage'],
		'Online',
		{}, // timers (Record, not Map)
		{ name: 'Dormitory' }
	);
	entities.set(dormitory.id, dormitory);

	// Training Grounds (XP bonus)
	const trainingId = Identifier.from<'FacilityId'>('facility-training-1');
	const trainingAttributes: FacilityAttributes = {
		facilityType: 'TrainingGrounds',
		tier: 1,
		baseCapacity: 1,
		bonusMultipliers: { xp: 1.1 } // 10% XP bonus
	};
	const training = new Facility(
		trainingId,
		trainingAttributes,
		['training'],
		'Online',
		{}, // timers (Record, not Map)
		{ name: 'Training Grounds' }
	);
	entities.set(training.id, training);

	return new GameState(playerId, lastPlayed, entities, resources);
}

