# 13. Facilities & Upgrade Queue

Facilities and Upgrade Queue Specification
This document describes the facility system for Idlefinder, which provides always-on passive effects and automated upgrade queues. Facilities are the progression backbone that unlocks capabilities and increases capacity.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.2 - Facility Upgrade & Operations Loop
- `08-systems-primitives-spec.md` Section 10.3 - Facility Entity Structure
- `09-mission-system.md` - Mission system (uses Mission Command facility)
- `10-adventurers-roster.md` - Roster system (uses Dormitory facility)

## Overview

Facilities are **always-on multipliers** and queues, not "click-to-activate" features. They provide:

* **Passive Effects**: Always-on bonuses (mission slots, roster capacity, XP multipliers, etc.)
* **Upgrade Queue**: Automated upgrade system that processes upgrades automatically
* **Capacity Increases**: Facilities increase various capacity limits (roster, missions, storage, etc.)

The player's job is deciding **what gets improved and in what order**, not when to press "upgrade."

## Facility Entity Structure

Facilities follow the Entity primitive structure defined in `08-systems-primitives-spec.md`:

### Entity Type
- `type: "Facility"`

### Attributes

* `facilityType: "Guildhall" | "Dormitory" | "MissionCommand" | "TrainingGrounds" | "ResourceDepot" | "Infirmary" | "Armory"` - Facility type
* `tier: number` - Current facility tier (starts at 0 or 1)
* `missionSlotsBonus: number` - Bonus mission slots (Mission Command)
* `xpGainMultiplier: number` - XP gain multiplier (Training Grounds)
* `fatigueRecoveryRate: number` - Fatigue recovery rate multiplier (Infirmary)
* `resourceStorageCapBonus: number` - Resource storage capacity bonus (Resource Depot)
* `rosterCapBonus: number` - Roster capacity bonus (Dormitory)
* `armoryCapBonus: number` - Armory capacity bonus (Armory)

### Tags

**Mechanical Tags:**
* Facility type tags: `["mission-control"]`, `["storage"]`, `["training"]`, `["recovery"]`, etc.
* Effect tags: `["capacity"]`, `["multiplier"]`, `["queue"]`

**Lore Tags (metadata.loreTags):**
* Thematic tags for worldbuilding (e.g., `["gothic", "stonework"]`)
* No gameplay logic depends on lore tags

### State

Facilities use a finite state machine:

* `Online` - Facility is operational and providing effects
* (Future) `UnderConstruction` - Facility is being built/upgraded
* (Future) `Disabled` - Facility is temporarily disabled

### Timers

* `constructionCompleteAt?: number` - Timestamp when construction/upgrade completes (future system)

## MVP Facilities

### Guildhall
* **Purpose**: Base facility, provides foundation for other facilities
* **Effects**: Base capacity for all systems
* **Tier Effects**: Unlocks higher tiers of other facilities

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
* **Effects**: Idle tick uses `trainingMultiplier` to compute XP gain for idle adventurers
* **Tier Scaling**: +10% XP gain per tier

### Resource Depot
* **Purpose**: Increases resource storage capacity
* **Effects**: `resourceStorageCap = base + depotTierBonus`
* **Tier Scaling**: +100 storage capacity per tier

### Infirmary
* **Purpose**: Provides recovery services for injured/fatigued adventurers
* **Effects**: `fatigueRecoveryRate` multiplier, recovery capacity
* **Tier Scaling**: +20% recovery speed per tier, +1 recovery slot per tier

### Armory
* **Purpose**: Provides storage for equipment
* **Effects**: `armoryCap = base + armoryTierBonus`
* **Tier Scaling**: +50 item capacity per tier

## Always-On Passive Effects

Facilities provide **always-on passive effects** that are evaluated by other systems:

* **No Manual Activation**: Facilities don't require clicking to activate
* **Automatic Evaluation**: Other systems automatically read facility effects
* **Continuous Operation**: Effects are always active while facility is `Online`

### Effect Evaluation

Other systems evaluate facility effects:

* **Mission System**: Reads `missionSlotsBonus` from Mission Command
* **Roster System**: Reads `rosterCapBonus` from Dormitory
* **Training System**: Reads `xpGainMultiplier` from Training Grounds
* **Storage System**: Reads `resourceStorageCapBonus` from Resource Depot
* **Recovery System**: Reads `fatigueRecoveryRate` from Infirmary

## Global Facility Upgrade Queue

Facilities are upgraded automatically via a **global upgrade queue**.

### Upgrade Queue System

1. **Queue Definition**: Player defines upgrade order (e.g., Dorms → Mission Command → Training Grounds → Resource Depot)
2. **Queue Processing**: System automatically processes queue when:
   * Resources are available (gold, materials, fame thresholds)
   * Upgrade slot is available (1 free slot, more via monetization)
3. **Automatic Start**: Next upgrade in queue starts automatically
4. **Continuous Processing**: Queue processes continuously as resources and slots become available

### Upgrade Requirements

Each facility upgrade requires:

* **Gold**: `costFor(facilityType, tier + 1)`
* **Materials**: May require materials (future system)
* **Fame**: `fameGateFor(facilityType, tier + 1)` (optional fame threshold)
* **Current Tier**: `facility.tier == currentTier` (must be at current tier to upgrade)

### Upgrade Process

1. **Check Queue**: System checks upgrade queue for next item
2. **Check Requirements**: Verify resources and fame thresholds
3. **Check Slot**: Verify upgrade slot is available
4. **Start Upgrade**: Execute `UpgradeFacility(facilityId)` action
5. **Reserve Resources**: Resources are spent
6. **Set Timer**: `constructionCompleteAt = now + upgradeDuration` (if upgrade takes time)
7. **Complete Upgrade**: When timer expires (or immediately if instant):
   * `facility.tier++`
   * Recalculate facility effects
   * Emit `FacilityUpgraded` event
8. **Process Next**: Queue automatically processes next upgrade

### Upgrade Queue Management

* **Queue Order**: Player defines order (can be reordered)
* **Queue Slots**: 1 free slot, additional slots via monetization
* **Queue Pausing**: Queue pauses if resources insufficient (resumes when resources available)
* **Queue Skipping**: Player can skip items in queue (optional)

## Remove Manual Toggle Assumptions

Facilities **never** require manual activation:

* ❌ No "click to activate" boosts
* ❌ No manual toggle switches
* ❌ No rapid check-in loops
* ✅ Always-on passive effects
* ✅ Automated upgrade queue
* ✅ Continuous operation

## Integration Points

### With Mission System
* Mission Command provides mission slots
* See `09-mission-system.md`

### With Roster System
* Dormitory provides roster capacity
* Infirmary provides recovery services
* See `10-adventurers-roster.md`

### With Equipment System
* Armory provides equipment storage
* See `11-equipment-auto-equip.md`

### With Resource System
* Resource Depot provides storage capacity
* See `16-resources-economy.md`

## Events

The facility system emits the following events:

* `FacilityUpgraded` - Facility tier increased
* (Future) `FacilityConstructed` - New facility built
* (Future) `FacilityDisabled` - Facility disabled

## MVP Scope

For MVP, the facility system includes:

* ✅ 7 facility types (Guildhall, Dormitory, Mission Command, Training Grounds, Resource Depot, Infirmary, Armory)
* ✅ Always-on passive effects
* ✅ Global upgrade queue
* ✅ Automated upgrade processing
* ✅ Tier-based scaling

Future enhancements (out of MVP scope):

* Facility construction (building new facilities)
* Facility disabling/enabling
* Advanced facility effects
* Facility synergies
* Regional facilities

