/**
 * Gate Registry Tests
 * 
 * Unit tests for gate registry functionality.
 * Tests registration, lookup, and querying methods.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GateRegistry, gateRegistry } from './GateRegistry';
import type { GateDefinition } from './GateDefinition';
import { resourceCondition } from './conditions/GateConditions';

describe('GateRegistry', () => {
	let registry: GateRegistry;

	beforeEach(() => {
		registry = new GateRegistry();
	});

	describe('register', () => {
		it('should register a valid gate', () => {
			const gate: GateDefinition = {
				id: 'test-gate-1',
				type: 'custom',
				name: 'Test Gate 1',
				conditions: [resourceCondition('gold', 100)],
			};

			expect(() => { registry.register(gate); }).not.toThrow();
			expect(registry.get('test-gate-1')).toEqual(gate);
		});

		it('should throw error for duplicate gate ID', () => {
			const gate1: GateDefinition = {
				id: 'test-gate-1',
				type: 'custom',
				name: 'Test Gate 1',
				conditions: [],
			};
			const gate2: GateDefinition = {
				id: 'test-gate-1',
				type: 'custom',
				name: 'Test Gate 2',
				conditions: [],
			};

			registry.register(gate1);
			expect(() => { registry.register(gate2); }).toThrow('already registered');
		});
	});

	describe('registerAll', () => {
		it('should register multiple gates', () => {
			const gates: GateDefinition[] = [
				{
					id: 'test-gate-1',
					type: 'custom',
					name: 'Test Gate 1',
					conditions: [],
				},
				{
					id: 'test-gate-2',
					type: 'custom',
					name: 'Test Gate 2',
					conditions: [],
				},
			];

			registry.registerAll(gates);
			expect(registry.get('test-gate-1')).toBeDefined();
			expect(registry.get('test-gate-2')).toBeDefined();
		});

		it('should throw error if any gate is duplicate', () => {
			const gates: GateDefinition[] = [
				{
					id: 'test-gate-1',
					type: 'custom',
					name: 'Test Gate 1',
					conditions: [],
				},
				{
					id: 'test-gate-1',
					type: 'custom',
					name: 'Test Gate 2',
					conditions: [],
				},
			];

			expect(() => { registry.registerAll(gates); }).toThrow('already registered');
		});
	});

	describe('get', () => {
		it('should return correct gate by ID', () => {
			const gate: GateDefinition = {
				id: 'test-gate-1',
				type: 'custom',
				name: 'Test Gate 1',
				conditions: [],
			};

			registry.register(gate);
			const retrieved = registry.get('test-gate-1');
			expect(retrieved).toEqual(gate);
		});

		it('should return undefined for missing gate', () => {
			const retrieved = registry.get('non-existent-gate');
			expect(retrieved).toBeUndefined();
		});
	});

	describe('getByType', () => {
		it('should filter gates by type', () => {
			const gates: GateDefinition[] = [
				{
					id: 'ui-panel-1',
					type: 'ui_panel',
					name: 'UI Panel 1',
					conditions: [],
				},
				{
					id: 'mission-tier-1',
					type: 'mission_tier',
					name: 'Mission Tier 1',
					conditions: [],
				},
				{
					id: 'ui-panel-2',
					type: 'ui_panel',
					name: 'UI Panel 2',
					conditions: [],
				},
			];

			registry.registerAll(gates);
			const uiPanels = registry.getByType('ui_panel');
			expect(uiPanels).toHaveLength(2);
			expect(uiPanels.every((g) => g.type === 'ui_panel')).toBe(true);
		});

		it('should return empty array for type with no gates', () => {
			const gates: GateDefinition[] = [
				{
					id: 'ui-panel-1',
					type: 'ui_panel',
					name: 'UI Panel 1',
					conditions: [],
				},
			];

			registry.registerAll(gates);
			const missionTiers = registry.getByType('mission_tier');
			expect(missionTiers).toHaveLength(0);
		});
	});

	describe('getAll', () => {
		it('should return all registered gates', () => {
			const gates: GateDefinition[] = [
				{
					id: 'gate-1',
					type: 'custom',
					name: 'Gate 1',
					conditions: [],
				},
				{
					id: 'gate-2',
					type: 'custom',
					name: 'Gate 2',
					conditions: [],
				},
				{
					id: 'gate-3',
					type: 'custom',
					name: 'Gate 3',
					conditions: [],
				},
			];

			registry.registerAll(gates);
			const allGates = registry.getAll();
			expect(allGates).toHaveLength(3);
			expect(allGates.map((g) => g.id)).toEqual(['gate-1', 'gate-2', 'gate-3']);
		});

		it('should return empty array when no gates registered', () => {
			const allGates = registry.getAll();
			expect(allGates).toHaveLength(0);
		});
	});

	describe('findByMetadata', () => {
		it('should find gates by metadata category', () => {
			const gates: GateDefinition[] = [
				{
					id: 'gate-1',
					type: 'ui_panel',
					name: 'Gate 1',
					conditions: [],
					metadata: { category: 'ui' },
				},
				{
					id: 'gate-2',
					type: 'mission_tier',
					name: 'Gate 2',
					conditions: [],
					metadata: { category: 'progression' },
				},
				{
					id: 'gate-3',
					type: 'ui_panel',
					name: 'Gate 3',
					conditions: [],
					metadata: { category: 'ui' },
				},
			];

			registry.registerAll(gates);
			const uiGates = registry.findByMetadata({ category: 'ui' });
			expect(uiGates).toHaveLength(2);
			expect(uiGates.every((g) => g.metadata?.category === 'ui')).toBe(true);
		});

		it('should find gates by metadata icon', () => {
			const gates: GateDefinition[] = [
				{
					id: 'gate-1',
					type: 'ui_panel',
					name: 'Gate 1',
					conditions: [],
					metadata: { icon: 'users' },
				},
				{
					id: 'gate-2',
					type: 'ui_panel',
					name: 'Gate 2',
					conditions: [],
					metadata: { icon: 'map' },
				},
			];

			registry.registerAll(gates);
			const userGates = registry.findByMetadata({ icon: 'users' });
			expect(userGates).toHaveLength(1);
			expect(userGates[0].id).toBe('gate-1');
		});

		it('should return empty array when no gates match metadata', () => {
			const gates: GateDefinition[] = [
				{
					id: 'gate-1',
					type: 'custom',
					name: 'Gate 1',
					conditions: [],
					metadata: { category: 'ui' },
				},
			];

			registry.registerAll(gates);
			const results = registry.findByMetadata({ category: 'progression' });
			expect(results).toHaveLength(0);
		});

		it('should return empty array for gates without metadata', () => {
			const gates: GateDefinition[] = [
				{
					id: 'gate-1',
					type: 'custom',
					name: 'Gate 1',
					conditions: [],
				},
			];

			registry.registerAll(gates);
			const results = registry.findByMetadata({ category: 'ui' });
			expect(results).toHaveLength(0);
		});
	});

	describe('singleton instance', () => {
		it('should export singleton gateRegistry instance', () => {
			expect(gateRegistry).toBeDefined();
			expect(gateRegistry).toBeInstanceOf(GateRegistry);
		});
	});
});

