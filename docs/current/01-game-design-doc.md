# 01. Game Design Doc

Idlefinder Game Design Document (MVP)
This document captures the vision and scope for Idlefinder, an idle-first guild management web game inspired by PF2E math and tone. It is intentionally high-level and language-agnostic so that you (and the AI tools building the prototype) have a shared understanding of what the minimum viable product should achieve. As the project evolves, update this document to reflect changes in concept, mechanics, and scope.

**Note**: This document describes the idle-first design direction. For detailed system specifications, see the system-specific documentation (09-17). For technical architecture, see `02-architecture-overview.md` and `07-authoritative-tech-spec.md`.

## High-Level Concept

**Project: Idlefinder** is an **always-running guild management idle game** inspired by PF2E math and tone.

* The game world **progresses continuously**, whether the player is online or offline.
* The player is the **Guildmaster**: they set high-level policies, doctrines, and priorities.
* The **game executes those policies on its own**:
  * Assigns missions
  * Forms parties
  * Equips adventurers
  * Sends them out
  * Resolves outcomes
  * Recruits replacements
  * Upgrades facilities
  * Trades with caravans

The central fantasy:

> "I run an ever-busy adventuring guild in a PF2E-flavored world that never sleeps, and my job is to make high-level decisions about how it runs — not to push every button."

## Core Design Principles

### Idle-First, Not "Idle-Lite"

* **All major gameplay loops must run without player input.**
* If something requires frequent manual interaction to work, it's either:
  * turned into a **policy**, or
  * pushed out of MVP scope.

### Strategic, Not Operational

* Player interacts in **bursts of meaningful decisions**, not constant micro.
* The "work" of:
  * selecting missions,
  * assigning heroes,
  * upgrading buildings at the exact moment resources hit the threshold
  is never the player's job.

### PF2E-Inspired, Not PF2E-Complete

* PF2E math concepts (DCs, success/crit bands, stats, roles) shape:
  * mission resolution,
  * build choices,
  * class identity.
* But you **simplify subsystems** dramatically for an idle context:
  * minimal stats
  * minimal item complexity
  * simplified roles.

### Equipment is Identity

* Equipment is the **main place where the player "touches" the world**.
* Gear is how the guild expresses:
  * power,
  * specialization,
  * identity,
  * progress.
* Gear management is one of the few intentionally hands-on systems.

### Offline Respect & Deterministic Progress

* Progress during offline time is:
  * calculable,
  * fair,
  * bounded by doctrine and capacity.
* No actions are lost because the player didn't log in during a window.
* No "missed caravans" or "expired missions" punish low-engagement players.

### Monetization via Efficiency + Expression (Not Raw Power)

* Paying players get:
  * **more efficient automation**,
  * **better QoL**,
  * **more expressive cosmetics**.
* They **do not** buy direct stats that trivialize the game's math.

## The Player's Role

The player is not "controlling heroes." They are **writing the operating manual** for the guild.

They define:

1. **Mission Doctrine**
   * What the guild is trying to maximize (XP, gold, materials, fame).
   * How much risk is acceptable (safe, balanced, aggressive).

2. **Team Formation Policies**
   * Preferred compositions (frontline/caster/support patterns).
   * Minimum thresholds to send a mission (e.g., "don't send under-geared heroes").

3. **Equipment & Crafting Decisions**
   * What to craft.
   * Which items to repair vs salvage.
   * What stats and properties to emphasize.
   * Auto-equip priorities.

4. **Recruiting & Roster Policies**
   * Target roster size.
   * Acceptable quality thresholds.
   * How to replace fallen adventurers.

5. **Facility Upgrade Priorities**
   * The queue of building upgrades.
   * Long-term focus (economy vs throughput vs survivability).

6. **Trade/Caravan Rules**
   * What the guild buys automatically.
   * How aggressively it recruits from caravans.
   * How hard it leans into trade for materials or gear.

They log in to **inspect, adjust, and refine**, not to manually drive the machine.

## Core Loops (Idle-First)

### Mission Automation Loop (Primary Engine)

**Goal:** Convert time + roster + equipment + doctrine → XP, gold, materials, fame, and items, continuously.

1. **Mission Generation** - The world provides a pool of missions with categories, difficulty tiers, rewards, and durations.
2. **Doctrine-Driven Selection** - System chooses missions based on player's doctrine (maximize fame/hour, farm gold, balance XP/materials, avoid lethal missions).
3. **Automatic Team Formation** - From available roster, system forms parties following role templates and power thresholds.
4. **Auto-Deployment** - Party is sent out automatically, timer starts.
5. **Resolution (PF2E-inspired)** - When mission completes, checks success vs DC, applies crit bands, computes rewards and consequences.
6. **Auto-Recovery** - Survivors rest and return to active pool, gear durability updates, injuries cause downtime.
7. **Loop** - As soon as a mission slot is free, doctrine chooses new mission, new party formed, cycle repeats.

The loop runs without player input 24/7.

### Facility Upgrade & Operations Loop

Facilities are **always-on multipliers** and queues, not "click-to-activate" features.

