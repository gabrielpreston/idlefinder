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
import { MissionDoctrine } from './MissionDoctrine';
import { AutoEquipRules } from './AutoEquipRules';
import { CraftingQueue } from './CraftingQueue';
import { ResourceSlot } from './ResourceSlot';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import { GameConfig } from '../config/GameConfig';
import { generateRecruitPool } from '../systems/RecruitPoolSystem';
import { generateMissionPool } from '../systems/MissionGenerationSystem';

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
	
	// Create initial resources (starting from nothing)
	const resources = ResourceBundle.fromArray([
		new ResourceUnit('gold', GameConfig.startingResources.gold),
		new ResourceUnit('fame', GameConfig.startingResources.fame)
	]);

	// Create initial facilities
	const entities = new Map<string, import('../primitives/Requirement').Entity>();

	// Guildhall (ruined, Tier 0 - starting from nothing)
	const guildhallId = Identifier.from<'FacilityId'>('facility-guildhall-1');
	const guildhallAttributes: FacilityAttributes = {
		facilityType: 'Guildhall',
		tier: 0,
		baseCapacity: GameConfig.resourceGeneration.initialBaseCapacity,
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

	// Create initial Gold Slot #1 (owned by Guildhall, player assigned)
	const goldSlotId = Identifier.from<'SlotId'>('slot-gold-1');
	const goldSlotAttributes: ResourceSlotAttributes = {
		facilityId: guildhall.id,
		resourceType: 'gold',
		baseRatePerMinute: GameConfig.resourceGeneration.initialGoldRatePerMinute,
		assigneeType: 'player',
		assigneeId: null,
		fractionalAccumulator: 0
	};
	const goldSlot = new ResourceSlot(
		goldSlotId,
		goldSlotAttributes,
		['slot:resource', 'slot:gold', 'facility:guildhall'],
		'occupied', // Player is assigned, so slot is occupied
		{ lastTickAt: currentTime.value }, // Store as milliseconds in timers Record
		{ displayName: 'Gold Generation Slot #1' }
	);
	entities.set(goldSlot.id, goldSlot);

	// Create default Mission Doctrine
	const doctrineId = Identifier.generate<'MissionDoctrineId'>();
	const doctrine = MissionDoctrine.createDefault(doctrineId);
	entities.set(doctrine.id, doctrine);

	// Create default Auto-Equip Rules
	const autoEquipRulesId = Identifier.generate<'AutoEquipRulesId'>();
	const autoEquipRules = AutoEquipRules.createDefault(autoEquipRulesId);
	entities.set(autoEquipRules.id, autoEquipRules);

	// Create default Crafting Queue
	const craftingQueueId = Identifier.generate<'CraftingQueueId'>();
	const craftingQueue = CraftingQueue.createDefault(craftingQueueId);
	entities.set(craftingQueue.id, craftingQueue);

	// Generate initial recruit pool (4 preview adventurers)
	const previewAdventurers = generateRecruitPool(4);
	for (const previewAdventurer of previewAdventurers) {
		entities.set(previewAdventurer.id, previewAdventurer);
	}

	// Generate initial mission pool (3 missions per unlocked tier)
	// Create temporary GameState to query unlocked tiers
	const tempState = new GameState(playerId, lastPlayed, entities, resources);
	const initialMissions = generateMissionPool(tempState, 3);
	for (const mission of initialMissions) {
		entities.set(mission.id, mission);
	}

	return new GameState(playerId, lastPlayed, entities, resources);
}

