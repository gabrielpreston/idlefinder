/**
 * SalvageItemHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { Item } from '../domain/entities/Item';
import { Identifier } from '../domain/valueObjects/Identifier';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import type { Entity } from '../domain/primitives/Requirement';

function createTestItem(id: string): Item {
	const itemId = Identifier.from<'ItemId'>(id);
	return new Item(
		itemId,
		{
			itemType: 'weapon',
			rarity: 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability: 0,
			maxDurability: 100,
			baseValue: 10
		},
		[],
		'Broken',
		{},
		{}
	);
}

describe('SalvageItemHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['ItemSalvaged', 'CommandFailed', 'ResourcesChanged']
		}));
	});

	describe('SalvageItem command', () => {
		it('should salvage broken item and add materials', async () => {
			const item = createTestItem('item-1');
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(item.id, item);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('SalvageItem', {
				itemId: 'item-1',
				materialsAmount: 5
			});

			await busManager.commandBus.dispatch(command);

			// Item should be removed
			const state = busManager.getState();
			expect(state.entities.has('item-1')).toBe(false);

			// Resources should be updated
			expect(state.resources.get('materials')).toBeGreaterThan(0);
		});

		it('should fail when item not found', async () => {
			const command = createTestCommand('SalvageItem', {
				itemId: 'nonexistent',
				materialsAmount: 5
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});
	});
});

