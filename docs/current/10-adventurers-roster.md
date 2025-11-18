# 10. Adventurers & Roster Automation

Adventurers and Roster Automation Specification
This document describes the adventurer entity and roster automation system for Idlefinder. The roster system is fully automated, maintaining the adventurer pool based on player-defined policies without requiring manual intervention.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.3 - Roster Automation Loop
- `08-systems-primitives-spec.md` Section 10.1 - Adventurer Entity Structure
- `09-mission-system.md` - Mission system (uses roster)
- `11-equipment-auto-equip.md` - Equipment system (auto-equip integration)

## Overview

The roster system maintains a pool of adventurers automatically based on player-defined policies. The player sets:

* Target roster size
* Role distribution (e.g., 40% frontline, 30% casters, 30% support)
* Minimum quality thresholds
* Recruitment sources and priorities

The system then automatically:
* Recruits new adventurers when roster falls below target
* Equips new recruits with gear from the Armory
* Manages adventurer lifecycle (missions, recovery, leveling)
* Replaces fallen adventurers
* Maintains roster composition according to policies

The player never manually recruits or assigns adventurers. They set policies, and the game executes them.

## Adventurer Entity Structure

Adventurers follow the Entity primitive structure defined in `08-systems-primitives-spec.md`:

### Entity Type
- `type: "Adventurer"`

### Attributes

* `level: number` - Current level (starts at 1)
* `xp: number` - Current experience points
* `abilityMods: { str: number; dex: number; con: number; int: number; wis: number; cha: number }` - Ability modifiers (PF2E-inspired)
* `classKey: string` - Pathfinder class identifier (e.g., "fighter", "wizard", "rogue", "cleric", "barbarian", "alchemist", "bard", "ranger")
* `ancestryKey: string` - Pathfinder ancestry identifier (e.g., "human", "elf", "dwarf", "gnome", "goblin", "halfling", "orc", "tiefling")
* `traitTags: string[]` - Pathfinder mechanical traits: "arcane", "divine", "occult", "primal", "healing", "finesse", "agile", "ranged", "melee", "undead", "construct", "beast"
* `roleKey: "martial_frontliner" | "mobile_striker" | "support_caster" | "skill_specialist" | ...` - Derived from classKey, used for role matching
* `baseHP: number` - Base hit points
* `equipment?: { weaponId?: string; armorId?: string; offHandId?: string; accessoryId?: string }` - References to Item entities; managed by auto-equip system

### Tags

**Mechanical Tags:**
* Role tags: `["frontline"]`, `["caster"]`, `["support"]`, `["striker"]`, etc.
* Trait tags: `["wilderness"]`, `["divine"]`, `["ranged"]`, `["melee"]`, etc.
* Synergy tags: Used for mission matching

**Lore Tags (metadata.loreTags):**
* Thematic tags for worldbuilding (e.g., `["human", "taldor", "noble"]`)
* No gameplay logic depends on lore tags

### State

Adventurers use a finite state machine:

* `Idle` - Available for mission assignment
* `OnMission` - Currently deployed on a mission
* `Fatigued` - Recovering from mission (initial non-lethal penalty state)
* (Future) `Recovering` - In infirmary recovering from injuries
* (Future) `Unavailable` - Temporarily unavailable (cooldown, etc.)
* (Future) `Dead` - Adventurer has died

### Timers

* `fatigueUntil?: number` - Timestamp (milliseconds) when fatigue expires (optional)
* `availableAt?: number` - Timestamp when adventurer becomes available (for cooldown/recovery)
* `recoveryUntil?: number` - Timestamp when recovery completes (future system)

### Resources (Per Adventurer)

* `xp` - Experience points (stored in attributes.xp)

## Roster Policies

Roster policies define how the roster is maintained automatically.

### Target Roster Size

* **Base Size**: Starting roster size (e.g., 5 adventurers)
* **Target Size**: Desired roster size (e.g., 10 adventurers)
* **Maximum Size**: Maximum roster size (determined by Dormitory facility tier)

### Role Distribution

Player defines desired role distribution:

* **Frontline**: X% of roster (e.g., 40%)
* **Casters**: Y% of roster (e.g., 30%)
* **Support**: Z% of roster (e.g., 30%)

The system maintains this distribution when recruiting.

### Quality Thresholds

* **Minimum Level**: Minimum level for new recruits (e.g., level 1 for early game, level 3+ for mid game)
* **Minimum Stats**: Minimum ability modifier thresholds (optional)
* **Preferred Traits**: Preferred trait tags for recruitment (optional)

### Recruitment Sources

Player defines recruitment source priorities:

* **Caravans**: Auto-buy recruits from caravans (see `14-caravans-trade.md`)
* **Local Pools**: Recruit from local adventurer pools
* **Special Sources**: Future content (faction recruitment, etc.)

## Auto-Recruitment

When the roster falls below target size, the system automatically recruits new adventurers.

### Recruitment Trigger

Recruitment is triggered when:
* `currentRosterSize < targetRosterSize`
* AND available recruitment slot exists
* AND recruitment source has available candidates

### Recruitment Process

1. **Check Roster Status**: Calculate current roster size and composition
2. **Identify Gaps**: Determine which roles are underrepresented
3. **Select Source**: Choose recruitment source based on priorities
4. **Filter Candidates**: Filter candidates by quality thresholds and role needs
5. **Select Candidate**: Choose best candidate that fills role gap
6. **Recruit**: Execute recruitment action (may cost resources)
7. **Auto-Equip**: Automatically equip new recruit with gear from Armory
8. **Add to Roster**: Add adventurer to roster

### Recruitment Costs

Recruitment may cost resources:
* **Gold**: Base recruitment cost
* **Fame**: Higher-tier recruits may require fame threshold
* **Materials**: Special recruits may cost materials

