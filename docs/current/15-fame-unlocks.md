# 15. Fame & Unlocks

Fame and Unlocks Specification
This document describes the fame system for Idlefinder, which measures "how big and important your guild is" and automatically unlocks new content as fame increases.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.6 - Fame, Unlocks, and Meta Progression
- `09-mission-system.md` - Mission system (generates fame)
- `13-facilities-upgrades.md` - Facilities (fame gates upgrades)
- `18-mission-data-tables.md` - Mission data (fame thresholds)

## Overview

Fame measures "how big and important your guild is." It:

* **Auto-Increases**: Earned naturally from missions (no manual claiming)
* **Auto-Unlocks**: Thresholds automatically unlock new content
* **Continuous Progress**: Because missions run continuously, fame slowly but steadily increases
* **Player Control**: Player chooses when to lean into risk to accelerate fame

The player's role is to choose when to lean into risk to accelerate fame and adjust doctrine to push toward fame or economy.

## Fame Resource

Fame is a global resource (stored in `GameState.resources`):

* **Resource Key**: `"fame"`
* **Auto-Increase**: Fame increases automatically from mission completion
* **No Manual Spending**: Fame is not spent, only accumulated (gates content)

## Auto-Increase via Missions

Fame is earned automatically from mission completion:

1. **Mission Completion**: Mission resolves successfully
2. **Fame Reward**: Mission `baseRewards.fame` is added to global fame
3. **Outcome Scaling**: Fame reward may scale with outcome band:
   * CriticalSuccess: 150% fame
   * Success: 100% fame
   * Failure: 0% fame (or reduced)
4. **Automatic Addition**: Fame is automatically added to resources (no manual claiming)

### Fame Generation Rate

Because missions run continuously:
* Fame slowly but steadily increases over time
* Rate governed by doctrine and power level
* Higher-tier missions provide more fame
* Aggressive doctrines may accelerate fame (at higher risk)

## Auto-Triggered Unlocks

Fame thresholds automatically unlock new content. When fame crosses a threshold:

1. **Check Thresholds**: System checks all unlock rules for fame thresholds
2. **Trigger Unlocks**: Unlock rules that meet threshold are triggered
3. **Apply Unlocks**: New content becomes available automatically
4. **Emit Events**: `UnlockTriggered` events emitted

### Unlock Types

#### Mission Tier Unlocks
* **Higher-Tier Missions**: Unlock missions of higher difficulty tiers
* **New Mission Types**: Unlock new mission categories
* **Elite Missions**: Unlock special high-reward missions

#### Facility Tier Unlocks
* **Higher Facility Tiers**: Unlock ability to upgrade facilities to higher tiers
* **New Facility Types**: Unlock new facility types (future system)

#### Region Unlocks
* **New Regions**: Unlock new regions/biomes for missions
* **Regional Missions**: Unlock region-specific mission types

#### Caravan Type Unlocks
* **Better Caravans**: Unlock higher-quality caravan types
* **Special Caravans**: Unlock special caravan types (future system)

#### Item/Crafting Unlocks
* **New Item Types**: Unlock new item types or slots
* **Crafting Options**: Unlock new crafting recipes
* **Rare Variants**: Unlock rare item variants

## Remove Manual Gating

Fame unlocks are **automatic** - no manual claiming:

* ❌ No "click to unlock" buttons
* ❌ No manual unlock selection
* ❌ No missed unlock windows
* ✅ Automatic threshold checking
* ✅ Automatic unlock application
* ✅ Continuous progression

## Fame Milestones

Fame milestones define unlock thresholds:

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

See `23-fame-milestones.md` for detailed milestone table.

## Integration Points

### With Mission System
* Missions generate fame as reward
* Fame gates unlock higher-tier missions
* See `09-mission-system.md`

### With Facility System
* Fame gates facility tier upgrades
* See `13-facilities-upgrades.md`

### With Caravan System
* Fame unlocks better caravan types
* See `14-caravans-trade.md`

## Events

The fame system emits the following events:

* `FameGained` - Fame increased (from mission completion)
* `UnlockTriggered` - Fame threshold crossed, unlock applied
* `FameMilestoneReached` - Major fame milestone reached

## MVP Scope

For MVP, the fame system includes:

* ✅ Auto-increase via missions
* ✅ Auto-triggered unlocks (mission tiers, facility tiers)
* ✅ Fame milestone system
* ✅ Continuous progression

Future enhancements (out of MVP scope):

* Prestige/rebirth systems
* Fame decay (optional)
* Fame-based events
* Advanced unlock trees

