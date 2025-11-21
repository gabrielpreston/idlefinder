# 18. Mission Data Tables

Mission Data Tables (MVP)
This document provides data tables for mission types, DC scaling, reward scaling, and duration curves. These tables are used by the mission generation and doctrine systems.

**Related Documentation:**
- `09-mission-system.md` - Mission system specification
- `15-fame-unlocks.md` - Fame system (gates mission tiers)

## Mission Types

### Mission Categories

* **Combat**: Combat-focused missions (primary ability: STR/DEX)
* **Exploration**: Exploration and discovery missions (primary ability: WIS/INT)
* **Investigation**: Investigation and research missions (primary ability: INT/WIS)
* **Diplomacy**: Social and negotiation missions (primary ability: CHA)
* **Resource**: Resource gathering missions (primary ability: varies)
* **Defense**: Defensive missions (primary ability: CON/STR)

### Mission Tiers

Missions are organized into tiers based on fame thresholds:

* **Tier 0**: Starter missions (fame 0+)
* **Tier 1**: Early game (fame 100+)
* **Tier 2**: Mid game (fame 500+)
* **Tier 3**: Late game (fame 2000+)
* **Tier 4**: End game (fame 10000+)
* **Tier 5**: End game (fame 10000+)

## DC Scaling

Mission DC scales with tier:

```
baseDC = 10 + (tier * 5)
```

Examples:
* Tier 0: DC 10 (minimum)
* Tier 1: DC 15
* Tier 2: DC 20
* Tier 3: DC 25
* Tier 4: DC 30
* Tier 5: DC 35

DC may be adjusted by:
* Mission category (some categories are harder)
* Mission modifiers (special conditions)

## Reward Scaling

Rewards scale with tier and outcome band:

### Base Rewards (Success)

**Gold:**
```
baseGold = 50 * tier (Tier 0: minimum 25)
```

**XP:**
```
baseXP = 100 * tier (Tier 0: minimum 50)
```

**Fame:**
```
baseFame = 10 * tier (Tier 0: minimum 5)
```

**Materials:**
```
baseMaterials = 5 * tier (resource missions only)
```

### Outcome Band Multipliers

* **CriticalSuccess**: 150% rewards
* **Success**: 100% rewards
* **Failure**: 50% rewards (or 0%, based on design)
* **CriticalFailure**: 0% rewards

## Duration Curves

Mission duration scales with tier:

```
baseDuration = 5 minutes * tier (Tier 0: minimum 3 minutes)
```

Examples:
* Tier 0: 3 minutes (minimum)
* Tier 1: 5 minutes
* Tier 2: 10 minutes
* Tier 3: 15 minutes
* Tier 4: 20 minutes
* Tier 5: 25 minutes

Duration may be adjusted by:
* Mission category (some categories are longer)
* Facility bonuses (future system)

## Mission Priority Weights

Mission priority weights for doctrine selection:

* **High Priority**: Weight 3.0 (missions that align with doctrine focus)
* **Medium Priority**: Weight 2.0 (missions that partially align)
* **Low Priority**: Weight 1.0 (missions that don't align)
* **Avoided**: Weight 0.0 (missions that violate risk tolerance)

Weights are used by doctrine engine to select missions.

## Mission Slot Requirements

Most missions require 1 slot, but complex missions may require more:

* **Standard Missions**: 1 slot
* **Complex Missions**: 2 slots (future system)
* **Elite Missions**: 3 slots (future system)

## MVP Values

### Tier 0 Missions (Starter)

* **DC**: 10
* **Base Rewards**: 25 gold, 50 XP, 5 fame
* **Duration**: 3 minutes
* **Slot Requirement**: 1

### Tier 1 Missions (Early Game)

* **DC**: 15
* **Base Rewards**: 50 gold, 100 XP, 10 fame
* **Duration**: 5 minutes
* **Slot Requirement**: 1

### Tier 2 Missions (Early Game)

* **DC**: 20
* **Base Rewards**: 100 gold, 200 XP, 20 fame
* **Duration**: 10 minutes
* **Slot Requirement**: 1

### Tier 3 Missions (Mid Game)

* **DC**: 25
* **Base Rewards**: 150 gold, 300 XP, 30 fame
* **Duration**: 15 minutes
* **Slot Requirement**: 1

(Values subject to balance tuning)

## Future Expansion

Future enhancements may include:
* Mission chains (sequential missions)
* Regional missions (region-specific modifiers)
* Faction missions (faction-specific rewards)
* Elite missions (higher difficulty, higher rewards)

