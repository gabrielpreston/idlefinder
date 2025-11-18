# 📘 Project: Idlefinder — Authoritative Technical Specification

---

# 1. High-Level Runtime Model

## 1.1 Single Game Runtime per Browser Tab

* Only **one** active game simulation runs in a given browser tab.
* Save slots may exist under the hood, but only one is ever **loaded** into memory at once.
* Multi-runtime support is intentionally **not required** for the MVP.

## 1.2 Explicit Runtime Factory (`startGame()`)

* The game runtime (BusManager, gameState store, handlers) is created via a **factory function**.
* This runtime instance is passed to the UI via **Svelte context/props**.
* **No global singletons** (no `getBusManager()`).

---

# 2. Simulation Authority & Long-Term Alignment

## 2.1 Client-Authoritative Now, Server-Authoritative Later

* MVP simulation is **fully client-side**, running entirely in-browser.
* But the architecture is intentionally shaped to support a **future server-authoritative model**.
* Long-term decisions influence:

  * determinism
  * DTO-based persistence
  * domain purity
  * strict typing
  * time abstraction
  * separation between simulation and UI

---

# 3. Event Bus Architecture

## 3.1 Only One Event Bus System

* The official/standard system is `src/lib/bus/*`:

  * `CommandBus`
  * `DomainEventBus`
  * `TickBus`
* The experimental `lifecycleEvents.ts` bus is **non-authoritative** and will be deprecated/removed.

## 3.2 Bus Is Infrastructure — Domain Must Not Depend on It

* **Strict domain purity**:
  No domain system or domain entity may import or depend on any bus.
* The bus invokes domain systems, not the other way around.
* Domain systems are **pure functional units** with no external side effects.
* **Domain Events** (as defined in `08-systems-primitives-spec.md`) are domain primitives that describe what happened.
* The `DomainEventBus` is infrastructure that publishes these domain event payloads.
* Domain systems generate Events; the bus transports them.

---

# 4. Time, Determinism, Offline Progress

## 4.1 Strict Time Rule: Domain Never Calls `Date.now()`

* Time is always passed into domain systems as a `Timestamp` or `Duration`.
* No domain code may call:

  * `Date.now()`
  * `performance.now()`
  * `Timestamp.now()`
* Only the runtime/infrastructure layer may obtain wall-clock time.

## 4.2 Pluggable `DomainTimeSource`

A clean interface:

```ts
interface DomainTimeSource {
  now(): Timestamp;
}
```

Implementations include:

* `RealTimeSource` (default) - uses system clock
* `SimulatedTimeSource` (dev/testing) - controllable time for deterministic tests
* `ServerTimeSource` (future) - server-provided time for multiplayer

**Usage Pattern:**
* `BusManager` holds a `DomainTimeSource` instance
* `CommandBus` receives time from `DomainTimeSource` and passes it to handlers via `CommandHandlerContext`
* Command handlers receive `currentTime: Timestamp` in their context parameter
* Handlers **never** call `Timestamp.now()` directly - they use `context.currentTime`
* Persistence layer receives time from `DomainTimeSource` via `PersistenceBus`

## 4.3 Offline Progress = Full Deterministic Replay

* On game load:

  * Compute elapsed real time.
  * Run deterministic tick-by-tick simulation until caught up.
* No approximation shortcuts.

## 4.4 UI Interpolation Allowed

* UI may use real-time (`Date.now() / performance.now()`) **for visual-only smoothing**.
* UI interpolation is **never authoritative**.
* UI uses separate `TimeSource` interface (`src/lib/stores/time/timeSource.ts`) that returns `Readable<number>` stores for reactive updates.

## 4.5 Unified Time Handling Pattern

**Command Handlers:**
```typescript
// ✅ CORRECT: Time passed via context
export function createHandler(): CommandHandler<CommandPayload, GameState> {
  return async (payload, state, context) => {
    const now = context.currentTime; // From DomainTimeSource
    // Use now for all time-dependent operations
  };
}

// ❌ WRONG: Direct time access
export function createHandler(): CommandHandler<CommandPayload, GameState> {
  return async (payload, state) => {
    const now = Timestamp.now(); // Violates spec 4.1
  };
}
```

