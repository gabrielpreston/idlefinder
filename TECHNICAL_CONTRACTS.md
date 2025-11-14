## 1. Platform & Runtime

1. **Single repo, single app.**

   * One SvelteKit project contains:

     * UI
     * HTTP endpoints
     * Domain/simulation logic
     * Persistence layer

2. **Runs entirely on one machine.**

   * No AWS / remote services.
   * `npm run dev` and a local SQLite file are all that’s needed.

---

## 2. Frontend & App Shell

1. **Framework & language**

   * **SvelteKit + TypeScript** as the main framework.
   * Application is primarily an SPA-style experience (client-side navigation), but uses SvelteKit’s routing & load functions.

2. **PWA**

   * The app is a **PWA**:

     * Has a web app manifest.
     * Uses a service worker for basic offline caching of static assets.
     * Is installable on desktop and mobile.

3. **Client state management**

   * Use **Svelte stores** for:

     * Current organization snapshot.
     * Active tasks & offers.
     * Agents, facilities, inventory.
     * A `serverTimeBaseline` used for visual ticking.

---

## 3. Interaction Layer (Inside SvelteKit)

1. **Commands & Queries via SvelteKit server routes**

   * Commands (mutating operations) are implemented as **POST** endpoints or SvelteKit actions, e.g.:

     * `POST /api/organization/create`
     * `POST /api/tasks/start`
     * `POST /api/tasks/collect`
     * `POST /api/facilities/upgrade`
   * Queries (read models) are implemented as **GET** endpoints or `load()` functions:

     * `GET /api/organization/overview`
     * `GET /api/organization/task-board`
     * `GET /api/agents`
     * `GET /api/progress-tracks`

2. **Server routes are thin**

   * Parse/validate input.
   * Call **application services** in `src/lib/app`.
   * Application services call repositories and domain systems.
   * Responses are DTOs for UI consumption.

---

## 4. Core Simulation & Domain Model

1. **Location & isolation**

   * All game rules live in **pure TS modules** under `src/lib/domain`:

     * No imports from SvelteKit.
     * No direct DB access.
     * No HTTP or framework types.

2. **Domain structure**

   * `src/lib/domain/entities/`

     * `Organization`
     * `AgentTemplate`, `AgentInstance`
     * `TaskArchetype`, `TaskOffer`, `TaskInstance`
     * `FacilityTemplate`, `FacilityInstance`
     * `ItemTemplate`, `ItemInstance`
     * `ProgressTrack`
     * `UnlockRule`
   * `src/lib/domain/valueObjects/`

     * `Identifier`
     * `Timestamp`
     * `Duration`
     * `ResourceUnit` / `ResourceBundle`
     * `NumericStatMap`
   * `src/lib/domain/systems/`

     * `TaskResolutionSystem`
     * `OfferSystem` (TaskOffers generation & rotation)
     * `EconomySystem`
     * `ProgressionSystem` (tracks + unlocks)
     * `RosterSystem` (agent recovery/availability)
     * Optional: `WorldAdvance` helper that orchestrates a full “advance by Δt”.

3. **Determinism**

   * Systems are **pure functions** over input data and “now”:

     * Given the same starting state and time delta, they produce the same results.

---

## 5. Application Layer (Services)

1. **Location**

   * `src/lib/app/` contains **use-case level services**:

     * `StartTaskService`
     * `CollectTaskResultService`
     * `RecruitAgentService`
     * `UpgradeFacilityService`
     * `AdvanceWorldService` (used by heartbeat/startup).

2. **Responsibilities**

   * Coordinate:

     * Loading entities via repositories.
     * Calling domain systems.
     * Applying resulting state changes.
   * Define **transaction boundaries** (what gets saved together).

3. **Dependencies**

   * Depend on repository interfaces (not Prisma directly).
   * Depend on domain systems.

---

## 6. Persistence: SQLite + Prisma Behind Repositories

1. **Database**

   * **SQLite** database file (e.g. `dev.db`) stored in the project.
   * Used for all persistence: organizations, agents, tasks, facilities, items, progress tracks, configs.

