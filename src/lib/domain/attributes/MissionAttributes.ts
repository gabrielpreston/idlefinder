/**
 * Mission Attributes - Structured data describing mission configuration
 * Per Systems Primitives Spec section 10.2 lines 361-365
 */

import type { Duration } from '../valueObjects/Duration';

export interface MissionAttributes {
	difficultyTier: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
	primaryAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
	baseDuration: Duration; // Value object, in seconds/minutes
	baseRewards: {
		gold: number;
		xp: number;
		fame?: number;
	};
	maxPartySize: number; // Optional, start with 1
}

