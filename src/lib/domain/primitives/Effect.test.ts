/**
 * Effect Tests
 */

import { describe, it, expect } from 'vitest';
import {
	ModifyResourceEffect,
	SetEntityStateEffect,
	SetEntityAttributeEffect,
	SetTimerEffect,
	AddEntityTagsEffect,
	EquipItemEffect,
	UnequipItemEffect,
	RepairItemEffect,
	SalvageItemEffect,
	CreateItemEffect,
	applyEffects,
	type Effect
} from './Effect';
import { createTestAdventurer, createTestMission, createTestFacility } from '../../test-utils/testFactories';
import { Item } from '../entities/Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Timestamp } from '../valueObjects/Timestamp';
import { setTimer } from './TimerHelpers';
import type { Entity } from './Requirement';

describe('ModifyResourceEffect', () => {
	it('should add resources', () => {
		const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		const effect = new ModifyResourceEffect([new ResourceUnit('gold', 50)], 'add');
		const entities = new Map<string, Entity>();

		const result = effect.apply(entities, resources);

		expect(result.resources.get('gold')).toBe(150);
	});

	it('should subtract resources', () => {
		const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		const effect = new ModifyResourceEffect([new ResourceUnit('gold', 50)], 'subtract');
		const entities = new Map<string, Entity>();

		const result = effect.apply(entities, resources);

		expect(result.resources.get('gold')).toBe(50);
	});
});

describe('SetEntityStateEffect', () => {
	it('should set Mission state to InProgress with timers', () => {
		const mission = createTestMission({ id: 'mission-1', state: 'Available' });
		setTimer(mission, 'startedAt', Timestamp.now());
		setTimer(mission, 'endsAt', Timestamp.from(Date.now() + 60000));
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityStateEffect('mission-1', 'InProgress');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('mission-1') as { state: string } | undefined)?.state).toBe('InProgress');
	});

	it('should set Mission state to InProgress without timers (fallback)', () => {
		const mission = createTestMission({ id: 'mission-1', state: 'Available' });
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityStateEffect('mission-1', 'InProgress');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('mission-1') as { state: string } | undefined)?.state).toBe('InProgress');
	});

	it('should set Mission state to Completed with timer', () => {
		const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
		setTimer(mission, 'endsAt', Timestamp.now());
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityStateEffect('mission-1', 'Completed');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('mission-1') as { state: string } | undefined)?.state).toBe('Completed');
	});

	it('should set Mission state to Completed without timer (fallback)', () => {
		const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityStateEffect('mission-1', 'Completed');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('mission-1') as { state: string } | undefined)?.state).toBe('Completed');
	});

	it('should set Mission state to Expired', () => {
		const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityStateEffect('mission-1', 'Expired');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('mission-1') as { state: string } | undefined)?.state).toBe('Expired');
	});

	it('should set Mission to other state (fallback)', () => {
		const mission = createTestMission({ id: 'mission-1', state: 'Available' });
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityStateEffect('mission-1', 'Available');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('mission-1') as { state: string } | undefined)?.state).toBe('Available');
	});

	it('should set Adventurer state to OnMission with missionId', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
		const mission = createTestMission({ id: 'mission-1' });
		const entities = new Map<string, Entity>([
			[adventurer.id, adventurer],
			[mission.id, mission]
		]);
		const effect = new SetEntityStateEffect('adv-1', 'OnMission', 'mission-1');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('adv-1') as { state: string } | undefined)?.state).toBe('OnMission');
	});

	it('should set Adventurer state to OnMission without missionId (finds mission)', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
		const mission = createTestMission({ id: 'mission-1' });
		const entities = new Map<string, Entity>([
			[adventurer.id, adventurer],
			[mission.id, mission]
		]);
		const effect = new SetEntityStateEffect('adv-1', 'OnMission');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('adv-1') as { state: string } | undefined)?.state).toBe('OnMission');
	});

	it('should set Adventurer state to OnMission without mission (fallback)', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetEntityStateEffect('adv-1', 'OnMission');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('adv-1') as { state: string } | undefined)?.state).toBe('OnMission');
	});

	it('should set Adventurer state to Idle from OnMission', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetEntityStateEffect('adv-1', 'Idle');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('adv-1') as { state: string } | undefined)?.state).toBe('Idle');
	});

	it('should set Adventurer to other state (fallback)', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetEntityStateEffect('adv-1', 'Fatigued');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect((result.entities.get('adv-1') as { state: string } | undefined)?.state).toBe('Fatigued');
	});

	it('should set state for other entity types (fallback)', () => {
		const facility = createTestFacility({ id: 'facility-1' });
		const entities = new Map<string, Entity>([[facility.id, facility]]);
		const effect = new SetEntityStateEffect('facility-1', 'Disabled');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedFacility = result.entities.get('facility-1') as any;
		expect(updatedFacility?.state).toBe('Disabled');
	});

	it('should throw error when entity not found', () => {
		const entities = new Map<string, Entity>();
		const effect = new SetEntityStateEffect('nonexistent', 'SomeState');

		expect(() => {
			effect.apply(entities, new ResourceBundle(new Map()));
		}).toThrow('Entity nonexistent not found');
	});
});

