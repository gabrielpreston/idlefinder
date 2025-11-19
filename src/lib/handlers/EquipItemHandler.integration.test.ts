/**
 * EquipItemHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestAdventurer } from '../test-utils/testFactories';
import { Item } from '../domain/entities/Item';
import { Identifier } from '../domain/valueObjects/Identifier';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import type { Entity } from '../domain/primitives/Requirement';

function createTestItem(id: string, state: 'InArmory' | 'Equipped' = 'InArmory'): Item {
	const itemId = Identifier.from<'ItemId'>(id);
	return new Item(
		itemId,
		{
			itemType: 'weapon',
			rarity: 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability: 100,
			maxDurability: 100,
			baseValue: 10
		},
		[],
		state,
		{},
		{}
	);
}

describe('EquipItemHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['ItemEquipped', 'CommandFailed']
		}));
	});

	describe('EquipItem command', () => {
		it('should equip item to adventurer', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const item = createTestItem('item-1', 'InArmory');
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(adventurer.id, adventurer);
			entities.set(item.id, item);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('EquipItem', {
				itemId: 'item-1',
				adventurerId: 'adv-1',
				slot: 'weapon'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const updatedItem = state.entities.get('item-1') as Item;
			expect(updatedItem.state).toBe('Equipped');
		});

		it('should fail when item not found', async () => {
			const command = createTestCommand('EquipItem', {
				itemId: 'nonexistent',
				adventurerId: 'adv-1',
				slot: 'weapon'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when adventurer not found', async () => {
			const item = createTestItem('item-1');
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(item.id, item);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('EquipItem', {
				itemId: 'item-1',
				adventurerId: 'nonexistent',
				slot: 'weapon'
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});
	});
});

