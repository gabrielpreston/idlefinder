/**
 * Handler Registration - wires all command handlers to the command bus
 */

import type { BusManager } from '../bus/BusManager';
import { MissionSystem, AdventurerSystem, FacilitySystem } from '../domain/systems';
import { createStartMissionHandler } from './StartMissionHandler';
import { createRecruitAdventurerHandler } from './RecruitAdventurerHandler';
import { createUpgradeFacilityHandler } from './UpgradeFacilityHandler';
import { createCompleteMissionHandler } from './CompleteMissionHandler';

/**
 * Register all command handlers with the bus manager
 */
export function registerHandlers(busManager: BusManager): void {
	const stateGetter = () => busManager.getState();

	// Create domain systems (pure - no bus dependencies)
	const missionSystem = new MissionSystem();
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
	// Pass commandBus and stateGetter as parameters (not stored in MissionSystem)
	const tickHandler = missionSystem.createTickHandler(busManager.commandBus, stateGetter);
	busManager.tickBus.subscribe(tickHandler);
}

