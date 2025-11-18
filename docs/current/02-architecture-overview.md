# 02. Architecture Overview

Idlefinder Architecture Overview
This document provides a high‑level overview of the Idlefinder system architecture. It is designed to be
language‑agnostic, describing patterns and interactions rather than specific implementation details. Use
this document to understand how major components communicate and where to extend the system as the
prototype evolves.

## Architectural Principles

- Event‑Driven and Message‑Oriented – The core of the system is built around message buses.

Components communicate by sending commands and events rather than direct function calls. This
decouples modules, allowing for easier testing, extensibility and offline simulation.

- Single Bus System – There is only one official bus system (`src/lib/bus/*`) containing specialized buses: CommandBus (user intent), DomainEventBus (game state changes), TickBus (time progression), and PersistenceBus (saving/loading). Each bus is small and focused to maintain separation of concerns. Future buses (network, analytics) would be added to this same system.

- Explicit Runtime Factory – The game runtime (BusManager, GameState store, handlers) is created via a `startGame()` factory function. This runtime instance is passed to the UI via Svelte context/props. No global singletons are used. The runtime includes a `DomainTimeSource` for deterministic time handling.

- Single Runtime per Tab – Only one active game simulation runs in a given browser tab. Save slots may exist under the hood, but only one is ever loaded into memory at once.

- Client‑First Simulation – For the MVP, all game logic runs on the client. Persistence is local, and there is no server dependency. The architecture leaves room for adding a server‑side idle loop later.

- Entity Map State Model – Game state uses an Entity map structure where all game objects (Adventurers, Missions, Facilities) are Entities following the Entity primitive structure (id, type, attributes, tags, state, timers, metadata). Core systems reason over entities by type, attributes, tags, and state - never by specific entity IDs.

- Strict Time Handling – Domain systems never call `Date.now()` or `Timestamp.now()` directly. Time is always passed into domain systems via `DomainTimeSource` and `CommandHandlerContext`. This ensures determinism and supports offline replay.

Components

1. UI Layer

The user interface (built in SvelteKit or similar) displays game state and captures player actions. It is dumb—
UI elements do not contain business logic. Instead, they dispatch commands to the command bus and subscribe
directly to the domain event bus to react to state changes. The UI receives the game runtime (including bus manager)
via Svelte context, which is created by the `startGame()` factory function.

2. Command Bus

## Receives commands representing player intentions (e.g., StartMission , UpgradeFacility ). It

validates them, then passes them to the appropriate handler in the domain layer. Commands are handled
synchronously; their effects are emitted as domain events.

3. Domain Event Bus

Carries events that describe what happened in the game (e.g., MissionStarted , ResourcesChanged ,
MissionCompleted ). These events are immutable facts about the state changes. Multiple listeners can
subscribe: the UI subscribes directly to update visuals, the persistence layer subscribes to queue saves,
analytics can subscribe to log metrics, etc. There is no separate UI/FX bus—the UI subscribes directly to
domain events for presentation updates.

4. Tick/Scheduler Bus

Emits Tick messages at regular intervals ( deltaMs , timestamp ). Subsystems that need to update over
time (missions, adventurer experience, facilities) subscribe to this bus. For offline catch‑up, a synthetic
sequence of tick messages can be fed into the system based on elapsed real time.

5. Persistence Bus

Part of the main bus system (`src/lib/bus/*`). Responsible for saving and loading game state. In the MVP,
this bus listens to domain events and periodically writes a snapshot of the state to local storage using a
DTO layer (domain models are converted to DTOs before serialization). When the game starts, it rehydrates
state and performs deterministic tick-by-tick replay to catch up offline progress. The MVP supports exactly
one autosave slot.

6. Network Bus (Future)

In a future multiplayer version, a network bus would be added to the main bus system (`src/lib/bus/*`). It
would bridge local events to a server or other players. For the MVP, this is not implemented.

7. Analytics/Telemetry Bus (Optional, Future)

If implemented, would be added to the main bus system (`src/lib/bus/*`). Collects analytics events to help
tune the game and identify usage patterns. Messages from this bus can be logged to the console during
development or forwarded to analytics services later.

## Interactions

The following flow illustrates how components interact in the automated mission system:

1. The doctrine engine (automation system) selects a mission from the available pool based on player's mission doctrine (maximize fame/hour, farm gold, etc.) and automatically forms a party from available adventurers.
2. The doctrine engine dispatches a StartMission command to the command bus with the selected mission and formed party.
3. A command handler in the domain layer validates the command (e.g., checks that the adventurer is available and mission slot is free) and updates the in‑memory state. It emits a MissionStarted event on the domain event bus.
4. The UI layer listens for MissionStarted and updates the mission list, animating the slot to show that it is in progress.
5. The tick bus emits ticks every second; the idle loop listens and checks mission timers. When a mission's `endsAt` timer is reached, it automatically resolves the mission and emits a MissionCompleted event.
6. The persistence bus subscribes to MissionStarted and MissionCompleted events and schedules a save. When triggered, it serializes the current state to local storage.
7. As soon as the mission slot becomes available, the doctrine engine automatically selects the next mission and the cycle repeats continuously without player input.
8. (Future) The network bus could publish mission events to other players or a server, enabling shared world state.

**Note**: This flow is fully automated - the player never manually selects missions or assigns adventurers. They set doctrine policies, and the system executes them automatically. See `09-mission-system.md` for detailed mission automation specification.

## MVP Implementation

For the initial POC:

- Implement the command bus, domain event bus, tick bus, and persistence bus in full. They form the backbone
  of gameplay and offline progression. All buses are part of the single bus system (`src/lib/bus/*`).
- Implement the `startGame()` factory function that creates the game runtime (BusManager, GameState store,
  handlers, DomainTimeSource) and passes it to the UI via Svelte context.
- Implement DTO layer for persistence (domain models are converted to DTOs before serialization).
- Implement deterministic offline catch-up using tick-by-tick replay (no approximation shortcuts).
- Network bus and analytics bus are not implemented for MVP; they would be added to the main bus system
  if needed in the future.

This provides extension points without adding complexity.

## Non‑Functional Considerations

- Testability – Each bus and subsystem should be testable in isolation. Use dependency injection to supply mock buses when writing unit tests.
- Performance – Avoid heavy work inside tick handlers; prefer coarse ticks (e.g., 1 second) and aggregate updates. Disconnect listeners when not needed to save battery on mobile devices.
- Extensibility – New systems (e.g., crafting, guilds) should plug into the existing buses rather than adding bespoke communication channels.
- Observability – Consider emitting debug events or logs for introspection during development. Use the analytics bus to capture high‑level metrics such as mission completions or upgrade rates.

## This overview sets the stage for implementing the message bus architecture. See

`06-message-bus-architecture.md` for detailed bus responsibilities and message definitions.

**Note**: This document describes the MVP architecture as implemented. For authoritative technical specifications,
see `07-authoritative-tech-spec.md`.

