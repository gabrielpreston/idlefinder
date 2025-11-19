/**
 * Gate Queries
 * 
 * High-level query API for gate evaluation.
 * Follows existing query patterns from Query.ts
 */

import type { GameState } from '../entities/GameState';
import type { Timestamp } from '../valueObjects/Timestamp';
import type {
	GateId,
	GateType,
	GateEvaluationResult,
	GateDefinition,
} from './GateDefinition';
import { gateRegistry } from './GateRegistry';
import { gateEvaluator } from './GateEvaluator';

/**
 * Check if a gate is unlocked
 * 
 * @param gateId Gate ID to check
 * @param state GameState
 * @param time Optional timestamp (defaults to state.lastPlayed)
 * @returns True if gate is unlocked
 */
export function isGateUnlocked(
	gateId: GateId,
	state: GameState,
	time?: Timestamp
): boolean {
	const gate = gateRegistry.get(gateId);
	if (!gate) return false;
	const result = gateEvaluator.evaluate(gate, state, time);
	return result.unlocked;
}

/**
 * Get gate evaluation result
 * 
 * @param gateId Gate ID to check
 * @param state GameState
 * @param time Optional timestamp (defaults to state.lastPlayed)
 * @returns GateEvaluationResult or null if gate not found
 */
export function getGateStatus(
	gateId: GateId,
	state: GameState,
	time?: Timestamp
): GateEvaluationResult | null {
	const gate = gateRegistry.get(gateId);
	if (!gate) return null;
	return gateEvaluator.evaluate(gate, state, time);
}

/**
 * Get all gates of a type
 * 
 * @param type Gate type to query
 * @param state GameState
 * @param time Optional timestamp (defaults to state.lastPlayed)
 * @returns Array of gates with their evaluation results
 */
export function getGatesByType(
	type: GateType,
	state: GameState,
	time?: Timestamp
): Array<{ gate: GateDefinition; status: GateEvaluationResult }> {
	const gates = gateRegistry.getByType(type);
	return gates.map((gate) => ({
		gate,
		status: gateEvaluator.evaluate(gate, state, time),
	}));
}

/**
 * Get unlock reason for a gate
 * 
 * @param gateId Gate ID to check
 * @param state GameState
 * @param time Optional timestamp (defaults to state.lastPlayed)
 * @returns Unlock reason string or null if unlocked/not found
 */
export function getGateUnlockReason(
	gateId: GateId,
	state: GameState,
	time?: Timestamp
): string | null {
	const status = getGateStatus(gateId, state, time);
	return status?.unlockReason ?? null;
}

/**
 * Get progress toward unlocking a gate
 * 
 * @param gateId Gate ID to check
 * @param state GameState
 * @param time Optional timestamp (defaults to state.lastPlayed)
 * @returns Progress value (0-1) or 0 if gate not found
 */
export function getGateProgress(
	gateId: GateId,
	state: GameState,
	time?: Timestamp
): number {
	const status = getGateStatus(gateId, state, time);
	return status?.progress ?? 0;
}

