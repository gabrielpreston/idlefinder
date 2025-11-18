/**
 * Auto-Equip System - Pure function for automatic equipment assignment
 * Per docs/current/11-equipment-auto-equip.md:193-214
 * Returns actions to execute (does not dispatch commands)
 */

import type { Adventurer } from '../entities/Adventurer';
import type { Item } from '../entities/Item';
import type { AutoEquipRules } from '../entities/AutoEquipRules';
import { EquipItemAction } from '../actions/EquipItemAction';

export interface EquipItemResult {
	actions: EquipItemAction[];
	slot: 'weapon' | 'armor' | 'offHand' | 'accessory';
	itemId: string;
	adventurerId: string;
}

/**
 * Auto-equip system - Pure function that scores items and returns actions
 * Per plan Phase 2.2: Returns EquipItemAction[] for IdleLoop to process
 */
export function autoEquip(
	adventurer: Adventurer,
	availableItems: Item[],
	rules: AutoEquipRules
): EquipItemAction[] {
	const actions: EquipItemAction[] = [];
	const slots: Array<'weapon' | 'armor' | 'offHand' | 'accessory'> = ['weapon', 'armor', 'offHand', 'accessory'];

	for (const slot of slots) {
		const bestItem = findBestItemForSlot(adventurer, availableItems, slot, rules);
		if (bestItem) {
			const currentItemId = adventurer.attributes.equipment?.[`${slot}Id`];
			
			// Only equip if:
			// 1. Slot is empty, OR
			// 2. New item is better than current (based on scoring)
			if (!currentItemId || isItemBetter(bestItem, currentItemId, availableItems, adventurer, rules)) {
				actions.push(new EquipItemAction(bestItem.id, adventurer.id, slot));
			}
		}
	}

	return actions;
}

/**
 * Find best item for a specific slot
 */
function findBestItemForSlot(
	adventurer: Adventurer,
	availableItems: Item[],
	slot: 'weapon' | 'armor' | 'offHand' | 'accessory',
	rules: AutoEquipRules
): Item | null {
	// Filter items by slot type and availability
	const slotItems = availableItems.filter(
		(item) => 
			item.attributes.itemType === slot &&
			item.state === 'InArmory' &&
			!item.isBroken()
	);

	if (slotItems.length === 0) {
		return null;
	}

	// Filter by rare item policy
	const filteredItems = slotItems.filter((item) => {
		if (item.attributes.rarity === 'rare' && !rules.attributes.allowRareAutoEquip) {
			return false;
		}
		return true;
	});

	if (filteredItems.length === 0) {
		return null;
	}

	// Score items based on rules
	const scoredItems = filteredItems.map((item) => ({
		item,
		score: scoreItem(item, adventurer, rules)
	}));

	// Sort by score (highest first) and return best
	scoredItems.sort((a, b) => b.score - a.score);
	return scoredItems[0].item;
}

/**
 * Score item based on auto-equip rules
 */
function scoreItem(
	item: Item,
	adventurer: Adventurer,
	rules: AutoEquipRules
): number {
	const roleKey = adventurer.attributes.roleKey;
	const rolePriorities = rules.attributes.rolePriorities.get(roleKey) || [];
	const globalFocus = rules.attributes.focus;

	let score = 0;

	// Apply role-based priorities
	for (let i = 0; i < rolePriorities.length; i++) {
		const priority = rolePriorities[i];
		const statValue = item.attributes.stats.get(priority) || 0;
		// Higher priority = higher weight (reverse index)
		const weight = rolePriorities.length - i;
		score += statValue * weight;
	}

	// Apply global focus multiplier
	if (globalFocus === 'offense-first') {
		const offenseStats = (item.attributes.stats.get('attackBonus') || 0) + 
		                   (item.attributes.stats.get('damageBonus') || 0);
		score += offenseStats * 2;
	} else if (globalFocus === 'defense-first') {
		const defenseStats = (item.attributes.stats.get('armorClass') || 0) + 
		                    (item.attributes.stats.get('damageReduction') || 0);
		score += defenseStats * 2;
	}

	// Rarity bonus (rare items get slight boost)
	if (item.attributes.rarity === 'rare') {
		score *= 1.1;
	} else if (item.attributes.rarity === 'uncommon') {
		score *= 1.05;
	}

	return score;
}

/**
 * Check if new item is better than current item
 */
function isItemBetter(
	newItem: Item,
	currentItemId: string,
	availableItems: Item[],
	adventurer: Adventurer,
	rules: AutoEquipRules
): boolean {
	const currentItem = availableItems.find((item) => item.id === currentItemId);
	if (!currentItem) {
		return true; // Current item not found, new item is better
	}

	const newScore = scoreItem(newItem, adventurer, rules);
	const currentScore = scoreItem(currentItem, adventurer, rules);

	return newScore > currentScore;
}