1. Player defines an **upgrade queue** (e.g., Dorms → Mission Command → Training Grounds → Resource Depot).
2. Each upgrade costs gold/materials, takes real time, increases capacity (mission slots, roster cap, crafting throughput, etc.).
3. When resources + slot are available, the system automatically starts the next upgrade in the queue.
4. Facilities also auto-run background effects (e.g., passive XP gain, repair throughput).

The player's job is deciding **what gets improved and in what order**, not when to press "upgrade."

### Roster Automation Loop

Adventurers flow through a lifecycle that is largely automated.

1. **Recruitment Rules** - Player sets target roster size, role distribution, minimum quality thresholds.
2. **Auto-Recruitment** - When roster falls below target, system automatically recruits from caravans, local pools, or special sources.
3. **Auto-Equipping** - On recruitment, auto-equip logic assigns gear from the Armory.
4. **Mission Usage** - Missions draw from this roster automatically.
5. **Death & Replacement** - When adventurers die, they may be recorded in Hall of Fame, roster drops below target, auto-recruit rules kick in and backfill.

The player can still **curate** or lock specific heroes for manual attention later — but MVP assumes fully automated roster maintenance.

### Equipment & Crafting Loop (Hands-On Core)

This is where the player **leans in**.

**Minimal Slot Model (MVP):** Each adventurer has Weapon, Armor, Off-Hand, Accessory, Consumable.

**Item Tiers (MVP):** Common, Uncommon, Rare (magical properties).

**Simple Stat Model (MVP):** Each item affects Attack bonus, Damage bonus, Armor Class, Flat DR, Skill bonus, Crit safety.

**Auto-Equip Logic:** Player defines rules (global: Balanced/Offense-first/Defense-first; role-based: Frontline prioritizes AC → DR → Attack, etc.). System automatically re-balances gear when new gear drops, crafting completes, or items are repaired.

**Crafting (MVP):** Player can craft basic gear, upgrade to uncommon, craft rare variants. Costs materials + gold + time. Crafting runs via queues.

**Durability & Repair (MVP):** Durability 0–100 on items. Lower durability reduces effectiveness. System can auto-repair common/uncommon items. Player may manually prioritize rare gear for repair.

**Salvage:** Player can salvage unwanted gear for generic materials or rare essences (from rares).

The **core feeling** is: "I spend my active time curating, crafting, repairing, and optimizing gear. The game uses that gear intelligently while I'm away."

### Caravans & Trade Loop

Caravans are **asynchronous economic events**, not login pressure.

1. Caravans appear over time with recruits, gear, materials, rare items.
2. Player sets **auto-buy rules** (auto-buy recruits above level X if we need their role, auto-buy rare items under Y cost, etc.).
3. When a caravan "arrives" in the sim, system processes those rules, purchases items and recruits automatically, integrates them into roster/armory/materials.

The player can still browse caravan logs when online, but **nothing is missed** by being offline.

### Fame, Unlocks, and Meta Progression

Fame measures "how big and important your guild is."

1. Fame is earned naturally from missions.
2. Thresholds unlock higher-tier missions, new regions/biomes, new facility tiers, new caravan types, new item types or crafting options.
3. Because missions run continuously, fame slowly but steadily increases over time, governed by doctrine and power level.
4. The player's role: choose when to lean into risk to accelerate fame, adjust doctrine to push toward fame or economy.

Later, prestige/rebirth systems can hook into fame, but MVP just needs linear unlocks.

## Time & Progression Model

### Continuous Time

* Missions, crafting, upgrading, recovery all take **real-world time**.
* The server (or local sim, for MVP) uses timestamps to:
  * compute how many cycles of missions/crafting/upgrades occurred while the player was away,
  * resolve results in batch when the player returns.

### Offline Catch-Up

On login, the game:

1. Computes elapsed time since last session.
2. Simulates mission cycles, facility ticks, crafting/repair completion, etc.
3. Presents:
   * XP gained,
   * deaths occurred,
   * items found,
   * upgrades completed,
   * fame increased,
   * new unlocks triggered.

No UI "fast-forward" mini-game; just deterministic summarized results.

## Typical Player Session Flow (Daily Check-In)

To make it concrete, a day looks like:

1. **Login**
   * See summary: missions completed, XP gained, adventurers who died, items found, fame increased, facilities upgraded, crafting finished.

2. **Inspect & Adjust**
   * Check Hall of Fame for notable deaths.
   * Review new rare items.
   * Salvage junk gear.
   * Repair or prioritize special items.
   * Adjust auto-equip rules if needed.

