/**
 * Handler Registration - wires all command handlers to the command bus
 */

import type { BusManager } from '../bus/BusManager';
import type { PlayerState } from '../domain/entities/PlayerState';
import { MissionSystem } from '../domain/systems/MissionSystem';
import { AdventurerSystem } from '../domain/systems/AdventurerSystem';
import { FacilitySystem } from '../domain/systems/FacilitySystem';
import { createStartMissionHandler } from './StartMissionHandler';
import { createRecruitAdventurerHandler } from './RecruitAdventurerHandler';
import { createUpgradeFacilityHandler } from './UpgradeFacilityHandler';
import { createCompleteMissionHandler } from './CompleteMissionHandler';

/**
 * Register all command handlers with the bus manager
 */
export function registerHandlers(busManager: BusManager): void {
	const stateGetter = () => busManager.getState();
	const stateSetter = (state: PlayerState) => {
		busManager.setState(state);
	};

	// Create domain systems
	const missionSystem = new MissionSystem(
		stateGetter,
		stateSetter,
		busManager.domainEventBus,
		busManager.commandBus
	);
	const adventurerSystem = new AdventurerSystem();
	const facilitySystem = new FacilitySystem();

	// Register command handlers
	busManager.commandBus.register('StartMission', createStartMissionHandler(missionSystem));
	busManager.commandBus.register(
		'RecruitAdventurer',
		createRecruitAdventurerHandler(adventurerSystem)
	);
	busManager.commandBus.register(
		'UpgradeFacility',
		createUpgradeFacilityHandler(facilitySystem)
	);
	busManager.commandBus.register(
		'CompleteMission',
		createCompleteMissionHandler(adventurerSystem)
	);

	// Subscribe mission system to tick bus for automatic mission completion
	const tickHandler = missionSystem.createTickHandler();
	busManager.tickBus.subscribe(tickHandler);
}

