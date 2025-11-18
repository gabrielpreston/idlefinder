# 09. Mission System

Mission System Specification (Automated, Doctrine-Driven)
This document describes the mission system for Idlefinder, which operates continuously without player input through doctrine-driven automation. Missions are the primary engine that converts time, roster, equipment, and doctrine into XP, gold, materials, fame, and items.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.1 - Mission Automation Loop
- `08-systems-primitives-spec.md` Section 10.2 - Mission Entity Structure
- `10-adventurers-roster.md` - Adventurer and roster automation
- `11-equipment-auto-equip.md` - Equipment system

## Overview

The mission system is **fully automated** and runs continuously 24/7. The player defines **mission doctrine** (what to maximize, risk tolerance), and the system automatically:

1. Selects missions from available pool based on doctrine
2. Forms parties from available adventurers
3. Deploys parties to missions
4. Resolves mission outcomes using PF2E-inspired mechanics
5. Processes rewards and consequences
6. Loops continuously as mission slots become available

The player never manually selects missions or assigns adventurers. They set policies, and the game executes them.

## Mission Entity Structure

Missions follow the Entity primitive structure defined in `08-systems-primitives-spec.md`:

### Entity Type
- `type: "Mission"`

### Attributes

* `primaryAbility: "str" | "dex" | "con" | "int" | "wis" | "cha"` - Primary ability used for mission resolution
* `dc: number` - Difficulty class for mission resolution (PF2E-inspired)
* `missionType: "combat" | "exploration" | "investigation" | "diplomacy" | "resource" | ...` - Mission category
* `preferredRole?: roleKey` - Preferred adventurer role for this mission (optional synergy bonus)
* `baseDuration: number` - Base duration in milliseconds
* `baseRewards: { gold: number; xp: number; fame?: number; materials?: number }` - Base reward values
* `missionPriorityWeight?: number` - Weight used by doctrine engine for mission selection (higher = more likely to be selected)
* `slotRequirement: number` - Number of mission slots required (typically 1, but may be higher for complex missions)
* (Future) `regionId?: string` - Region where mission takes place
* (Future) `factionId?: string` - Faction associated with mission

### Tags

**Mechanical Tags:**
* `category`: Mission category tag (`"combat"`, `"diplomacy"`, `"resource"`, `"defense"`, etc.)
* `terrain`: Terrain type (`"forest"`, `"urban"`, `"dungeon"`, `"wilderness"`, etc.)
* `threatType`: Threat classification (`"undead"`, `"bandits"`, `"beasts"`, etc.)
* `difficultyTier`: Difficulty tier (tied to fame thresholds)

**Lore Tags (metadata.loreTags):**
* Thematic tags for worldbuilding (e.g., `["ancient-ruins", "bandit-hold"]`)
* No gameplay logic depends on lore tags

### State

Missions use a finite state machine:

* `Available` - Mission is available for selection
* `InProgress` - Mission is currently active, adventurers are deployed
* `Completed` - Mission has been resolved successfully
* `Expired` - Mission expired before being selected (optional, for time-limited missions)

### Timers

* `availableAt?: number` - Timestamp (milliseconds) when mission becomes available (optional)
* `startedAt?: number` - Timestamp when mission was started
* `endsAt?: number` - Timestamp when mission will complete (used for idle resolution)

## Doctrine-Driven Selection

The mission selection system uses **doctrine** (player-defined policies) to automatically choose missions from the available pool.

### Mission Doctrine

Mission doctrine defines what the guild is trying to maximize and how much risk is acceptable:

**Focus Options:**
* `MaximizeFame` - Prioritize missions with highest fame/hour
* `MaximizeGold` - Prioritize missions with highest gold/hour
* `MaximizeXP` - Prioritize missions with highest XP/hour
* `MaximizeMaterials` - Prioritize missions with highest materials/hour
* `Balanced` - Balance multiple reward types

**Risk Tolerance:**
* `Safe` - Avoid missions with death risk > X% (configurable threshold)
* `Balanced` - Accept moderate risk
* `Aggressive` - Accept high risk for higher rewards

