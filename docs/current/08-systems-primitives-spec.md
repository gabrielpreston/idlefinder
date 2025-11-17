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
A typed “thing” in the simulation with identity and attached data.

**Core properties:**

* `id`: unique identifier
* `type`: enum/string (e.g. `Adventurer`, `Mission`, `Facility`)
* `attributes`: key/value map (static or slow-changing)
* `tags`: string array for classification/synergy
* `state`: finite state machine label for current lifecycle state
* `timers`: time-related fields (start/end/cooldowns)
* `metadata`: optional non-mechanical info (names, flavor, logs)

**Invariants:**

* `type` determines which attributes, states, and actions are valid.
* Core systems never special-case a specific *id*; they reason over `type`, `attributes`, `tags`, and `state`.

---

## 2. Attributes

**Definition:**
Structured data describing an entity’s **capabilities, stats, and configuration**.

Examples (conceptual, not final TS):

* Adventurer:

  * `level`, `abilityMods`, `classKey`, `ancestryKey`, `baseHP`
* Mission:

  * `difficultyTier`, `primaryAbility`, `baseDuration`, `baseReward`
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

Examples:

* Adventurer tags: `["wilderness", "divine", "scout"]`
* Mission tags: `["forest", "undead", "escort"]`
* Facility tags: `["training", "storage"]`

**Uses:**

* Matching logic: `if sharedTag(adventurer, mission) → small bonus`
* Content filters: “show missions with `urban` tag”
* Future systems: factions, traits, regional effects, etc.

**Design rule:**
Tags are cheap to add and powerful to reuse. Prefer tags to new bespoke attributes when you’re expressing “category/affinity” rather than a numeric stat.

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

**Idle resolution:**

* Offline/idle logic consumes **current time** + entity **timers** + **state**
  to determine how far things have progressed.

**Design rule:**
The idle loop is pure: given `(previousState, timers, now)` it computes a new `(state, timers)` via Effects.

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

**Design rule:**
All lasting change to game state flows through Effects. This makes it easier to:

* Log and audit
* Replay/check consistency
* Hook into Events

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
* Payload includes:

  * Entity IDs involved
  * Key attributes before/after (if useful)
  * Resource deltas
  * Outcome bands (e.g., success/crit failure)

**Design rule:**

* Core engine doesn’t *depend* on Events; it uses them as an integration surface:

  * UI updates
  * Narrative hooks
  * Analytics/telemetry
  * Post-processing (e.g., memorialization, later)

---

# 10. Applying the Primitives to MVP Domains

Now, the three domains you care about right now — Adventurers, Missions, Facilities — expressed strictly in terms of the primitives.

---

## 10.1 Adventurer (Entity Type: `Adventurer`)

**Attributes (MVP):**

* `level: number`
* `xp: number`
* `abilityMods: { str, dex, con, int, wis, cha }`
* `classKey: string`
* `ancestryKey: string`
* `roleTag: string` (e.g., `frontliner`, `support`, `skirmisher`)

**Tags (MVP):**

* Examples: `["wilderness", "divine", "ranged"]`

**State:**

* `Idle`
* `OnMission`
* (Optional later: `Recovering`, `Unavailable`, `Dead`)

**Timers:**

* `availableAt?: time` (for cooldown/recovery if used)
* (Not strictly required for first MVP, but slot is reserved.)

**Resources (per adventurer):**

* `xp` (main one)

**Key Requirements:**

* Can be assigned to mission:

  * `state == Idle`
* Can level up:

  * `xp >= xpThresholdFor(level)`

**Key Actions:**

* `GainXP(adventurerId, amount)`
* `LevelUpAdventurer(adventurerId)`
* `AssignAdventurerToMission(adventurerId, missionId)`
* (Later: `MarkAdventurerDead`, `StartRecovery`)

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

* `difficultyTier: "Easy" | "Medium" | "Hard" | "Legendary"`
* `primaryAbility: "str" | "dex" | ...`
* `baseDuration: number` (in seconds/minutes)
* `baseRewards: { gold: number; xp: number; fame?: number }`
* (Optional) `maxPartySize: number` (start with 1 if you want to keep pairing simple)

**Tags (MVP):**

* `category`: via tag (`"combat"`, `"diplomacy"`, `"resource"`)
* `terrain`: `"forest"`, `"urban"`, `"dungeon"`
* `threatType`: `"undead"`, `"bandits"`, etc.

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

* `StartMission(missionId, adventurerId)`
* `ResolveMission(missionId)` (called by idle loop or tick)

**Effects (MVP):**

* On `StartMission`:

  * `mission.state = InProgress`
  * `mission.startedAt = now`
  * `mission.endsAt = now + baseDuration`
  * `adventurer.state = OnMission`
* On `ResolveMission`:

  * Run PF2E-style check:

    * `roll = d20 + adventurer.abilityMods[primaryAbility] + synergyBonus`
  * Map to outcome band:

    * `CriticalSuccess / Success / Failure / CriticalFailure`
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
* `baseCapacity: number`
* `bonusMultipliers: { xp?: number; resourceGen?: number; missionSlots?: number }`

**Tags:**

* Examples: `["storage"]`, `["training"]`, `["mission-control"]`

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

* `UpgradeFacility(facilityId)`

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

## 11. Extension Philosophy

Everything post-MVP (caravans, crafting, planar missions, relationships, injuries, factions) should be expressible as:

* New **Entity types** (e.g. `Caravan`, `Item`, `StatusEffect`, `Faction`)
* New **Attributes** & **Tags**
* New **Requirements** (e.g., faction standing, item ownership)
* New **Effects** (e.g., add item, apply injury status)
* New **Events** (e.g., `CaravanArrived`, `StatusApplied`)

No new fundamental primitive should be required.