Costs are automatically deducted when recruitment occurs.

## Auto-Equip Integration

When a new adventurer is recruited, the auto-equip system automatically assigns gear:

1. **Check Armory**: Find available equipment in Armory
2. **Apply Auto-Equip Rules**: Use player-defined auto-equip rules (global and role-based)
3. **Assign Equipment**: Assign best available gear to new recruit
4. **Update Equipment References**: Set `adventurer.equipment` attributes

See `11-equipment-auto-equip.md` for detailed auto-equip rules.

## Mission Usage

Missions automatically draw from the roster:

1. **Filter Available**: Get all adventurers with `state === "Idle"` (or `Fatigued` if policy allows)
2. **Role Matching**: Match adventurers to mission requirements (preferred role, etc.)
3. **Form Party**: Select adventurers for mission party
4. **Update State**: Set adventurer state to `OnMission`

See `09-mission-system.md` for detailed mission assignment.

## Auto-Heal/Infirmary

Adventurers automatically recover from injuries and fatigue via the infirmary system.

### Fatigue Recovery

After mission completion, adventurers may become `Fatigued`:

1. **Fatigue State**: Adventurer enters `Fatigued` state
2. **Recovery Timer**: Set `fatigueUntil` timer based on infirmary tier
3. **Auto-Recovery**: When timer expires, adventurer returns to `Idle` state

### Injury Recovery (Future)

When injury system is implemented:

1. **Injury State**: Adventurer enters `Recovering` state
2. **Infirmary Processing**: Infirmary facility processes recovery
3. **Recovery Timer**: Set `recoveryUntil` timer based on injury severity and infirmary tier
4. **Auto-Recovery**: When timer expires, adventurer returns to `Idle` state

### Infirmary Facility

The Infirmary facility provides:
* **Recovery Speed Multiplier**: Faster recovery times
* **Recovery Capacity**: Number of adventurers that can recover simultaneously

See `13-facilities-upgrades.md` for facility details.

## Automated Rest Cycles

Adventurers automatically rest after missions:

1. **Mission Completion**: Adventurer completes mission
2. **State Transition**: `OnMission` → `Fatigued` (or `Idle` if no fatigue)
3. **Rest Period**: Adventurer rests for recovery duration
4. **Return to Pool**: Adventurer returns to `Idle` state and becomes available

Rest cycles are fully automated - no player intervention required.

## Leveling System

Adventurers automatically level up when they gain enough XP.

### XP Gain

XP is gained from:
* Mission completion (based on outcome band and mission rewards)
* Training Grounds facility (passive XP gain)

### Level Up Process

1. **Check XP Threshold**: `adventurer.xp >= xpThresholdFor(adventurer.level)`
2. **Level Up Action**: Execute `LevelUpAdventurer(adventurerId)` action
3. **Update Attributes**:
   * `level++`
   * Recalculate `abilityMods` (if using PF2E progression curves)
   * Reset XP or carry over excess
4. **Emit Event**: `AdventurerLeveledUp` event

### XP Thresholds

XP required per level (example progression):
* Level 1 → 2: 100 XP
* Level 2 → 3: 200 XP
* Level 3 → 4: 300 XP
* (Scaling formula: `xpThreshold = level * 100`)

## Death & Replacement

When adventurers die (future system), they are automatically replaced:

1. **Death Event**: Adventurer dies (from mission failure, injury, etc.)
2. **Hall of Fame**: Record adventurer in Hall of Fame (if applicable)
3. **Roster Update**: Remove adventurer from roster
4. **Size Check**: `currentRosterSize < targetRosterSize`
5. **Auto-Recruit**: Trigger auto-recruitment to backfill roster
6. **Replacement**: New adventurer recruited and equipped automatically

## Roster Capacity

Roster capacity is determined by the **Dormitory** facility:

* **Base Capacity**: Starting roster capacity (e.g., 5)
* **Dormitory Bonus**: +X capacity per Dormitory tier
* **Maximum Capacity**: `baseCapacity + dormitoryTierBonus`

If roster reaches maximum capacity, recruitment is paused until capacity increases or roster size decreases.

## Integration Points

### With Mission System
* Missions draw from available adventurer roster
* Mission outcomes affect adventurer state (fatigue, injuries, deaths)
* See `09-mission-system.md`

### With Equipment System
* Auto-equip assigns gear to new recruits
* Equipment affects adventurer capabilities for missions
* See `11-equipment-auto-equip.md`

### With Facility System
* Dormitory determines roster capacity
* Infirmary provides recovery services
* Training Grounds provide passive XP gain
* See `13-facilities-upgrades.md`

### With Caravan System
* Caravans provide recruitment sources
* Auto-buy rules affect recruitment
* See `14-caravans-trade.md`

## Events

The roster system emits the following events:

* `AdventurerRecruited` - New adventurer recruited
* `AdventurerAssigned` - Adventurer assigned to mission
* `AdventurerGainedXP` - Adventurer gained experience
* `AdventurerLeveledUp` - Adventurer leveled up
* `AdventurerRecovered` - Adventurer recovered from fatigue/injury
* (Future) `AdventurerDied` - Adventurer died

## MVP Scope

For MVP, the roster system includes:

* ✅ Roster policies (target size, role distribution, quality thresholds)
* ✅ Auto-recruitment from caravans and local pools
* ✅ Auto-equip integration
* ✅ Automated rest cycles
* ✅ Automatic leveling
* ✅ Roster capacity management

Future enhancements (out of MVP scope):

* Injury system and infirmary recovery
* Death system and Hall of Fame
* Advanced recruitment sources (factions, special events)
* Roster curation tools (lock/unlock adventurers)
* Retirement system

