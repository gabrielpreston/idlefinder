# 23. Fame Milestones

Fame Milestones (MVP)
This document provides fame threshold tables for unlocks. Fame milestones automatically unlock new content as fame increases.

**Related Documentation:**
- `15-fame-unlocks.md` - Fame and unlocks system specification
- `09-mission-system.md` - Mission system (fame gates tiers)
- `13-facilities-upgrades.md` - Facilities (fame gates upgrades)

## Fame Milestone Format

```typescript
FameMilestone = {
  fameThreshold: number,
  unlocks: {
    missionTiers?: number[],
    facilityTiers?: { facilityType: string; maxTier: number }[],
    regions?: string[],
    caravanTypes?: string[],
    itemTypes?: string[],
    craftingRecipes?: string[]
  }
}
```

## Milestone Table

### Fame 0 (Starting Point)

* **Mission Tiers**: Tier 1 unlocked
* **Facility Tiers**: All facilities Tier 1 unlocked
* **Caravan Types**: Basic caravans unlocked
* **Item Types**: All MVP item types unlocked
* **Crafting Recipes**: All common recipes unlocked

### Fame 100 (Early Game)

* **Mission Tiers**: Tier 2 unlocked
* **Facility Tiers**: All facilities Tier 2 unlocked
* **Caravan Types**: Improved caravans unlocked
* **Crafting Recipes**: Uncommon recipes unlocked

### Fame 500 (Mid Game)

* **Mission Tiers**: Tier 3 unlocked
* **Facility Tiers**: All facilities Tier 3 unlocked
* **Caravan Types**: Rare caravans unlocked
* **Crafting Recipes**: Rare recipes unlocked

### Fame 2000 (Late Game)

* **Mission Tiers**: Tier 4 unlocked
* **Facility Tiers**: All facilities Tier 4 unlocked
* **Regions**: New regions unlocked (future system)
* **Caravan Types**: Elite caravans unlocked

### Fame 10000 (End Game)

* **Mission Tiers**: Tier 5 unlocked
* **Facility Tiers**: All facilities Tier 5 unlocked
* **Regions**: All regions unlocked
* **Caravan Types**: All caravan types unlocked

## Unlock Details

### Mission Tier Unlocks

| Fame Threshold | Mission Tiers Unlocked |
|----------------|------------------------|
| 0              | Tier 1                 |
| 100            | Tier 2                 |
| 500            | Tier 3                 |
| 2000           | Tier 4                 |
| 10000          | Tier 5                 |

### Facility Tier Unlocks

| Fame Threshold | Max Facility Tier |
|----------------|-------------------|
| 0              | Tier 1           |
| 100            | Tier 2           |
| 500            | Tier 3           |
| 2000           | Tier 4           |
| 10000          | Tier 5           |

### Caravan Type Unlocks

| Fame Threshold | Caravan Types Unlocked |
|----------------|------------------------|
| 0              | Basic, Trade          |
| 100            | Recruit, Mixed         |
| 500            | Rare                  |
| 2000           | Elite                 |

### Crafting Recipe Unlocks

| Fame Threshold | Recipes Unlocked |
|----------------|------------------|
| 0              | Common           |
| 100            | Uncommon         |
| 500            | Rare             |

## Auto-Unlock Process

When fame crosses a threshold:

1. **Check Milestones**: System checks all milestones for crossed thresholds
2. **Apply Unlocks**: Unlock rules are applied automatically
3. **Emit Events**: `UnlockTriggered` events emitted
4. **Update Availability**: New content becomes available immediately

No manual claiming required - unlocks are automatic.

## MVP Scope

For MVP, fame milestones include:

* ✅ 5 major milestones (0, 100, 500, 2000, 10000)
* ✅ Mission tier unlocks
* ✅ Facility tier unlocks
* ✅ Caravan type unlocks
* ✅ Crafting recipe unlocks

Future enhancements (out of MVP scope):

* Regional unlocks
* Faction unlocks
* Advanced item unlocks
* Prestige unlocks

(All thresholds subject to balance tuning)