describe('SetEntityAttributeEffect', () => {
	it('should set Adventurer xp attribute', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetEntityAttributeEffect('adv-1', 'attributes.xp', 100);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.attributes.xp).toBe(100);
	});

	it('should set Adventurer level attribute', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetEntityAttributeEffect('adv-1', 'attributes.level', 5);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.attributes.level).toBe(5);
	});

	it('should set Adventurer other attribute (fallback)', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetEntityAttributeEffect('adv-1', 'attributes.baseHP', 20);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.get('adv-1')).toBeDefined();
	});

	it('should set Facility tier attribute', () => {
		const facility = createTestFacility({ id: 'facility-1', tier: 1 });
		const entities = new Map<string, Entity>([[facility.id, facility]]);
		const effect = new SetEntityAttributeEffect('facility-1', 'attributes.tier', 3);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedFacility = result.entities.get('facility-1') as any;
		expect(updatedFacility?.attributes.tier).toBe(3);
	});

	it('should set Facility other attribute (fallback)', () => {
		const facility = createTestFacility({ id: 'facility-1' });
		const entities = new Map<string, Entity>([[facility.id, facility]]);
		const effect = new SetEntityAttributeEffect('facility-1', 'attributes.baseCapacity', 5);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.get('facility-1')).toBeDefined();
	});

	it('should set attribute for other entity types (fallback)', () => {
		const mission = createTestMission({ id: 'mission-1' });
		const entities = new Map<string, Entity>([[mission.id, mission]]);
		const effect = new SetEntityAttributeEffect('mission-1', 'attributes.dc', 20);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.get('mission-1')).toBeDefined();
	});

	it('should set direct attribute (no nesting)', () => {
		const facility = createTestFacility({ id: 'facility-1' });
		const entities = new Map<string, Entity>([[facility.id, facility]]);
		const effect = new SetEntityAttributeEffect('facility-1', 'someAttribute', 'value');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.get('facility-1')).toBeDefined();
	});

	it('should throw error when entity not found', () => {
		const entities = new Map<string, Entity>();
		const effect = new SetEntityAttributeEffect('nonexistent', 'attributes.xp', 100);

		expect(() => {
			effect.apply(entities, new ResourceBundle(new Map()));
		}).toThrow('Entity nonexistent not found');
	});
});

describe('SetTimerEffect', () => {
	it('should set timer value', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const timerValue = Timestamp.now();
		const effect = new SetTimerEffect('adv-1', 'someTimer', timerValue);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.timers.someTimer).toBe(timerValue.value);
	});

	it('should set timer to null', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		adventurer.timers['someTimer'] = Date.now();
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new SetTimerEffect('adv-1', 'someTimer', null);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.timers.someTimer).toBeNull();
	});

	it('should throw error when entity not found', () => {
		const entities = new Map<string, Entity>();
		const effect = new SetTimerEffect('nonexistent', 'timer', Timestamp.now());

		expect(() => {
			effect.apply(entities, new ResourceBundle(new Map()));
		}).toThrow('Entity nonexistent not found');
	});
});

