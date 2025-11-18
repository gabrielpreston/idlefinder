# 17. Meta Systems

Meta Systems Specification
This document describes the meta progression systems for Idlefinder, including the Hall of Fame and future prestige systems. These systems provide long-term engagement and memorialization.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.3 - Roster Automation Loop (death & replacement)
- `10-adventurers-roster.md` - Roster system (adventurer lifecycle)
- `15-fame-unlocks.md` - Fame system (meta progression foundation)

## Overview

Meta systems provide long-term engagement beyond the core gameplay loops. They include:

* **Hall of Fame**: Memorializes fallen adventurers and notable achievements
* **Prestige System**: Future rebirth/prestige mechanics (placeholder)
* **Integration with Automation**: All meta systems integrate with automated gameplay

These systems enhance the narrative and provide long-term goals without requiring manual interaction.

## Hall of Fame

The Hall of Fame memorializes fallen adventurers and notable achievements.

### Automated Death Recording

When adventurers die (future system):

1. **Death Event**: `AdventurerDied` event emitted
2. **Automatic Recording**: System automatically records adventurer in Hall of Fame
3. **Memorial Entry**: Create memorial entry with:
   * Adventurer name and metadata
   * Level and achievements
   * Cause of death (mission failure, injury, etc.)
   * Date of death
   * Notable accomplishments

### Memorial Entries

Hall of Fame entries include:

* **Adventurer Info**: Name, Pathfinder class, Pathfinder ancestry, level
* **Achievements**: Missions completed, levels gained, notable accomplishments
* **Death Info**: Cause of death, mission where died, date
* **Statistics**: Total XP gained, missions completed, etc.

### Hall of Fame Display

Players can browse Hall of Fame when online:

* **Recent Deaths**: Most recent fallen adventurers
* **Notable Achievements**: Adventurers with exceptional accomplishments
* **Statistics**: Overall guild statistics (total deaths, total missions, etc.)

Hall of Fame is **read-only** - entries are automatically created, players can only view.

## Automated Achievements

The system automatically tracks and records achievements:

* **Mission Milestones**: Complete X missions
* **Level Milestones**: Reach level X
* **Fame Milestones**: Reach fame threshold X
* **Facility Milestones**: Upgrade facility to tier X
* **Crafting Milestones**: Craft X items

Achievements are automatically recorded and displayed in Hall of Fame or achievement log.

## Prestige Loop (Placeholder)

Future system for long-term progression:

* **Prestige Mechanics**: Rebirth system that resets progress for permanent bonuses
* **Prestige Currency**: Earned from completing prestige cycles
* **Prestige Upgrades**: Permanent bonuses that persist across resets

**MVP Scope**: Placeholder only - not implemented in MVP.

## Integration with Automated Systems

All meta systems integrate with automated gameplay:

* **Automatic Recording**: Deaths and achievements recorded automatically
* **No Manual Interaction**: Players don't need to manually record anything
* **Offline Processing**: Meta events processed during offline catch-up
* **Event-Driven**: Meta systems respond to domain events

## Events

The meta systems emit the following events:

* `AdventurerMemorialized` - Adventurer recorded in Hall of Fame
* `AchievementUnlocked` - Achievement milestone reached
* (Future) `PrestigeCycleCompleted` - Prestige cycle completed

## MVP Scope

For MVP, the meta systems include:

* ✅ Hall of Fame (automated death recording)
* ✅ Automated achievements
* ✅ Integration with automated systems

Future enhancements (out of MVP scope):

* Prestige/rebirth system
* Advanced achievement system
* Cosmetic memorials
* Statistics tracking
* Leaderboards (if multiplayer)

