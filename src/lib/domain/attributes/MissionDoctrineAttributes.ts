/**
 * Mission Doctrine Attributes - Configuration for mission automation
 * Per docs/current/09-mission-system.md: Doctrine-driven selection
 */

export type MissionFocus = 'gold' | 'xp' | 'materials' | 'balanced';
export type RiskTolerance = 'low' | 'medium' | 'high';

export interface MissionDoctrineAttributes {
	focus: MissionFocus; // Primary reward focus
	riskTolerance: RiskTolerance; // Risk preference
	preferredMissionTypes?: string[]; // Optional: preferred mission types
	minLevel?: number; // Optional: minimum mission level
	maxLevel?: number; // Optional: maximum mission level
}

