/**
 * Game State Store - reactive Svelte store for game state
 * Provides reactive access to GameState
 * 
 * Now uses GameRuntime from Svelte context instead of singleton
 * Refactored to use EntityQueryBuilder for consistency
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { GameState } from '../domain/entities/GameState';
import type { GameRuntime } from '../runtime/startGame';
import type { Adventurer } from '../domain/entities/Adventurer';
import type { Mission } from '../domain/entities/Mission';
import type { Facility } from '../domain/entities/Facility';
import type { ResourceSlot } from '../domain/entities/ResourceSlot';
import { EntityQueryBuilder } from '../domain/queries/EntityQueryBuilder';
import { getMissionPoolAdventurers, getAssignedAdventurers } from '../domain/queries/MissionPoolQueries';
import { getMissionSlotCapacity } from '../domain/queries/MissionSlotQueries';
import { 
	getRosterCapacity,
	getRosterRoleDistribution,
	getRosterStatusSummary,
	getRosterAverageLevel,
	type RoleDistribution,
	type StatusSummary
} from '../domain/queries/RosterQueries';
import type { Capacity } from '../domain/queries/Capacity';
import { getGuildHallTier, isGuildHallRuined, getGuildHall, getFacilityCounts } from '../domain/queries/FacilityQueries';
import { canBuildFacility } from '../domain/queries/UnlockQueries';
import { getAdventurerCount, hasAnyAdventurers, isFirstAdventurer } from '../domain/queries/AdventurerQueries';
import { getPlayerAssignedSlots, hasOddJobsAvailable, getOddJobsGoldRate, getTrainingMultiplier, getResourceGenerationRates } from '../domain/queries/FacilityEffectQueries';
import { isAdventurersPanelUnlocked, isMissionsPanelUnlocked, isMissionsPanelFunctional, isFacilitiesPanelUnlocked, isEquipmentPanelUnlocked, isCraftingPanelUnlocked, isDoctrinePanelUnlocked } from '../domain/queries/UIGatingQueries';
// Ensure gates are registered when store module loads
import '../domain/gating';
import { getGuildHallUpgradeCost, canUpgradeGuildHall, getRecruitAdventurerCost, canAffordRecruitAdventurer, getRefreshRecruitPoolCost, canAffordRefreshRecruitPool } from '../domain/queries/CostQueries';
import { getRecruitPool } from '../domain/queries/RecruitPoolQueries';
import type { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import { getGateProgress, getGateStatus } from '../domain/gating/GateQueries';
import { gateRegistry } from '../domain/gating/GateRegistry';
import type { GateId } from '../domain/gating/GateDefinition';
import { getMissionStatistics, getRecentCompletions, type MissionStatistics } from '../domain/queries/MissionStatisticsQueries';
import { getAllActiveTimers } from '../domain/queries/TimerQueries';
import { gameTime } from './time/timeSource';

/**
 * Game state store - reactive wrapper around runtime's gameState
 */
function createGameStateStore() {
	const { subscribe, set } = writable<GameState | null>(null);
	let runtime: GameRuntime | null = null;

	return {
		subscribe,
		initialize: (rt: GameRuntime) => {
			if (!rt) {
				throw new Error('GameRuntime cannot be null when initializing gameState store');
			}
			if (!rt.gameState) {
				throw new Error('GameRuntime.gameState cannot be null');
			}
			runtime = rt;
			// Use runtime's gameState store
			const unsubscribe = rt.gameState.subscribe((state: GameState) => {
				if (!state) {
					console.warn('gameState store received null state - this should not happen');
					return;
				}
				set(state);
			});
			// Store unsubscribe in runtime's destroy (will be called on cleanup)
			const originalDestroy = rt.destroy;
			rt.destroy = () => {
				unsubscribe();
				originalDestroy();
			};
		},
		refresh: () => {
			if (!runtime) {
				return; // Gracefully handle null runtime
			}
			set(runtime.busManager.getState());
		}
	};
}

export const gameState = createGameStateStore();

/**
 * Derived stores for convenience
 */
export const resources: Readable<GameState['resources'] | null> = derived(
	gameState,
	($state) => $state?.resources ?? null
);

// Refactored to use EntityQueryBuilder
export const adventurers: Readable<Adventurer[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return EntityQueryBuilder.byType<Adventurer>('Adventurer')($state)
			.filter(a => a.state !== 'Preview'); // Exclude Preview entities from roster
	}
);

export const missions: Readable<Mission[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return EntityQueryBuilder.byType<Mission>('Mission')($state);
	}
);

export const facilities: Readable<Facility[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return EntityQueryBuilder.byType<Facility>('Facility')($state);
	}
);

export const missionSlotCapacity: Readable<import('../domain/queries/Capacity').Capacity> = derived(
	gameState,
	($state) => {
		if (!$state) return { current: 0, max: 0, available: 0, utilization: 0 };
		return getMissionSlotCapacity($state);
	}
);

