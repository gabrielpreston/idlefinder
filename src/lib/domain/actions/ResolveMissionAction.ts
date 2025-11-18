/**
 * ResolveMission Action - Per Systems Primitives Spec section 10.2
 * Requirements: mission.state == InProgress, now >= mission.endsAt
 * Effects: Run PF2E check, apply rewards/penalties, mission.state = Completed, adventurer.state = Idle
 * Events: MissionCompleted (with outcome band)
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import {
	entityExistsRequirement,
	entityStateRequirement,
	allRequirements
} from '../primitives/Requirement';
import {
	SetEntityStateEffect,
	ModifyResourceEffect,
	SetEntityAttributeEffect,
	type Effect
} from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { getTimer } from '../primitives/TimerHelpers';

export interface ResolveMissionParams {
	missionId: string;
	resolvedAt: Timestamp;
}

/**
 * PF2E-style outcome bands
 */
export type OutcomeBand = 'CriticalSuccess' | 'Success' | 'Failure' | 'CriticalFailure';

/**
 * Roll d20 + ability mod + synergy bonus
 */
function rollCheck(
	adventurer: Adventurer,
	mission: Mission,
	synergyBonus: number = 0
): number {
	const d20 = Math.floor(Math.random() * 20) + 1;
	const abilityMod = adventurer.attributes.abilityMods.get(mission.attributes.primaryAbility) || 0;
	return d20 + abilityMod + synergyBonus;
}

/**
 * Map roll result to outcome band using numeric DC
 * Per spec line 362: uses numeric dc instead of difficultyTier
 * PF2E-style: Critical Success = DC + 10, Success = DC, Failure = DC - 10, Critical Failure = DC - 20
 */
function mapToOutcomeBand(roll: number, dc: number): OutcomeBand {
	const critSuccess = dc + 10;
	const success = dc;
	const failure = dc - 10;

	if (roll >= critSuccess) return 'CriticalSuccess';
	if (roll >= success) return 'Success';
	if (roll >= failure) return 'Failure';
	return 'CriticalFailure'; // roll < failure (dc - 10)
}

/**
 * Calculate synergy bonus from role match and shared tags
 * Per spec lines 525-526: role match = +1, trait tags = additional bonus
 */
function calculateSynergyBonus(adventurer: Adventurer, mission: Mission): number {
	let bonus = 0;
	
	// Role synergy: if adventurer.roleKey === mission.preferredRole → +1 (spec line 525)
	if (mission.attributes.preferredRole && adventurer.attributes.roleKey === mission.attributes.preferredRole) {
		bonus += 1;
	}
	
	// Trait synergy: if adventurer.traitTags ∩ mission.tags ≠ ∅ → additional bonus (spec line 526)
	const sharedTags = adventurer.tags.filter((tag) => mission.tags.includes(tag));
	bonus += sharedTags.length * 1; // +1 per shared tag
	
	return bonus;
}

/**
 * Calculate rewards based on outcome band
 */
function calculateRewards(
	mission: Mission,
	outcome: OutcomeBand
): { gold: number; xp: number; fame?: number; materials?: number } {
	const base = mission.attributes.baseRewards;
	const multipliers: Record<OutcomeBand, { gold: number; xp: number; fame: number; materials: number }> = {
		CriticalSuccess: { gold: 1.5, xp: 1.5, fame: 1.5, materials: 1.5 },
		Success: { gold: 1.0, xp: 1.0, fame: 1.0, materials: 1.0 },
		Failure: { gold: 0.5, xp: 0.5, fame: 0.5, materials: 0.5 },
		CriticalFailure: { gold: 0.0, xp: 0.0, fame: 0.0, materials: 0.0 }
	};

	const mult = multipliers[outcome];
	return {
		gold: Math.floor(base.gold * mult.gold),
		xp: Math.floor(base.xp * mult.xp),
		fame: base.fame ? Math.floor(base.fame * mult.fame) : undefined,
		materials: base.materials ? Math.floor(base.materials * mult.materials) : undefined
	};
}

/**
 * Requirement: mission is ready for resolution (now >= endsAt)
 */
