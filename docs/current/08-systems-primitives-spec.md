# 📜 Idlefinder Systems Primitives Spec (MVP-Oriented, Extensible)

## 0. Purpose

Define a **small, reusable vocabulary** of primitives that all game systems use:

> **Entities → Attributes → Tags → State/Timers → Resources → Requirements → Actions → Effects → Events**

Adventurers, missions, facilities, caravans, crafting, planar content, etc. are *all* expressed in terms of this set. This keeps the engine:

* Easy to reason about
* Easy to extend
* Resistant to feature sprawl

---

## 1. Entities

**Definition:**
A typed "thing" in the simulation with identity and attached data.

**Core properties:**

* `id`: unique identifier
* `type`: enum/string (e.g. `Adventurer`, `Mission`, `Facility`)
* `attributes`: key/value map (static or slow-changing)
* `tags`: string array for classification/synergy
* `state`: finite state machine label for current lifecycle state
* `timers`: time-related fields (start/end/cooldowns)
* `metadata`: optional non-mechanical info (names, flavor, logs)

**Complete structure (conceptual TypeScript):**

```ts
Entity = {
  id: string,
  type: string,              // "Adventurer" | "Mission" | "Facility" | "Region" | ...
  attributes: Record<string, any>,
  tags: string[],            // mechanical tags
  state: string,             // type-local FSM state
  timers: Record<string, number | null>,
  metadata: {
    displayName?: string,
    description?: string,
    loreTags?: string[],     // world/theme tags (canonical location)
    visualKey?: string,
  }
}
```

**Invariants:**

* `type` determines which attributes, states, and actions are valid.
* Core systems never special-case a specific *id*; they reason over `type`, `attributes`, `tags`, and `state`.
* `tags` are for mechanical rules; `metadata.loreTags` are for worldbuilding/theming (no gameplay logic depends on them).

---

## 2. Attributes

**Definition:**
Structured data describing an entity’s **capabilities, stats, and configuration**.

Examples (conceptual, not final TS):

* Adventurer:

  * `level`, `abilityMods`, `classKey`, `ancestryKey`, `baseHP`
* Mission:

  * `dc`, `primaryAbility`, `baseDuration`, `baseRewards`
* Facility:

  * `tier`, `baseCapacity`, `bonusMultiplier`

**Properties:**

* Mostly numeric, enums, or small structs.
* Read-only during an action; mutations happen via **Effects**.

**Design rule:**
All mechanics that “need to know X about Y” should read from attributes, not from entity-type-specific branching.

---

## 3. Tags

**Definition:**
Lightweight labels for classification, filtering, and synergy.

**Two types:**

* **`tags`**: Mechanical tags used in rules, synergies, and gameplay logic.
* **`metadata.loreTags`**: Thematic/worldbuilding tags used for text, art, and theming (no gameplay logic depends on these). This is the canonical location for lore tags.

**Examples:**

* Adventurer mechanical tags: `["wilderness", "divine", "ranged"]`
* Adventurer lore tags: `["human", "taldor", "noble"]`
* Mission mechanical tags: `["combat", "undead", "escort"]`
* Mission lore tags: `["forest", "ancient-ruins"]`
* Facility mechanical tags: `["training", "storage"]`
* Facility lore tags: `["gothic", "stonework"]`

**Uses:**

* Matching logic: `if sharedTag(adventurer, mission) → small bonus`
* Content filters: "show missions with `urban` tag"
* Future systems: factions, traits, regional effects, etc.
* Worldbuilding: `loreTags` enable narrative hooks without coupling to mechanics

**Design rule:**
Tags are cheap to add and powerful to reuse. Prefer tags to new bespoke attributes when you're expressing "category/affinity" rather than a numeric stat. Use `metadata.loreTags` for worldbuilding; they're safe to add early since no gameplay logic depends on them.

---

## 4. State & Timers

### 4.1 State

**Definition:**
The current phase or condition of an entity’s lifecycle.

Examples:

