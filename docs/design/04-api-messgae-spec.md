# 04. Api Messgae Spec

Idlefinder API/Message Specification
This document defines the messages that flow through the various buses in Idlefinder. It is
language‑agnostic and uses conceptual types rather than concrete classes. The goal is to provide a clear
contract for how the client’s subsystems communicate via commands and events. Interface design is crucial
for maintaining modularity and is one of the recommended sections of a software design document 1 .

## Design Principles

- Self‑Describing Messages – Each message contains a type property indicating its purpose and a payload object with parameters. Metadata such as timestamps or correlation IDs may be included

for debugging and replay.

- Separation of Concerns – Commands represent user intent and are consumed by a single handler; domain events represent facts about state changes and can be processed by multiple listeners. This

separation follows event‑driven design patterns 1 .

- Explicit Error Handling – If a command cannot be fulfilled, the handler returns an error event.

Errors are treated as domain events so they can be logged, displayed to the user and handled
consistently 1 .

## Message Envelope

All messages share a common envelope:

## Message {

type: string, // Discriminator (e.g., "StartMission")
payload: object, // Command or event data
timestamp: string, // ISO 8601 UTC time when dispatched
metadata?: object // Optional fields such as correlationId, userId

Commands

## Commands describe intent and are dispatched by the UI or other systems. Only one handler should

process a command. If validation fails, emit a CommandFailed event.

StartMission

Starts a mission by assigning adventurers.

"type": "StartMission",

"payload": {
"missionId": string,
"adventurerIds": string[]

CompleteMission

Marks a mission as complete (invoked by mission subsystem when time elapses).

"type": "CompleteMission",
"payload": {
"missionId": string

RecruitAdventurer

Adds a new adventurer to the roster.

"type": "RecruitAdventurer",
"payload": {
"name": string,
"traits": string[]

UpgradeFacility

Upgrades a facility to the next level.

"type": "UpgradeFacility",
"payload": {
"facility": string

Domain Events

## Events describe facts about state changes. They are immutable and can be consumed by multiple

subscribers (UI, persistence, analytics). They occur after the associated command has been validated and
processed.

MissionStarted

Indicates that a mission has begun.

"type": "MissionStarted",
"payload": {
"missionId": string,
"adventurerIds": string[],
"startTime": string, // ISO timestamp
"duration": number // Total duration in milliseconds

MissionCompleted

Indicates that a mission finished and rewards are available.

"type": "MissionCompleted",
"payload": {
"missionId": string,
"reward": {
"resources": ResourceMap,
"fame": number,
"experience": number

AdventurerRecruited

Emitted when a new adventurer is added.

"type": "AdventurerRecruited",
"payload": {
"adventurerId": string,

"name": string,
"traits": string[]

FacilityUpgraded

Emitted when a facility level increases.

"type": "FacilityUpgraded",
"payload": {
"facility": string,
"newLevel": number,
"effects": string[]

ResourcesChanged

Emitted whenever resource totals change (e.g., after rewards or purchases).

"type": "ResourcesChanged",
"payload": {
"delta": ResourceMap, // Change in resources (positive or negative)
"current": ResourceMap // Current resource totals after change

CommandFailed

## Emitted when a command cannot be processed. The reason field should be human‑readable for UI

feedback.

"type": "CommandFailed",
"payload": {
"commandType": string,
"reason": string

Tick Messages

## The tick/scheduler bus emits Tick messages periodically. Subsystems subscribe to update time‑based

processes.

"type": "Tick",
"payload": {
"deltaMs": number, // Milliseconds since last tick
"timestamp": string // Current time (ISO 8601)

Persistence Messages

## The persistence bus may define its own message types, such as SaveSnapshot or LoadSnapshot , but

these are internal to the persistence layer. For the MVP, the interface is kept simple: subscribe to domain
events and periodically invoke a save routine.

## Error Handling and Security

All command handlers should validate inputs and game state. When validation fails (e.g., insufficient
resources, adventurer already on a mission), emit a CommandFailed event rather than throwing
exceptions. This approach aligns with the recommendation to include error handling information in
interface specifications 1 .

As the MVP stores all state client‑side, there is no sensitive data exchange. If a network component is added
later, messages should be authenticated and validated server‑side before acceptance.

## Extensibility

This specification covers the initial set of commands and events needed for the core game loop. As new
features emerge (e.g., crafting, guilds, marketplace), new commands and events should be defined
following the same conventions. Keep the envelope consistent so that all buses can route messages
generically.

1 Software Design Document [Tips & Best Practices] | The Workstream
https://www.atlassian.com/work-management/knowledge-sharing/documentation/software-design-document

