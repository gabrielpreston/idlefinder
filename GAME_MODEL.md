Talking in terms of **conceptual modules, entities, and processes**, not frameworks.

---

## 1. High-Level Structure

Think of the game as four big pieces:

1. **Domain Model** – the nouns: what exists in the world.
2. **Simulation Systems** – the verbs: how things change over time.
3. **State Store** – how world and player state are persisted.
4. **Interaction Layer** – how a client sends commands and reads state (UI can come later).

Everything else hangs off of this.

---

## 2. Core Domain Model (Building Block Entities)

These are your core, flavorless types. Later you can give them names, art, and lore, but structurally they stay the same.

### 2.1 Universal Primitives

* **Identifier**

  * Opaque unique ID for any entity (`EntityId`).
* **Timestamp**

  * Absolute time in some canonical format.
* **Duration**

  * A quantity of time used for tasks, cooldowns, rotations.
* **NumericStat**

  * A named numeric value (e.g. `"combat"`, `"social"`), but abstracted as `StatKey -> number`.
* **ResourceUnit**

  * `{ resourceType: string, amount: number }`.
* **ResourceBundle**

  * Collection of `ResourceUnit`, used for costs and rewards.

These show up everywhere.

---

### 2.2 Player & Organization

For the MVP, “player” and “organization/base” can be merged or kept distinct. Conceptually:

* **PlayerAccount**

  * Identity of the player (even if anonymous).
  * References exactly one **Organization** in MVP.

* **Organization**

  * Represents the player’s long-lived “thing” (guild, company, clan, etc.).
  * Fields:

    * `id` (OrganizationId)
    * `ownerPlayerId`
    * `createdAt`, `lastActiveAt`
    * **Progress Tracks** (see 2.3)
    * **Economy State** (wallet, storage)
    * References to:

      * Roster of **Agents**
      * Owned **Facilities**
      * Owned **Items**
      * Active **Tasks** / **TaskBoard**

---

### 2.3 Progress Tracks

Generalize all progression into tracks:

* **ProgressTrack**

  * `id`
  * `ownerOrganizationId`
  * `trackKey` (e.g. `"prestige"`, `"tech"`, `"reputation"`)
  * `currentValue: number`
  * Optional metadata: soft caps, rate modifiers.

All unlocks and gating (harder content, better vendors, new systems) should be expressed in terms of these tracks.

---

### 2.4 Agents (Units / Characters)

These are the “pieces” the player assigns to work.

* **AgentTemplate**

  * Static blueprint:

    * `id`
    * `baseStats: Map<StatKey, number>`
    * `growthProfile` (e.g. stat gains per level or tier)
    * `tags: string[]` (role tags, rarity bands, etc.)

* **AgentInstance**

  * Owned by an Organization:

    * `id`
    * `organizationId`
    * `templateId`
    * `level`, `experience`
    * `effectiveStats: Map<StatKey, number>` (base + growth + equipment)
    * `status`: `"IDLE" | "ASSIGNED" | "INJURED" | "UNAVAILABLE" | ...`
    * `currentTaskId` (if any)
    * Equipped items (references to ItemInstances)
    * Lifecycle timestamps (recruitedAt, retiredAt, etc.)

The key separation: **template** is design/balance data; **instance** is player-specific progression.

---

### 2.5 Tasks (Missions / Jobs / Expeditions)

The idle loop is all about *tasks* that you send agents on, which resolve over time.

You want three levels here:

1. **TaskArchetype** – abstract template: “a type of activity that exists.”
2. **TaskOffer** – a concrete, currently available opportunity for a specific Organization.
3. **TaskInstance** – a specific run the player has started.

#### 2.5.1 TaskArchetype

* `id`
* `category: string` (e.g. `"combat"`, `"diplomacy"`, `"research"`)
* `baseDuration: Duration`
* Participation rules:

  * `minAgents`, `maxAgents`
  * Recommended stat profile (e.g. `primaryStatKey`, `secondaryStatKeys[]`)
* Entry requirements:

  * Required **ProgressTrack** thresholds
  * Required resources (upfront costs)
* Reward model:

  * Base `ResourceBundle`
  * Optional scaling with agent level, organization tracks, etc.
  * Hooks for non-resource rewards (e.g. new AgentTemplate unlock, item templates).

#### 2.5.2 TaskOffer

* `id`
* `organizationId`
* `taskArchetypeId`
* Context:

  * Optional region/zone/grouping key (purely mechanical)
* Availability:

  * `createdAt`, optional `expiresAt`
  * Flags: `isTaken`, `assignedTaskInstanceId`

#### 2.5.3 TaskInstance

