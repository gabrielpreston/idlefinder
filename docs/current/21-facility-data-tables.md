# 21. Facility Data Tables

Facility Data Tables (MVP)
This document provides data tables for facility tier tables, upgrade costs, and effect values. These tables are used by the facility upgrade system.

**Related Documentation:**
- `13-facilities-upgrades.md` - Facility system specification
- `15-fame-unlocks.md` - Fame system (gates facility tiers)

## Facility Types

### Guildhall
* **Purpose**: Base facility, foundation for other facilities
* **Effects**: Base capacity for all systems
* **Unlocks**: Higher tiers of other facilities

### Dormitory
* **Purpose**: Increases roster capacity
* **Effects**: `rosterCap = baseCap + dormitoryTierBonus`
* **Tier Scaling**: +2 roster capacity per tier

### Mission Command
* **Purpose**: Increases available mission slots
* **Effects**: `maxActiveMissions = base + missionCommandTierBonus`
* **Tier Scaling**: +1 mission slot per tier

### Training Grounds
* **Purpose**: Provides passive XP gain
* **Effects**: `xpGainMultiplier` for idle adventurers
* **Tier Scaling**: +10% XP gain per tier

### Resource Depot
* **Purpose**: Increases resource storage capacity
* **Effects**: `resourceStorageCap = base + depotTierBonus`
* **Tier Scaling**: +100 storage capacity per tier

### Infirmary
* **Purpose**: Provides recovery services
* **Effects**: `fatigueRecoveryRate` multiplier, recovery capacity
* **Tier Scaling**: +20% recovery speed per tier, +1 recovery slot per tier

### Armory
* **Purpose**: Provides storage for equipment
* **Effects**: `armoryCap = base + armoryTierBonus`
* **Tier Scaling**: +50 item capacity per tier

## Tier Tables

### Dormitory Tiers

| Tier | Roster Cap Bonus | Upgrade Cost (Gold) | Fame Gate |
|------|------------------|---------------------|-----------|
| 0    | 0                | -                   | 0         |
| 1    | +2               | 100                 | 0         |
| 2    | +4               | 250                 | 100       |
| 3    | +6               | 500                 | 500       |
| 4    | +8               | 1000                | 2000      |
| 5    | +10              | 2000                | 10000     |

### Mission Command Tiers

| Tier | Mission Slots Bonus | Upgrade Cost (Gold) | Fame Gate |
|------|---------------------|---------------------|-----------|
| 0    | 0                   | -                   | 0         |
| 1    | +1                  | 150                 | 0         |
| 2    | +2                  | 350                 | 100       |
| 3    | +3                  | 700                 | 500       |
| 4    | +4                  | 1500                | 2000      |
| 5    | +5                  | 3000                | 10000     |

### Training Grounds Tiers

| Tier | XP Gain Multiplier | Upgrade Cost (Gold) | Fame Gate |
|------|---------------------|---------------------|-----------|
| 0    | 1.0x                | -                   | 0         |
| 1    | 1.1x                | 200                 | 0         |
| 2    | 1.2x                | 400                 | 100       |
| 3    | 1.3x                | 800                 | 500       |
| 4    | 1.4x                | 1600                | 2000      |
| 5    | 1.5x                | 3200                | 10000     |

### Resource Depot Tiers

| Tier | Storage Cap Bonus | Upgrade Cost (Gold) | Fame Gate |
|------|-------------------|---------------------|-----------|
| 0    | 0                 | -                   | 0         |
| 1    | +100              | 100                 | 0         |
| 2    | +200              | 250                 | 100       |
| 3    | +300              | 500                 | 500       |
| 4    | +400              | 1000                | 2000      |
| 5    | +500              | 2000                | 10000     |

### Infirmary Tiers

| Tier | Recovery Speed | Recovery Slots | Upgrade Cost (Gold) | Fame Gate |
|------|----------------|----------------|---------------------|-----------|
| 0    | 1.0x           | 1              | -                   | 0         |
| 1    | 1.2x           | 2              | 150                 | 0         |
| 2    | 1.4x           | 3              | 350                 | 100       |
| 3    | 1.6x           | 4              | 700                 | 500       |
| 4    | 1.8x           | 5              | 1500                | 2000      |
| 5    | 2.0x           | 6              | 3000                | 10000     |

### Armory Tiers

| Tier | Armory Cap Bonus | Upgrade Cost (Gold) | Fame Gate |
|------|-------------------|---------------------|-----------|
| 0    | 0                 | -                   | 0         |
| 1    | +50               | 100                 | 0         |
| 2    | +100              | 250                 | 100       |
| 3    | +150              | 500                 | 500       |
| 4    | +200              | 1000                | 2000      |
| 5    | +250              | 2000                | 10000     |

## Upgrade Cost Scaling

Upgrade costs scale with tier:

```
costForTier(tier) = baseCost * (2 ^ tier)
```

Examples:
* Tier 1: baseCost
* Tier 2: baseCost × 2
* Tier 3: baseCost × 4
* Tier 4: baseCost × 8
* Tier 5: baseCost × 16

Base costs vary by facility type.

## Fame Gates

Facility tiers are gated by fame thresholds:

* **Tier 1**: No fame gate (available from start)
* **Tier 2**: Fame 100+
* **Tier 3**: Fame 500+
* **Tier 4**: Fame 2000+
* **Tier 5**: Fame 10000+

Fame gates prevent upgrading facilities beyond player's progression level.

## MVP Scope

For MVP, facility data includes:

* ✅ 7 facility types
* ✅ Tier 0-5 progression
* ✅ Upgrade costs (gold)
* ✅ Fame gates
* ✅ Effect values per tier

Future enhancements (out of MVP scope):

* Material costs for upgrades
* Upgrade duration (time-based upgrades)
* Facility construction costs
* Advanced facility effects

(All values subject to balance tuning)