* Adventurer: `Idle`, `OnMission`, `Recovering`, `Dead`
* Mission: `Available`, `InProgress`, `Completed`, `Expired`
* Facility: `UnderConstruction`, `Online`, `Disabled`

**Properties:**

* Encoded as a small enum per entity type.
* Transitions only occur via **Actions** + **Effects**.

### 4.2 Timers

**Definition:**
Time-related values that control idle behavior and lifecycle progression.

Examples:

* `startedAt`, `endsAt` for missions
* `cooldownUntil` for an adventurer or facility
* `constructionCompleteAt` for facilities

**Storage Format:**
* Timers are stored as `Record<string, number | null>` where values are **milliseconds since epoch**
* `null` indicates timer is not set/cleared
* Entity methods use `Timestamp` objects via `TimerHelpers.getTimer()` and `TimerHelpers.setTimer()`
* Conversion between `Timestamp` and milliseconds happens at boundaries

**Idle resolution:**

* Offline/idle logic consumes **current time** (from `DomainTimeSource`) + entity **timers** + **state**
  to determine how far things have progressed.

**Design rule:**
The idle loop is pure: given `(previousState, timers, now)` it computes a new `(state, timers)` via Effects.
* `now` is always passed as a parameter (from `DomainTimeSource`), never obtained directly

---

## 5. Resources

**Definition:**
Quantities that can be produced, consumed, or transformed.

Types:

* Global/guild resources: `gold`, `materials`, `fame`, etc.
* Per-entity resources (most importantly): `adventurer.xp`

**Properties:**

* Represented as numeric values in one or more pools.
* Mutated only via **Effects**.
* Referenced by **Requirements** (costs) and **Effects** (rewards).

**Design rule:**
Any “currency-like” or countable quantity goes through the Resource pipeline, not hidden as arbitrary attributes.

---

## 6. Requirements

**Definition:**
Predicates (boolean checks) over entities, resources, state, timers, or tags.

**Signature (conceptual):**

```ts
Requirement(context) -> boolean
// context includes: entities, resources, currentTime, maybe action parameters
```

**Common examples:**

* Adventurer requirements:

  * `level >= 2`
  * `state == Idle`
* Mission requirements:

  * `adventurer.abilityMods[primaryAbility] >= threshold`
  * `adventurer.state == Idle`
* Facility requirements:

  * `gold >= 100`
  * `facility.tier == currentTier`

**Use cases:**

* Gating actions (assign, upgrade, start mission)
* Determining outcome bands (success / failure) when resolving

**Design rules:**

* Requirements are *pure* (no side effects).
* Actions are declaratively defined as:

  * `preconditions: Requirement[]`
  * If any fails, action is rejected with a reason.

---

## 7. Actions

**Definition:**
The verbs of the system — things initiated by the player or engine.

Examples:

* `CreateAdventurer`
* `AssignAdventurerToMission`
* `ResolveMissionOutcome`
* `UpgradeFacility`
* `TickIdleProgress`

**Action lifecycle:**

1. Validate **Requirements**.
2. Compute **Effects** (including any randomness).
3. Apply **Effects** to entities/resources.
4. Emit **Events** describing what happened.

**Design rule:**
Actions should be small and composable. “Big” behaviors are built by sequencing simple actions, not by creating mega-actions.

---

## 8. Effects

**Definition:**
Descriptions of state and resource changes caused by actions.

Examples:

* Entity field mutations:

  * `adventurer.level++`
  * `mission.state = InProgress`
* Resource mutations:

  * `gold += 50`
  * `fame += 5`
* Timers:

  * `mission.endsAt = now + duration`
* Derived stat changes:

  * Recalculate `adventurer.abilityMods` on level-up (if needed)

**Properties:**

* Effects are **data describing mutations**, not imperative logic spread everywhere.
* Effects can be sequenced: an action may produce a list of effects.
* Effects are implemented as structured classes (e.g., `ModifyResourceEffect`, `SetEntityStateEffect`).
* **The domain is semantic, not textual**: Effects are structured data objects, not string descriptions.
* UI converts structured effects to human-readable text for display.

**Design rule:**
All lasting change to game state flows through Effects. This makes it easier to:

