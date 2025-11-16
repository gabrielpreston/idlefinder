# 01. Game Design Doc

Idlefinder Game Design Document (POC/MVP)
This document captures the initial vision and scope for Idlefinder, an idle‑incremental web game. It is
intentionally high‑level and language‑agnostic so that you (and the AI tools building the prototype) have a
shared understanding of what the minimum viable product should achieve. As the project evolves, update
this document to reflect changes in concept, mechanics, and scope.

## High‑Level Concept

Idlefinder is an incremental “idle” game where players manage a band of adventurers exploring a fantasy
world. Instead of controlling characters directly, the player assigns adventurers to missions, collects
rewards, and invests resources into upgrading facilities. Progress continues even when the game is not
open—idle timers drive mission completion and resource generation. The initial prototype focuses on core
loop satisfaction and a functional simulation rather than polished art or narrative.

## Core Loop

At the heart of Idlefinder lies a simple loop that supports idle progression:

1. Recruit or Upgrade Adventurers – Spend resources to recruit new adventurers or level up existing ones, improving mission performance.
2. Assign Missions – Choose missions from a mission board and assign one or more adventurers.

Missions have durations and potential rewards.

3. Wait / Progress Idle – While a mission is in progress, the game simulates time through the tick bus.

Progress continues offline based on real‑world elapsed time.

4. Claim Rewards – Once completed, claim mission rewards (gold, items, fame) and experience for participating adventurers.
5. Upgrade Facilities – Invest resources into the camp or town to unlock new mission types, reduce mission times, or increase adventurer capacity.
6. Repeat – Use new resources and experience to take on harder missions and expand your adventuring guild.

This loop should be fun and rewarding even at the prototype stage. Additional systems (crafting, world
events, guilds) can layer on top later.

## Game Features & Mechanics

The MVP will include a subset of mechanics to demonstrate the game’s viability:

- Adventurer Management – A roster of adventurers with names, levels, stats and unique traits.

Players can recruit new adventurers or retire underperformers.

- Mission System – A mission board presenting tasks with durations, requirements and randomised rewards. Players assign adventurers to missions and await completion.
- Resource Gathering – Collect currency (gold) and resources (e.g., supplies, relics) from missions to fund upgrades.
- Facility Upgrades – Upgrade the player’s base (camp, tavern, guild hall) to unlock new mission tiers, improve resource yields and expand adventurer capacity.
- Experience & Fame – Adventurers gain experience from missions, levelling up to improve their stats. Completing missions also increases the guild’s fame, unlocking advanced content.
- Offline Progression – The game tracks elapsed time while closed and processes mission timers on the next load, ensuring players are rewarded for idle play.

## Visual & Sound Direction

For a POC, the visual style will be lightweight and functional. Use simple, clean UI components with clear
typography and iconography. Placeholder art or free assets are acceptable. Sound and music can be
omitted initially; focus instead on responsive UI and clear feedback (e.g., animations, progress indicators). A
consistent colour palette will make the prototype feel coherent.

## Controls & User Interface

The game runs in a modern browser. The UI should follow web best practices:

- Mouse/Touch Controls – Support both desktop and mobile interactions. Buttons and list items should be large enough for touch.
- Simple Navigation – Use tabs or panels for core screens (missions, adventurers, upgrades). Avoid deep nested menus.
- Clear Status Indicators – Show mission progress bars, adventurer statuses and resource totals at a glance.
- Accessibility – Ensure text is readable and controls are reachable without complex gestures.

The UI will be built using SvelteKit or a similar framework, but no framework‑specific details appear in this
document.

## Technical Requirements

- Platform – Web application running on modern browsers (desktop and mobile).
- Architecture – Uses a message bus system to decouple subsystems (commands, events, ticks, persistence). See the architecture overview document for details.
- State Persistence – Save player state locally (e.g., browser localStorage or IndexedDB) to survive page reloads and offline play. No server dependency in the MVP.
- Offline Catch‑Up – On load, calculate how much real‑world time has passed since last play and simulate mission progress accordingly.
- Performance – Keep client‑side processing lightweight; update UI reactively in response to events.

## Milestones & Schedule (Approximate)

1. Framework Setup – Scaffold the project with TypeScript, SvelteKit and the message bus skeleton.

Implement the command bus, event bus and tick bus.

2. Mission System Prototype – Implement mission definitions, assignment UI and progress tracking.

Connect missions to adventurer stats and simple rewards.

3. Adventurer Management – Add the ability to recruit, level up and view adventurers. Persist the roster between sessions.
4. Facilities & Upgrades – Introduce facility structures with levels and effects (e.g., shorter mission times). Hook upgrades into the resource system.
5. Offline Progress – Implement loading and catch‑up logic using the tick bus to process elapsed time.

Add a simple save/load mechanism.

6. Polish & Feedback – Improve UI responsiveness, add animations and tooltips, and collect user feedback. Refine the core loop and prepare for next iteration.

Dates are intentionally omitted because the timeline will depend on discovery and iteration cycles. Use
these milestones to structure development tasks and evaluate progress.

## Stakeholders & Contributors

The initial prototype will be implemented primarily by AI tools under the direction of the product owner
(you). Document all assumptions, requirements and decisions to align the AI‑generated code with your
vision. As additional collaborators join, share and update this document accordingly.

