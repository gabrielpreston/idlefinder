# 📘 Project: Idlefinder — Authoritative Technical Specification

---

# 1. High-Level Runtime Model

## 1.1 Single Game Runtime per Browser Tab

* Only **one** active game simulation runs in a given browser tab.
* Save slots may exist under the hood, but only one is ever **loaded** into memory at once.
* Multi-runtime support is intentionally **not required** for the MVP.

## 1.2 Explicit Runtime Factory (`startGame()`)

* The game runtime (BusManager, PlayerState, gameState store, handlers) is created via a **factory function**.
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

---

# 4. Time, Determinism, Offline Progress

## 4.1 Strict Time Rule: Domain Never Calls `Date.now()`

* Time is always passed into domain systems as a `Timestamp` or `Duration`.
* No domain code may call:

  * `Date.now()`
  * `performance.now()`
  * `Timestamp.now()`
* Only the runtime/infrastructure layer may obtain wall-clock time.

## 4.2 Pluggable `TimeSource`

A clean interface:

```ts
interface TimeSource {
  now(): Timestamp;
}
```

Implementations include:

* `RealTimeSource` (default)
* `SimulatedTimeSource` (dev/testing)
* `ServerTimeSource` (future)

## 4.3 Offline Progress = Full Deterministic Replay

* On game load:

  * Compute elapsed real time.
  * Run deterministic tick-by-tick simulation until caught up.
* No approximation shortcuts.

## 4.4 UI Interpolation Allowed

* UI may use real-time (`Date.now() / performance.now()`) **for visual-only smoothing**.
* UI interpolation is **never authoritative**.

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

## 6.1 `PlayerState` + `gameState` is the Sole In-Memory Model

* UI renders from `gameState` only.
* Legacy `organizationStore` and its derived stores are removed.
* DTOs live below domain, not used as UI state.

## 6.2 Canonical Barrel Exports for Domain Systems

* `src/lib/domain/systems/index.ts` is the only import surface for domain systems.
* All systems are exported from the barrel.
* No direct file-level imports.

## 6.3 Strict Unions Everywhere (Domain + DTO)

* All gameplay-critical categories, statuses, types, etc. use **strict string unions**.
* DTO shapes use the same unions.
* No naked `string` fields for enumerated concepts.

## 6.4 Structured Gameplay Effects

* All facility, mission, item, and other modifiers are expressed as **strongly typed objects**, e.g.:

```ts
type FacilityEffect =
  | { kind: 'ADVENTURER_CAPACITY'; value: number }
  | { kind: 'MISSION_SPEED'; multiplier: number };
```

* The domain is semantic, not textual.
* UI converts structured effects to text.

## 6.5 Mission/Task System Remains Flexible for Now

* Do **not** overformalize the Mission → Task → TaskInstance → Outcome hierarchy yet.
* The structure may evolve significantly.
* Types and invariants remain intentionally loose until gameplay settles.

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
| Time                 | Pluggable `TimeSource`, no `Date.now()` in domain |
| Offline              | Deterministic replay                              |
| Visuals              | UI may interpolate                                |
| Persistence          | Local now, remote-ready architecture              |
| Save slots           | One autosave                                      |
| State model          | `PlayerState` + `gameState`, no organizationStore |
| Domain systems       | Barrel export required                            |
| Typing               | Strict unions everywhere                          |
| Effects              | Structured domain objects                         |
| Mission/Task         | Keep flexible                                     |
| Domain tests         | Mandatory                                         |
| Bus-level tests      | Mandatory                                         |
| Docs                 | Split into current + future                       |
