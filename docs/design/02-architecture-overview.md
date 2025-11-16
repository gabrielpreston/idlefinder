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

- Layered Buses – Different types of messages flow through specialized buses: command bus (user intent), domain event bus (game state changes), tick scheduler bus (time progression), persistence

bus (saving/loading), and network bus (multiplayer) with analytics bus as an optional sink. Each bus
is small and focused to maintain separation of concerns.

- Client‑First Simulation – For the MVP, all game logic runs on the client. Persistence is local, and there is no server dependency. The architecture leaves room for adding a server‑side idle loop later.

Components

1. UI Layer

The user interface (built in SvelteKit or similar) displays game state and captures player actions. It is dumb—
UI elements do not contain business logic. Instead, they dispatch commands to the command bus and react
to events from the domain event bus.

2. Command Bus

## Receives commands representing player intentions (e.g., StartMission , UpgradeFacility ). It

validates them, then passes them to the appropriate handler in the domain layer. Commands are handled
synchronously; their effects are emitted as domain events.

3. Domain Event Bus

Carries events that describe what happened in the game (e.g., MissionStarted , ResourcesChanged ,
MissionCompleted ). These events are immutable facts about the state changes. Multiple listeners can
subscribe: the UI to update visuals, the persistence layer to queue saves, analytics to log metrics, etc.

4. Tick/Scheduler Bus

Emits Tick messages at regular intervals ( deltaMs , timestamp ). Subsystems that need to update over
time (missions, adventurer experience, facilities) subscribe to this bus. For offline catch‑up, a synthetic
sequence of tick messages can be fed into the system based on elapsed real time.

5. Persistence Bus

## Responsible for saving and loading game state. In the MVP, this bus listens to domain events and

periodically writes a snapshot of the state to local storage. When the game starts, it rehydrates state and
may apply a sequence of unsaved commands or events to catch up.

6. Network Bus (Future)

In a future multiplayer version, a network bus bridges local events to a server or other players. For the MVP,
this bus can be stubbed out. Its interface is symmetrical to the domain bus, forwarding inbound remote
events to local subscribers and sending outbound events to remote channels.

7. Analytics/Telemetry Bus (Optional)

Collects analytics events to help tune the game and identify usage patterns. Messages from this bus can be
logged to the console during development or forwarded to analytics services later.

## Interactions

The following flow illustrates how components interact when a player starts a mission:

1. The player clicks Start Mission in the UI, which dispatches a StartMission command to the command bus.
2. A command handler in the domain layer validates the command (e.g., checks that the adventurer is available) and updates the in‑memory state. It emits a MissionStarted event on the domain

event bus.

3. The UI layer listens for MissionStarted and updates the mission list, animating the slot to show that it is in progress.
4. The tick bus emits ticks every second; the mission subsystem listens and decrements the remaining time on active missions. When the timer reaches zero, it emits a MissionCompleted event.
5. The persistence bus subscribes to MissionStarted and MissionCompleted events and schedules a save. When triggered, it serializes the current state to local storage.
6. (Future) The network bus could publish mission events to other players or a server, enabling shared world state.

## MVP Implementation

For the initial POC:

- Implement the command bus, domain event bus and tick bus in full. They form the backbone of gameplay and offline progression.
- Implement a minimal persistence bus that saves state after significant events and loads it on game start.
- Stub the network bus and analytics bus; design their interfaces but leave implementations empty.

This provides extension points without adding complexity.

## Non‑Functional Considerations

- Testability – Each bus and subsystem should be testable in isolation. Use dependency injection to supply mock buses when writing unit tests.
- Performance – Avoid heavy work inside tick handlers; prefer coarse ticks (e.g., 1 second) and aggregate updates. Disconnect listeners when not needed to save battery on mobile devices.
- Extensibility – New systems (e.g., crafting, guilds) should plug into the existing buses rather than adding bespoke communication channels.
- Observability – Consider emitting debug events or logs for introspection during development. Use the analytics bus to capture high‑level metrics such as mission completions or upgrade rates.

## This overview sets the stage for implementing the message bus architecture. See

idle_game_message_bus_architecture.md for detailed bus responsibilities and message definitions.