* `id`
* `organizationId`
* `taskArchetypeId`
* `originOfferId` (if it came from a TaskOffer)
* `assignedAgentIds: AgentId[]`
* Timing:

  * `startedAt`
  * `expectedCompletionAt`
  * `completedAt?`
* Outcome:

  * `status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"`
  * `outcomeCategory: string` (e.g. `"GREAT_SUCCESS" | "SUCCESS" | "FAILURE" | ...`)
  * `outcomeDetails`:

    * Random roll / score metrics
    * `RewardBundle`
    * Changes to Agents (injury, death, XP)
    * Changes to ProgressTracks
    * Changes to resources

---

### 2.6 Facilities (Upgrades / Buildings / Systems)

Facilities are **organization-level upgrades** that modify rules and capacities.

* **FacilityTemplate**

  * `id`
  * `typeKey` (e.g. `"training_center"`, `"task_control"`)
  * Tiered configurations:

    * For each `tier`:

      * `buildCost: ResourceBundle`
      * Required ProgressTrack values
      * **EffectDescriptors** (see below)

* **FacilityInstance**

  * `id`
  * `organizationId`
  * `facilityTemplateId`
  * `currentTier`
  * `constructedAt`, `lastUpgradeAt`

* **EffectDescriptor**

  * Data-driven representation of “this facility modifies the rules.”
  * Example structure:

    * `effectKey` (e.g. `"maxConcurrentTasks"`, `"agentRecoverySpeedMultiplier"`)
    * `value: number`
    * Optional `scope` (e.g. only affects certain TaskCategories or Agent tags)

The simulation systems interpret EffectDescriptors; the data stays generic.

---

### 2.7 Items & Inventory

Items are modifiers and consumables that plug into the other systems.

* **ItemTemplate**

  * `id`
  * `slotType` (if equippable)
  * `rarityKey`
  * `statModifiers: Map<StatKey, number>`
  * `taskModifiers: Map<string, number>` (e.g. `"successChanceBonus: +0.05"`)
  * `baseValue: ResourceBundle`
  * `tags: string[]` (for later systems, drop tables, etc.)

* **ItemInstance**

  * `id`
  * `organizationId`
  * `templateId`
  * `quantity` (for stackables)
  * `equippedByAgentId?`
  * `state` (e.g. `"IN_INVENTORY" | "CONSUMED" | "LOCKED"`)

---

### 2.8 Vendors / Rotating Opportunities

You’ll likely want **rotating points of interaction** beyond tasks (e.g. caravans, traders, special events).

* **VendorTemplate**

  * `id`
  * Gate conditions tied to ProgressTracks
  * Behavior parameters for rotations:

    * Active duration
    * Cooldown
    * Inventory rules (what kind of ItemTemplates can appear, quantities, prices)

* **VendorVisit**

  * `id`
  * `organizationId`
  * `vendorTemplateId`
  * `openedAt`, `closesAt`
  * Concrete inventory:

    * List of `ItemInstance` or references
  * Transaction log:

    * Entries of buys/sells with ResourceBundle cost/reward

---

### 2.9 Unlock Rules

System-wide rules that say:

> “When a ProgressTrack crosses X, unlock Y things.”

* **UnlockRule**

  * `id`
  * `trackKey`
  * `thresholdValue`
  * `effects`:

    * New TaskArchetypes available
    * New FacilityTemplates available
    * New VendorTemplates available
    * New AgentTemplates or ItemTemplates become eligible as rewards
  * Optional “one-time vs repeatable” flags

Unlock processing is a system (see next), not embedded into the entities.

---

## 3. Simulation & Rule Systems

These are pure logic modules that operate on the domain model. They should not care *how* data is stored or how commands arrive.

### 3.1 Task Resolution System

**Responsibility:** Take all `TaskInstance` that have reached or passed their expected completion time, and resolve them.

Inputs:

* Pending `TaskInstance`s
* Related `TaskArchetype`, `AgentInstances`, `Organization`, `Facilities`, `Items`, `ProgressTracks`

Core logic:

1. Compute an **effective task score** from:

   * Agents’ stats
   * Facility effects
   * Items and other modifiers
   * Optional randomness
2. Map the score to an `outcomeCategory`.
3. Generate:

   * Rewards (ResourceBundles, XP, items, new Agents, track increments)
   * Agent state changes (injured, dead, exhausted)
   * Organization state changes (wallet, progress tracks)
4. Mark `TaskInstance` as completed and apply all state changes atomically.

This is the heart of the idle loop.

---

### 3.2 Offer & Rotation System

**Responsibility:** Manage rotating opportunities:

* TaskOffers on a board (which tasks are currently available)
* VendorVisits
* Any other time-based “offers”

Core actions:

* When an Organization needs new TaskOffers:

  * Use TaskArchetypes + UnlockRules + randomness to generate a small set of offers.
