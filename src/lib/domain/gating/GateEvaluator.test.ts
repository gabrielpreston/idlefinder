/**
 * Gate Evaluator Tests
 * 
 * Unit tests for gate evaluation logic.
 * Tests all condition types and gate evaluation scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GateEvaluator } from './GateEvaluator';
import type { GateDefinition } from './GateDefinition';
import type { GameState } from '../entities/GameState';
import { createTestGameState } from '../../test-utils/testFactories';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Facility } from '../entities/Facility';
import { Identifier } from '../valueObjects/Identifier';
import type { FacilityAttributes } from '../attributes/FacilityAttributes';
import {
	resourceCondition,
	entityTierCondition,
	entityExistsCondition,
	fameMilestoneCondition,
	allConditions,
	anyCondition,
} from './conditions/GateConditions';

describe('GateEvaluator', () => {
	let evaluator: GateEvaluator;
	let state: GameState;

	beforeEach(() => {
		evaluator = new GateEvaluator();
		state = createTestGameState();
	});

	describe('resourceCondition evaluation', () => {
		it('should be satisfied when resource >= minAmount', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
			]);
			const stateWithGold = createTestGameState({ resources });

			const condition = resourceCondition('gold', 50);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			expect(result.unlocked).toBe(true);
			expect(result.conditionResults[0].satisfied).toBe(true);
			expect(result.conditionResults[0].progress).toBe(1);
		});

		it('should not be satisfied when resource < minAmount', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 25),
			]);
			const stateWithGold = createTestGameState({ resources });

			const condition = resourceCondition('gold', 50);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
			expect(result.conditionResults[0].progress).toBe(0.5);
			expect(result.conditionResults[0].reason).toContain('Need 50 gold');
		});

		it('should calculate progress correctly', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 75),
			]);
			const stateWithGold = createTestGameState({ resources });

			const condition = resourceCondition('gold', 100);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			expect(result.conditionResults[0].progress).toBe(0.75);
		});

		it('should cap progress at 1.0', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 200),
			]);
			const stateWithGold = createTestGameState({ resources });

			const condition = resourceCondition('gold', 100);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			expect(result.conditionResults[0].progress).toBe(1);
		});
	});

	describe('entityTierCondition evaluation', () => {
		it('should be satisfied when entity tier >= minTier', () => {
			const guildhallId = Identifier.from<'FacilityId'>('facility-guildhall-1');
			const attributes: FacilityAttributes = {
				facilityType: 'Guildhall',
				tier: 2,
				baseCapacity: 1,
				bonusMultipliers: {},
			};
			const guildhall = new Facility(
				guildhallId,
				attributes,
				[],
				'Online',
				{},
				{}
			);

			const entities = new Map(state.entities);
			entities.set(guildhall.id, guildhall);
			const stateWithGuildhall = createTestGameState({ entities });

			const condition = entityTierCondition('Facility', 'Guildhall', 1);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGuildhall);
			expect(result.unlocked).toBe(true);
			expect(result.conditionResults[0].satisfied).toBe(true);
		});

		it('should not be satisfied when entity tier < minTier', () => {
			const guildhallId = Identifier.from<'FacilityId'>('facility-guildhall-1');
			const attributes: FacilityAttributes = {
				facilityType: 'Guildhall',
				tier: 0,
				baseCapacity: 1,
				bonusMultipliers: {},
			};
			const guildhall = new Facility(
				guildhallId,
				attributes,
				[],
				'Online',
				{},
				{}
			);

			const entities = new Map(state.entities);
			entities.set(guildhall.id, guildhall);
			const stateWithGuildhall = createTestGameState({ entities });

			const condition = entityTierCondition('Facility', 'Guildhall', 1);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGuildhall);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
			expect(result.conditionResults[0].reason).toContain('tier 1');
		});

		it('should not be satisfied when entity does not exist', () => {
			const condition = entityTierCondition('Facility', 'TrainingGrounds', 1);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, state);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
			expect(result.conditionResults[0].reason).toContain('not found');
			expect(result.conditionResults[0].progress).toBe(0);
		});

		it('should calculate progress correctly', () => {
			const guildhallId = Identifier.from<'FacilityId'>('facility-guildhall-1');
			const attributes: FacilityAttributes = {
				facilityType: 'Guildhall',
				tier: 2,
				baseCapacity: 1,
				bonusMultipliers: {},
			};
			const guildhall = new Facility(
				guildhallId,
				attributes,
				[],
				'Online',
				{},
				{}
			);

			const entities = new Map(state.entities);
			entities.set(guildhall.id, guildhall);
			const stateWithGuildhall = createTestGameState({ entities });

			const condition = entityTierCondition('Facility', 'Guildhall', 4);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGuildhall);
			expect(result.conditionResults[0].progress).toBe(0.5); // 2/4
		});
	});

	describe('entityExistsCondition evaluation', () => {
		it('should be satisfied when entity exists', () => {
			const guildhallId = Identifier.from<'FacilityId'>('facility-guildhall-1');
			const attributes: FacilityAttributes = {
				facilityType: 'Guildhall',
				tier: 1,
				baseCapacity: 1,
				bonusMultipliers: {},
			};
			const guildhall = new Facility(
				guildhallId,
				attributes,
				[],
				'Online',
				{},
				{}
			);

			const entities = new Map(state.entities);
			entities.set(guildhall.id, guildhall);
			const stateWithGuildhall = createTestGameState({ entities });

			const condition = entityExistsCondition('Facility', 'Guildhall');
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithGuildhall);
			expect(result.unlocked).toBe(true);
			expect(result.conditionResults[0].satisfied).toBe(true);
			expect(result.conditionResults[0].progress).toBe(1);
		});

		it('should not be satisfied when entity missing', () => {
			const condition = entityExistsCondition('Facility', 'TrainingGrounds');
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, state);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
			expect(result.conditionResults[0].reason).toContain('does not exist');
			expect(result.conditionResults[0].progress).toBe(0);
		});
	});

	describe('fameMilestoneCondition evaluation', () => {
		it('should be satisfied when fame >= minFame', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 100),
			]);
			const stateWithFame = createTestGameState({ resources });

			const condition = fameMilestoneCondition(50);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithFame);
			expect(result.unlocked).toBe(true);
			expect(result.conditionResults[0].satisfied).toBe(true);
		});

		it('should not be satisfied when fame < minFame', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 25),
			]);
			const stateWithFame = createTestGameState({ resources });

			const condition = fameMilestoneCondition(50);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithFame);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
			expect(result.conditionResults[0].reason).toContain('Need 50 fame');
		});

		it('should calculate progress correctly', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 75),
			]);
			const stateWithFame = createTestGameState({ resources });

			const condition = fameMilestoneCondition(100);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithFame);
			expect(result.conditionResults[0].progress).toBe(0.75);
		});
	});

	describe('allConditions composite evaluation', () => {
		it('should be satisfied when all sub-conditions satisfied', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 50),
			]);
			const stateWithResources = createTestGameState({ resources });

			const condition = allConditions(
				resourceCondition('gold', 50),
				fameMilestoneCondition(25)
			);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(true);
			expect(result.conditionResults[0].satisfied).toBe(true);
		});

		it('should not be satisfied when any sub-condition fails', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 10),
			]);
			const stateWithResources = createTestGameState({ resources });

			const condition = allConditions(
				resourceCondition('gold', 50),
				fameMilestoneCondition(25)
			);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
		});
	});

	describe('anyCondition composite evaluation', () => {
		it('should be satisfied when any sub-condition satisfied', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 10),
			]);
			const stateWithResources = createTestGameState({ resources });

			const condition = anyCondition(
				resourceCondition('gold', 50),
				fameMilestoneCondition(25)
			);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(true);
			expect(result.conditionResults[0].satisfied).toBe(true);
		});

		it('should not be satisfied when all sub-conditions fail', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 10),
				new ResourceUnit('fame', 10),
			]);
			const stateWithResources = createTestGameState({ resources });

			const condition = anyCondition(
				resourceCondition('gold', 50),
				fameMilestoneCondition(25)
			);
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [condition],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
		});
	});

	describe('gate evaluation logic', () => {
		it('should unlock gate with single condition', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
			]);
			const stateWithGold = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [resourceCondition('gold', 50)],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			expect(result.unlocked).toBe(true);
		});

		it('should require all conditions (AND logic)', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 50),
			]);
			const stateWithResources = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [
					resourceCondition('gold', 50),
					fameMilestoneCondition(25),
				],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(true);
		});

		it('should fail when any condition fails (AND logic)', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 10),
			]);
			const stateWithResources = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [
					resourceCondition('gold', 50),
					fameMilestoneCondition(25),
				],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(false);
		});

		it('should support alternatives (OR logic)', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 10),
				new ResourceUnit('fame', 50),
			]);
			const stateWithResources = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [resourceCondition('gold', 100)],
				alternatives: [[fameMilestoneCondition(25)]],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.unlocked).toBe(true);
		});

		it('should unlock gate with empty conditions', () => {
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [],
			};

			const result = evaluator.evaluate(gate, state);
			expect(result.unlocked).toBe(true);
		});

		it('should calculate progress for multiple conditions', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 50),
				new ResourceUnit('fame', 25),
			]);
			const stateWithResources = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [
					resourceCondition('gold', 100), // 0.5 progress
					fameMilestoneCondition(50), // 0.5 progress
				],
			};

			const result = evaluator.evaluate(gate, stateWithResources);
			expect(result.progress).toBe(0.5); // Average of 0.5 and 0.5
		});

		it('should generate unlock reason when locked', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 25),
			]);
			const stateWithGold = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [resourceCondition('gold', 50)],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			expect(result.unlocked).toBe(false);
			expect(result.unlockReason).toBeDefined();
			expect(result.unlockReason).toContain('gold');
		});

		it('should extract next threshold information', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 75),
			]);
			const stateWithFame = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [fameMilestoneCondition(100)],
			};

			const result = evaluator.evaluate(gate, stateWithFame);
			expect(result.nextThreshold).toBeDefined();
			expect(result.nextThreshold?.threshold).toBe(100);
			expect(result.nextThreshold?.current).toBe(75);
			expect(result.nextThreshold?.remaining).toBe(25);
		});
	});

	describe('edge cases', () => {
		it('should handle unknown condition type', () => {
			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [
					{
						type: 'unknown_type',
						params: {},
					},
				],
			};

			const result = evaluator.evaluate(gate, state);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].satisfied).toBe(false);
			expect(result.conditionResults[0].reason).toContain('Unknown condition type');
		});

		it('should handle zero resources', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 0),
			]);
			const stateWithZero = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [resourceCondition('gold', 50)],
			};

			const result = evaluator.evaluate(gate, stateWithZero);
			expect(result.unlocked).toBe(false);
			expect(result.conditionResults[0].progress).toBe(0);
		});

		it('should handle missing resource type', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
			]);
			const stateWithGold = createTestGameState({ resources });

			const gate: GateDefinition = {
				id: 'test-gate',
				type: 'custom',
				name: 'Test Gate',
				conditions: [resourceCondition('fame', 50)],
			};

			const result = evaluator.evaluate(gate, stateWithGold);
			// ResourceBundle.get() returns 0 for missing resources
			expect(result.unlocked).toBe(false);
		});
	});
});