* Log and audit
* Replay/check consistency
* Hook into Events
* Maintain type safety and semantic meaning

---

## 9. Events

**Definition:**
Notifications that something meaningful happened.

Examples:

* `MissionStarted`
* `MissionCompleted`
* `MissionFailed`
* `AdventurerGainedLevel`
* `AdventurerDied`
* `FacilityUpgraded`

**Properties:**

* Events are read-only: they report what Effects already did.
* Events are domain primitives (data structures), not infrastructure.
* The `DomainEventBus` (infrastructure) publishes these event payloads to subscribers.
* Payload includes:

  * Entity IDs involved
  * Key attributes before/after (if useful)
  * Resource deltas
  * Outcome bands (e.g., success/crit failure)

**Design rule:**

* Core engine doesn't *depend* on Events; it uses them as an integration surface:

  * UI updates
  * Narrative hooks
  * Analytics/telemetry
  * Post-processing (e.g., memorialization, later)
* Domain systems generate Events; infrastructure (DomainEventBus) transports them.

---

# 10. Applying the Primitives to MVP Domains

Now, the three domains you care about right now — Adventurers, Missions, Facilities — expressed strictly in terms of the primitives.

---

## 10.1 Adventurer (Entity Type: `Adventurer`)

**Attributes (MVP):**

* `level: number`
* `xp: number`
* `abilityMods: { str, dex, con, int, wis, cha }`
* `classKey: string` - Pathfinder class identifier (e.g., "fighter", "wizard", "rogue", "cleric", "barbarian", "alchemist", "bard", "ranger")
* `ancestryKey: string` - Pathfinder ancestry identifier (e.g., "human", "elf", "dwarf", "gnome", "goblin", "halfling", "orc", "tiefling")
* `traitTags: string[]` - Pathfinder mechanical traits: "arcane", "divine", "occult", "primal", "healing", "finesse", "agile", "ranged", "melee", "undead", "construct", "beast"
* `roleKey: "martial_frontliner" | "mobile_striker" | "support_caster" | "skill_specialist" | ...` (derived from `classKey`)
* `equipment?: { weaponId?: string, armorId?: string, offHandId?: string, accessoryId?: string }` (references to Item entities; managed by auto-equip system)

**Tags (MVP):**

* Mechanical: Examples: `["wilderness", "divine", "ranged"]`
* Lore (optional): Examples: `["human", "taldor"]`

**State:**

* `Idle`
* `OnMission`
* `Fatigued` (initial non-lethal penalty state)
* (Optional later: `Recovering`, `Unavailable`, `Dead`)

**Timers:**

* `fatigueUntil?: number` (optional at first)
* `availableAt?: time` (for cooldown/recovery if used)

**Resources (per adventurer):**

* `xp` (main one)

**Key Requirements:**

* Can be assigned to mission:
  * `state === "Idle"` (or allow Fatigued with penalties)
* Can level up:
  * `xp >= xpThresholdFor(level)`

**Key Actions:**

* `GainXP(adventurerId, amount)`
* `LevelUpAdventurer(adventurerId)`
* `AssignAdventurerToMission(adventurerId, missionId)` (called automatically by doctrine engine, not manually)
* `AutoEquipAdventurer(adventurerId)` (called automatically when gear changes or on recruitment)
* (Later: `MarkAdventurerDead`, `StartRecovery`)

**Automation Integration:**

* **Roster Policies**: Adventurer lifecycle is managed by roster automation system based on player-defined policies (target roster size, role distribution, quality thresholds). See `10-adventurers-roster.md` for details.
* **Auto-Equip**: Equipment is automatically assigned based on player-defined auto-equip rules (global and role-based priorities). See `11-equipment-auto-equip.md` for details.
* **Auto-Recruitment**: New adventurers are automatically recruited when roster falls below target size, following recruitment policies.
* **Auto-Recovery**: Adventurers automatically recover from fatigue/injuries via infirmary system based on facility tiers.

**Key Effects:**

* On mission resolution:

  * `xp += calculatedAmount`
