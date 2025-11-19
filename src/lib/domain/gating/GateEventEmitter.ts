/**
 * Gate Event Emitter
 * 
 * Wrapper function to evaluate gates and emit unlock events.
 * Keeps gate evaluator pure - event emission is separate layer.
 */

import type { GameState } from '../entities/GameState';
import type { DomainEventBus } from '../../bus/DomainEventBus';
import type { GateId } from './GateDefinition';
import type { DomainEvent } from '../primitives/Event';
import { trackGateTransitions, getCurrentGateStates } from './GateStateTracker';

/**
 * Evaluate gates and emit unlock events for newly unlocked gates
 * 
 * Tracks previous gate states, evaluates current state, and emits events
 * for gates that transitioned from locked to unlocked.
 * 
 * @param previousStates Previous gate states (from last evaluation)
 * @param currentState Current GameState
 * @param eventBus DomainEventBus to emit events
 * @returns Updated gate states for next evaluation
 */
export function evaluateGatesWithEvents(
	previousStates: Record<GateId, boolean>,
	currentState: GameState,
	eventBus: DomainEventBus
): Record<GateId, boolean> {
	// Track transitions
	const newlyUnlocked = trackGateTransitions(previousStates, currentState);

	// Emit events for newly unlocked gates
	for (const eventPayload of newlyUnlocked) {
		const event: DomainEvent = {
			type: 'GateUnlocked',
			payload: eventPayload,
			timestamp: new Date().toISOString(),
		};
		eventBus.publish(event);
	}

	// Return current states for next evaluation
	return getCurrentGateStates(currentState);
}