export const availableFacilities: Readable<string[]> = derived(
	[gameState, facilities],
	([$state, $facilities]) => {
		if (!$state) return [];
		const facilityTypes = ['Dormitory', 'MissionCommand', 'TrainingGrounds', 'ResourceDepot'];
		return facilityTypes.filter(type => {
			const exists = $facilities.some(f => f.attributes.facilityType === type);
			const unlocked = canBuildFacility(type, $state);
			return unlocked && !exists;
		});
	}
);

export const slots: Readable<ResourceSlot[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return EntityQueryBuilder.byType<ResourceSlot>('ResourceSlot')($state);
	}
);

export const items: Readable<import('../domain/entities/Item').Item[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return Array.from($state.entities.values()).filter(
			(e) => e.type === 'Item'
		) as import('../domain/entities/Item').Item[];
	}
);

export const craftingQueue: Readable<import('../domain/entities/CraftingQueue').CraftingQueue | undefined> = derived(
	gameState,
	($state) => {
		if (!$state) return undefined;
		return Array.from($state.entities.values())
			.find((e) => e.type === 'CraftingQueue') as import('../domain/entities/CraftingQueue').CraftingQueue | undefined;
	}
);

export const missionDoctrine: Readable<import('../domain/entities/MissionDoctrine').MissionDoctrine | undefined> = derived(
	gameState,
	($state) => {
		if (!$state) return undefined;
		return Array.from($state.entities.values())
			.find((e) => e.type === 'MissionDoctrine') as import('../domain/entities/MissionDoctrine').MissionDoctrine | undefined;
	}
);

export const autoEquipRules: Readable<import('../domain/entities/AutoEquipRules').AutoEquipRules | undefined> = derived(
	gameState,
	($state) => {
		if (!$state) return undefined;
		const rules = EntityQueryBuilder.byType<import('../domain/entities/AutoEquipRules').AutoEquipRules>('AutoEquipRules')($state);
		return rules[0];
	}
);

/**
 * New query-based derived stores
 */

// Mission pool adventurers (Idle + not assigned to slots)
export const missionPoolAdventurers: Readable<Adventurer[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return getMissionPoolAdventurers($state);
	}
);

// Assigned adventurers (assigned to resource slots)
export const assignedAdventurers: Readable<Adventurer[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return getAssignedAdventurers($state);
	}
);

// Mission slot capacity
export const missionCapacity: Readable<Capacity | null> = derived(
	gameState,
	($state) => {
		if (!$state) return null;
		return getMissionSlotCapacity($state);
	}
);

// Roster capacity
export const rosterCapacity: Readable<Capacity | null> = derived(
	gameState,
	($state) => {
		if (!$state) return null;
		return getRosterCapacity($state);
	}
);

// Roster analytics
export const rosterRoleDistribution: Readable<RoleDistribution> = derived(
	gameState,
	($state) => {
		if (!$state) return {};
		return getRosterRoleDistribution($state);
	}
);

export const rosterStatusSummary: Readable<StatusSummary> = derived(
	gameState,
	($state) => {
		if (!$state) return {};
		return getRosterStatusSummary($state);
	}
);

export const rosterAverageLevel: Readable<number> = derived(
	gameState,
	($state) => {
		if (!$state) return 0;
		return getRosterAverageLevel($state);
	}
);

// Guild hall queries
export const guildHallTier: Readable<number> = derived(
	gameState,
	($state) => $state ? getGuildHallTier($state) : 0
);

export const isGuildHallRuinedState: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isGuildHallRuined($state) : true
);

export const guildHall: Readable<Facility | undefined> = derived(
	gameState,
	($state) => $state ? getGuildHall($state) : undefined
);

// Adventurer queries
export const adventurerCount: Readable<number> = derived(
	gameState,
	($state) => $state ? getAdventurerCount($state) : 0
);

export const hasAdventurers: Readable<boolean> = derived(
	gameState,
	($state) => $state ? hasAnyAdventurers($state) : false
);

export const isFirstAdventurerState: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isFirstAdventurer($state) : false
);

// Odd Jobs queries
export const playerSlots: Readable<ResourceSlot[]> = derived(
	gameState,
	($state) => $state ? getPlayerAssignedSlots($state) : []
);

export const oddJobsAvailable: Readable<boolean> = derived(
	gameState,
	($state) => $state ? hasOddJobsAvailable($state) : false
);

export const oddJobsGoldRate: Readable<number> = derived(
	gameState,
	($state) => $state ? getOddJobsGoldRate($state) : 0
);

// UI gating queries
export const adventurersPanelUnlocked: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isAdventurersPanelUnlocked($state) : false
);

export const missionsPanelUnlocked: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isMissionsPanelUnlocked($state) : false
);

export const missionsPanelFunctional: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isMissionsPanelFunctional($state) : false
);

export const facilitiesPanelUnlocked: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isFacilitiesPanelUnlocked($state) : false
);

