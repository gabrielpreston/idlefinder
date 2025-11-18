/**
 * Mission Attributes - Structured data describing mission configuration
 * Per Systems Primitives Spec section 10.2 lines 361-365
 */

import type { Duration } from '../valueObjects/Duration';
import type { RoleKey } from './RoleKey';

export interface MissionAttributes {
	missionType: 'combat' | 'exploration' | 'investigation' | 'diplomacy' | 'resource'; // Spec line 363
	primaryAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
	dc: number; // Numeric DC per spec line 362
	difficultyTier: 'Easy' | 'Medium' | 'Hard' | 'Legendary'; // Keep for backward compatibility, can derive DC from it
	preferredRole?: RoleKey; // Optional role preference per spec line 365
	baseDuration: Duration; // Value object, in seconds/minutes
	baseRewards: {
		gold: number;
		xp: number;
		fame?: number;
	};
	maxPartySize: number; // Optional, start with 1
}

