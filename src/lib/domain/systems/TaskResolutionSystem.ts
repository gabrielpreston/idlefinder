import type { TaskInstance, OutcomeCategory } from '../entities/TaskInstance';
import type { AgentInstance } from '../entities/AgentInstance';
import type { TaskArchetype } from '../entities/TaskArchetype';
import type { FacilityInstance } from '../entities/FacilityInstance';
import type {
	TaskInstanceId,
	AgentId
} from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';

/**
 * Result of resolving a task.
 */
export interface TaskResolutionResult {
	taskId: TaskInstanceId;
	outcomeCategory: OutcomeCategory;
	rewards: ResourceBundle;
	agentChanges: AgentChange[];
	trackChanges: TaskTrackChange[];
}

/**
 * Change to an agent from task resolution.
 */
export interface AgentChange {
	agentId: AgentId;
	xpGain?: number;
	injury?: boolean;
	death?: boolean;
}

/**
 * Change to a progress track from task resolution.
 */
export interface TaskTrackChange {
	trackKey: string;
	amount: number;
}

/**
 * Domain system for resolving completed tasks.
 * Most complex system - computes scores, determines outcomes, generates rewards.
 * Must be deterministic: same inputs → same outputs.
 */
export class TaskResolutionSystem {
	/**
	 * Resolves tasks that are ready for resolution.
	 * Returns results without mutating inputs (pure function).
	 */
	resolveTasks(
		tasks: TaskInstance[],
		agents: Map<string, AgentInstance>,
		archetypes: Map<string, TaskArchetype>,
		facilities: FacilityInstance[],
		now: Timestamp
	): TaskResolutionResult[] {
		const results: TaskResolutionResult[] = [];

		for (const task of tasks) {
			if (!task.isReadyForResolution(now)) {
				continue;
			}

			const archetype = archetypes.get(task.taskArchetypeId.value);
			if (!archetype) {
				console.warn('[TaskResolutionSystem] Missing archetype for task:', task.id.value.slice(0, 8), 'archetypeId:', task.taskArchetypeId.value, 'available keys:', Array.from(archetypes.keys()));
				continue;
			}

			// Get assigned agents
			const assignedAgents = task.assignedAgentIds
				.map((id) => agents.get(id.value))
				.filter((agent): agent is AgentInstance => agent !== undefined);

			// Compute task score
			const score = this.computeTaskScore(archetype, assignedAgents, facilities);

			// Determine outcome
			const outcome = this.determineOutcome(score, archetype);

			// Generate rewards
			const rewards = this.generateRewards(outcome, archetype, assignedAgents);

			// Compute agent changes
			const agentChanges = this.computeAgentChanges(outcome, assignedAgents);

			// Compute track changes (simplified for MVP)
			const trackChanges: TaskTrackChange[] = [];

			results.push({
				taskId: task.id,
				outcomeCategory: outcome,
				rewards,
				agentChanges,
				trackChanges
			});
		}

		return results;
	}

	/**
	 * Computes the task score based on agent stats and facilities.
	 * Deterministic: same inputs → same score.
	 */
	private computeTaskScore(
		archetype: TaskArchetype,
		agents: AgentInstance[],
		facilities: FacilityInstance[]
	): number {
		let score = 0;

		// Sum primary stat from all agents
		for (const agent of agents) {
			score += agent.effectiveStats.get(archetype.primaryStatKey);
		}

		// Sum secondary stats (weighted less)
		for (const statKey of archetype.secondaryStatKeys) {
			for (const agent of agents) {
				score += agent.effectiveStats.get(statKey) * 0.5;
			}
		}

		// Apply facility effects (simplified for MVP)
		// In full implementation, would check facility effect types
		for (const facility of facilities) {
			const effects = facility.getActiveEffects();
			for (const effect of effects) {
				if (effect.effectKey === 'statBonus') {
					score += effect.value;
				}
			}
		}

		return score;
	}

	/**
	 * Determines the outcome category based on score.
	 * Deterministic thresholds.
	 */
	private determineOutcome(score: number, _archetype: TaskArchetype): OutcomeCategory {
		// Simple threshold-based system
		// GREAT_SUCCESS: score >= 100
		// SUCCESS: score >= 50
		// FAILURE: score < 50
		if (score >= 100) {
			return 'GREAT_SUCCESS';
		}
		if (score >= 50) {
			return 'SUCCESS';
		}
		return 'FAILURE';
	}

	/**
	 * Generates rewards based on outcome and agent levels.
	 * Scales base reward by outcome multiplier and agent levels.
	 */
	private generateRewards(
		outcome: OutcomeCategory,
		archetype: TaskArchetype,
		agents: AgentInstance[]
	): ResourceBundle {
		// Outcome multipliers
		const multipliers: Record<OutcomeCategory, number> = {
			GREAT_SUCCESS: 1.5,
			SUCCESS: 1.0,
			FAILURE: 0.3
		};

		const multiplier = multipliers[outcome];

		// Average agent level multiplier
		const avgLevel =
			agents.length > 0
				? agents.reduce((sum, a) => sum + a.level, 0) / agents.length
				: 1;
		const levelMultiplier = 1 + (avgLevel - 1) * 0.1;

		// Scale base reward
		const finalMultiplier = multiplier * levelMultiplier;
		const scaledReward = archetype.baseReward.toArray().map((unit) => {
			return new ResourceUnit(unit.resourceType, Math.floor(unit.amount * finalMultiplier));
		});

		return ResourceBundle.fromArray(scaledReward);
	}

	/**
	 * Computes agent changes (XP, injuries, deaths) based on outcome.
	 * Deterministic: uses agent ID hash for consistent results.
	 */
	private computeAgentChanges(
		outcome: OutcomeCategory,
		agents: AgentInstance[]
	): AgentChange[] {
		const changes: AgentChange[] = [];

		for (const agent of agents) {
			const change: AgentChange = { agentId: agent.id };

			// XP based on outcome
			const xpRewards: Record<OutcomeCategory, number> = {
				GREAT_SUCCESS: 50,
				SUCCESS: 30,
				FAILURE: 10
			};
			change.xpGain = xpRewards[outcome];

			// Injuries based on outcome (deterministic based on agent ID)
			if (outcome === 'FAILURE') {
				// Deterministic injury: use agent ID hash
				const idHash = this.hashString(agent.id.value);
				change.injury = (idHash % 5) === 0; // ~20% chance, but deterministic
			}

			changes.push(change);
		}

		return changes;
	}

	/**
	 * Simple hash function for deterministic pseudo-randomness.
	 */
	private hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash);
	}
}