describe('AddEntityTagsEffect', () => {
	it('should add new tags', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', tags: ['combat'] });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new AddEntityTagsEffect('adv-1', ['undead', 'dungeon']);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.tags).toContain('undead');
		expect(updatedAdventurer?.tags).toContain('dungeon');
	});

	it('should not add duplicate tags', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1', tags: ['combat'] });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new AddEntityTagsEffect('adv-1', ['combat', 'undead']);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		const combatCount = updatedAdventurer?.tags.filter((t: string) => t === 'combat').length;
		expect(combatCount).toBe(1); // Should not duplicate
		expect(updatedAdventurer?.tags).toContain('undead');
	});

	it('should throw error when entity not found', () => {
		const entities = new Map<string, Entity>();
		const effect = new AddEntityTagsEffect('nonexistent', ['tag1']);

		expect(() => {
			effect.apply(entities, new ResourceBundle(new Map()));
		}).toThrow('Entity nonexistent not found');
	});
});

describe('EquipItemEffect', () => {
	it('should equip item to adventurer', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([
			[item.id, item],
			[adventurer.id, adventurer]
		]);
		const effect = new EquipItemEffect('item-1', 'adv-1', 'weapon');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedItem = result.entities.get('item-1') as Item;
		expect(updatedItem?.state).toBe('Equipped');
		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.attributes.equipment?.weaponId).toBe('item-1');
	});

	it('should unequip existing item in slot', () => {
		const existingItem = new Item(
			Identifier.from<'ItemId'>('existing-item'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'Equipped',
			{},
			{}
		);
		const newItem = new Item(
			Identifier.from<'ItemId'>('new-item'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 2]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		adventurer.attributes.equipment = { weaponId: 'existing-item' };
		const entities = new Map<string, Entity>([
			[existingItem.id, existingItem],
			[newItem.id, newItem],
			[adventurer.id, adventurer]
		]);
		const effect = new EquipItemEffect('new-item', 'adv-1', 'weapon');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedExistingItem = result.entities.get('existing-item') as Item;
		expect(updatedExistingItem?.state).toBe('InArmory');
		const updatedNewItem = result.entities.get('new-item') as Item;
		expect(updatedNewItem?.state).toBe('Equipped');
	});

	it('should initialize equipment if not exists', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		adventurer.attributes.equipment = undefined as any;
		const entities = new Map<string, Entity>([
			[item.id, item],
			[adventurer.id, adventurer]
		]);
		const effect = new EquipItemEffect('item-1', 'adv-1', 'weapon');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.attributes.equipment?.weaponId).toBe('item-1');
	});

	it('should throw error when item not found', () => {
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
		const effect = new EquipItemEffect('nonexistent-item', 'adv-1', 'weapon');

		expect(() => {
			effect.apply(entities, new ResourceBundle(new Map()));
		}).toThrow('Item nonexistent-item not found');
	});

	it('should throw error when adventurer not found', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const entities = new Map<string, Entity>([[item.id, item]]);
		const effect = new EquipItemEffect('item-1', 'nonexistent-adv', 'weapon');

		expect(() => {
			effect.apply(entities, new ResourceBundle(new Map()));
		}).toThrow('Adventurer nonexistent-adv not found');
	});
});

describe('UnequipItemEffect', () => {
	it('should unequip item from adventurer', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'Equipped',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		adventurer.attributes.equipment = { weaponId: 'item-1' };
		const entities = new Map<string, Entity>([
			[item.id, item],
			[adventurer.id, adventurer]
		]);
		const effect = new UnequipItemEffect('item-1', 'adv-1', 'weapon');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedItem = result.entities.get('item-1') as Item;
		expect(updatedItem?.state).toBe('InArmory');
		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.attributes.equipment?.weaponId).toBeUndefined();
	});

	it('should handle item not in Equipped state', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		const entities = new Map<string, Entity>([
			[item.id, item],
			[adventurer.id, adventurer]
		]);
		const effect = new UnequipItemEffect('item-1', 'adv-1', 'weapon');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.get('item-1')).toBeDefined();
	});

	it('should handle missing equipment object', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'Equipped',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		adventurer.attributes.equipment = undefined as any;
		const entities = new Map<string, Entity>([
			[item.id, item],
			[adventurer.id, adventurer]
		]);
		const effect = new UnequipItemEffect('item-1', 'adv-1', 'weapon');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.get('item-1')).toBeDefined();
	});
});

