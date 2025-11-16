# 03. Data And Persistence Design

Idlefinder Data and Persistence Design
This document outlines the initial data model and persistence strategy for the Idlefinder MVP. It focuses on
describing what data is stored and how it will be persisted in a language‑agnostic manner. As the game
evolves, refine and extend the model to support new features.

## Data Model Overview

The game maintains a single player state object containing all mutable information. This state is serialized
to persistent storage and used to initialise the game on startup. At a high level, the state looks like this
(pseudo‑schema):

## PlayerState {

playerId: string,
lastPlayed: timestamp, // Last time the state was saved (UTC)
resources: ResourceMap, // Key/value store of resource amounts
adventurers: Adventurer[], // List of recruited adventurers
missions: Mission[], // Active missions and their progress
facilities: FacilityMap, // Upgrades applied to the camp/town
fame: number, // Guild fame level
completedMissionIds: string[] // IDs of missions completed (for
achievements)

Resource

Represents a stackable item or currency. The MVP uses a simple model:

## ResourceMap {

gold: number,
supplies: number,
relics: number
// Add additional resources as needed

Adventurer

An adventurer is a recruitable character assigned to missions:

## Adventurer {

id: string,
name: string,
level: number,
experience: number,
traits: string[], // e.g., "Strong", "Cautious"
status: 'idle' | 'onMission',
assignedMissionId: string | null

Mission

A mission tracks the assignment of adventurers to a task:

## Mission {

id: string,
name: string,
duration: number, // Total duration in milliseconds
startTime: timestamp, // When the mission started (UTC)
assignedAdventurerIds: string[],
reward: Reward,
status: 'inProgress' | 'completed'

Reward

Simple representation of mission rewards:

## Reward {

resources: ResourceMap,
fame: number,
experience: number

Facility

Facilities provide persistent bonuses and unlocked features:

## FacilityMap {

tavern: FacilityLevel,
guildHall: FacilityLevel,
blacksmith: FacilityLevel

## FacilityLevel {

level: number,
effects: string[] // Human‑readable description of perks (for documentation)

## Persistence Strategy

For the MVP, persistence happens client‑side. The architecture is designed to be migratable to remote DB in the future.

### DTO Layer (Data Transfer Object)

**Critical**: Domain models are **not serialized directly**. A strict DTO layer exists as the source of truth for persistence:

- `domainToDTO()` - Converts domain models (PlayerState, Adventurer, Mission, etc.) to DTOs
- `dtoToDomain()` - Converts DTOs back to domain models (handles version migration)

DTOs are stable across versions and remain backward-compatible. Domain models may evolve while DTOs maintain compatibility.

### Persistence Flow

1. **Save Process**:
   - Domain state changes trigger domain events
   - PersistenceBus subscribes to domain events and schedules saves
   - When saving, convert domain PlayerState to DTO using `domainToDTO()`
   - Serialize DTO to JSON string
   - Store in browser localStorage under a stable key (e.g., `idlefinder_state`)

2. **Load Process**:
   - Read saved JSON from localStorage
   - Parse JSON to DTO
   - Convert DTO to domain model using `dtoToDomain()` (handles version migration)
   - If no state exists, initialise a new PlayerState with default values

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

