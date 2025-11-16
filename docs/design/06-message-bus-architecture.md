# 06. Message Bus Architecture

Message Bus Architecture for an Idle Web Game
Overview
A message bus is a design pattern that connects several components and transfers data between them
through a shared medium. In software, components send small objects (messages) to the bus; middleware
on the bus processes each message and forwards it to the appropriate handlers. This approach promotes
decoupling and extensibility—additional middleware can be added without changing the core logic.
Compared to request/response architectures, a bus facilitates asynchronous communication and loose
coupling—publishers and consumers of messages do not need to know about each other. This property is
key for an idle game where multiple subsystems (game logic, UI, persistence, networking) run concurrently
and react to events at different times.

The game can be built around several specialized buses, each owning a different kind of flow. The following
sections describe the responsibilities, message definitions and design considerations for each bus. The
document is language‑agnostic—interfaces can be implemented in any language (TypeScript, C#, etc.) as
long as they follow the described contracts.

1. Command Bus (User Intent → Domain Logic)

Purpose

A command bus transports commands—objects that represent a player’s intent (e.g., StartMission ,
UpgradeFacility , ClaimIdleRewards ). A command has a type and a payload and is handled by
exactly one handler. Each command encapsulates a single user action and can be validated before
execution. Handling a command should have side effects only within the game state.

Interface

Concept Description

## Immutable object containing type , payload , and optional metadata

Command (timestamp, correlation ID). The payload holds domain‑specific parameters
(adventurer IDs, mission ID, etc.).

## Accepts commands from the UI or other subsystems and passes them through

Command Bus
middleware. Returns no value; results propagate via the event buses.

## A function/class responsible for executing a specific command. It updates the

Command Handler domain state, records domain events and may schedule persistence snapshots.
There is exactly one handler per command type.

Concept Description

## Cross‑cutting layers such as logging, authentication, validation and transaction

Middleware management. For example, a validation middleware checks command payloads
(optional) before execution; a transaction middleware wraps handler execution in a
database transaction.

Flow Example

1. Dispatch – The UI dispatches a StartMission command with mission and adventurer IDs.
2. Middleware – The command bus logs the command and validates it (e.g., check resources).
3. Handler – The StartMissionHandler updates the game state (mark mission started, remove adventurer from idle pool). The handler records domain events like MissionStarted and

ResourcesChanged which are emitted to the domain event bus.

4. Persist / Respond – The persistence bus may enqueue a snapshot. The UI reacts to domain events via the UI/FX bus.

Benefits

- Testability – Commands and handlers can be unit‑tested by asserting emitted events.
- Replay / Undo – Commands can be logged to support offline catch‑up or undo/redo.
- Decoupling – The UI simply dispatches commands; domain logic is isolated.

Considerations

- Commands should be idempotent; repeated dispatch with the same parameters should have predictable results.
- Use asynchronous command handlers if actions may take time (e.g., contacting a server). The bus should not block the UI; results come back via events.

2. Domain Event Bus vs. UI/FX Bus

Domain Event Bus

## An event bus carries events—objects describing something that happened in the system. Unlike

commands, a single event can be handled by multiple listeners. Domain events are business‑oriented; they
describe state changes without implying presentation (e.g., MissionCompleted ,
AdventurerLeveledUp , ResourcesChanged ). An event bus implements a publish/subscribe model:
event producers do not know the consumers and vice versa. This asynchronous messaging decouples
components and allows them to scale independently.

Concept Description

## Immutable object with type , payload , and metadata. Payload contains the

Event
specifics of what happened.

Concept Description

## Publishes domain events; consumers subscribe to event types. The bus may

Domain Event Bus guarantee ordering and ensure each consumer receives events in the same
sequence they were emitted.

## Function/class that reacts to an event. Handlers should not modify domain state

Event Handler (except via separate commands) but may trigger side effects (e.g., start a timer,
record analytics). Multiple handlers can react to the same event.

UI/FX Bus

The UI/FX bus is a specialization of the event bus for presentation and user feedback. It listens to domain
events and produces presentation actions: animations, sounds, toast notifications, or screen updates.
Separating domain events from UI/FX events enforces a clear boundary: domain logic remains
framework‑agnostic, while the UI layer handles how information is displayed. For example:

- On MissionCompleted , the UI/FX bus might trigger a celebration animation and queue a notification.
- On ResourcesChanged , it might animate resource counters and play a sound.

Benefits

- Loose coupling – Domain logic does not import UI code; UI can change without touching game logic.
- Extendibility – New features (analytics, achievements) can subscribe to domain events without impacting existing handlers.
- Resilience – Producers and consumers operate asynchronously; if a UI subscriber fails, domain logic proceeds.

Considerations

- Events should be dispatched only after domain state is successfully committed. Dispatching events before a transaction commits can lead to inconsistent side effects.
- Avoid making the domain event bus aware of UI concerns; keep event names business‑oriented.
- Provide mechanisms for event ordering and replay so that offline clients can process missed events.

3. Tick / Scheduler Bus (Idle Heartbeat)

Purpose

Idle games rely on the passage of time. A tick bus (sometimes called a scheduler) emits periodic tick events
such as Tick(deltaTime, now) that drive time‑based game logic (resource production, mission
progress, cooldowns). Rather than continuously polling state, components should subscribe to the tick bus
for periods when they need updates and disconnect when idle.

Interface

Concept Description

## Tick An object containing elapsed time ( deltaMs ) and current time ( now ). Additional fields

Event (coarse intervals) may be provided for low‑frequency updates.

## Emits tick events at a defined frequency. Subsystems (missions, buildings, idle resource

Tick Bus generators) subscribe to ticks to perform time‑based updates. The bus may also provide
functions for connecting/disconnecting and customizing tick order.