3. **Strategic Choices**
   * Start new crafting recipes.
   * Adjust facility upgrade queue (e.g., shift toward more mission slots).
   * Tweak mission doctrines (e.g., push fame harder now that you're stronger).
   * Update recruit policies if roster composition looks off.

4. **Log Out**
   * The guild continues to operate: missions loop endlessly, crafting ticks down, facilities upgrade, caravan rules execute, fame climbs.

The game does not punish you for logging out; it relies on you to **steer**, then steps aside to run.

## Game Features & Mechanics (MVP)

The MVP will include a subset of mechanics to demonstrate the game's viability:

- **Adventurer Management** - A roster of adventurers with names, levels, stats and unique traits. Roster is automatically maintained based on player policies (target size, role distribution, quality thresholds).

- **Mission System** - Automated mission selection based on doctrine, automatic team formation, PF2E-inspired resolution with crit bands, continuous looping without player input.

- **Resource Gathering** - Collect currency (gold) and resources (materials) from missions to fund upgrades. Resources are earned passively through automated mission loops.

- **Facility Upgrades** - Upgrade the player's base (Guildhall, Dormitory, Mission Command, Training Grounds, Resource Depot, Infirmary) to unlock new mission tiers, improve resource yields and expand adventurer capacity. Upgrades run via automated queue.

- **Experience & Fame** - Adventurers gain experience from missions, levelling up to improve their stats. Completing missions also increases the guild's fame, unlocking advanced content automatically.

- **Equipment & Crafting** - Craft and manage gear with auto-equip rules. Equipment is the primary hands-on engagement layer.

- **Offline Progression** - The game tracks elapsed time while closed and processes mission timers on the next load, ensuring players are rewarded for idle play.

## Visual & Sound Direction

For a POC, the visual style will be lightweight and functional. Use simple, clean UI components with clear typography and iconography. Placeholder art or free assets are acceptable. Sound and music can be omitted initially; focus instead on responsive UI and clear feedback (e.g., animations, progress indicators). A consistent colour palette will make the prototype feel coherent.

## Controls & User Interface

The game runs in a modern browser. The UI should follow web best practices:

- **Mouse/Touch Controls** - Support both desktop and mobile interactions. Buttons and list items should be large enough for touch.
- **Simple Navigation** - Use tabs or panels for core screens (doctrines/policies, adventurers, equipment/crafting, facilities, caravans). Avoid deep nested menus.
- **Clear Status Indicators** - Show mission progress bars, adventurer statuses, resource totals, and facility upgrade queues at a glance.
- **Accessibility** - Ensure text is readable and controls are reachable without complex gestures.

The UI will be built using SvelteKit, but no framework-specific details appear in this document.

## Technical Requirements

- **Platform** - Web application running on modern browsers (desktop and mobile).
- **Architecture** - Uses a message bus system to decouple subsystems (commands, events, ticks, persistence). See the architecture overview document for details.
- **State Persistence** - Save player state locally (e.g., browser localStorage or IndexedDB) to survive page reloads and offline play. No server dependency in the MVP.
- **Offline Catch-Up** - On load, calculate how much real-world time has passed since last play and simulate mission progress accordingly using deterministic tick-by-tick replay.
- **Performance** - Keep client-side processing lightweight; update UI reactively in response to events.

## Milestones & Schedule (Approximate)

1. **Framework Setup** - Scaffold the project with TypeScript, SvelteKit and the message bus skeleton. Implement the command bus, event bus and tick bus.

2. **Mission System Prototype** - Implement mission definitions, doctrine-driven selection, automatic team formation, and progress tracking. Connect missions to adventurer stats and simple rewards.

3. **Adventurer Management** - Add the ability to recruit (automated), level up and view adventurers. Implement roster policies and auto-recruitment. Persist the roster between sessions.

4. **Facilities & Upgrades** - Introduce facility structures with levels and effects. Implement automated upgrade queue. Hook upgrades into the resource system.

5. **Equipment & Crafting** - Add equipment system with auto-equip rules. Implement crafting queue and repair system.

6. **Offline Progress** - Implement loading and catch-up logic using the tick bus to process elapsed time. Add a simple save/load mechanism.

7. **Polish & Feedback** - Improve UI responsiveness, add animations and tooltips, and collect user feedback. Refine the core loop and prepare for next iteration.

Dates are intentionally omitted because the timeline will depend on discovery and iteration cycles. Use these milestones to structure development tasks and evaluate progress.

## Stakeholders & Contributors

The initial prototype will be implemented primarily by AI tools under the direction of the product owner (you). Document all assumptions, requirements and decisions to align the AI-generated code with your vision. As additional collaborators join, share and update this document accordingly.

## Related Documentation

- **`00-idle-first-core-design.md`** - Detailed design direction and core loops
- **`08-systems-primitives-spec.md`** - Systems primitives vocabulary (Entities, Attributes, Tags, State/Timers, Resources, Requirements, Actions, Effects, Events)
- **`09-mission-system.md`** - Mission system specification (automated, doctrine-driven)
- **`10-adventurers-roster.md`** - Adventurer and roster automation specification
- **`11-equipment-auto-equip.md`** - Equipment and auto-equip system specification
- **`12-crafting-armory.md`** - Crafting and armory operations specification
- **`13-facilities-upgrades.md`** - Facilities and upgrade queue specification
- **`14-caravans-trade.md`** - Caravans and auto-trade specification
- **`15-fame-unlocks.md`** - Fame and unlocks specification
- **`16-resources-economy.md`** - Resources and economy model specification
- **`17-meta-systems.md`** - Meta systems (Hall of Fame, prestige) specification
- **`02-architecture-overview.md`** - High-level architecture
- **`07-authoritative-tech-spec.md`** - Authoritative technical specification
