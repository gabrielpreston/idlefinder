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
	entityExistsCondition,
	fameMilestoneCondition,
} from '../conditions/GateConditions';

/**
 * Register all game gates
 */
export function registerGameGates(): void {
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
				entityExistsCondition(
					'Facility',
					'TrainingGrounds',
					'Training Grounds facility exists'
				),
			],
			metadata: {
				icon: 'building',
				category: 'ui',
			},
		},

		// Mission Tier Gates
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

		// Facility Tier Gates
		{
			id: 'facility_tier_2',
			type: 'facility_tier',
			name: 'Facility Tier 2',
			description: 'Unlock ability to upgrade facilities to Tier 2',
			conditions: [fameMilestoneCondition(100, 'Fame 100+')],
		},
		{
			id: 'facility_tier_3',
			type: 'facility_tier',
			name: 'Facility Tier 3',
			description: 'Unlock ability to upgrade facilities to Tier 3',
			conditions: [fameMilestoneCondition(500, 'Fame 500+')],
		},
		{
			id: 'facility_tier_4',
			type: 'facility_tier',
			name: 'Facility Tier 4',
			description: 'Unlock ability to upgrade facilities to Tier 4',
			conditions: [fameMilestoneCondition(2000, 'Fame 2000+')],
		},
		{
			id: 'facility_tier_5',
			type: 'facility_tier',
			name: 'Facility Tier 5',
			description: 'Unlock ability to upgrade facilities to Tier 5',
			conditions: [fameMilestoneCondition(10000, 'Fame 10000+')],
		},

		// Resource Slot Gates
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

