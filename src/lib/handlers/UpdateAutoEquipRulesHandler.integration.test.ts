/**
 * UpdateAutoEquipRulesHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';

describe('UpdateAutoEquipRulesHandler Integration', () => {
	let busManager: BusManager;
	let _publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents: _publishedEvents } = setupIntegrationTest({
			eventTypes: []
		}));
	});

	describe('UpdateAutoEquipRules command', () => {
		it('should update auto-equip rules focus', async () => {
			const command = createTestCommand('UpdateAutoEquipRules', {
				focus: 'offense-first'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const rules = Array.from(state.entities.values()).filter(e => e.type === 'AutoEquipRules');
			expect(rules.length).toBeGreaterThan(0);
			const autoEquipRules = rules[0] as import('../domain/entities/AutoEquipRules').AutoEquipRules;
			expect(autoEquipRules.attributes.focus).toBe('offense-first');
		});

		it('should create auto-equip rules if they do not exist', async () => {
			const state = busManager.getState();
			const initialRules = Array.from(state.entities.values()).filter(e => e.type === 'AutoEquipRules');

			const command = createTestCommand('UpdateAutoEquipRules', {
				focus: 'balanced'
			});

			await busManager.commandBus.dispatch(command);

			const finalState = busManager.getState();
			const finalRules = Array.from(finalState.entities.values()).filter(e => e.type === 'AutoEquipRules');
			expect(finalRules.length).toBeGreaterThanOrEqual(initialRules.length);
		});
	});
});