* When VendorVisits expire:

  * Mark them closed.
* When it is time to open new vendors:

  * Check VendorTemplates against ProgressTracks; create new VendorVisits.

---

### 3.3 Progression System

**Responsibility:** Maintain and apply ProgressTracks, and process UnlockRules.

* Whenever a ProgressTrack changes:

  * Check all UnlockRules targeting that track.
  * Determine newly-crossed thresholds.
  * Apply unlock effects (e.g., mark new TaskArchetypes as available, enable new FacilityTemplates, etc.).

Important: unlock logic is **driven by data in UnlockRules**, not scattered throughout other systems.

---

### 3.4 Economy System

**Responsibility:** Central place for resource validation and transfer:

* Check if Organization can afford costs.
* Apply ResourceBundle additions and subtractions.
* Ensure consistency (no negative resources unless allowed by design).

Used by:

* Task start (upfront costs)
* Task resolution (rewards)
* Vendor transactions
* Facility construction/upgrades
* Agent recruitment

---

### 3.5 Roster & Recovery System

**Responsibility:** Manage Agent lifecycle and availability:

* Update Agent status after tasks (e.g. mark as INJURED for a duration).
* Recover Agents over time (e.g. after some Duration, move from INJURED back to IDLE).
* Handle level-ups and experience awards.

This can be implemented as:

* A periodic process that looks at Agents with time-based states (cooldowns, injuries) and updates them.
* Or part of the same scheduling loop as Task resolution.

---

## 4. State Store Abstractions (No Tech Assumed)

Assume a **generic persistence layer** with these conceptual responsibilities:

* **Repositories** per aggregate/root type:

  * `OrganizationRepository`
  * `AgentRepository`
  * `TaskRepository` (Offers + Instances)
  * `FacilityRepository`
  * `InventoryRepository`
  * `VendorRepository`
  * `ConfigRepository` (Archetypes, Templates, UnlockRules)

Each repository provides:

* `getById(id)`
* `save(entity)`
* Query methods tailored to that entity’s usage patterns:

  * e.g. `findPendingTasksReadyForResolution(now)`, `findOffersForOrganization(orgId)`

You can implement these repositories later using:

* Files, in-memory data, a relational DB, a key-value store, etc.
* The game logic stays the same.

---

## 5. Interaction Layer (Commands & Queries)

Keep the interface to the game **simple and abstract**; you can later map this to HTTP, CLI, desktop GUI, whatever.

### 5.1 Commands (Write operations)

Examples (not exhaustive):

* `CreateOrganization()`
* `StartTask(organizationId, offerId, agentIds)`
* `CollectTaskResult(organizationId, taskInstanceId)`
  (if you want an explicit “claim” step)
* `UpgradeFacility(organizationId, facilityInstanceId)`
* `PurchaseItem(organizationId, vendorVisitId, itemId, quantity)`
* `AssignItemToAgent(organizationId, itemInstanceId, agentId)`
* `RecruitAgent(organizationId, templateId)` (if recruitment is direct)

These commands:

* Validate business rules.
* Use repositories to fetch and update entities.
* Invoke systems (Economy, Progression, etc.) as needed.

### 5.2 Queries (Read operations)

Examples:

* `GetOrganizationOverview(organizationId)`
* `GetTaskBoard(organizationId)`
* `GetActiveTasks(organizationId)`
* `GetAgents(organizationId)`
* `GetFacilities(organizationId)`
* `GetInventory(organizationId)`
* `GetProgressTracks(organizationId)`
* `GetVendorVisits(organizationId)`

These return **read models / DTOs** that are convenient for UI, composed from the domain entities.

---

## 6. MVP Scope Using These Blocks

Within this building-block framework, an MVP only needs:

* **Core Entities**

  * Organization
  * ProgressTracks (at least one important track)
  * AgentTemplate + AgentInstance
  * TaskArchetype + TaskOffer + TaskInstance
  * A minimal FacilityTemplate + FacilityInstance (e.g. one that changes “max concurrent tasks”)
  * ResourceBundle as a generic economy object

* **Core Systems**

  * Task Resolution System
  * Offer & Rotation System (for Tasks)
  * Economy System
  * Progression System (for at least one track)

Everything else (vendors, complex facilities, deep itemization) can be added later without changing the fundamental shape of the system.

---

This gives you a **clean, flavorless, tech-neutral “game kernel”**:

* You can now pick any implementation stack and map:

  * Entities → classes/structs/tables/documents
  * Systems → services/modules
  * Repositories → DB/file/in-memory adapters
  * Commands/Queries → HTTP endpoints, RPC handlers, or anything else
* Once the loop feels good (assign agents → wait → resolve → progress), you can start grafting flavor, narrative, and UI onto these same primitives.