2. **ORM**

   * **Prisma** as the ORM:

     * `prisma/schema.prisma` defines models for:

       * Organization
       * AgentTemplate / AgentInstance
       * TaskArchetype / TaskOffer / TaskInstance
       * FacilityTemplate / FacilityInstance
       * ItemTemplate / ItemInstance
       * ProgressTrack
       * UnlockRule
       * Any needed join/aux tables

3. **Repository pattern**

   * `src/lib/repos/contracts/` defines interfaces:

     * `OrganizationRepository`
     * `AgentRepository`
     * `TaskRepository`
     * `FacilityRepository`
     * `InventoryRepository`
     * `ConfigRepository`
   * `src/lib/repos/prisma/` contains Prisma-backed implementations.
   * SvelteKit server layer or a small DI helper wires implementations into application services.

---

## 7. Idle Behavior: Deterministic Logic + Live UI

### 7.1 Authoritative time & offline catch-up

1. **Server-side “world clock” per organization**

   * Each `Organization` has:

     * `lastSimulatedAt` (timestamp).

2. **World advancement**

   * Core entry point: `AdvanceWorldService.advance(orgId, now)`:

     * Load org & related state.
     * Compute `delta = now - lastSimulatedAt`.
     * Pass `delta` and state into domain systems (TaskResolutionSystem, RosterSystem, etc.).
     * Persist updated entities.
     * Set `organization.lastSimulatedAt = now`.
     * Return updated snapshot + any “events” (e.g. completed tasks).

3. **Offline catch-up**

   * On **initial load** (e.g. `GET /api/organization/bootstrap`):

     * Call `AdvanceWorldService` with current time.
     * Return fully advanced state to the client.
   * This handles long offline gaps deterministically.

### 7.2 Heartbeat while tab is open

1. **Client heartbeat**

   * While the app is open and visible:

     * Periodically (e.g. every 10–30 seconds) call:

       * `POST /api/organization/heartbeat`.
   * The heartbeat endpoint:

     * Calls `AdvanceWorldService` with server “now”.
     * Returns:

       * Updated organization snapshot.
       * Server timestamp.

2. **Visibility handling**

   * When the tab becomes **visible**:

     * Force a sync/heartbeat call.
   * When the tab becomes **hidden**:

     * Pause the client heartbeat loop (server isn’t getting pings).
     * Next visibility event triggers a catch-up heartbeat.

### 7.3 Visual tick on the client

1. **Client-side animation loop**

   * A Svelte component or utility sets up a **visual tick** (e.g. `setInterval` or `requestAnimationFrame` throttled).
   * On each tick:

     * Use the last **server snapshot + serverTimeBaseline** to compute:

       * Each active task’s progress fraction.
       * Remaining time display.
     * Update Svelte stores that drive the UI (progress bars, “X seconds remaining”, etc.).

2. **Authority**

   * Visual tick **does not mutate real game state**:

     * No currency changes.
     * No unlocks.
   * It only interpolates/animates until the next heartbeat provides an authoritative update.

---

## 8. Testing & Tooling

1. **Testing**

   * **Vitest** as the primary test runner.
   * Test categories:

     * Domain/system unit tests (`src/lib/domain`) – pure logic.
     * Application service tests (`src/lib/app`) using in-memory or mocked repos.
   * Keep these runnable without launching SvelteKit dev server.

2. **Local workflows**

   * `npm run dev` – SvelteKit dev server + SQLite + Prisma.
   * `npx prisma migrate dev` – for schema evolution.
   * `npm test` – domain + app tests.

---

## 9. High-Level Summary

For the purely local MVP:

* **UI:** SvelteKit + TS, PWA, Svelte stores, visual tick loop.
* **Backend-in-app:** SvelteKit server routes implementing commands/queries.
* **Core game logic:** Pure TS domain & systems in `src/lib/domain`.
* **Application services:** `src/lib/app` orchestrating use cases.
* **Persistence:** SQLite + Prisma, hidden behind repo interfaces.
* **Idle model:**

  * Deterministic world advance based on `lastSimulatedAt`.
  * Offline catch-up on login.
  * Heartbeat endpoint to advance while the tab is open.
  * Client-side visual animation for responsiveness.

That’s the complete, aligned decision set for the local, single-machine MVP.
