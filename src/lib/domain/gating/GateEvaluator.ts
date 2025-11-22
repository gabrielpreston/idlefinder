/**
 * Gate Evaluator
 * 
 * Evaluates gates against game state.
 * Pure function system following existing system patterns.
 */

import type { GameState } from '../entities/GameState';
import type { Timestamp } from '../valueObjects/Timestamp';
import type {
	GateDefinition,
	GateEvaluationResult,
	ConditionResult,
	GateCondition,
} from './GateDefinition';
import type { RequirementContext } from '../primitives/Requirement';
import { createQueryContext } from '../queries/Query';
import type { Facility } from '../entities/Facility';
import { safeString } from '../../utils/templateLiterals';

/**
 * Evaluates gates against game state
 */
export class GateEvaluator {
	/**
	 * Evaluate a single gate
	 */
	evaluate(
		gate: GateDefinition,
		state: GameState,
		time?: Timestamp
	): GateEvaluationResult {
		const context = this.createContext(state, time);
		const conditionResults = this.evaluateConditions(
			gate.conditions,
			context
		);

		// Check if all conditions are satisfied
		const allSatisfied = conditionResults.every((r) => r.satisfied);

		// Check alternatives if main conditions not satisfied
		let alternativesSatisfied = false;
		if (!allSatisfied && gate.alternatives) {
			alternativesSatisfied = gate.alternatives.some((altSet) => {
				const altResults = this.evaluateConditions(altSet, context);
				return altResults.every((r) => r.satisfied);
			});
		}

		const unlocked = allSatisfied || alternativesSatisfied;

		// Calculate progress
		const progress = this.calculateProgress(conditionResults);

		// Generate unlock reason
		const unlockReason = unlocked
			? undefined
			: this.generateUnlockReason(gate, conditionResults);

		// Get next threshold
		const nextThreshold = this.getNextThreshold(
			gate,
			conditionResults,
			context
		);

		return {
			unlocked,
			unlockReason,
			progress,
			conditionResults,
			nextThreshold,
		};
	}

	/**
	 * Evaluate multiple conditions
	 */
	private evaluateConditions(
		conditions: GateCondition[],
		context: RequirementContext
	): ConditionResult[] {
		return conditions.map((condition) => {
			const evaluator = this.getConditionEvaluator(condition.type);
			return evaluator(condition, context);
		});
	}

	/**
	 * Get condition evaluator for a condition type
	 */
	private getConditionEvaluator(
		conditionType: string
	): (
		condition: GateCondition,
		context: RequirementContext
	) => ConditionResult {
		switch (conditionType) {
			case 'resource':
				return (condition: GateCondition, context: RequirementContext) => this.evaluateResourceCondition(condition, context);
			case 'entity_tier':
				return (condition: GateCondition, context: RequirementContext) => this.evaluateEntityTierCondition(condition, context);
			case 'entity_exists':
				return (condition: GateCondition, context: RequirementContext) => this.evaluateEntityExistsCondition(condition, context);
			case 'fame_milestone':
				return (condition: GateCondition, context: RequirementContext) => this.evaluateFameMilestoneCondition(condition, context);
			case 'all':
				return (condition: GateCondition, context: RequirementContext) => this.evaluateAllCondition(condition, context);
			case 'any':
				return (condition: GateCondition, context: RequirementContext) => this.evaluateAnyCondition(condition, context);
			default:
				return (condition: GateCondition, context: RequirementContext) => this.evaluateUnknownCondition(condition, context);
		}
	}

	/**
	 * Evaluate resource condition
	 */
	private evaluateResourceCondition(
		condition: GateCondition,
		context: RequirementContext
	): ConditionResult {
		const { resourceType, minAmount } = condition.params as {
			resourceType: string;
			minAmount: number;
		};
		const current = context.resources.get(resourceType);
		const satisfied = current >= minAmount;
		const progress = Math.min(1, current / minAmount);

		return {
			condition,
			satisfied,
			reason: satisfied
				? undefined
				: `Need ${String(minAmount)} ${resourceType}, have ${String(current)}`,
			progress,
		};
	}

	/**
	 * Evaluate entity tier condition
	 */
	private evaluateEntityTierCondition(
		condition: GateCondition,
		context: RequirementContext
	): ConditionResult {
		const { entityType, entityIdOrType, minTier } = condition.params as {
			entityType: string;
			entityIdOrType: string;
			minTier: number;
		};

		// Find entity by type or ID
		const entities = Array.from(context.entities.values());
		const entity = entities.find(
			(e) =>
				e.type === entityType &&
				(e.id === entityIdOrType ||
					(e as Facility).attributes.facilityType === entityIdOrType)
		);

		if (!entity) {
			return {
				condition,
				satisfied: false,
				reason: `${entityType} not found`,
				progress: 0,
			};
		}

		const currentTier = (entity as Facility).attributes.tier;
		const satisfied = currentTier >= minTier;
		const progress = Math.min(1, currentTier / minTier);

		return {
			condition,
			satisfied,
			reason: satisfied
				? undefined
				: `Need ${safeString(entityType)} at tier ${safeString(minTier)}, currently tier ${safeString(currentTier)}`,
			progress,
		};
	}

	/**
	 * Evaluate entity exists condition
	 */
	private evaluateEntityExistsCondition(
		condition: GateCondition,
		context: RequirementContext
	): ConditionResult {
		const { entityType, entityIdOrType } = condition.params as {
			entityType: string;
			entityIdOrType: string;
		};

		const entities = Array.from(context.entities.values());
		const entity = entities.find(
			(e) =>
				e.type === entityType &&
				(e.id === entityIdOrType ||
					(e as Facility).attributes.facilityType === entityIdOrType)
		);

		return {
			condition,
			satisfied: !!entity,
			reason: entity ? undefined : `${entityType} does not exist`,
			progress: entity ? 1 : 0,
		};
	}

