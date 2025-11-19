/**
 * Action Validation Queries
 * 
 * Queries for validating if actions can be performed without executing them.
 * Extracts requirement validation from Action.execute() for pre-validation.
 */

import type { GameState } from '../entities/GameState';
import type { Action } from '../primitives/Action';
import type { RequirementResult } from '../primitives/Requirement';
import type { Timestamp } from '../valueObjects/Timestamp';
import { createQueryContext } from './Query';

/**
 * Validate action requirements without executing the action
 * 
 * Extracts requirement validation from Action.execute() lifecycle.
 * Reuses Action.getRequirements() to check if action can be performed.
 * 
 * @param action Action to validate
 * @param state GameState to validate against
 * @param time Current time for time-dependent requirements
 * @param actionParams Optional action-specific parameters for requirement context
 * @returns RequirementResult indicating if action can be performed
 */
export function validateAction(
	action: Action,
	state: GameState,
	time: Timestamp,
	actionParams?: Record<string, unknown>
): RequirementResult {
	const context = createQueryContext(state, time);
	if (actionParams) {
		context.actionParams = actionParams;
	}

	const requirements = action.getRequirements();
	
	for (const requirement of requirements) {
		const result = requirement(context);
		if (!result.satisfied) {
			return result;
		}
	}
	
	return { satisfied: true };
}

/**
 * Check if action can be performed
 * 
 * @param action Action to check
 * @param state GameState to check against
 * @param time Current time for time-dependent requirements
 * @param actionParams Optional action-specific parameters
 * @returns True if action can be performed, false otherwise
 */
export function canPerformAction(
	action: Action,
	state: GameState,
	time: Timestamp,
	actionParams?: Record<string, unknown>
): boolean {
	return validateAction(action, state, time, actionParams).satisfied;
}

/**
 * Get reason why action cannot be performed
 * 
 * @param action Action to check
 * @param state GameState to check against
 * @param time Current time for time-dependent requirements
 * @param actionParams Optional action-specific parameters
 * @returns Reason string if action cannot be performed, null if it can
 */
export function getActionValidationReason(
	action: Action,
	state: GameState,
	time: Timestamp,
	actionParams?: Record<string, unknown>
): string | null {
	const result = validateAction(action, state, time, actionParams);
	return result.satisfied ? null : (result.reason || 'Action cannot be performed');
}