**Additional Policies:**
* Prefer short/long missions
* Avoid certain categories if healing is constrained
* Minimum success probability threshold

### Selection Algorithm

1. **Filter Available Missions**: Get all missions with `state === "Available"`
2. **Apply Doctrine Filters**: Filter out missions that violate risk tolerance or category preferences
3. **Calculate Priority Scores**: For each mission, calculate priority score based on:
   * Doctrine focus (fame/hour, gold/hour, etc.)
   * Mission priority weight
   * Success probability (based on available adventurers)
   * Slot availability
4. **Select Mission**: Choose mission with highest priority score
5. **Reserve Slot**: Mark mission slot as reserved (prevents double-booking)

### Mission Queue/Slot Management

The system tracks available mission slots, which are determined by the **Mission Command** facility tier:

* Base slots: 1 (without Mission Command)
* Additional slots: +1 per Mission Command tier
* Maximum slots: Determined by facility tier

When a mission slot becomes available:
1. Doctrine engine selects next mission
2. System forms party (see Automatic Team Formation)
3. Mission is started automatically
4. Slot is marked as in use until mission completes

## Automatic Team Formation

When a mission is selected, the system automatically forms a party from available adventurers.

### Team Formation Rules

1. **Filter Available Adventurers**: Get all adventurers with `state === "Idle"` (or `Fatigued` with penalties, if policy allows)

2. **Role Matching**: If mission has `preferredRole`, prioritize adventurers with matching role (synergy bonus)

3. **Power Threshold**: Ensure party meets minimum power threshold for mission difficulty:
   * Calculate combined ability modifiers
   * Check against mission DC
   * Ensure success probability meets minimum threshold (from doctrine)

4. **Role Composition**: Follow role templates if available:
   * Frontline + Support pattern
   * Balanced composition
   * Specialized composition (based on mission type)

5. **Equipment Check**: Ensure adventurers have appropriate equipment (based on auto-equip rules)

6. **Health/Durability Check**: Prefer healthier adventurers and gear with higher durability

### Party Size

* MVP: Single adventurer per mission (simplified)
* Future: Multi-adventurer parties (2-4 adventurers)

## Auto-Deployment

Once a party is formed, the mission is automatically started:

1. **Reserve Resources**: Check that mission slot is available
2. **Start Mission Action**: Execute `StartMission(missionId, adventurerId)` action
3. **Update States**: 
   * Mission: `Available` → `InProgress`
   * Adventurer: `Idle` → `OnMission`
4. **Set Timers**:
   * `mission.startedAt = now`
   * `mission.endsAt = now + baseDuration`
5. **Emit Event**: `MissionStarted` event

The mission now runs automatically until completion.

## Resolution (PF2E-Inspired)

When a mission's `endsAt` timer is reached (checked by idle loop), the mission is resolved using PF2E-inspired mechanics.

### Resolution Process

1. **Check Requirements**: Verify `mission.state === "InProgress"` and `now >= mission.endsAt`

2. **Calculate Roll**:
   ```
   roll = d20 + adventurer.abilityMods[primaryAbility] + synergyBonuses + equipmentBonuses
   ```
   Where:
   * `d20` = random roll (1-20)
   * `adventurer.abilityMods[primaryAbility]` = adventurer's ability modifier for mission's primary ability
   * `synergyBonuses` = bonuses from role matching, trait matching, etc.
   * `equipmentBonuses` = bonuses from equipped items (skill bonus, etc.)

3. **Determine Outcome Band**:
   * `CriticalSuccess`: `roll >= dc + 10`
   * `Success`: `roll >= dc`
   * `Failure`: `roll < dc`
   * `CriticalFailure`: `roll <= dc - 10`

4. **Calculate Rewards**:
   * Base rewards from `mission.baseRewards`
   * Scaled by outcome band:
     * CriticalSuccess: 150% rewards
     * Success: 100% rewards
     * Failure: 50% rewards (or no rewards, based on design)
     * CriticalFailure: 0% rewards (or penalties)

