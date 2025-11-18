# 19. Item Data Tables

Item Data Tables (MVP)
This document provides data tables for item stats by rarity, slot restrictions, and stat progression. These tables are used by the equipment and crafting systems.

**Related Documentation:**
- `11-equipment-auto-equip.md` - Equipment system specification
- `12-crafting-armory.md` - Crafting system specification

## Item Slots

### Slot Types

* **Weapon**: Primary weapon slot
* **Armor**: Body armor slot
* **Off-Hand**: Shield or secondary item slot
* **Accessory**: Ring, amulet, or other accessory slot
* **Consumable**: Consumable item slot (conceptual in MVP)

### Slot Restrictions

* Each slot can only hold items of matching `itemType`
* Items cannot be equipped to wrong slots
* Each slot holds one item at a time

## Rarity Tiers

### Common Items

* **Base Stats**: Standard stat values
* **Stat Range**: 0-5 per stat
* **No Special Properties**: Basic functionality only
* **Auto-Repair**: Enabled (if policy allows)

### Uncommon Items

* **Base Stats**: +50% stat values vs common
* **Stat Range**: 3-8 per stat
* **No Special Properties**: Improved stats only (MVP)
* **Auto-Repair**: Enabled (if policy allows)

### Rare Items

* **Base Stats**: +100% stat values vs common
* **Stat Range**: 5-15 per stat
* **Special Properties**: Future system (MVP: no properties)
* **Auto-Repair**: Manual only (player must prioritize)

## Stat Progression by Slot

### Weapon Stats

* **Primary**: Attack Bonus, Damage Bonus
* **Secondary**: Skill Bonus
* **Tertiary**: Crit Safety

### Armor Stats

* **Primary**: Armor Class, Damage Reduction
* **Secondary**: Skill Bonus
* **Tertiary**: Crit Safety

### Off-Hand Stats

* **Primary**: Armor Class (shields), Damage Bonus (weapons)
* **Secondary**: Damage Reduction (shields), Attack Bonus (weapons)
* **Tertiary**: Skill Bonus, Crit Safety

### Accessory Stats

* **Primary**: Skill Bonus, Crit Safety
* **Secondary**: Balanced stats (small bonuses to multiple stats)

## Stat Values by Rarity

### Common Items

* **Attack Bonus**: 0-3
* **Damage Bonus**: 0-2
* **Armor Class**: 0-3
* **Damage Reduction**: 0-2
* **Skill Bonus**: 0-2
* **Crit Safety**: 0-1

### Uncommon Items

* **Attack Bonus**: 2-6
* **Damage Bonus**: 1-4
* **Armor Class**: 2-6
* **Damage Reduction**: 1-4
* **Skill Bonus**: 1-4
* **Crit Safety**: 1-2

### Rare Items

* **Attack Bonus**: 5-12
* **Damage Bonus**: 3-8
* **Armor Class**: 5-12
* **Damage Reduction**: 3-8
* **Skill Bonus**: 3-8
* **Crit Safety**: 2-4

(Values subject to balance tuning)

## Durability Values

* **Max Durability**: 100 (all items)
* **Durability Loss per Mission**: 1-5 (based on mission difficulty)
* **Repair Cost**: Based on rarity and damage amount
* **Repair Time**: Based on facility tier

## Item Value (Gold)

* **Common Items**: 50-200 gold
* **Uncommon Items**: 200-500 gold
* **Rare Items**: 500-2000 gold

Values used for:
* Salvage returns
* Caravan pricing
* Economy balance

## MVP Scope

For MVP, item data includes:

* ✅ 5 slot types
* ✅ 3 rarity tiers
* ✅ 6 stat types
* ✅ Stat progression by rarity
* ✅ Durability system

Future enhancements (out of MVP scope):

* Item properties (rare item special abilities)
* Item sets (set bonuses)
* Item upgrades/enhancements
* Advanced stat types

