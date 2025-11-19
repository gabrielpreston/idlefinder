/**
 * Gate State Tracker
 * 
 * Pure function to track gate state transitions and detect newly unlocked gates.
 * Follows handler pattern from indexV2.ts:37-38 (store previous state, compare with new).
 */

import type { GateId } from './GateDefinition';
import type { GateUnlockedEvent } from '../primitives/Event';
import { gateRegistry } from './GateRegistry';
import { isGateUnlocked } from './GateQueries';
import type { GameState } from '../entities/GameState';

/**
 * Track gate transitions and return newly unlocked gates
 * 
 * Pure function: compares previous and current gate states to detect transitions.
 * Follows handler pattern of storing previous state and comparing.
 * 
 * @param previousStates Record of gateId to unlocked status (from previous evaluation)
 * @param currentState Current GameState
 * @returns Array of GateUnlockedEvent for gates that transitioned from locked to unlocked
 */
export function trackGateTransitions(
	previousStates: Record<GateId, boolean>,
	currentState: GameState
): GateUnlockedEvent[] {
	const events: GateUnlockedEvent[] = [];
	const allGates = gateRegistry.getAll();

	for (const gate of allGates) {
		const wasUnlocked = previousStates[gate.id] ?? false;
		const isUnlocked = isGateUnlocked(gate.id, currentState);

		// Detect transition from locked to unlocked
		if (!wasUnlocked && isUnlocked) {
			events.push({
				gateId: gate.id,
				gateType: gate.type,
				gateName: gate.name,
			});
		}
	}

	return events;
}

/**
 * Get current gate states for all gates
 * 
 * @param state Current GameState
 * @returns Record of gateId to unlocked status
 */
export function getCurrentGateStates(state: GameState): Record<GateId, boolean> {
	const states: Record<GateId, boolean> = {};
	const allGates = gateRegistry.getAll();

	for (const gate of allGates) {
		states[gate.id] = isGateUnlocked(gate.id, state);
	}

	return states;
}