* On level up:

  * `level++`
  * Recalculate `abilityMods` (if using PF2E progression curves later).

**Key Events:**

* `AdventurerAssigned`
* `AdventurerGainedXP`
* `AdventurerLeveledUp`
* (Later: `AdventurerDied`)

---

## 10.2 Mission (Entity Type: `Mission`)

**Attributes (MVP):**

* `primaryAbility: "str" | "dex" | "con" | "int" | "wis" | "cha"`
* `dc: number`
* `missionType: "combat" | "exploration" | "investigation" | ...`
* `preferredRole?: roleKey`
* `baseDuration: number`
* `baseRewards: { gold; xp; fame?: number }`
* `missionPriorityWeight?: number` (used by doctrine engine for mission selection; higher = more likely to be selected)
* `slotRequirement: number` (number of mission slots required; typically 1, but may be higher for complex missions)
* (later) `regionId?: string`, `factionId?: string` (hooks into world layer)

**Tags (MVP):**

* Mechanical: `category` via tag (`"combat"`, `"diplomacy"`, `"resource"`), `terrain`: `"forest"`, `"urban"`, `"dungeon"`, `threatType`: `"undead"`, `"bandits"`, etc.
* Lore (optional): Examples: `["ancient-ruins", "bandit-hold"]`

**State:**

* `Available`
* `InProgress`
* `Completed`
* `Expired`

**Timers:**

* `availableAt` (optional)
* `startedAt?`
* `endsAt?`

**Requirements:**

* To start:

  * `mission.state == Available`
  * `adventurer.state == Idle`
* To complete/resolve:

  * `mission.state == InProgress`
  * `now >= mission.endsAt` (idle-aware)

**Actions:**

* `StartMission(missionId, adventurerId)` (called automatically by doctrine engine when mission is selected and party is formed)
* `ResolveMission(missionId)` (called by idle loop or tick)

**Automation Integration:**

* **Doctrine-Driven Selection**: Missions are automatically selected from available pool based on player's mission doctrine (maximize fame/hour, farm gold, balance XP/materials, avoid lethal missions). See `09-mission-system.md` for details.
* **Automatic Team Formation**: When a mission is selected, the system automatically forms a party from available adventurers following role templates and power thresholds.
* **Continuous Looping**: As soon as a mission slot is free, the doctrine engine automatically selects a new mission and forms a new party. The loop runs 24/7 without player input.
* **Mission Queue/Slot Management**: The system tracks available mission slots (determined by Mission Command facility tier) and automatically fills them based on doctrine.

**Effects (MVP):**

* On `StartMission`:

  * `mission.state = InProgress`
  * `mission.startedAt = now`
  * `mission.endsAt = now + baseDuration`
  * `adventurer.state = OnMission`
* On `ResolveMission`:

  * Run PF2E-style check:
    * `roll = d20 + adventurer.abilityMods[primaryAbility] + synergyBonuses`
  * Map to outcome band:
    * `CriticalSuccess | Success | Failure | CriticalFailure`
  * Apply rewards/penalties:

    * `gold += x`, `xp += y`, `fame += z` (if applicable)
    * (Optional later) Injury / death / extra loot
  * `mission.state = Completed`
  * `adventurer.state = Idle` (or `Dead`, later)

**Events:**

* `MissionStarted`
* `MissionCompleted` (include outcome band)
* `MissionFailed` (if you differentiate failure vs. no result)

---

## 10.3 Facility (Entity Type: `Facility`)

**Attributes (MVP):**

* `facilityType: "Guildhall" | "Dormitory" | "MissionCommand" | "TrainingGrounds" | "ResourceDepot"`
* `tier: number`
* Numeric hooks:
  * `missionSlotsBonus: number`
  * `xpGainMultiplier: number`
  * `fatigueRecoveryRate: number`
  * `resourceStorageCapBonus: number`

**Tags:**

* Mechanical: Examples: `["storage"]`, `["training"]`, `["mission-control"]`
* Lore (optional): Examples: `["gothic", "stonework"]`

**State:**

* `Online`
* (Optional future: `UnderConstruction`, `Disabled`)

