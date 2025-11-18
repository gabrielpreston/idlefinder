/**
 * Actions System - Verbs of the system with exact lifecycle
 * Per Systems Primitives Spec section 7: Actions follow lifecycle:
 * 1. Validate Requirements
 * 2. Compute Effects (including any randomness)
 * 3. Apply Effects to entities/resources
 * 4. Emit Events describing what happened
 */

import type { Requirement, RequirementContext } from './Requirement';
import type { Effect } from './Effect';
import type { DomainEvent } from './Event';
import type { Entity } from './Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';

/**
 * Result of executing an action
 */
export interface ActionResult {
	/**
	 * Whether the action succeeded
	 */
	success: boolean;
	/**
	 * Effects that were computed (before applying)
	 */
	effects: Effect[];
	/**
	 * Events that were generated
	 */
	events: DomainEvent[];
	/**
	 * Error message if action failed
	 */
	error?: string;
}

/**
 * Base Action class - all actions follow the same lifecycle
 */
export abstract class Action {
	/**
	 * Get the requirements for this action
	 * Returns array of requirement functions to validate
	 */
	abstract getRequirements(): Requirement[];

	/**
	 * Compute effects for this action
	 * This is where randomness and business logic happens
	 */
	abstract computeEffects(
		context: RequirementContext,
		params: Record<string, unknown>
	): Effect[];

	/**
	 * Generate events describing what happened
	 * Called after effects are applied
	 */
	abstract generateEvents(
		entities: Map<string, Entity>,
		resources: ResourceBundle,
		effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[];

	/**
	 * Execute the action following exact lifecycle:
	 * 1. Validate Requirements
	 * 2. Compute Effects
	 * 3. Apply Effects (done by caller)
	 * 4. Emit Events
	 */
	execute(
		context: RequirementContext,
		params: Record<string, unknown> = {}
	): ActionResult {
		// Step 1: Validate Requirements
		const requirements = this.getRequirements();
		for (const requirement of requirements) {
			const result = requirement(context);
			if (!result.satisfied) {
				return {
					success: false,
					effects: [],
					events: [],
					error: result.reason || 'Requirement not satisfied'
				};
			}
		}

		// Step 2: Compute Effects
		const effects = this.computeEffects(context, params);

		// Step 3: Apply Effects (caller will do this)
		// We return effects so caller can apply them

		// Step 4: Generate Events (caller will apply effects first, then call generateEvents)
		// For now, we generate events based on computed effects
		// In practice, caller should apply effects, then call generateEvents with updated state
		const events: DomainEvent[] = [];

		return {
			success: true,
			effects,
			events
		};
	}
}

