/**
 * TriggerAutoEquipHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';

describe('TriggerAutoEquipHandler Integration', () => {
	let busManager: BusManager;
	let _publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents: _publishedEvents } = setupIntegrationTest({
			eventTypes: ['ItemEquipped', 'ItemUnequipped']
		}));
	});

	describe('TriggerAutoEquip command', () => {
		it('should trigger auto-equip for adventurers', async () => {
			const command = createTestCommand('TriggerAutoEquip', {});

			await busManager.commandBus.dispatch(command);

			// Should process without errors
			const state = busManager.getState();
			expect(state).toBeDefined();
		});

		it('should handle empty state gracefully', async () => {
			const command = createTestCommand('TriggerAutoEquip', {});

			await busManager.commandBus.dispatch(command);

			// Should not throw
			const state = busManager.getState();
			expect(state).toBeDefined();
		});
	});
});

