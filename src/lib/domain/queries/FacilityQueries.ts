/**
 * Facility Queries
 * 
 * Queries for facility-specific information, particularly guildhall tier and facility existence.
 */

import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import { EntityQueryBuilder } from './EntityQueryBuilder';

/**
 * Get guildhall tier
 * 
 * @param state GameState
 * @returns Guildhall tier, or 0 if guildhall not found
 */
export function getGuildHallTier(state: GameState): number {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	const guildhall = facilities.find(f => f.attributes.facilityType === 'Guildhall');
	return guildhall?.attributes.tier ?? 0;
}

/**
 * Check if guildhall is ruined (Tier 0)
 * 
 * @param state GameState
 * @returns True if guildhall tier is 0
 */
export function isGuildHallRuined(state: GameState): boolean {
	return getGuildHallTier(state) === 0;
}

/**
 * Get guildhall facility
 * 
 * @param state GameState
 * @returns Guildhall facility, or undefined if not found
 */
export function getGuildHall(state: GameState): Facility | undefined {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	return facilities.find(f => f.attributes.facilityType === 'Guildhall');
}

/**
 * Check if a facility type exists
 * 
 * @param facilityType Facility type to check
 * @param state GameState
 * @returns True if at least one facility of the specified type exists
 */
export function hasFacility(facilityType: string, state: GameState): boolean {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	return facilities.some(f => f.attributes.facilityType === facilityType);
}

/**
 * Get all facilities of a specific type
 * 
 * @param facilityType Facility type to filter by
 * @param state GameState
 * @returns Array of facilities of the specified type
 */
export function getFacilitiesByType(facilityType: string, state: GameState): Facility[] {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	return facilities.filter(f => f.attributes.facilityType === facilityType);
}

/**
 * Get facility counts by type
 * 
 * @param state GameState
 * @returns Record mapping facility type to count
 */
export function getFacilityCounts(state: GameState): Record<string, number> {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	const counts: Record<string, number> = {};
	
	for (const facility of facilities) {
		const type = facility.attributes.facilityType;
		counts[type] = (counts[type] || 0) + 1;
	}
	
	return counts;
}