**Timer Access:**
* Timers stored as `Record<string, number | null>` (milliseconds) in entities
* Use `TimerHelpers.getTimer()` and `TimerHelpers.setTimer()` for entity timer access
* Convert to/from `Timestamp` only at boundaries (entity methods use `Timestamp`, storage uses milliseconds)

**Time Source Flow:**
1. `BusManager` holds `DomainTimeSource`
2. `CommandBus` gets time from `DomainTimeSource.now()` → passes to handlers via `CommandHandlerContext`
3. `PersistenceBus` gets time from `DomainTimeSource.now()` → passes to `LocalStorageAdapter.save()`
4. `TickBus` uses `DomainTimeSource` for tick timestamps
5. Domain systems receive time as parameters (never call `Timestamp.now()`)

---

# 5. Persistence & Save System

## 5.1 Persistence Is Local for MVP but Migratable to Remote DB

* MVP uses browser-only persistence (LocalStorage/IndexedDB).
* But persistence boundaries and DTO structures must be ready for:

  * server backing
  * remote DB
  * migrations
  * multi-device sync

## 5.2 Dedicated DTO Layer Is the Source of Truth for Persistence

* Domain models are **not serialized directly**.
* A strict mapping layer exists:

  * `domainToDTO`
  * `dtoToDomain`
* DTOs are stable across versions.
* Domain models may evolve while DTOs remain backward-compatible.

## 5.3 One Autosave Slot

* MVP supports exactly **one autosave slot**.
* No player-visible profile management.
* Backup/secondary slots can be added later if needed.

---

# 6. Domain Modeling Standards

## 6.1 `GameState` is the Sole In-Memory Model

* UI renders from `gameState` only.
* `GameState` uses an **Entity map structure** where all game objects (Adventurers, Missions, Facilities) are Entities.
* All entities implement the `Entity` interface with: `id`, `type`, `attributes`, `tags`, `state`, `timers`, `metadata`.
* Core systems reason over entities by `type`, `attributes`, `tags`, and `state` - never by specific entity IDs.
* Legacy `PlayerState` and `organizationStore` are deprecated and removed.
* DTOs live below domain, not used as UI state.

## 6.2 Entity Primitive Structure

* All domain entities follow the Entity primitive structure defined in `08-systems-primitives-spec.md`.
* Entities are typed "things" with:
  * `id`: unique identifier
  * `type`: enum/string (e.g. `Adventurer`, `Mission`, `Facility`)
  * `attributes`: structured data describing capabilities/stats
  * `tags`: mechanical tags for classification/synergy
  * `state`: finite state machine label
  * `timers`: time-related fields (milliseconds)
  * `metadata`: optional non-mechanical info (includes `loreTags` for thematic tags)

## 6.3 Canonical Barrel Exports for Domain Systems

* `src/lib/domain/systems/index.ts` is the only import surface for domain systems.
* All systems are exported from the barrel.
* No direct file-level imports.

## 6.4 Structured Gameplay Effects

* Effects are **data describing mutations**, not imperative logic.
* Effects are implemented as classes (e.g., `ModifyResourceEffect`, `SetEntityStateEffect`, `SetTimerEffect`).
* Effects can be sequenced: an action may produce a list of effects.
* All lasting change to game state flows through Effects.
* The domain is semantic, not textual - UI converts structured effects to text.
* Facility effects use structured `EffectDescriptor` objects with `effectKey` and `value`, not string descriptions.

## 6.5 Mission System Structure

* Missions follow the Entity primitive structure with formal states: `Available`, `InProgress`, `Completed`, `Expired`.
* Mission attributes include: `primaryAbility`, `dc`, `missionType`, `baseDuration`, `baseRewards`.
* Mission timers: `availableAt`, `startedAt`, `endsAt` (stored as milliseconds).
* This is the first iteration of the formal system - structure may still evolve as gameplay settles.
* Types and invariants remain intentionally loose for now, but follow the Entity primitive pattern.