Design Notes

- Centralized time source – Use one scheduler to emit ticks, decoupled from rendering or UI frame rates. This ensures consistent progression across devices and allows offline catch‑up by replaying

ticks from the last saved timestamp.

- Granularity levels – Idle mechanics often require updates at different intervals (e.g., 1 s, 10 s, 1 min). The tick bus can emit multiple channels or events for various granularities, reducing

unnecessary work on low‑frequency systems.

- Connection management – Systems should connect to the tick bus only when needed and disconnect when idle. For example, a component monitoring a triggered state should only subscribe

during the active period.

Benefits

- Determinism – Centralized ticks allow deterministic simulation and simplify offline progress replay.
- Efficiency – Avoiding per‑component polling reduces CPU load; only active systems process ticks.
- Testing – Time can be simulated by feeding synthetic ticks, making unit and integration testing easier.

4. Persistence / Sync Bus (Local + Server)

Purpose

Idle games need to persist progress locally and, in multiplayer scenarios, synchronize with a server. Treating
persistence as a message stream simplifies this: rather than scattered localStorage calls, all save/load
operations flow through a persistence bus. In offline‑first architectures, an effective pattern is the
command queue, where user actions are appended to a local queue and the UI state becomes the
acknowledged server state plus the local queue. The client begins syncing commands in the background,
and while the queue is non‑empty the UI indicates that changes are pending.

Interface

Concept Description

## Snapshot / A serialized representation of the current game state or an incremental difference

Patch (diff). Snapshots may include timestamps to support offline progression.

Concept Description

## Emits messages such as SaveSnapshot{ state, reason } , LoadSnapshot , and

Persistence
ApplyServerPatch{ diff, version } . Listeners (e.g., local storage handler,
Bus
cloud sync module) subscribe and perform actual I/O.

## In offline mode, commands that modify state are logged in a local queue. Each

Command command is persisted and then applied to the domain state immediately. When
Queue connectivity resumes, the queue is replayed against the server to synchronize
differences.

Flow Example

1. User dispatches command – e.g., UpgradeFacility(level 2) .
2. Local update – Command handler updates the domain state and records the command in the local command queue.
3. Persistence bus – Emits SaveSnapshot(reason="upgrade") . The local persistence listener serializes the state to localStorage or IndexedDB.
4. Sync – Background sync module (network listener) attempts to send queued commands to the server. If offline, the queue grows; the UI shows a “syncing” indicator.
5. Conflict resolution – When the server responds, ApplyServerPatch events reconcile differences.

If conflicts cannot be resolved automatically, present them to the player.

Benefits

- Offline support – The game remains usable offline; commands update local state and are synced later.
- Atomic saves – All state changes go through the bus, making it easier to implement backups, periodic snapshots, and cross‑device sync.
- Integration seam – When moving from browser‑only to server‑backed versions, you simply add or replace persistence bus listeners (e.g., storing snapshots to IndexedDB vs. posting diffs to cloud

storage).

Considerations

