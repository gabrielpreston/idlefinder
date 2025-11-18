# 12. Crafting & Armory

Crafting and Armory Operations Specification (MVP)
This document describes the crafting system for Idlefinder, which allows players to create and manage equipment. Crafting is a hands-on system that complements the equipment system, providing the primary way to obtain better gear.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.4.5 - Crafting (MVP)
- `11-equipment-auto-equip.md` - Equipment system (crafting output)
- `13-facilities-upgrades.md` - Facilities (Armory facility)

## Overview

Crafting is the primary way players create equipment. It's a hands-on system where players:

* Define crafting queues (what to craft and in what order)
* Spend resources (materials, gold, time) to create items
* Manage the Armory (storage for crafted and found items)
* Integrate with auto-equip (newly crafted items may be automatically equipped)

Crafting runs via **queues** - players set up a queue of items to craft, and the system processes them automatically.

## Crafting System (MVP)

### Simple Crafting Model

MVP crafting is intentionally simple:

* **Common → Uncommon → Rare** progression
* No complex crafting trees
* No runes or properties (future system)
* Straightforward resource costs

### Crafting Recipes

Each craftable item has a recipe:

```typescript
CraftingRecipe = {
  itemType: "weapon" | "armor" | "offHand" | "accessory",
  rarity: "common" | "uncommon" | "rare",
  input: {
    materials: number,        // Generic materials required
    rareEssence?: number,     // Rare essence required (for rare items)
    gold: number             // Gold cost
  },
  duration: number,          // Crafting time in milliseconds
  output: {
    itemId: string           // Item template ID to create
  }
}
```

### Crafting Progression

* **Common Items**: Craft directly from materials
* **Uncommon Items**: Craft from materials (higher cost than common)
* **Rare Items**: Craft from materials + rare essence (highest cost)

### Crafting Queue

Crafting runs via a queue system:

1. **Queue Slots**: 1 free slot, additional slots via monetization
2. **Queue Management**: Player defines queue order
3. **Automatic Processing**: System automatically starts next item when slot available
4. **Queue Examples**:
   * "Craft 3 common armors → 2 uncommon weapons → 1 rare accessory"

### Crafting Process

1. **Player Adds to Queue**: Player selects recipe and adds to crafting queue
2. **Check Resources**: System verifies required resources are available
3. **Reserve Resources**: Resources are reserved (not spent until crafting starts)
4. **Wait for Slot**: Queue waits for available crafting slot
5. **Start Crafting**: When slot available, crafting starts:
   * Resources are spent
   * Timer starts (`craftingCompleteAt = now + duration`)
6. **Complete Crafting**: When timer expires:
   * Item is created
   * Item added to Armory
   * Auto-equip may equip new item (if better than current)
   * Crafting slot becomes available
   * Next item in queue starts automatically

### Crafting Times

Crafting takes real-world time:

* **Common Items**: Short duration (e.g., 5 minutes)
* **Uncommon Items**: Medium duration (e.g., 15 minutes)
* **Rare Items**: Long duration (e.g., 60 minutes)

Times may be reduced by facility tiers (future system).

### Crafting Costs

Crafting costs resources:

* **Materials**: Generic materials (from missions, salvage, caravans)
* **Rare Essence**: Rare essence (from salvaging rare items)
* **Gold**: Gold cost (scales with rarity)

Costs scale with item rarity:
* Common: Low cost
* Uncommon: Medium cost (2-3x common)
* Rare: High cost (5-10x common) + rare essence

## Armory Operations

The Armory is the storage system for all items (crafted and found).

### Armory Structure

* **Storage**: All items with `state === "InArmory"` are stored in Armory
* **Capacity**: Determined by facility tier (Resource Depot or dedicated Armory facility)
* **Organization**: Items organized by type, rarity, slot

### Armory Management

* **Item Storage**: Crafted items automatically added to Armory
* **Item Retrieval**: Auto-equip system retrieves items from Armory
* **Item Organization**: Player can view items by slot, rarity, stats
* **Item Comparison**: System compares items for auto-equip decisions

### Armory Capacity

* **Base Capacity**: Starting storage capacity
* **Facility Bonus**: +X capacity per facility tier
* **Maximum Capacity**: `baseCapacity + facilityTierBonus`

If Armory reaches capacity, new items cannot be added until space is freed (via equipping, salvaging, or capacity upgrade).

## Integration with Auto-Equip

When crafting completes:

1. **Item Created**: New item added to Armory
2. **Auto-Equip Trigger**: Auto-equip system checks if new item improves any adventurer
3. **Automatic Equipping**: If item is better (based on auto-equip rules), it's automatically equipped
4. **Old Item Handling**: Previously equipped item returns to Armory (if replaced)

This ensures newly crafted items are immediately utilized if they improve the roster.

## Crafting Recipes (MVP Examples)

### Common Items

* **Common Weapon**: 10 materials, 50 gold, 5 minutes
* **Common Armor**: 15 materials, 75 gold, 5 minutes
* **Common Off-Hand**: 8 materials, 40 gold, 5 minutes
* **Common Accessory**: 5 materials, 25 gold, 5 minutes

### Uncommon Items

* **Uncommon Weapon**: 25 materials, 150 gold, 15 minutes
* **Uncommon Armor**: 35 materials, 200 gold, 15 minutes
* **Uncommon Off-Hand**: 20 materials, 120 gold, 15 minutes
* **Uncommon Accessory**: 15 materials, 100 gold, 15 minutes

### Rare Items

* **Rare Weapon**: 50 materials, 5 rare essence, 500 gold, 60 minutes
* **Rare Armor**: 70 materials, 7 rare essence, 700 gold, 60 minutes
* **Rare Off-Hand**: 40 materials, 4 rare essence, 400 gold, 60 minutes
* **Rare Accessory**: 30 materials, 3 rare essence, 300 gold, 60 minutes

(Exact values subject to balance tuning)

## Future Expansion Notes

While MVP keeps crafting simple, future expansions may include:

* **Runes**: Enchantments that add properties to items
* **Item Properties**: Special abilities on rare items
* **Crafting Trees**: More complex progression paths
* **Masterwork Items**: Exceptional quality items
* **Set Crafting**: Crafting items that form sets

These are explicitly out of MVP scope but noted for future development.

## Integration Points

### With Equipment System
* Crafting creates items that enter the equipment system
* Auto-equip uses crafted items
* See `11-equipment-auto-equip.md`

### With Facility System
* Armory facility provides storage capacity
* Crafting facilities may provide speed bonuses (future)
* See `13-facilities-upgrades.md`

### With Resource System
* Crafting consumes materials and gold
* Materials come from missions, salvage, caravans
* See `16-resources-economy.md`

## Events

The crafting system emits the following events:

* `CraftingStarted` - Crafting item started
* `CraftingCompleted` - Crafting item completed, item created
* `ItemAddedToArmory` - Item added to Armory (from crafting or other sources)

## MVP Scope

For MVP, the crafting system includes:

* ✅ Simple crafting (common → uncommon → rare)
* ✅ Crafting queue (1 slot free, monetized extras)
* ✅ Crafting times and costs
* ✅ Integration with auto-equip
* ✅ Armory storage and management

Future enhancements (out of MVP scope):

* Runes and item properties
* Complex crafting trees
* Masterwork items
* Set crafting
* Crafting facility speed bonuses