export const equipmentPanelUnlocked: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isEquipmentPanelUnlocked($state) : false
);

export const craftingPanelUnlocked: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isCraftingPanelUnlocked($state) : false
);

export const doctrinePanelUnlocked: Readable<boolean> = derived(
	gameState,
	($state) => $state ? isDoctrinePanelUnlocked($state) : false
);

// Guild hall upgrade queries
export const guildHallUpgradeCost: Readable<ResourceBundle | null> = derived(
	gameState,
	($state) => $state ? getGuildHallUpgradeCost($state) : null
);

export const canUpgradeGuildHallState: Readable<boolean> = derived(
	gameState,
	($state) => $state ? canUpgradeGuildHall($state) : false
);

// Recruitment cost queries
export const recruitAdventurerCost: Readable<ResourceBundle | null> = derived(
	gameState,
	($state) => $state ? getRecruitAdventurerCost() : null
);

export const canAffordRecruitAdventurerState: Readable<boolean> = derived(
	gameState,
	($state) => $state ? canAffordRecruitAdventurer($state) : false
);

// Recruit pool queries
export const recruitPool: Readable<Adventurer[]> = derived(
	gameState,
	($state) => $state ? getRecruitPool($state) : []
);

// Refresh recruit pool cost queries
export const refreshRecruitPoolCost: Readable<ResourceBundle | null> = derived(
	gameState,
	($state) => $state ? getRefreshRecruitPoolCost() : null
);

export const canAffordRefreshRecruitPoolState: Readable<boolean> = derived(
	gameState,
	($state) => $state ? canAffordRefreshRecruitPool($state) : false
);

// Gate progress tracking stores
export const gateProgress: Readable<Record<GateId, number>> = derived(
	gameState,
	($state) => {
		if (!$state) return {};
		const allGates = gateRegistry.getAll();
		const progress: Record<GateId, number> = {};
		for (const gate of allGates) {
			progress[gate.id] = getGateProgress(gate.id, $state);
		}
		return progress;
	}
);

export const nextUnlockThreshold: Readable<
	Record<
		GateId,
		{ threshold: number; current: number; remaining: number; description: string } | null
	>
> = derived(gameState, ($state) => {
	if (!$state) return {};
	const allGates = gateRegistry.getAll();
	const thresholds: Record<
		GateId,
		{ threshold: number; current: number; remaining: number; description: string } | null
	> = {};
	for (const gate of allGates) {
		const status = getGateStatus(gate.id, $state);
		thresholds[gate.id] = status?.nextThreshold ?? null;
	}
	return thresholds;
});

// Mission statistics queries
export const missionStatistics: Readable<MissionStatistics | null> = derived(
	gameState,
	($state) => {
		if (!$state) return null;
		return getMissionStatistics($state);
	}
);

export const recentCompletions: Readable<Mission[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return getRecentCompletions($state, 10);
	}
);

// Mission count stores (for convenience)
export const activeMissionCount: Readable<number> = derived(
	missionStatistics,
	($stats) => $stats?.inProgress ?? 0
);

export const completedMissionCount: Readable<number> = derived(
	missionStatistics,
	($stats) => $stats?.completed ?? 0
);

export const availableMissionCount: Readable<number> = derived(
	missionStatistics,
	($stats) => $stats?.available ?? 0
);

// Resource stores - individual resource accessors
export const gold: Readable<number> = derived(
	gameState,
	($state) => $state?.resources?.get('gold') ?? 0
);

export const fame: Readable<number> = derived(
	gameState,
	($state) => $state?.resources?.get('fame') ?? 0
);

export const materials: Readable<number> = derived(
	gameState,
	($state) => $state?.resources?.get('materials') ?? 0
);

// Facility counts store
export const facilityCounts: Readable<Record<string, number>> = derived(
	gameState,
	($state) => {
		if (!$state) return {};
		return getFacilityCounts($state);
	}
);

// Training multiplier store
export const trainingMultiplier: Readable<number> = derived(
	gameState,
	($state) => {
		if (!$state) return 1.0;
		return getTrainingMultiplier($state);
	}
);

// Resource generation rates store
export const resourceGenerationRates: Readable<Record<string, number>> = derived(
	gameState,
	($state) => {
		if (!$state) return {};
		const rates = getResourceGenerationRates($state);
		// Filter out any NaN or invalid values as final safety check
		const validRates: Record<string, number> = {};
		for (const [resourceType, rate] of Object.entries(rates)) {
			if (typeof rate === 'number' && !isNaN(rate) && isFinite(rate) && rate > 0) {
				validRates[resourceType] = rate;
			}
		}
		return validRates;
	}
);

// Active timers for Dashboard
export const activeTimers: Readable<import('../domain/queries/TimerQueries').TimerInfo[]> = derived(
	[gameState, gameTime.now],
	([$state, now]) => {
		if (!$state) return [];
		return getAllActiveTimers($state, now);
	}
);

