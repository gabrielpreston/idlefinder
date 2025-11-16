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

For the MVP, persistence happens client‑side. The current plan is to:

1. Serialize the PlayerState to a JSON string.
2. Store it in browser localStorage under a stable key (e.g., idlefinder_state ). Alternatively, use IndexedDB for larger data sets.
3. On game load, read the saved state and parse it. If no state exists, initialise a new PlayerState with default values.
4. Each time a significant event occurs (e.g., mission start/completion, adventurer recruited, facility upgraded), schedule a save through the persistence bus.
5. Store lastPlayed timestamp to compute offline progress on the next load. When loading, compute elapsed = now - lastPlayed and feed elapsed / tickInterval synthetic tick

events into the simulation.

Save Frequency

To avoid excessive writes, aggregate events and save at intervals (e.g., every 10 seconds or after a certain
number of events). The persistence bus can implement a debounce mechanism to coalesce saves.

Versioning & Migration

As the data model evolves, include a version field in the PlayerState. When loading, detect older versions
and migrate data accordingly. For example, if a new resource type is added, set its initial amount to zero.

## Future Considerations

- Cloud Sync – Later versions may support syncing state to a backend to enable cross‑device play or multiplayer. In that case, the persistence bus would serialize state and send it to a server via the

network bus.

- Data Compression – If state grows large, consider compressing the JSON before writing to storage.
- Security – Client‑side state is inherently modifiable by the player. For competitive leaderboards or monetization, server‑side validation would be necessary.

This document should evolve alongside the game. As new systems (crafting, items, quests) are added,
extend the data model and update the persistence strategy accordingly.