- Conflict handling – Concurrent updates from multiple devices require conflict resolution strategies (e.g., last‑write‑wins, version vectors, or manual merge). The command queue pattern helps by

encoding intent but conflicts may still need user intervention.

- Snapshot size – Snapshots should be compact and incremental; excessive size impacts performance. Consider compressing or chunking large states.
- Security – Validate incoming ApplyServerPatch diffs and handle version mismatches to prevent state corruption.

5. Network / WebSocket Bus (Future Multiplayer & Presence)

Purpose

For multiplayer features, live world state, or presence, a network bus bridges local events to other players
and the backend. It uses a publish/subscribe model similar to a generic event bus but transports messages
over network channels (WebSockets, Server‑Sent Events, etc.). In a pub/sub system, messages are
distributed to many subscribers via topics; publishers send messages to topics and subscribers listen to the
topics they care about. This decouples message sources from consumers—producers don’t know who will
receive the messages.

Interface

Concept Description

## Network Encoded representation of a domain or UI event sent across the network. Should

Event include channel/topic identifiers, payload and metadata (timestamp, version, author).

## Subscribes to local domain/UI events and publishes them to the appropriate network

Network topics. Likewise, it receives network events from remote peers or the server and
Bus converts them into local domain events. The bus abstracts transport details
(WebSocket, HTTP long polling, SSE).

Logical addresses to which events are published (e.g., global:missions ,
Channels /
guild:notifications ). Subscribers join channels to receive events. The pub/sub
Topics
model allows multiple producers and consumers.

Flow Example

1. Subscription – On entering a region, the client subscribes to network topics like region:mwangi .

The network bus opens or reuses a WebSocket and sends a SubscribeToChannel message.

2. Publishing local events – When a mission is started, the domain event bus emits

MissionStarted . The network bus listens and publishes a network event to guild:missions
with the mission details.

3. Receiving remote events – The server pushes MissionCompleted events to subscribed topics.

The network bus translates them into domain events, which then flow through the domain event bus
and UI/FX bus.

Benefits

- Scalability – Pub/sub messaging scales to multiple publishers and subscribers; producers and consumers remain decoupled.
- Real‑time updates – WebSockets provide low‑latency two‑way communication; players see world changes immediately.
- Unified architecture – By treating the network as another bus, the same publish/subscribe semantics apply locally and across the network.

Considerations

- Connection management – Implement reconnection, heartbeat and backoff strategies; gracefully handle network partitions.
- Ordering and idempotency – Messages may arrive out of order or duplicated; include sequence numbers and deduplicate accordingly.
- Security – Authenticate connections and authorize channel subscriptions. Validate inbound events to prevent tampering.

## Putting It All Together

The idle game can be architected by layering these buses around the core domain model. An overview of
the flow:

┌───────────────────────────────────────────────────────────────┐
│ User Interface (UI) │
│ - Dispatches Commands → Command Bus │
│ - Receives UI/FX events ← UI/FX Bus │
└───────────────────────────────────────────────────────────────┘
↓ ↑
┌───────────────────────┐ ┌───────────────────────────────┐
│ Command Bus │ │ UI/FX Bus │
│ – Validates & routes │ │ – Listens to domain events │
│ commands to domain │ │ – Emits presentation actions │
└──────────────┬────────┘ └───────────────┬───────────────┘
↓ ↑
┌─────────────────────────────────────────────────────┐
│ Domain Event Bus │
│ – Publishes domain events (e.g., MissionStarted) │
│ – Listeners: game systems, analytics, persistence │
└──────────────┬──────────────────────────────────────┘

┌────────────────────────────────────┐
│ Tick / Scheduler Bus │
│ – Emits periodic Tick events │
│ – Subsystems update timers, cooldowns │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Persistence / Sync Bus │
│ – Handles SaveSnapshot, LoadSnapshot │
│ – Manages command queue & sync to server |
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Network / WebSocket Bus │

│ – Publishes/receives network events|
│ – Bridges local events to remote peers |
└────────────────────────────────────┘

Each bus is specialized yet built on the same principles: messages are immutable data structures that flow
through a pipeline of middleware and handlers. Commands represent intent and have one handler; events
represent facts and may have many handlers. The tick bus provides a heartbeat for time‑based logic.
Persistence and network buses adapt messages to storage and network transports; they use command
queues and pub/sub models to support offline play and multiplayer. Together, these buses provide a
modular, testable and scalable foundation for an idle web game.