	/**
	 * Evaluate fame milestone condition
	 */
	private evaluateFameMilestoneCondition(
		condition: GateCondition,
		context: RequirementContext
	): ConditionResult {
		const { minFame } = condition.params as { minFame: number };
		const currentFame = context.resources.get('fame');
		const satisfied = currentFame >= minFame;
		const progress = Math.min(1, currentFame / minFame);

		return {
			condition,
			satisfied,
			reason: satisfied
				? undefined
				: `Need ${safeString(minFame)} fame, have ${safeString(currentFame)}`,
			progress,
		};
	}

	/**
	 * Evaluate composite 'all' condition
	 */
	private evaluateAllCondition = (
		condition: GateCondition,
		context: RequirementContext
	): ConditionResult => {
		const { conditions } = condition.params as {
			conditions: GateCondition[];
		};
		const results = this.evaluateConditions(conditions, context);
		const satisfied = results.every((r) => r.satisfied);
		const progress =
			results.reduce((sum, r) => sum + (r.progress ?? 0), 0) /
			results.length;

		return {
			condition,
			satisfied,
			reason: satisfied
				? undefined
				: `Not all sub-conditions satisfied`,
			progress,
		};
	};

	/**
	 * Evaluate composite 'any' condition
	 */
	private evaluateAnyCondition = (
		condition: GateCondition,
		context: RequirementContext
	): ConditionResult => {
		const { conditions } = condition.params as {
			conditions: GateCondition[];
		};
		const results = this.evaluateConditions(conditions, context);
		const satisfied = results.some((r) => r.satisfied);
		const progress = Math.max(...results.map((r) => r.progress ?? 0));

		return {
			condition,
			satisfied,
			reason: satisfied
				? undefined
				: `None of the sub-conditions satisfied`,
			progress,
		};
	};

	/**
	 * Evaluate unknown condition type
	 */
	private evaluateUnknownCondition(
		condition: GateCondition,
		_context: RequirementContext
	): ConditionResult {
		return {
			condition,
			satisfied: false,
			reason: `Unknown condition type: ${condition.type}`,
			progress: 0,
		};
	}

	/**
	 * Calculate overall progress
	 */
	private calculateProgress(results: ConditionResult[]): number {
		if (results.length === 0) return 1;
		return (
			results.reduce((sum, r) => sum + (r.progress ?? 0), 0) /
			results.length
		);
	}

	/**
	 * Generate human-readable unlock reason
	 */
	private generateUnlockReason(
		gate: GateDefinition,
		results: ConditionResult[]
	): string {
		const failed = results.filter((r) => !r.satisfied);
		if (failed.length === 0) return 'Gate is unlocked';

		// Use condition descriptions if available
		const reasons = failed
			.map(
				(r) => r.reason || r.condition.description || 'Condition not met'
			)
			.filter(Boolean);

		if (reasons.length === 1) return reasons[0];
		return `Requires: ${reasons.join(', ')}`;
	}

	/**
	 * Get next threshold information
	 */
	private getNextThreshold(
		gate: GateDefinition,
		results: ConditionResult[],
		context: RequirementContext
	): {
		threshold: number;
		current: number;
		remaining: number;
		description: string;
	} | undefined {
		// Find the first progress-based condition (resource, fame, tier)
		const progressCondition = results.find(
			(r) =>
				r.progress !== undefined &&
				r.progress < 1 &&
				(r.condition.type === 'resource' ||
					r.condition.type === 'fame_milestone' ||
					r.condition.type === 'entity_tier')
		);

		if (!progressCondition) return undefined;

		const { condition } = progressCondition;

		if (condition.type === 'resource') {
			const { resourceType, minAmount } = condition.params as {
				resourceType: string;
				minAmount: number;
			};
			const current = context.resources.get(resourceType);
			return {
				threshold: minAmount,
				current,
				remaining: Math.max(0, minAmount - current),
				description: resourceType,
			};
		}

		if (condition.type === 'fame_milestone') {
			const { minFame } = condition.params as { minFame: number };
			const current = context.resources.get('fame');
			return {
				threshold: minFame,
				current,
				remaining: Math.max(0, minFame - current),
				description: 'fame',
			};
		}

		if (condition.type === 'entity_tier') {
			const { minTier } = condition.params as { minTier: number };
			const { entityType, entityIdOrType } = condition.params as {
				entityType: string;
				entityIdOrType: string;
			};
			const entities = Array.from(context.entities.values());
			const entity = entities.find(
				(e) =>
					e.type === entityType &&
					(e.id === entityIdOrType ||
						(e as Facility).attributes.facilityType === entityIdOrType)
			);
			if (!entity) {
				return {
					threshold: minTier,
					current: 0,
					remaining: minTier,
					description: `${entityType} tier`,
				};
			}
			const current = (entity as Facility).attributes.tier;
			return {
				threshold: minTier,
				current,
				remaining: Math.max(0, minTier - current),
				description: `${entityType} tier`,
			};
		}

		return undefined;
	}

	/**
	 * Create requirement context from game state
	 */
	private createContext(state: GameState, time?: Timestamp): RequirementContext {
		const timestamp = time ?? state.lastPlayed;
		return createQueryContext(state, timestamp);
	}
}

/**
 * Global gate evaluator instance
 */
export const gateEvaluator = new GateEvaluator();