**Timers (optional MVP, but future-proof):**

* `constructionCompleteAt?`

**Requirements:**

* To upgrade:

  * `gold >= costFor(tier + 1)`
  * (Optional) `fame >= fameGateFor(facilityType, tier + 1)`
  * `facility.tier == currentTier`

**Actions:**

* `UpgradeFacility(facilityId)` (called automatically by upgrade queue system when resources and slot are available)

**Automation Integration:**

* **Upgrade Queue**: Facilities are upgraded automatically via a global upgrade queue. Player defines the upgrade order (e.g., Dorms → Mission Command → Training Grounds → Resource Depot), and the system automatically starts the next upgrade when resources and slot are available. See `13-facilities-upgrades.md` for details.
* **Passive Effects**: Facilities provide always-on passive effects (multipliers, capacity bonuses) that are evaluated by other systems. No manual activation required.
* **Queue Behavior**: The upgrade queue system tracks available upgrade slots (typically 1 free slot, more via monetization) and automatically processes the queue.

**Effects (MVP; passive, evaluated by other systems):**

* Dormitory:

  * `rosterCap = baseCap + dormitoryTierBonus`
* Mission Command:

  * `maxActiveMissions = base + missionCommandTierBonus`
* Training Grounds:

  * Idle tick uses `trainingMultiplier` to compute `xp` gain
* Resource Depot:

  * `resourceStorageCap = base + depotTierBonus`

**Events:**

* `FacilityUpgraded`
* (Later: `FacilityConstructed`, `FacilityDisabled`)

---

## 10.4 Simple Synergy System

* Role synergy: if `adventurer.roleKey === mission.preferredRole` → `+1` to roll.
* Trait synergy (later): if `adventurer.traitTags` ∩ `mission.tags` ≠ ∅ → additional bonus.

All implemented as pre-resolution Effects/derived modifiers.

---

# 11. Layer B – Mechanical Depth Expansion

## 11.1 Status Effects

Attached to entities (mostly adventurers):

```ts
statusEffects: Array<{
  key: string,
  modifiers: {
    abilityModsDelta?: {...},
    rollBonus?: number,
    xpMultiplier?: number,
    dcModifier?: number,
    resourceGainMultiplier?: Record<string, number>,
  },
  expiresAt?: number,
  stacks?: number
}>
```

Used for injuries, buffs, training bonuses, debuffs, etc.

---

## 11.2 Items / Equipment (Entity: `Item`)

**Attributes:**

* `slot: "weapon" | "armor" | "utility" | ...`
* `modifiers: { armorBonus?; rollBonus?; traitTagsAdd?: string[]; ... }`

Adventurer has:

```ts
equipment: {
  weapon?: itemId;
  armor?: itemId;
  utility?: itemId;
}
```

Modifiers combine with base attributes / status effects.

---

## 11.3 Multi-Adventurer Composition

Logical `Party` structure (could be virtual, not persisted):

```ts
Party = {
  memberIds: string[],
  combinedMods: { ... },     // aggregate abilityMods
  traitTags: string[],       // union
  roleDistribution: Record<roleKey, number>
}
```

Missions can target `party` instead of a single adventurer; resolution uses `combinedMods`.

---

## 11.4 Scaling DC & Rewards

Configurable functions per mission tier/difficulty:

* `dc = baseDC + dcScaleFactor * tier`
* `rewards = baseRewards * rewardScaleFactor(tier)`

Centralized config, referenced by mission generation and progression.

---

## 11.5 Action Cost System

Common shape:

```ts
ActionCost = {
  gold?: number,
  materials?: Record<string, number>,
  time?: number,
  fatigue?: number
}
```

Used by:

* Upgrades
* Training
* Recruitment
* Special actions

Requirements check those; Effects apply changes.

---

## 11.6 Training & Specialization

Facilities or actions that apply **persistent** changes:

* Adjust base `abilityMods`
* Add permanent `traitTags`
* Add persistent `statusEffects` without `expiresAt`
* Possibly adjust `roleKey`

Mechanical archetype paths are built on this.

