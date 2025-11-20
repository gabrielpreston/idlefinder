/**
 * Centralized Game Configuration
 * 
 * All game balance constants, formulas, and starting values are defined here.
 * This makes it easy to tune game balance without hunting through code.
 * 
 * Design Principles:
 * - Single Source of Truth: All balance values in one place
 * - Type Safety: Full TypeScript support with const assertions
 * - Composability: Formulas can reference other config values
 * - Documentation: Inline comments explain balance decisions
 * - Testability: Easy to override for testing different configurations
 */

/**
 * Game balance configuration
 * 
 * Organized by functional area for easy navigation and maintenance.
 * All values use the same numbers as the original hardcoded values
 * to ensure game behavior remains unchanged.
 */
export const GameConfig = {
	// ============================================
	// Starting Resources
	// ============================================
	/**
	 * Initial resources when starting a new game
	 * Reference: GameStateFactory.ts:31-34
	 */
	startingResources: {
		gold: 15,
		fame: 0,
		materials: 0
	},

	// ============================================
	// Resource Generation
	// ============================================
	/**
	 * Initial resource generation rates and capacities
	 * Reference: GameStateFactory.ts:44,62
	 */
	resourceGeneration: {
		/**
		 * Initial gold generation rate per minute
		 * Reference: GameStateFactory.ts:62, SlotSystem.ts:44
		 */
		initialGoldRatePerMinute: 6,
		
		/**
		 * Initial base capacity for facilities
		 * Reference: GameStateFactory.ts:44
		 */
		initialBaseCapacity: 1
	},

	// ============================================
	// Costs
	// ============================================
	/**
	 * All cost values and formulas
	 * Reference: RecruitAdventurerHandler.ts:21, CostQueries.ts:49,119,129
	 */
	costs: {
		/**
		 * Cost to recruit a new adventurer
		 * Reference: RecruitAdventurerHandler.ts:21, CostQueries.ts:119,129
		 */
		recruitAdventurer: 50,
		
		/**
		 * Facility upgrade cost formula
		 * Simple progression: tier * 100
		 * Reference: CostQueries.ts:49
		 * 
		 * @param tier Target tier (current tier + 1)
		 * @returns Cost in gold
		 */
		facilityUpgrade: (tier: number): number => tier * 100
	},

	// ============================================
	// Facility Tier Scaling
	// ============================================
	/**
	 * Tier-based scaling formulas for facility effects
	 * Reference: Facility.ts:83,86,92
	 */
	facilityScaling: {
		/**
		 * Dormitory: +5 roster capacity per tier
		 * Formula: tier * 5
		 * Reference: Facility.ts:83
		 * 
		 * @param tier Facility tier
		 * @returns Roster capacity bonus
		 */
		dormitoryRosterBonus: (tier: number): number => tier * 5,
		
		/**
		 * MissionCommand: +1 mission slot per tier
		 * Formula: tier * 1
		 * Reference: Facility.ts:86
		 * 
		 * @param tier Facility tier
		 * @returns Mission slot bonus
		 */
		missionCommandSlotBonus: (tier: number): number => tier,
		
		/**
		 * ResourceDepot: +100 storage capacity per tier
		 * Formula: tier * 100
		 * Reference: Facility.ts:92
		 * 
		 * @param tier Facility tier
		 * @returns Storage capacity bonus
		 */
		resourceDepotStorageBonus: (tier: number): number => tier * 100
	},

	// ============================================
	// Mission Resolution
	// ============================================
	/**
	 * Mission resolution thresholds, rewards, and multipliers
	 * Reference: TaskResolutionSystem.ts:149-155,171-174,184,209-213
	 */
	missionResolution: {
		/**
		 * Score thresholds for determining mission outcome
		 * Reference: TaskResolutionSystem.ts:149-155
		 */
		scoreThresholds: {
			greatSuccess: 100,
			success: 50
		},
		
		/**
		 * XP rewards based on mission outcome
		 * Reference: TaskResolutionSystem.ts:209-213
		 */
		xpRewards: {
			greatSuccess: 50,
			success: 30,
			failure: 10
		},
		
		/**
		 * Outcome multipliers for mission rewards
		 * Reference: TaskResolutionSystem.ts:171-174
		 */
		outcomeMultipliers: {
			greatSuccess: 1.5,
			success: 1.0,
			failure: 0.3
		},
		
		/**
		 * Level multiplier for mission rewards
		 * Formula: 1 + (avgLevel - 1) * levelMultiplier
		 * Reference: TaskResolutionSystem.ts:184
		 */
		levelMultiplier: 0.1
	},

	// ============================================
	// Items
	// ============================================
	/**
	 * Item-related constants
	 * Reference: CompleteCraftingAction.ts:61-62
	 */
	items: {
		/**
		 * Maximum durability for all items
		 * Reference: CompleteCraftingAction.ts:61-62
		 */
		maxDurability: 100
	}
} as const;