describe('RepairItemEffect', () => {
	it('should repair item', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 50,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const entities = new Map<string, Entity>([[item.id, item]]);
		const effect = new RepairItemEffect('item-1');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedItem = result.entities.get('item-1') as Item;
		expect(updatedItem?.attributes.durability).toBe(100);
	});

	it('should transition Broken item to InArmory', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
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
		const entities = new Map<string, Entity>([[item.id, item]]);
		const effect = new RepairItemEffect('item-1');

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		const updatedItem = result.entities.get('item-1') as Item;
		expect(updatedItem?.state).toBe('InArmory');
	});
});

describe('SalvageItemEffect', () => {
	it('should salvage item in InArmory state', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const entities = new Map<string, Entity>([[item.id, item]]);
		const resources = new ResourceBundle(new Map());
		const effect = new SalvageItemEffect('item-1', 50, 0);

		const result = effect.apply(entities, resources);

		expect(result.entities.has('item-1')).toBe(false);
		expect(result.resources.get('materials')).toBe(50);
	});

	it('should unequip and salvage equipped item', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'Equipped',
			{},
			{}
		);
		const adventurer = createTestAdventurer({ id: 'adv-1' });
		adventurer.attributes.equipment = { weaponId: 'item-1' };
		const entities = new Map<string, Entity>([
			[item.id, item],
			[adventurer.id, adventurer]
		]);
		const resources = new ResourceBundle(new Map());
		const effect = new SalvageItemEffect('item-1', 50, 0);

		const result = effect.apply(entities, resources);

		expect(result.entities.has('item-1')).toBe(false);
		const updatedAdventurer = result.entities.get('adv-1') as any;
		expect(updatedAdventurer?.attributes.equipment?.weaponId).toBeUndefined();
	});

	it('should add rare essence for rare items', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'rare',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 100
			},
			[],
			'InArmory',
			{},
			{}
		);
		const entities = new Map<string, Entity>([[item.id, item]]);
		const resources = new ResourceBundle(new Map());
		const effect = new SalvageItemEffect('item-1', 0, 10);

		const result = effect.apply(entities, resources);

		expect(result.resources.get('rareEssence')).toBe(10);
	});

	it('should handle no materials or rare essence', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const entities = new Map<string, Entity>([[item.id, item]]);
		const resources = new ResourceBundle(new Map());
		const effect = new SalvageItemEffect('item-1', 0, 0);

		const result = effect.apply(entities, resources);

		expect(result.entities.has('item-1')).toBe(false);
		expect(result.resources.get('materials')).toBe(0);
	});
});

describe('CreateItemEffect', () => {
	it('should create and add item to entities', () => {
		const item = new Item(
			Identifier.from<'ItemId'>('item-1'),
			{
				itemType: 'weapon',
				rarity: 'common',
				stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
				durability: 100,
				maxDurability: 100,
				baseValue: 10
			},
			[],
			'InArmory',
			{},
			{}
		);
		const entities = new Map<string, Entity>();
		const effect = new CreateItemEffect(item);

		const result = effect.apply(entities, new ResourceBundle(new Map()));

		expect(result.entities.has('item-1')).toBe(true);
	});
});

describe('applyEffects', () => {
	it('should apply multiple effects in sequence', () => {
		const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		const effects = [
			new ModifyResourceEffect([new ResourceUnit('gold', 50)], 'add'),
			new ModifyResourceEffect([new ResourceUnit('gold', 25)], 'subtract')
		];
		const entities = new Map<string, Entity>();

		const result = applyEffects(effects, entities, resources);

		expect(result.resources.get('gold')).toBe(125); // 100 + 50 - 25
	});

	it('should handle empty effects array', () => {
		const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		const effects: Effect[] = [];
		const entities = new Map<string, Entity>();

		const result = applyEffects(effects, entities, resources);

		expect(result.resources.get('gold')).toBe(100);
	});
});

