# 22. Adventurer Data Tables

Adventurer Data Tables (MVP)
This document provides data tables for class/role matrix, stat progressions, and XP curves. These tables are used by the adventurer and roster systems.

**Related Documentation:**
- `10-adventurers-roster.md` - Adventurer and roster system specification
- `09-mission-system.md` - Mission system (uses adventurer stats)

## Class/Role Matrix

### Pathfinder Classes (MVP)

* **Alchemist**: Utility caster class, utility role
* **Barbarian**: Martial class, frontline role
* **Bard**: Support caster class, support role
* **Cleric**: Support caster class, support role
* **Fighter**: Martial class, frontline role
* **Ranger**: Hybrid class, ranged combatant role
* **Rogue**: Skill class, skill specialist role
* **Wizard**: Utility caster class, utility role

### Role Derivation

Pathfinder classes derive roles:

* **Alchemist** → `utility_caster`
* **Barbarian** → `martial_frontliner`
* **Bard** → `support_caster`
* **Cleric** → `support_caster`
* **Fighter** → `martial_frontliner`
* **Ranger** → `ranged_combatant`
* **Rogue** → `skill_specialist`
* **Wizard** → `utility_caster`

### Role Distribution Targets

Example role distribution:

* **Frontline**: 40% of roster
* **Casters**: 30% of roster
* **Strikers**: 30% of roster

## Stat Progressions

### Base Ability Modifiers (Level 1)

All adventurers start with base ability modifiers:

* **Base Modifiers**: 0 across all abilities (STR, DEX, CON, INT, WIS, CHA)
* **Class Bonuses**: +2 to primary ability, +1 to secondary ability
* **Ancestry Bonuses**: +1 to one ability (future system)

### Level-Up Stat Gains

Per level (simplified MVP progression):

* **Primary Ability**: +1 every 2 levels
* **Secondary Ability**: +1 every 4 levels
* **Other Abilities**: +1 every 8 levels

Example (Fighter, STR primary, CON secondary):
* Level 1: STR +2, CON +1
* Level 2: STR +2, CON +1
* Level 3: STR +3, CON +1
* Level 4: STR +3, CON +2
* Level 5: STR +4, CON +2

(Exact progression subject to balance tuning)

## XP Curves

### XP Thresholds per Level

XP required to level up:

```
xpThreshold(level) = level * 100
```

Examples:
* Level 1 → 2: 100 XP
* Level 2 → 3: 200 XP
* Level 3 → 4: 300 XP
* Level 4 → 5: 400 XP
* Level 5 → 6: 500 XP

### XP Gain Sources

* **Mission Completion**: Base XP from mission rewards (scaled by outcome band)
* **Training Grounds**: Passive XP gain for idle adventurers (based on facility tier)

### XP Gain Rates

Example XP gain rates:

* **Tier 1 Mission (Success)**: 100 XP
* **Tier 2 Mission (Success)**: 200 XP
* **Tier 3 Mission (Success)**: 300 XP
* **Training Grounds (Tier 1)**: 10 XP/hour per idle adventurer
* **Training Grounds (Tier 5)**: 15 XP/hour per idle adventurer (1.5x multiplier)

## Class Stat Focuses

### Fighter
* **Primary**: STR
* **Secondary**: CON
* **Role**: Frontline
* **Focus**: Melee combat, survivability

### Wizard
* **Primary**: INT
* **Secondary**: WIS
* **Role**: Caster
* **Focus**: Spellcasting, skill checks

### Rogue
* **Primary**: DEX
* **Secondary**: INT
* **Role**: Striker
* **Focus**: Mobility, skill checks

### Cleric
* **Primary**: WIS
* **Secondary**: CHA
* **Role**: Support
* **Focus**: Healing, support abilities

### Ranger
* **Primary**: DEX
* **Secondary**: WIS
* **Role**: Striker
* **Focus**: Ranged combat, wilderness skills

## MVP Scope

For MVP, adventurer data includes:

* ✅ 5 classes
* ✅ 4 roles (derived from classes)
* ✅ Stat progression (simplified)
* ✅ XP curve (linear scaling)

Future enhancements (out of MVP scope):

* Advanced stat progressions (PF2E curves)
* Ancestry bonuses
* Background bonuses
* Archetype paths
* Advanced class features

(All values subject to balance tuning)

