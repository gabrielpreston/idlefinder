/**
 * RepairItemHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { Item } from '../domain/entities/Item';
import { Identifier } from '../domain/valueObjects/Identifier';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import type { Entity } from '../domain/primitives/Requirement';
import { GameConfig } from '../domain/config/GameConfig';

function createTestItem(id: string, durability: number = GameConfig.items.maxDurability): Item {
	const itemId = Identifier.from<'ItemId'>(id);
	return new Item(
		itemId,
		{
			itemType: 'weapon',
			rarity: 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability,
			maxDurability: GameConfig.items.maxDurability,
			baseValue: 10
		},
		[],
		durability > 0 ? 'InArmory' : 'Broken',
		{},
		{}
	);
}

describe('RepairItemHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['ItemRepaired', 'CommandFailed']
		}));
	});

	describe('RepairItem command', () => {
		it('should repair damaged item', async () => {
			const item = createTestItem('item-1', 50); // Damaged
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(item.id, item);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('RepairItem', {
				itemId: 'item-1'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const updatedItem = state.entities.get('item-1') as Item;
			expect(updatedItem.attributes.durability).toBe(100);
		});

		it('should fail when item not found', async () => {
			const command = createTestCommand('RepairItem', {
				itemId: 'nonexistent'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});
	});
});