---

## 11.7 Job System / Task Queue

Generic scheduled jobs:

```ts
Job = {
  id: string,
  type: string,                // "Training", "Recovery", "Construction", ...
  targetEntityId: string,
  startsAt: number,
  completesAt: number,
  effectsOnComplete: Effect[]
}
```

Idle/offline resolution processes jobs whose `completesAt <= now`.

---

## 11.8 Failure Consequences

Maps outcome bands to penalties:

* Add fatigue
* Apply negative statusEffect
* Increment injury tier
* Reduce item durability

Tied into mission result Events.

---

## 11.9 Resource Multipliers

Multipliers keyed by source/type:

* `xpFromMissionsMultiplier`
* `goldFromCombatMissionsMultiplier`
* `trainingXpMultiplier`
* Node production multipliers

Supplied by facilities, status effects, items, world events, etc.

---

## 11.10 Passive Generation Nodes

Idle sources:

```ts
Node = {
  id: string,
  resourceType: "gold" | "xp" | "materials" | ...,
  baseRatePerHour: number,
  modifiedByTags: string[]    // e.g. ["facility:ResourceDepot", "trait:efficient"]
}
```

Idle loop: sum node outputs × applicable multipliers.

---

# 12. Layer C – Integrative / Orchestration Systems

## 12.1 Mission Templates & Generators

```ts
MissionTemplate = {
  key: string,
  missionType: string,
  primaryAbility: keyof abilityMods,
  baseDuration: number,
  baseDC: number,
  baseRewards: { gold; xp; fame? },
  tags: string[],
  scalingRules: { dcFactor; rewardFactor; durationGrowth? }
}
```

Generator + scaling model → concrete `Mission` entities.

---

## 12.2 Resource Sinks & Conversions

```ts
ConversionNode = {
  id: string,
  input: { gold?: number; materials?: Record<string, number> },
  output: { resource?: { type: string; amount: number }; xpBoost?: number; timeReduction?: number },
  duration?: number
}
```

Actions built over these convert resources and create sinks.

---

## 12.3 Mechanical Archetype Paths

```ts
ArchetypePath = {
  key: string,
  requirements: Requirement[],
  permanentModifiers: {
    abilityModsDelta?: {...},
    traitTagsAdd?: string[],
    roleKeyChange?: roleKey,
  }
}
```

Chosen at level milestones or via facilities.

---

## 12.4 Multi-Mission Orchestration

Structures that depend on multiple missions:

* Chains: mission B requires mission A completed.
* Sets: "complete N missions of type X".
* Composite goals using Requirements + Events over `Mission` entities.

---

## 12.5 Risk Bands & Injury Tiers

```ts
Injury = {
  tier: 1 | 2 | 3,
  modifiers: { ... },
  recoveryTime: number
}
```

Attached as statusEffects; recovery handled via Job system.

---

## 12.6 Parallel Progression Tracks

Formalize three axes:

1. **Adventurer**: level, archetype, gear.
2. **Mission**: available templates & tiers.
3. **Guild**: facility tiers, job capacity, nodes.

Each axis is a set of unlock Requirements + Effects (no new primitive).

---

## 12.7 Modular Buff/Debuff Engine

Rules that consume Events and apply/remove statusEffects:

* Event + context → list of Effects.

Example triggers:

* On mission start
* On outcome band
* On job completion
* Based on tags/roles/regions/factions

---

## 12.8 Auto-Assignment Hooks

Policies for automated mission assignment:

```ts
AutoAssignPolicy = {
  prioritizeRoleMatch?: boolean,
  avoidInjured?: boolean,
  maximizeXPGain?: boolean,
  minimizeRisk?: boolean,
  fatigueThreshold?: number,
}
```

Used to choose adventurers/parties via Requirements and derived metrics.

---

## 12.9 Unified Difficulty Curve Model

Central module/config with:

* XP per level curve
* DC growth factors
* Reward multipliers
* Upgrade/gear costs
* Node rates
* Recovery times

Referenced point-in-time by all scaling logic.

---

