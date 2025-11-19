/**
 * Gate State Tracker Tests
 * 
 * Unit tests for gate state tracking and transition detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { trackGateTransitions, getCurrentGateStates } from './GateStateTracker';
import { createTestGameState } from '../../test-utils/testFactories';
import type { GameState } from '../entities/GameState';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Facility } from '../entities/Facility';
// Import to ensure gates are registered
import '../gating';

describe('GateStateTracker', () => {
	let state: GameState;

	beforeEach(() => {
		state = createTestGameState();
	});

	describe('getCurrentGateStates', () => {
		it('should return gate states for all gates', () => {
			const states = getCurrentGateStates(state);
			expect(Object.keys(states).length).toBeGreaterThan(0);
			expect(states['mission_tier_1']).toBe(true); // Tier 1 unlocked at 0 fame
			expect(states['mission_tier_2']).toBe(false); // Tier 2 requires 100 fame
		});
	});

	describe('trackGateTransitions', () => {
		it('should detect newly unlocked gates', () => {
			// Start with initial state (0 fame) - track all gates
			const previousStates = getCurrentGateStates(state);
			// Verify mission_tier_2 is locked
			expect(previousStates['mission_tier_2']).toBe(false);

			// Add fame to unlock tier 2
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 100),
			]);
			const stateWithFame = createTestGameState({ resources });

			const events = trackGateTransitions(previousStates, stateWithFame);
			// Should detect mission_tier_2 unlocking
			const tier2Event = events.find((e) => e.gateId === 'mission_tier_2');
			expect(tier2Event).toBeDefined();
			expect(tier2Event?.gateType).toBe('mission_tier');
		});

		it('should not emit events for already unlocked gates', () => {
			// Create state with 100 fame
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 100),
			]);
			const stateWithFame = createTestGameState({ resources });

			// Get states after fame is added (mission_tier_2 should be unlocked)
			const previousStates = getCurrentGateStates(stateWithFame);
			// Verify mission_tier_2 is unlocked
			expect(previousStates['mission_tier_2']).toBe(true);

			// Compare same state - should produce no transitions
			const events = trackGateTransitions(previousStates, stateWithFame);
			// mission_tier_2 should not be in events since it was already unlocked
			const tier2Event = events.find((e) => e.gateId === 'mission_tier_2');
			expect(tier2Event).toBeUndefined();
		});

		it('should not emit events for gates that remain locked', () => {
			// Track all current gate states
			const previousStates = getCurrentGateStates(state);
			// Verify mission_tier_2 is locked
			expect(previousStates['mission_tier_2']).toBe(false);

			// Compare same state - mission_tier_2 should remain locked
			const events = trackGateTransitions(previousStates, state);
			// mission_tier_2 should not be in the events since it's still locked
			const tier2Event = events.find((e) => e.gateId === 'mission_tier_2');
			expect(tier2Event).toBeUndefined();
		});

		it('should detect multiple newly unlocked gates', () => {
			const previousStates: Record<string, boolean> = {
				'mission_tier_1': true,
				'mission_tier_2': false,
				'mission_tier_3': false,
				'facility_tier_2': false,
				'facility_tier_3': false,
			};

			// Add enough fame to unlock tiers 2 and 3 (both mission and facility)
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 500),
			]);
			const stateWithFame = createTestGameState({ resources });

			const events = trackGateTransitions(previousStates, stateWithFame);
			expect(events.length).toBeGreaterThanOrEqual(2);
			expect(events.map((e) => e.gateId)).toContain('mission_tier_2');
			expect(events.map((e) => e.gateId)).toContain('mission_tier_3');
		});

		it('should include gate metadata in events', () => {
			const previousStates: Record<string, boolean> = {
				'ui_panel_adventurers': false,
				'ui_panel_missions': false,
			};

			// Upgrade Guild Hall to unlock panels
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			const events = trackGateTransitions(previousStates, state);
			expect(events.length).toBeGreaterThanOrEqual(1);
			const adventurersEvent = events.find((e) => e.gateId === 'ui_panel_adventurers');
			expect(adventurersEvent).toBeDefined();
			expect(adventurersEvent?.gateType).toBe('ui_panel');
			expect(adventurersEvent?.gateName).toBe('Adventurers Panel');
		});
	});
});

