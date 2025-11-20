# 20. Crafting Recipes

Crafting Recipes (MVP)
This document provides crafting recipes for MVP. Recipes define the resources, time, and output for crafting items.

**Related Documentation:**
- `12-crafting-armory.md` - Crafting system specification
- `16-resources-economy.md` - Resource system (crafting costs)

## Recipe Format

```typescript
CraftingRecipe = {
  itemType: "weapon" | "armor" | "offHand" | "accessory",
  rarity: "common" | "uncommon" | "rare",
  input: {
    materials: number,
    gold: number
  },
  duration: number, // milliseconds
  output: {
    itemTemplateId: string
  }
}
```

## Common Item Recipes

### Common Weapon
* **Materials**: 10
* **Gold**: 50
* **Duration**: 5 minutes (300,000 ms)
* **Output**: Common weapon (random stat roll)

### Common Armor
* **Materials**: 15
* **Gold**: 75
* **Duration**: 5 minutes (300,000 ms)
* **Output**: Common armor (random stat roll)

### Common Off-Hand
* **Materials**: 8
* **Gold**: 40
* **Duration**: 5 minutes (300,000 ms)
* **Output**: Common off-hand (random stat roll)

### Common Accessory
* **Materials**: 5
* **Gold**: 25
* **Duration**: 5 minutes (300,000 ms)
* **Output**: Common accessory (random stat roll)

## Uncommon Item Recipes

### Uncommon Weapon
* **Materials**: 25
* **Gold**: 150
* **Duration**: 15 minutes (900,000 ms)
* **Output**: Uncommon weapon (random stat roll)

### Uncommon Armor
* **Materials**: 35
* **Gold**: 200
* **Duration**: 15 minutes (900,000 ms)
* **Output**: Uncommon armor (random stat roll)

### Uncommon Off-Hand
* **Materials**: 20
* **Gold**: 120
* **Duration**: 15 minutes (900,000 ms)
* **Output**: Uncommon off-hand (random stat roll)

### Uncommon Accessory
* **Materials**: 15
* **Gold**: 100
* **Duration**: 15 minutes (900,000 ms)
* **Output**: Uncommon accessory (random stat roll)

## Rare Item Recipes

### Rare Weapon
* **Materials**: 100
* **Gold**: 500
* **Duration**: 60 minutes (3,600,000 ms)
* **Output**: Rare weapon (random stat roll)

### Rare Armor
* **Materials**: 155
* **Gold**: 750
* **Duration**: 60 minutes (3,600,000 ms)
* **Output**: Rare armor (random stat roll)

### Rare Off-Hand
* **Materials**: 70
* **Gold**: 400
* **Duration**: 60 minutes (3,600,000 ms)
* **Output**: Rare off-hand (random stat roll)

### Rare Accessory
* **Materials**: 45
* **Gold**: 250
* **Duration**: 60 minutes (3,600,000 ms)
* **Output**: Rare accessory (random stat roll)

## Recipe Scaling

Recipes scale with rarity:

* **Common → Uncommon**: ~2.5x materials, ~3x gold, 3x duration
* **Uncommon → Rare**: ~2x materials, ~4x gold, 4x duration

## MVP Scope

For MVP, crafting recipes include:

* ✅ 4 item types × 3 rarities = 12 base recipes
* ✅ Simple progression (common → uncommon → rare)
* ✅ Resource costs (materials, gold)
* ✅ Time costs (duration)

Future enhancements (out of MVP scope):

* Recipe variants (different stat focuses)
* Recipe upgrades (improved recipes)
* Masterwork recipes
* Set recipes

(All values subject to balance tuning)

