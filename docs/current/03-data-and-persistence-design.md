# 03. Data And Persistence Design

Idlefinder Data and Persistence Design
This document outlines the initial data model and persistence strategy for the Idlefinder MVP. It focuses on
describing what data is stored and how it will be persisted in a language‑agnostic manner. As the game
evolves, refine and extend the model to support new features.

## Data Model Overview

The game maintains a single game state object (`GameState`) containing all mutable information. This state is serialized
to persistent storage and used to initialise the game on startup. The state uses an **Entity map structure** where all game objects (Adventurers, Missions, Facilities) are Entities following the Entity primitive structure.

### GameState Structure

At a high level, the state looks like this (pseudo‑schema):

## GameState {

playerId: string,
lastPlayed: Timestamp, // Last time the state was saved
resources: ResourceBundle, // Global resources (gold, fame, etc.)
entities: Map<string, Entity> // All entities by ID (Adventurer, Mission, Facility)

### Entity Primitive Structure

All game objects (Adventurers, Missions, Facilities) follow the Entity primitive structure defined in `08-systems-primitives-spec.md`:

## Entity {

id: string, // Unique identifier
type: string, // "Adventurer" | "Mission" | "Facility" | ...
attributes: Record<string, any>, // Structured data describing capabilities/stats
tags: string[], // Mechanical tags for classification/synergy
state: string, // Finite state machine label (e.g., "Idle", "OnMission", "InProgress")
timers: Record<string, number | null>, // Time-related fields (milliseconds since epoch, null if not set)
metadata: {
  displayName?: string,
  description?: string,
  loreTags?: string[], // Thematic/worldbuilding tags (no gameplay logic depends on these)
  visualKey?: string
}

**Key Properties:**
- `type` determines which attributes, states, and actions are valid
- Core systems reason over entities by `type`, `attributes`, `tags`, and `state` - never by specific entity IDs
- `tags` are for mechanical rules; `metadata.loreTags` are for worldbuilding/theming
- Timers are stored as `Record<string, number | null>` where values are **milliseconds since epoch**
- `null` indicates a timer is not set/cleared

### ResourceBundle

Represents global resources (gold, fame, etc.):

## ResourceBundle {

resources: Map<string, number> // Key/value store of resource amounts (gold, fame, materials, etc.)

### Entity Examples

**Adventurer Entity:**
- `type: "Adventurer"`
- `attributes`: `{ level, xp, abilityMods, classKey, ancestryKey, ... }`
- `tags`: `["wilderness", "divine", "ranged"]` (mechanical)
- `state`: `"Idle" | "OnMission" | "Fatigued" | ...`
- `timers`: `{ fatigueUntil?: number, availableAt?: number }`
- `metadata.loreTags`: `["human", "taldor"]` (thematic)

**Mission Entity:**
- `type: "Mission"`
- `attributes`: `{ primaryAbility, dc, missionType, baseDuration, baseRewards, ... }`
- `tags`: `["combat", "undead", "escort"]` (mechanical)
- `state`: `"Available" | "InProgress" | "Completed" | "Expired"`
- `timers`: `{ availableAt?, startedAt?, endsAt? }`
- `metadata.loreTags`: `["forest", "ancient-ruins"]` (thematic)

**Facility Entity:**
- `type: "Facility"`
- `attributes`: `{ facilityType, tier, baseCapacity, bonusMultipliers, ... }`
- `tags`: `["training", "storage"]` (mechanical)
- `state`: `"Online" | "UnderConstruction" | "Disabled"`
- `timers`: `{ constructionCompleteAt? }`
- `metadata.loreTags`: `["gothic", "stonework"]` (thematic)

## Persistence Strategy

For the MVP, persistence happens client‑side. The architecture is designed to be migratable to remote DB in the future.

### DTO Layer (Data Transfer Object)

**Critical**: Domain models are **not serialized directly**. A strict DTO layer exists as the source of truth for persistence:

- `domainToDTO()` - Converts domain models (GameState, Entities) to DTOs
- `dtoToDomain()` - Converts DTOs back to domain models (handles version migration)

DTOs are stable across versions and remain backward-compatible. Domain models may evolve while DTOs maintain compatibility.

### Persistence Flow

1. **Save Process**:
   - Domain state changes trigger domain events
   - PersistenceBus subscribes to domain events and schedules saves
   - When saving, convert domain GameState to DTO using `domainToDTO()`
   - Serialize DTO to JSON string
   - Store in browser localStorage under a stable key (e.g., `idlefinder_state`)

2. **Load Process**:
   - Read saved JSON from localStorage
   - Parse JSON to DTO
   - Convert DTO to domain model using `dtoToDomain()` (handles version migration)
   - If no state exists, initialise a new GameState with default values

3. **Offline Catch-Up**:
   - Store `lastPlayed` timestamp in DTO
   - On load, compute elapsed real time: `elapsed = now - lastPlayed`
   - Perform **full deterministic tick-by-tick replay** (no approximation shortcuts)
   - Run simulation tick-by-tick until caught up to current time

### One Autosave Slot

The MVP supports exactly **one autosave slot**. No player-visible profile management. Backup/secondary slots can be added later if needed.

### Save Frequency

To avoid excessive writes, the persistence bus implements a debounce mechanism:

- **Immediate saves** for critical user-initiated events (FacilityUpgraded, AdventurerRecruited, MissionStarted)
- **Debounced saves** (e.g., every 10 seconds) for automatic or frequent events (MissionCompleted, ResourcesChanged)

### Versioning & Migration

DTOs include a `version` field. When loading, `dtoToDomain()` detects older versions and migrates data accordingly.
For example, if a new resource type is added, set its initial amount to zero. Migration logic lives in the mapper
layer, keeping domain models clean.

## Future Considerations

- **Cloud Sync** – Later versions may support syncing state to a backend to enable cross‑device play or multiplayer.
  The DTO layer makes this straightforward—DTOs can be sent over the network, and the same `dtoToDomain()` mapping
  applies on the server.

- **Data Compression** – If state grows large, consider compressing the JSON before writing to storage.

- **Security** – Client‑side state is inherently modifiable by the player. For competitive leaderboards or monetization,
  server‑side validation would be necessary.

- **Multiple Save Slots** – Backup/secondary slots can be added later if needed. The MVP supports one autosave slot.

This document should evolve alongside the game. As new systems (crafting, items, quests) are added,
extend the data model and update the persistence strategy accordingly.

**Note**: This document describes the MVP persistence architecture as implemented. For authoritative technical specifications,
see `07-authoritative-tech-spec.md`.