5. **Apply Consequences**:
   * XP gain for adventurer
   * Resource gains (gold, fame, materials)
   * (Future) Injuries, deaths, item durability loss

6. **Update States**:
   * Mission: `InProgress` → `Completed`
   * Adventurer: `OnMission` → `Idle` (or `Fatigued`, `Dead`, etc.)

7. **Emit Events**: `MissionCompleted` event with outcome band and rewards

### Automated Outcome Processing

All rewards and consequences are processed automatically:

* **Resource Gains**: Gold, fame, materials added to global resources
* **XP Gain**: Adventurer's XP increased
* **Level Ups**: If XP threshold reached, adventurer levels up automatically
* **Gear Durability**: Equipment durability decreases (if applicable)
* **Injuries**: Adventurers may become injured (future system)
* **Deaths**: Adventurers may die (future system)

## Auto-Recovery

After mission completion, adventurers automatically recover:

1. **State Transition**: Adventurer returns to `Idle` state (or `Fatigued` if injured)
2. **Recovery Time**: If injured, adventurer enters recovery period (managed by infirmary system)
3. **Gear Updates**: Equipment durability is updated
4. **Return to Pool**: Adventurer becomes available for next mission

## Continuous Looping

The mission system runs continuously:

1. **Idle Loop Checks**: Every tick, idle loop checks for missions ready to resolve
2. **Slot Availability**: When a mission completes, slot becomes available
3. **Automatic Selection**: Doctrine engine immediately selects next mission
4. **Automatic Formation**: System forms new party
5. **Automatic Deployment**: New mission starts automatically
6. **Repeat**: Cycle continues 24/7 without player input

The loop runs without player input, driven entirely by doctrine and policies.

## Risk Rules

The mission system includes risk management rules to prevent excessive adventurer deaths:

### Risk Calculation

For each mission, calculate death risk based on:
* Mission DC vs adventurer capabilities
* Mission difficulty tier
* Mission tags (some missions are inherently more dangerous)

### Risk Policies

* **Safe Doctrine**: Never select missions with death risk > 5%
* **Balanced Doctrine**: Accept missions with death risk up to 15%
* **Aggressive Doctrine**: Accept missions with death risk up to 30%

### Risk Enforcement

Before selecting a mission, system checks:
1. Calculate estimated death risk
2. Compare against doctrine risk tolerance
3. If risk exceeds threshold, skip mission and select next best option

## Mission Generation

Missions are generated by the world system (not detailed in this doc, but referenced):

* **Mission Pool**: World maintains a pool of available missions
* **Mission Refresh**: New missions added over time
* **Fame Gating**: Higher-tier missions unlock as fame increases
* **Mission Variety**: Missions vary by category, difficulty, rewards

## Integration Points

### With Roster System
* Missions draw from available adventurer roster
* Roster policies affect which adventurers are available
* See `10-adventurers-roster.md`

### With Equipment System
* Equipment bonuses affect mission resolution
* Auto-equip ensures adventurers have appropriate gear
* See `11-equipment-auto-equip.md`

### With Facility System
* Mission Command facility determines available mission slots
* Other facilities may provide mission bonuses
* See `13-facilities-upgrades.md`

### With Fame System
* Fame gates unlock higher-tier missions
* Missions generate fame as reward
* See `15-fame-unlocks.md`

## Events

The mission system emits the following events:

* `MissionStarted` - Mission has been started, party deployed
* `MissionCompleted` - Mission resolved successfully (includes outcome band and rewards)
* `MissionFailed` - Mission failed (if differentiated from completion)
* `AdventurerAssigned` - Adventurer assigned to mission (part of MissionStarted flow)

## MVP Scope

For MVP, the mission system includes:

* ✅ Doctrine-driven mission selection
* ✅ Automatic team formation (single adventurer)
* ✅ Automatic deployment
* ✅ PF2E-inspired resolution
* ✅ Automated reward processing
* ✅ Continuous looping
* ✅ Risk rules

Future enhancements (out of MVP scope):

* Multi-adventurer parties
* Mission chains/quests
* Regional missions
* Faction missions
* Mission templates and generators
* Advanced risk calculations