## 6.6 Strict Unions Everywhere (Domain + DTO)

* All gameplay-critical categories, statuses, types, etc. use **strict string unions**.
* DTO shapes use the same unions.
* No naked `string` fields for enumerated concepts.

## 6.7 Automation Systems Architecture

The game implements **idle-first automation** where major gameplay loops run without player input. Automation systems include:

### Doctrine Engine

* **Purpose**: Automatically selects missions based on player-defined doctrine
* **Integration**: Reads mission doctrine from player policies, selects missions from available pool, forms parties automatically
* **See**: `09-mission-system.md` for detailed specification

### Auto-Equip System

* **Purpose**: Automatically equips gear to adventurers based on player-defined rules
* **Integration**: Reads auto-equip rules (global and role-based), assigns equipment from Armory, triggers on recruitment and gear changes
* **See**: `11-equipment-auto-equip.md` for detailed specification

### Auto-Recruit System

* **Purpose**: Automatically recruits adventurers when roster falls below target
* **Integration**: Reads roster policies (target size, role distribution), recruits from caravans/local pools, auto-equips new recruits
* **See**: `10-adventurers-roster.md` for detailed specification

### Upgrade Queue System

* **Purpose**: Automatically processes facility upgrades from player-defined queue
* **Integration**: Reads upgrade queue order, checks resources and fame thresholds, starts upgrades when slots available
* **See**: `13-facilities-upgrades.md` for detailed specification

### Automation Principles

* **Policy-Driven**: All automation driven by player-defined policies (doctrine, rules, queues)
* **Event-Driven**: Automation systems respond to domain events (mission completion, recruitment, etc.)
* **Idle-Aware**: All automation respects offline time and processes catch-up automatically
* **No Manual Triggers**: Automation runs continuously without requiring player interaction

**Architecture Note**: Automation systems are domain systems that read policies and execute actions automatically. They follow the same Entity → Attributes → Tags → State/Timers → Requirements → Actions → Effects → Events pattern as manual systems, but are triggered by automation logic rather than player commands.


---

# 7. Testing Requirements

## 7.1 Domain Unit Tests Are Mandatory

* All meaningful domain changes require unit tests.
* Domain systems must be fully deterministic and easily testable.

## 7.2 Bus-Level Integration Tests Are Mandatory

* Any significant runtime behavior must have an integration test covering:

  * Command dispatch
  * Event flow
  * Tick progression
  * State updates
  * Persistence interactions

This ensures wiring and sequencing remain correct through refactors.

---

# 8. Documentation Philosophy

## 8.1 Documentation Split: Current vs. Future

Two separate doc sections:

### `docs/current/`

* Describes the MVP architecture exactly as implemented.
* Must always remain 1:1 with actual code.

### `docs/future/`

* Contains long-term design goals:

  * server authoritative model
  * Prisma/SQLite/remote DB plans
  * advanced progression systems
  * multiplayer or multi-device sync
* Clearly distinguished from present implementation.

---

# 9. Summary Table (Quick View)

| Area                 | Decision                                          |
| -------------------- | ------------------------------------------------- |
| Runtime instances    | One per tab                                       |
| Runtime access       | `startGame()` factory, no global singleton        |
| Simulation authority | Client for now, server later                      |
| Bus architecture     | Only one bus (`src/lib/bus`)                      |
| Domain purity        | Strict, no bus imports                            |
| Time                 | Pluggable `DomainTimeSource`, passed via `CommandHandlerContext`, no `Date.now()`/`Timestamp.now()` in domain |
| Offline              | Deterministic replay                              |
| Visuals              | UI may interpolate                                |
| Persistence          | Local now, remote-ready architecture              |
| Save slots           | One autosave                                      |
| State model          | `GameState` (Entity map), no PlayerState |
| Domain systems       | Barrel export required                            |
| Typing               | Strict unions everywhere                          |
| Effects              | Structured domain objects                         |
| Mission/Task         | Keep flexible                                     |
| Domain tests         | Mandatory                                         |
| Bus-level tests      | Mandatory                                         |
| Docs                 | Split into current + future                       |
