/**
 * UpgradeFacility command handler
 * Matches design spec: docs/design/04-api-message-spec.md lines 68-76, 117-126
 */

import type { CommandHandler } from '../bus/CommandBus';
import type { UpgradeFacilityCommand, DomainEvent } from '../bus/types';
import type { PlayerState, FacilityMap } from '../domain/entities/PlayerState';
import { FacilitySystem } from '../domain/systems';

/**
 * Create UpgradeFacility command handler
 */
export function createUpgradeFacilityHandler(
	facilitySystem: FacilitySystem
): CommandHandler<UpgradeFacilityCommand, PlayerState> {
	return async (
		payload: UpgradeFacilityCommand,
		state: PlayerState
	): Promise<{ newState: PlayerState; events: DomainEvent[] }> => {
		// Validation: Check if facility is valid
		const validFacilities: (keyof FacilityMap)[] = ['tavern', 'guildHall', 'blacksmith'];
		if (!validFacilities.includes(payload.facility as keyof FacilityMap)) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpgradeFacility',
							reason: `Invalid facility: ${payload.facility}`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		const facility = payload.facility as keyof FacilityMap;

		// Validation: Check if facility can be upgraded
		if (!facilitySystem.canUpgrade(state, facility)) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpgradeFacility',
							reason: `Facility ${facility} cannot be upgraded further`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Validation: Check if organization can afford upgrade cost
		const currentLevel = state.facilities[facility].level;
		const cost = facilitySystem.getUpgradeCost(facility, currentLevel);

		if (
			state.resources.gold < cost.gold ||
			state.resources.supplies < cost.supplies ||
			state.resources.relics < cost.relics
		) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpgradeFacility',
							reason: 'Insufficient resources for upgrade'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Upgrade facility
		const newState = facilitySystem.upgrade(state, facility);

		// Apply costs
		const updatedState: PlayerState = {
			...newState,
			resources: {
				gold: newState.resources.gold - cost.gold,
				supplies: newState.resources.supplies - cost.supplies,
				relics: newState.resources.relics - cost.relics
			}
		};

		const upgradedFacility = updatedState.facilities[facility];

		// Emit FacilityUpgraded event
		const facilityUpgradedEvent: DomainEvent = {
			type: 'FacilityUpgraded',
			payload: {
				facility: payload.facility,
				newLevel: upgradedFacility.level,
				effects: upgradedFacility.effects
			},
			timestamp: new Date().toISOString()
		};

		// Emit ResourcesChanged event
		const resourcesChangedEvent: DomainEvent = {
			type: 'ResourcesChanged',
			payload: {
				delta: {
					gold: -cost.gold,
					supplies: -cost.supplies,
					relics: -cost.relics
				},
				current: updatedState.resources
			},
			timestamp: new Date().toISOString()
		};

		return {
			newState: updatedState,
			events: [facilityUpgradedEvent, resourcesChangedEvent]
		};
	};
}

