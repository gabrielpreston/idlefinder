/**
 * Game Gates Configuration
 * 
 * Defines all MVP gates for the game.
 * Uses condition factories to create reusable gate definitions.
 */

import type { GateDefinition } from '../GateDefinition';
import { gateRegistry } from '../GateRegistry';
import {
	entityTierCondition,
	fameMilestoneCondition,
	entityExistsCondition,
} from '../conditions/GateConditions';

/**
 * Register all game gates
 * In development, clear registry first to handle HMR reloads
 */
export function registerGameGates(): void {
	// In development with HMR, gates may already be registered
	// Clear registry first to allow re-registration
	const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
	if (isDev) {
		gateRegistry.clear();
	}
	
	const gates: GateDefinition[] = [
		// UI Panel Gates
		{
			id: 'ui_panel_adventurers',
			type: 'ui_panel',
			name: 'Adventurers Panel',
			description: 'Unlock the Roster panel to recruit adventurers',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					1,
					'Guild Hall at Tier 1+'
				),
			],
			metadata: {
				icon: 'users',
				category: 'ui',
			},
		},
		{
			id: 'ui_panel_missions',
			type: 'ui_panel',
			name: 'Missions Panel',
			description:
				'Unlock the Missions panel to send adventurers on missions',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					1,
					'Guild Hall at Tier 1+'
				),
			],
			metadata: {
				icon: 'map',
				category: 'ui',
			},
		},
		{
			id: 'ui_panel_facilities',
			type: 'ui_panel',
			name: 'Facilities Panel',
			description: 'Unlock the Facilities panel to manage your base',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					0,
					'Guild Hall at Tier 0+'
				),
			],
			metadata: {
				icon: 'building',
				category: 'ui',
			},
		},
		{
			id: 'ui_panel_equipment',
			type: 'ui_panel',
			name: 'Equipment Panel',
			description: 'Unlock the Equipment panel to manage gear',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					2,
					'Guild Hall at Tier 2+'
				),
			],
			metadata: {
				icon: 'sword',
				category: 'ui',
			},
		},
		{
			id: 'ui_panel_crafting',
			type: 'ui_panel',
			name: 'Crafting Panel',
			description: 'Unlock the Crafting panel to create items',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					3,
					'Guild Hall at Tier 3+'
				),
			],
			metadata: {
				icon: 'hammer',
				category: 'ui',
			},
		},
		{
			id: 'ui_panel_doctrine',
			type: 'ui_panel',
			name: 'Doctrine Panel',
			description: 'Unlock the Doctrine panel to configure mission strategy',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					4,
					'Guild Hall at Tier 4+'
				),
			],
			metadata: {
				icon: 'book',
				category: 'ui',
			},
		},

		// Mission Tier Gates
		{
			id: 'mission_tier_0',
			type: 'mission_tier',
			name: 'Mission Tier 0',
			description: 'Unlock Tier 0 missions (starter missions)',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
		},
		{
			id: 'mission_tier_1',
			type: 'mission_tier',
			name: 'Mission Tier 1',
			description: 'Unlock Tier 1 missions',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
		},
		{
			id: 'mission_tier_2',
			type: 'mission_tier',
			name: 'Mission Tier 2',
			description: 'Unlock Tier 2 missions',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
		},
		{
			id: 'mission_tier_3',
			type: 'mission_tier',
			name: 'Mission Tier 3',
			description: 'Unlock Tier 3 missions',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
		},
		{
			id: 'mission_tier_4',
			type: 'mission_tier',
			name: 'Mission Tier 4',
			description: 'Unlock Tier 4 missions',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
		},
		{
			id: 'mission_tier_5',
			type: 'mission_tier',
			name: 'Mission Tier 5',
			description: 'Unlock Tier 5 missions',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
		},

		// ============================================================================
		// FACILITY TIER GATES - GUILDHALL
		// ============================================================================
		{
			id: 'guildhall_tier_1',
			type: 'facility_tier',
			name: 'Guild Hall Tier 1',
			description: 'Unlock ability to upgrade Guild Hall to Tier 1',
			conditions: [], // Tier 1 is always available (starting tier is 0)
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['guildhall'],
			},
		},
		{
			id: 'guildhall_tier_2',
			type: 'facility_tier',
			name: 'Guild Hall Tier 2',
			description: 'Unlock ability to upgrade Guild Hall to Tier 2',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['guildhall'],
			},
		},
		{
			id: 'guildhall_tier_3',
			type: 'facility_tier',
			name: 'Guild Hall Tier 3',
			description: 'Unlock ability to upgrade Guild Hall to Tier 3',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['guildhall'],
			},
		},
		{
			id: 'guildhall_tier_4',
			type: 'facility_tier',
			name: 'Guild Hall Tier 4',
			description: 'Unlock ability to upgrade Guild Hall to Tier 4',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['guildhall'],
			},
		},
		{
			id: 'guildhall_tier_5',
			type: 'facility_tier',
			name: 'Guild Hall Tier 5',
			description: 'Unlock ability to upgrade Guild Hall to Tier 5',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['guildhall'],
			},
		},

		// ============================================================================
		// FACILITY TIER GATES - DORMITORY
		// ============================================================================
		{
			id: 'dormitory_tier_1',
			type: 'facility_tier',
			name: 'Dormitory Tier 1',
			description: 'Unlock ability to upgrade Dormitory to Tier 1',
			conditions: [], // Tier 1 is always available
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['dormitory'],
			},
		},
		{
			id: 'dormitory_tier_2',
			type: 'facility_tier',
			name: 'Dormitory Tier 2',
			description: 'Unlock ability to upgrade Dormitory to Tier 2',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['dormitory'],
			},
		},
		{
			id: 'dormitory_tier_3',
			type: 'facility_tier',
			name: 'Dormitory Tier 3',
			description: 'Unlock ability to upgrade Dormitory to Tier 3',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['dormitory'],
			},
		},
		{
			id: 'dormitory_tier_4',
			type: 'facility_tier',
			name: 'Dormitory Tier 4',
			description: 'Unlock ability to upgrade Dormitory to Tier 4',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['dormitory'],
			},
		},
		{
			id: 'dormitory_tier_5',
			type: 'facility_tier',
			name: 'Dormitory Tier 5',
			description: 'Unlock ability to upgrade Dormitory to Tier 5',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['dormitory'],
			},
		},

		// ============================================================================
		// FACILITY TIER GATES - MISSION COMMAND
		// ============================================================================
		{
			id: 'missioncommand_tier_1',
			type: 'facility_tier',
			name: 'Mission Command Tier 1',
			description: 'Unlock ability to upgrade Mission Command to Tier 1',
			conditions: [], // Tier 1 is always available
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['missioncommand'],
			},
		},
		{
			id: 'missioncommand_tier_2',
			type: 'facility_tier',
			name: 'Mission Command Tier 2',
			description: 'Unlock ability to upgrade Mission Command to Tier 2',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['missioncommand'],
			},
		},
		{
			id: 'missioncommand_tier_3',
			type: 'facility_tier',
			name: 'Mission Command Tier 3',
			description: 'Unlock ability to upgrade Mission Command to Tier 3',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['missioncommand'],
			},
		},
		{
			id: 'missioncommand_tier_4',
			type: 'facility_tier',
			name: 'Mission Command Tier 4',
			description: 'Unlock ability to upgrade Mission Command to Tier 4',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['missioncommand'],
			},
		},
		{
			id: 'missioncommand_tier_5',
			type: 'facility_tier',
			name: 'Mission Command Tier 5',
			description: 'Unlock ability to upgrade Mission Command to Tier 5',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['missioncommand'],
			},
		},

		// ============================================================================
		// FACILITY TIER GATES - TRAINING GROUNDS
		// ============================================================================
		{
			id: 'traininggrounds_tier_1',
			type: 'facility_tier',
			name: 'Training Grounds Tier 1',
			description: 'Unlock ability to upgrade Training Grounds to Tier 1',
			conditions: [], // Tier 1 is always available
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['traininggrounds'],
			},
		},
		{
			id: 'traininggrounds_tier_2',
			type: 'facility_tier',
			name: 'Training Grounds Tier 2',
			description: 'Unlock ability to upgrade Training Grounds to Tier 2',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['traininggrounds'],
			},
		},
		{
			id: 'traininggrounds_tier_3',
			type: 'facility_tier',
			name: 'Training Grounds Tier 3',
			description: 'Unlock ability to upgrade Training Grounds to Tier 3',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['traininggrounds'],
			},
		},
		{
			id: 'traininggrounds_tier_4',
			type: 'facility_tier',
			name: 'Training Grounds Tier 4',
			description: 'Unlock ability to upgrade Training Grounds to Tier 4',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['traininggrounds'],
			},
		},
		{
			id: 'traininggrounds_tier_5',
			type: 'facility_tier',
			name: 'Training Grounds Tier 5',
			description: 'Unlock ability to upgrade Training Grounds to Tier 5',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['traininggrounds'],
			},
		},

		// ============================================================================
		// FACILITY TIER GATES - RESOURCE DEPOT
		// ============================================================================
		{
			id: 'resourcedepot_tier_1',
			type: 'facility_tier',
			name: 'Resource Depot Tier 1',
			description: 'Unlock ability to upgrade Resource Depot to Tier 1',
			conditions: [], // Tier 1 is always available
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['resourcedepot'],
			},
		},
		{
			id: 'resourcedepot_tier_2',
			type: 'facility_tier',
			name: 'Resource Depot Tier 2',
			description: 'Unlock ability to upgrade Resource Depot to Tier 2',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['resourcedepot'],
			},
		},
		{
			id: 'resourcedepot_tier_3',
			type: 'facility_tier',
			name: 'Resource Depot Tier 3',
			description: 'Unlock ability to upgrade Resource Depot to Tier 3',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['resourcedepot'],
			},
		},
		{
			id: 'resourcedepot_tier_4',
			type: 'facility_tier',
			name: 'Resource Depot Tier 4',
			description: 'Unlock ability to upgrade Resource Depot to Tier 4',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['resourcedepot'],
			},
		},
		{
			id: 'resourcedepot_tier_5',
			type: 'facility_tier',
			name: 'Resource Depot Tier 5',
			description: 'Unlock ability to upgrade Resource Depot to Tier 5',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['resourcedepot'],
			},
		},

		// ============================================================================
		// FACILITY CONSTRUCTION GATES
		// ============================================================================
		// Note: Guildhall is built at game start, so no construction gate needed
		{
			id: 'facility_build_dormitory',
			type: 'facility_build',
			name: 'Build Dormitory',
			description: 'Unlock ability to construct Dormitory facility',
			conditions: [], // Available from start (or set specific conditions)
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['dormitory', 'construction'],
			},
		},
		{
			id: 'facility_build_missioncommand',
			type: 'facility_build',
			name: 'Build Mission Command',
			description: 'Unlock ability to construct Mission Command facility',
			conditions: [], // Available from start (or set specific conditions)
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['missioncommand', 'construction'],
			},
		},
		{
			id: 'facility_build_traininggrounds',
			type: 'facility_build',
			name: 'Build Training Grounds',
			description: 'Unlock ability to construct Training Grounds facility',
			conditions: [], // Available from start (or set specific conditions)
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['traininggrounds', 'construction'],
			},
		},
		{
			id: 'facility_build_resourcedepot',
			type: 'facility_build',
			name: 'Build Resource Depot',
			description: 'Unlock ability to construct Resource Depot facility',
			conditions: [], // Available from start (or set specific conditions)
			metadata: {
				icon: 'building',
				category: 'facility',
				tags: ['resourcedepot', 'construction'],
			},
		},

		// ============================================================================
		// ROSTER CAPACITY GATES
		// ============================================================================
		{
			id: 'roster_capacity_1',
			type: 'custom',
			name: 'First Adventurer Slot',
			description: 'Unlock ability to recruit your first adventurer',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					1,
					'Guild Hall at Tier 1+'
				),
			],
			metadata: {
				icon: 'users',
				category: 'roster',
				tags: ['roster', 'capacity'],
			},
		},
		{
			id: 'roster_capacity_2',
			type: 'custom',
			name: 'Second Adventurer Slot',
			description: 'Unlock ability to recruit your second adventurer',
			conditions: [
				entityExistsCondition(
					'Facility',
					'Dormitory',
					'Dormitory facility built'
				),
			],
			metadata: {
				icon: 'users',
				category: 'roster',
				tags: ['roster', 'capacity'],
			},
		},

		// ============================================================================
		// CARAVAN TYPE GATES
		// ============================================================================
		{
			id: 'caravan_type_basic',
			type: 'caravan_type',
			name: 'Basic Caravan',
			description: 'Unlock Basic caravan type',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
			metadata: {
				icon: 'caravan',
				category: 'caravan',
			},
		},
		{
			id: 'caravan_type_trade',
			type: 'caravan_type',
			name: 'Trade Caravan',
			description: 'Unlock Trade caravan type',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
			metadata: {
				icon: 'caravan',
				category: 'caravan',
			},
		},
		{
			id: 'caravan_type_recruit',
			type: 'caravan_type',
			name: 'Recruit Caravan',
			description: 'Unlock Recruit caravan type',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'caravan',
				category: 'caravan',
			},
		},
		{
			id: 'caravan_type_mixed',
			type: 'caravan_type',
			name: 'Mixed Caravan',
			description: 'Unlock Mixed caravan type',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'caravan',
				category: 'caravan',
			},
		},
		{
			id: 'caravan_type_rare',
			type: 'caravan_type',
			name: 'Rare Caravan',
			description: 'Unlock Rare caravan type',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'caravan',
				category: 'caravan',
			},
		},
		{
			id: 'caravan_type_elite',
			type: 'caravan_type',
			name: 'Elite Caravan',
			description: 'Unlock Elite caravan type',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
			metadata: {
				icon: 'caravan',
				category: 'caravan',
			},
		},

		// ============================================================================
		// CRAFTING RECIPE GATES - COMMON (Fame 0+)
		// ============================================================================
		{
			id: 'crafting_recipe_common_weapon',
			type: 'crafting_recipe',
			name: 'Common Weapon Recipe',
			description: 'Unlock recipe to craft common weapons',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
			metadata: {
				icon: 'sword',
				category: 'crafting',
				tags: ['common', 'weapon'],
			},
		},
		{
			id: 'crafting_recipe_common_armor',
			type: 'crafting_recipe',
			name: 'Common Armor Recipe',
			description: 'Unlock recipe to craft common armor',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
			metadata: {
				icon: 'shield',
				category: 'crafting',
				tags: ['common', 'armor'],
			},
		},
		{
			id: 'crafting_recipe_common_offHand',
			type: 'crafting_recipe',
			name: 'Common Off-Hand Recipe',
			description: 'Unlock recipe to craft common off-hand items',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
			metadata: {
				icon: 'shield',
				category: 'crafting',
				tags: ['common', 'offhand'],
			},
		},
		{
			id: 'crafting_recipe_common_accessory',
			type: 'crafting_recipe',
			name: 'Common Accessory Recipe',
			description: 'Unlock recipe to craft common accessories',
			conditions: [fameMilestoneCondition(0, 'Fame 0+')],
			metadata: {
				icon: 'ring',
				category: 'crafting',
				tags: ['common', 'accessory'],
			},
		},

		// ============================================================================
		// CRAFTING RECIPE GATES - UNCOMMON (Fame 100+)
		// ============================================================================
		{
			id: 'crafting_recipe_uncommon_weapon',
			type: 'crafting_recipe',
			name: 'Uncommon Weapon Recipe',
			description: 'Unlock recipe to craft uncommon weapons',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'sword',
				category: 'crafting',
				tags: ['uncommon', 'weapon'],
			},
		},
		{
			id: 'crafting_recipe_uncommon_armor',
			type: 'crafting_recipe',
			name: 'Uncommon Armor Recipe',
			description: 'Unlock recipe to craft uncommon armor',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'shield',
				category: 'crafting',
				tags: ['uncommon', 'armor'],
			},
		},
		{
			id: 'crafting_recipe_uncommon_offHand',
			type: 'crafting_recipe',
			name: 'Uncommon Off-Hand Recipe',
			description: 'Unlock recipe to craft uncommon off-hand items',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'shield',
				category: 'crafting',
				tags: ['uncommon', 'offhand'],
			},
		},
		{
			id: 'crafting_recipe_uncommon_accessory',
			type: 'crafting_recipe',
			name: 'Uncommon Accessory Recipe',
			description: 'Unlock recipe to craft uncommon accessories',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
			metadata: {
				icon: 'ring',
				category: 'crafting',
				tags: ['uncommon', 'accessory'],
			},
		},

		// ============================================================================
		// CRAFTING RECIPE GATES - RARE (Fame 500+)
		// ============================================================================
		{
			id: 'crafting_recipe_rare_weapon',
			type: 'crafting_recipe',
			name: 'Rare Weapon Recipe',
			description: 'Unlock recipe to craft rare weapons',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'sword',
				category: 'crafting',
				tags: ['rare', 'weapon'],
			},
		},
		{
			id: 'crafting_recipe_rare_armor',
			type: 'crafting_recipe',
			name: 'Rare Armor Recipe',
			description: 'Unlock recipe to craft rare armor',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'shield',
				category: 'crafting',
				tags: ['rare', 'armor'],
			},
		},
		{
			id: 'crafting_recipe_rare_offHand',
			type: 'crafting_recipe',
			name: 'Rare Off-Hand Recipe',
			description: 'Unlock recipe to craft rare off-hand items',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'shield',
				category: 'crafting',
				tags: ['rare', 'offhand'],
			},
		},
		{
			id: 'crafting_recipe_rare_accessory',
			type: 'crafting_recipe',
			name: 'Rare Accessory Recipe',
			description: 'Unlock recipe to craft rare accessories',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
			metadata: {
				icon: 'ring',
				category: 'crafting',
				tags: ['rare', 'accessory'],
			},
		},

		// ============================================================================
		// RESOURCE SLOT GATES
		// ============================================================================
		{
			id: 'resource_slot_gold_2',
			type: 'resource_slot',
			name: 'Gold Slot #2',
			description: 'Unlock second gold generation slot',
			conditions: [
				entityTierCondition(
					'Facility',
					'Guildhall',
					2,
					'Guild Hall at Tier 2+'
				),
			],
		},
	];

	gateRegistry.registerAll(gates);
}