## 12.10 Simulation-Based Balancing (Internal)

Offline tools that run the real Actions/Effects engine to:

* Estimate XP/hour, gold/hour, injury risk.
* Validate curves.

No new runtime primitives.

---

# 13. Layer D – World-Structure Primitives (Future Worldbuilding-Ready)

These are the **structural** worldbuilding aids, integrated into the same primitive model but currently mechanics-first and flavor-neutral.

## 13.1 Region (Entity: `Region`)

```ts
Region = {
  id: string,
  attributes: {
    tier: number,
    tags: string[],                    // mechanical: "dangerous", "starter", ...
    modifiers: {
      dcModifier?: number,
      rewardModifier?: number,
      nodeRateModifiers?: Record<string, number>,
    }
  },
  loreTags?: string[],                 // thematic: "forest", "coastal", ...
  state: string,                       // e.g. "Unlocked" | "Locked" | "UnderThreat"
  timers: {}
}
```

Missions / facilities can reference `regionId`.

---

## 13.2 Faction (Entity: `Faction`)

```ts
Faction = {
  id: string,
  attributes: {
    reputation: number,
    rewardMultiplier: number,
    preferredMissionTags: string[],
  },
  loreTags?: string[],                 // e.g. "merchant", "military"
  state: string,                       // e.g. "Neutral" | "Allied" | "Hostile"
  timers: {}
}
```

Missions, world events, vendors, caravans, etc. can be linked to factions.

---

## 13.3 WorldEvent (Entity: `WorldEvent`)

```ts
WorldEvent = {
  id: string,
  attributes: {
    eventType: string,                 // "resource_boost" | "outbreak" | ...
    modifiers: {
      globalMultipliers?: {...},
      regionModifiers?: Record<regionId, {...}>,
      factionModifiers?: Record<factionId, {...}>,
    },
    regionId?: string,
    factionId?: string,
  },
  state: "Scheduled" | "Active" | "Expired",
  timers: { startsAt: number; endsAt: number }
}
```

Runs through the same job/timer/event system.

---

## 13.4 EncounterTemplate

Used for future mission/encounter generation, logic-only:

```ts
EncounterTemplate = {
  id: string,
  tags: string[],                      // "combat", "trap", "hazard"
  difficulty: number,
  mechanicalProfile: {
    primaryAbility: keyof abilityMods,
    dcModifier: number,
    statusOnFail?: string,             // e.g. "injury_tier_1"
    rewardAdjustments?: {...}
  }
}
```

Can be tied to Regions, Factions, WorldEvents later via tags/loreTags.

---

## 13.5 WorldState

Global aggregator (can be implicit or explicit structure):

```ts
WorldState = {
  activeRegionIds: string[],
  activeWorldEventIds: string[],
  globalModifiers: {
    resourceMultipliers?: {...},
    dcModifiers?: {...},
  }
}
```

Systems read from this when resolving actions; WorldEvents + Regions + Factions write to it via Effects.

---

## 13.6 Lore/Theme Tags & Metadata

Already integrated in Entity:

* `metadata.loreTags` for thematic classification (canonical location).
* `metadata.displayName`, `metadata.description`, `metadata.visualKey` for future worldbuilding, text, and art.

Crucially: **no gameplay logic is required to depend on these**; they are safe to add early.

---

## 14. Extension Philosophy

Everything post-MVP (caravans, crafting, planar missions, relationships, injuries, factions) should be expressible as:

* New **Entity types** (e.g. `Caravan`, `Item`, `StatusEffect`, `Faction`, `Region`, `WorldEvent`, `Job`, `Node`, `Party` (virtual))
* New **Attributes** & **Tags**
* New **Requirements** (e.g., faction standing, item ownership)
* New **Effects** (e.g., add item, apply injury status)
* New **Events** (e.g., `CaravanArrived`, `StatusApplied`)

No new fundamental primitive should be required.

The four layers (A: PF2E-aligned core, B: Mechanical depth, C: Orchestration, D: World-structure) provide a complete scaffolding that can support both deep systems **and** future worldbuilding without requiring new primitives.