function missionReadyRequirement(missionId: string): Requirement {
	return (context: RequirementContext) => {
		const mission = context.entities.get(missionId) as Mission | undefined;
		if (!mission) {
			return { satisfied: false, reason: `Mission ${missionId} not found` };
		}
		const endsAt = getTimer(mission, 'endsAt');
		if (!endsAt) {
			return { satisfied: false, reason: `Mission ${missionId} has no endsAt timer` };
		}
		if (context.currentTime.value < endsAt.value) {
			return {
				satisfied: false,
				reason: `Mission ${missionId} not ready: endsAt ${endsAt.value} > now ${context.currentTime.value}`
			};
		}
		return { satisfied: true };
	};
}

/**
 * ResolveMission Action - Per spec lines 400, 410-423
 */
export class ResolveMissionAction extends Action {
	private outcome: OutcomeBand | null = null;
	private rewards: { gold: number; xp: number; fame?: number; materials?: number } | null = null;
	private adventurerId: string | null = null;

	constructor(private readonly missionId: string) {
		super();
	}

	getRequirements(): Requirement[] {
		return [
			allRequirements(
				entityExistsRequirement(this.missionId, 'Mission'),
				entityStateRequirement(this.missionId, 'InProgress'),
				missionReadyRequirement(this.missionId)
			)
		];
	}

	computeEffects(
		context: RequirementContext,
		_params: Record<string, unknown>
	): Effect[] {
		// Note: resolvedAt parameter is available but mission completion uses endsAt timer from mission entity
		const mission = context.entities.get(this.missionId) as Mission;
		if (!mission) {
			throw new Error(`Mission ${this.missionId} not found`);
		}

		// Find assigned adventurer (stored in mission metadata or find by state)
		const adventurers = Array.from(context.entities.values()).filter(
			(e) => e.type === 'Adventurer' && (e as Adventurer).state === 'OnMission'
		) as Adventurer[];

		if (adventurers.length === 0) {
			throw new Error(`No adventurer assigned to mission ${this.missionId}`);
		}

		const adventurer = adventurers[0]; // MVP: single adventurer

		// Run PF2E check
		const synergyBonus = calculateSynergyBonus(adventurer, mission);
		const roll = rollCheck(adventurer, mission, synergyBonus);
		this.outcome = mapToOutcomeBand(roll, mission.attributes.dc); // Use numeric DC per spec

		// Calculate rewards
		this.rewards = calculateRewards(mission, this.outcome);
		this.adventurerId = adventurer.id;

		// Build effects
		const effects: Effect[] = [];

		// Mission state: InProgress -> Completed (Effect will call mission.complete())
		effects.push(new SetEntityStateEffect(this.missionId, 'Completed'));

		// Adventurer state: OnMission -> Idle (Effect will call adventurer.completeMission())
		effects.push(new SetEntityStateEffect(adventurer.id, 'Idle'));

		// Apply rewards
		const resourceUnits: ResourceUnit[] = [];
		if (this.rewards.gold > 0) {
			resourceUnits.push(new ResourceUnit('gold', this.rewards.gold));
		}
		if (this.rewards.fame !== undefined && this.rewards.fame > 0) {
			resourceUnits.push(new ResourceUnit('fame', this.rewards.fame));
		}
		if (this.rewards.materials !== undefined && this.rewards.materials > 0) {
			resourceUnits.push(new ResourceUnit('materials', this.rewards.materials));
		}
		if (resourceUnits.length > 0) {
			effects.push(new ModifyResourceEffect(resourceUnits, 'add'));
		}

		// XP is per-adventurer resource, stored in adventurer.attributes.xp
		if (this.rewards.xp > 0) {
			const newXP = adventurer.attributes.xp + this.rewards.xp;
			effects.push(
				new SetEntityAttributeEffect(adventurer.id, 'attributes.xp', newXP)
			);
		}

		return effects;
	}

	generateEvents(
		entities: Map<string, Entity>,
		resources: ResourceBundle,
		effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[] {
		const resolveParams = params as unknown as ResolveMissionParams;
		const mission = entities.get(this.missionId) as Mission;

		if (!mission) {
			return [];
		}

		if (!this.outcome || !this.rewards || !this.adventurerId) {
			return [];
		}

		return [
			{
				type: 'MissionCompleted',
				payload: {
					missionId: this.missionId,
					adventurerIds: [this.adventurerId],
					outcome: this.outcome,
					rewards: {
						gold: this.rewards.gold,
						xp: this.rewards.xp,
						fame: this.rewards.fame,
						materials: this.rewards.materials
					}
				},
				timestamp: resolveParams?.resolvedAt
					? resolveParams.resolvedAt.value.toString()
					: new Date().toISOString()
			}
		];
	}
}

