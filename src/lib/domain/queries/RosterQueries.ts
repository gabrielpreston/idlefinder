/**
 * Roster Capacity Queries
 * 
 * Queries for roster capacity, size, and recruitment availability.
 * Base capacity from unlocked roster capacity gates.
 * Dormitory provides tier bonuses on top of base capacity.
 */

import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import type { Adventurer } from '../entities/Adventurer';
import type { Item } from '../entities/Item';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { CapacityQueryBuilder } from './CapacityQueryBuilder';
import type { Capacity } from './Capacity';
import type { NumericStatMap } from '../valueObjects/NumericStatMap';
import { getGatesByType } from '../gating/GateQueries';
import { GameConfig } from '../config/GameConfig';

/**
 * Get maximum roster capacity
 * 
 * Base capacity: Count of unlocked roster capacity gates
 * Dormitory bonus: Additional capacity from Dormitory tier bonuses
 * 
 * Follows MissionSlotQueries pattern: base + facility tier bonuses
 * 
 * @param state GameState
 * @returns Maximum roster size
 */
export function getMaxRosterCapacity(state: GameState): number {
	// Count unlocked roster capacity gates (base capacity)
	const rosterCapacityGates = getGatesByType('custom', state)
		.filter(({ gate, status }) => 
			gate.metadata && gate.metadata.tags && gate.metadata.tags.includes('roster') && 
			gate.metadata.tags.includes('capacity') &&
			status.unlocked
		);
	
	let maxCapacity = rosterCapacityGates.length;
	
	// Add Dormitory tier bonuses (just the bonus, like MissionSlotQueries does)
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	
	for (const facility of facilities) {
		if (facility.attributes.facilityType === 'Dormitory') {
			// Add tier bonus only (not full effect which includes baseCapacity)
			// Per MissionSlotQueries pattern: "Base capacity is X, plus facility tier bonuses"
			maxCapacity += GameConfig.facilityScaling.dormitoryRosterBonus(facility.attributes.tier);
		}
	}
	
	return maxCapacity;
}

/**
 * Get current roster size
 * 
 * @param state GameState
 * @returns Number of Adventurer entities
 */
export function getCurrentRosterSize(state: GameState): number {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.filter(a => a.state !== 'Preview').length;
}

/**
 * Check if recruitment is possible
 * 
 * @param state GameState
 * @returns True if roster has available slots for recruitment
 */
export function canRecruit(state: GameState): boolean {
	const max = getMaxRosterCapacity(state);
	const current = getCurrentRosterSize(state);
	return current < max;
}

/**
 * Get available roster slots
 * 
 * @param state GameState
 * @returns Number of available roster slots (max - current)
 */
export function getAvailableRosterSlots(state: GameState): number {
	const max = getMaxRosterCapacity(state);
	const current = getCurrentRosterSize(state);
	return Math.max(0, max - current);
}

/**
 * Get roster capacity information
 * 
 * @param state GameState
 * @returns Capacity object with current, max, available, and utilization
 */
export function getRosterCapacity(state: GameState): Capacity {
	return CapacityQueryBuilder.create(
		getMaxRosterCapacity,
		getCurrentRosterSize
	)(state);
}

/**
 * Type definitions for roster analytics
 */
export interface RoleDistribution {
	[roleKey: string]: number;
}

export interface StatusSummary {
	[state: string]: number;
}

export interface XPProgress {
	current: number;
	threshold: number;
	progress: number;
	remaining: number;
}

/**
 * Get role distribution across roster
 * 
 * @param state GameState
 * @returns Object mapping roleKey to count
 */
export function getRosterRoleDistribution(state: GameState): RoleDistribution {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	const distribution: RoleDistribution = {};
	
	for (const adventurer of adventurers) {
		// Exclude Preview entities from role distribution
		if (adventurer.state === 'Preview') continue;
		const roleKey = adventurer.attributes.roleKey;
		distribution[roleKey] = (distribution[roleKey] || 0) + 1;
	}
	
	return distribution;
}

/**
 * Get status summary across roster
 * 
 * @param state GameState
 * @returns Object mapping state to count
 */
export function getRosterStatusSummary(state: GameState): StatusSummary {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	const summary: StatusSummary = {};
	
	for (const adventurer of adventurers) {
		// Exclude Preview entities from status summary
		if (adventurer.state === 'Preview') continue;
		const stateKey = adventurer.state;
		summary[stateKey] = (summary[stateKey] || 0) + 1;
	}
	
	return summary;
}

/**
 * Get average level across roster
 * 
 * @param state GameState
 * @returns Average level (0 if no adventurers)
 */
export function getRosterAverageLevel(state: GameState): number {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state)
		.filter(a => a.state !== 'Preview'); // Exclude Preview entities
	
	if (adventurers.length === 0) {
		return 0;
	}
	
	const totalLevel = adventurers.reduce((sum, adventurer) => sum + adventurer.attributes.level, 0);
	return totalLevel / adventurers.length;
}

/**
 * Calculate XP threshold for a level
 * Simple progression: level * 100
 */
function xpThresholdFor(level: number): number {
	return level * 100;
}

/**
 * Get XP progress for an adventurer
 * 
 * @param adventurer Adventurer entity
 * @returns XP progress information
 */
export function getAdventurerXPProgress(adventurer: Adventurer): XPProgress {
	const current = adventurer.attributes.xp;
	const threshold = xpThresholdFor(adventurer.attributes.level);
	const progress = threshold > 0 ? Math.min(1, current / threshold) : 0;
	const remaining = Math.max(0, threshold - current);
	
	return {
		current,
		threshold,
		progress,
		remaining
	};
}

/**
 * Get effective stats for an adventurer (base stats + equipment bonuses)
 * 
 * @param adventurer Adventurer entity
 * @param state GameState (to look up items)
 * @returns Combined stats as NumericStatMap
 */
export function getAdventurerEffectiveStats(adventurer: Adventurer, state: GameState): NumericStatMap {
	// Start with base ability modifiers
	let effectiveStats = adventurer.attributes.abilityMods;
	
	// Get equipment IDs from adventurer
	const equipment = adventurer.attributes.equipment;
	if (!equipment) {
		return effectiveStats;
	}
	
	// Look up each equipped item and merge its stats
	const equipmentSlots: Array<'weaponId' | 'armorId' | 'offHandId' | 'accessoryId'> = [
		'weaponId',
		'armorId',
		'offHandId',
		'accessoryId'
	];
	
	for (const slotKey of equipmentSlots) {
		const itemId = equipment[slotKey];
		if (itemId) {
			const item = state.entities.get(itemId) as Item | undefined;
			if (item) {
				// Merge item stats into effective stats
				effectiveStats = effectiveStats.merge(item.attributes.stats);
			}
		}
	}
	
	return effectiveStats;
}

