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
		gold: 550,
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
		initialGoldRatePerMinute: 30,
		
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
		 * Cost to refresh the recruit pool
		 * Reference: RefreshRecruitPoolHandler.ts, CostQueries.ts
		 */
		refreshRecruitPool: 5,
		
		/**
		 * Facility upgrade cost formula
		 * Simple progression: tier * 100
		 * Reference: CostQueries.ts:49
		 * 
		 * @param tier Target tier (current tier + 1)
		 * @returns Cost in gold
		 */
		facilityUpgrade: (tier: number): number => tier * 100,
		
		/**
		 * Facility construction cost by type
		 * Reference: docs/current/21-facility-data-tables.md (construction costs)
		 * 
		 * @param facilityType Facility type to construct
		 * @returns Cost in gold
		 */
		facilityConstruction: (facilityType: string): number => {
			const costs: Record<string, number> = {
				Dormitory: 100,
				MissionCommand: 150,
				TrainingGrounds: 200,
				ResourceDepot: 100
			};
			return costs[facilityType] || 100;
		}
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
	// Mission Generation
	// ============================================
	/**
	 * Mission generation configuration
	 * Reference: MissionGenerationSystem.ts, 18-mission-data-tables.md
	 */
	missionGeneration: {
		/**
		 * Calculate mission DC based on tier
		 * Formula: 10 + (tier * 5)
		 * Tier 0 uses minimum DC 10
		 * Reference: 18-mission-data-tables.md:33-44
		 * 
		 * @param tier Mission tier (0-5)
		 * @returns Difficulty class (DC)
		 */
		calculateDC: (tier: number): number => {
			if (tier === 0) return 10; // Tier 0 minimum
			return 10 + (tier * 5);
		},

		/**
		 * Calculate base gold reward based on tier
		 * Formula: 50 * tier (Tier 0 uses minimum 25)
		 * Reference: 18-mission-data-tables.md:56-59
		 * 
		 * @param tier Mission tier (0-5)
		 * @returns Base gold reward
		 */
		calculateGold: (tier: number): number => {
			if (tier === 0) return 25; // Tier 0 minimum
			return 50 * tier;
		},

		/**
		 * Calculate base XP reward based on tier
		 * Formula: 100 * tier (Tier 0 uses minimum 50)
		 * Reference: 18-mission-data-tables.md:61-64
		 * 
		 * @param tier Mission tier (0-5)
		 * @returns Base XP reward
		 */
		calculateXP: (tier: number): number => {
			if (tier === 0) return 50; // Tier 0 minimum
			return 100 * tier;
		},

		/**
		 * Calculate base fame reward based on tier
		 * Formula: 10 * tier (Tier 0 uses minimum 5)
		 * Reference: 18-mission-data-tables.md:66-69
		 * 
		 * @param tier Mission tier (0-5)
		 * @returns Base fame reward
		 */
		calculateFame: (tier: number): number => {
			if (tier === 0) return 5; // Tier 0 minimum
			return 10 * tier;
		},

		/**
		 * Calculate base duration in seconds based on tier
		 * Formula: 30 seconds * tier (Tier 0 uses minimum 30 seconds)
		 * Reference: 18-mission-data-tables.md:85-96
		 * 
		 * @param tier Mission tier (0-5)
		 * @returns Base duration in seconds
		 */
		calculateDurationSeconds: (tier: number): number => {
			if (tier === 0) return 30; // Tier 0 minimum: 30 seconds
			return 30 * tier;
		}
	},

	// ============================================
	// Mission Pool Management
	// ============================================
	/**
	 * Mission pool management configuration
	 * Controls periodic generation and expiration of missions
	 */
	missionPool: {
		/**
		 * Time between generation checks in seconds
		 * Default: 60 seconds (1 minute)
		 */
		generationCadenceSeconds: 60,

		/**
		 * Target number of available missions per unlocked tier
		 * Default: 5 missions per tier
		 */
		targetPoolSizePerTier: 5,

		/**
		 * Age in seconds before a mission expires
		 * Default: 300 seconds (5 minutes)
		 */
		expirationAgeSeconds: 300,

		/**
		 * Maximum number of missions to generate per cycle
		 * Default: 2 missions per generation cycle
		 */
		generationBatchSize: 2
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

