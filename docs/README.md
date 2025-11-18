# Documentation Structure

This directory contains project documentation organized by implementation status.

## `current/`

Contains documentation for the **current MVP implementation**:

### Core Design & Architecture

- `00-idle-first-core-design.md` - **Idle-first design direction** (north star document)
- `01-game-design-doc.md` - Game design overview (idle-first vision)
- `02-architecture-overview.md` - High-level architecture
- `03-data-and-persistence-design.md` - Data model and persistence
- `04-api-message-spec.md` - Message bus API specification
- `05-dev-guidelines.md` - Development guidelines
- `06-message-bus-architecture.md` - Message bus architecture details
- `07-authoritative-tech-spec.md` - **Authoritative technical specification** (primary reference)
- `08-systems-primitives-spec.md` - Systems primitives vocabulary (Entities, Attributes, Tags, State/Timers, Resources, Requirements, Actions, Effects, Events)

### System Specifications (Automated, Idle-First)

- `09-mission-system.md` - Mission system (doctrine-driven automation)
- `10-adventurers-roster.md` - Adventurers and roster automation
- `11-equipment-auto-equip.md` - Equipment and auto-equip system (MVP)
- `12-crafting-armory.md` - Crafting and armory operations
- `13-facilities-upgrades.md` - Facilities and upgrade queue
- `14-caravans-trade.md` - Caravans and auto-trade
- `15-fame-unlocks.md` - Fame and unlocks system
- `16-resources-economy.md` - Resources and economy model
- `17-meta-systems.md` - Meta systems (Hall of Fame, prestige placeholder)

### Data Tables

- `18-mission-data-tables.md` - Mission data tables (types, DCs, rewards, durations)
- `19-item-data-tables.md` - Item data tables (stats, rarity, slots)
- `20-crafting-recipes.md` - Crafting recipes (MVP recipes)
- `21-facility-data-tables.md` - Facility data tables (tiers, costs, effects)
- `22-adventurer-data-tables.md` - Adventurer data tables (classes, roles, stats, XP)
- `23-fame-milestones.md` - Fame milestones (unlock thresholds)

These documents describe the current client-authoritative MVP implementation with **idle-first, automation-driven** design. All major gameplay loops run automatically based on player-defined policies (doctrine, rules, queues). The player sets high-level strategies, and the game executes them continuously.

## `future/`

Reserved for future planning documents:

- Server-authoritative migration plans
- Prisma/SQLite/remote DB implementation plans
- Multiplayer architecture
- Other future enhancements

Note: Future considerations are currently embedded in the current docs. As specific implementation plans are developed, they will be documented here.

