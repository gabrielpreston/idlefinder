# 14. Caravans & Auto-Trade

Caravans and Auto-Trade Specification
This document describes the caravan system for Idlefinder, which provides asynchronous economic events for recruiting, trading, and acquiring resources. Caravans are **asynchronous economic events**, not login pressure.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.5 - Caravans & Trade Loop
- `10-adventurers-roster.md` - Roster system (caravan recruitment)
- `11-equipment-auto-equip.md` - Equipment system (caravan items)
- `16-resources-economy.md` - Resource system (caravan materials)

## Overview

Caravans are **asynchronous economic events** that appear over time with recruits, gear, materials, and rare items. The player sets **auto-buy rules**, and the system automatically processes caravans when they arrive.

**Key Principle**: Nothing is missed by being offline. Caravans are processed automatically based on player policies, and the player can browse caravan logs when online.

## Caravan Entity Structure

Caravans follow the Entity primitive structure defined in `08-systems-primitives-spec.md`:

### Entity Type
- `type: "Caravan"`

### Attributes

* `caravanType: "recruit" | "trade" | "rare" | "mixed"` - Caravan type
* `availableItems: Array<{ type: "recruit" | "item" | "material"; id: string; cost: number; quality?: number }>` - Items available for purchase
* `arrivedAt: number` - Timestamp when caravan arrived
* `departsAt?: number` - Timestamp when caravan departs (optional, for time-limited caravans)

### Tags

**Mechanical Tags:**
* Caravan type tags: `["recruit"]`, `["trade"]`, `["rare"]`
* Quality tags: `["common"]`, `["uncommon"]`, `["rare"]`

**Lore Tags (metadata.loreTags):**
* Thematic tags for worldbuilding (e.g., `["merchant-guild", "traveling-circus"]`)
* No gameplay logic depends on lore tags

### State

Caravans use a finite state machine:

* `Available` - Caravan is available for trading
* `Processed` - Caravan has been processed (auto-buy rules applied)
* `Departed` - Caravan has departed (time-limited caravans)

### Timers

* `arrivedAt: number` - Timestamp when caravan arrived
* `departsAt?: number` - Timestamp when caravan departs (optional)

## Caravan Types

### Recruit Caravans
* **Purpose**: Provide adventurer recruits
* **Contents**: Adventurers of various levels, Pathfinder classes (Alchemist, Barbarian, Bard, Cleric, Fighter, Ranger, Rogue, Wizard), and roles
* **Auto-Buy**: Based on roster policies (target size, role distribution, quality thresholds)

### Trade Caravans
* **Purpose**: Provide materials and common items
* **Contents**: Generic materials, common/uncommon equipment
* **Auto-Buy**: Based on material storage capacity and auto-buy rules

### Rare Caravans
* **Purpose**: Provide rare items and high-quality recruits
* **Contents**: Rare equipment, high-level recruits, rare materials
* **Auto-Buy**: Based on rare item auto-buy rules and gold reserve

### Mixed Caravans
* **Purpose**: Provide variety of items
* **Contents**: Mix of recruits, items, materials
* **Auto-Buy**: Based on all applicable auto-buy rules

## Auto-Buy Rules

The player defines auto-buy rules, and the system automatically processes caravans when they arrive.

### Recruit Auto-Buy Rules

* **Auto-Buy Recruits Above Level X**: If we need their role
* **Role Priority**: Prefer recruits that fill role gaps
* **Quality Threshold**: Minimum level/quality for auto-buy
* **Gold Limit**: Maximum gold to spend per recruit

### Item Auto-Buy Rules

* **Auto-Buy Rare Items Under Y Cost**: Automatically buy rare items below cost threshold
* **Auto-Buy Uncommon Items**: Yes/No (if better than current equipment)
* **Item Type Preferences**: Prefer certain item types (weapons, armor, etc.)

### Material Auto-Buy Rules

* **Auto-Buy Materials Up to Storage Cap**: Automatically buy materials until storage is full
* **Material Type Preferences**: Prefer certain material types
* **Gold Reserve**: Maintain minimum gold reserve (don't spend below threshold)

### Capacity Limits

Auto-buy respects capacity limits:

* **Material Cap**: Don't buy materials if storage is full
* **Roster Cap**: Don't buy recruits if roster is full
* **Armory Cap**: Don't buy items if Armory is full (unless replacing worse items)
* **Gold Reserve**: Maintain minimum gold reserve

## Asynchronous Processing

Caravans are processed **asynchronously** - they don't require player login:

1. **Caravan Arrives**: Caravan entity created with `arrivedAt` timestamp
2. **Offline Processing**: If player is offline, caravan is processed when they return
3. **Auto-Buy Execution**: System applies auto-buy rules automatically
4. **Resource Deduction**: Gold/resources automatically deducted
5. **Item Integration**: Purchased items automatically integrated:
   * Recruits added to roster (auto-equipped)
   * Items added to Armory (may be auto-equipped)
   * Materials added to storage
6. **Caravan Log**: Caravan transaction logged for player review

### Offline Processing

When player returns after being offline:

1. **Calculate Elapsed Time**: Determine time since last session
2. **Process Caravans**: Find all caravans that arrived during offline time
3. **Apply Auto-Buy Rules**: Process each caravan with auto-buy rules
4. **Generate Summary**: Present summary of purchases made
5. **Caravan Logs**: Make caravan logs available for review

## Caravan Logs

Players can browse caravan logs when online:

* **Recent Caravans**: List of caravans that arrived (processed or available)
* **Purchase History**: What was purchased from each caravan
* **Missed Opportunities**: Caravans that arrived but couldn't purchase (insufficient resources, capacity full, etc.)

Logs are for **information only** - nothing is missed by being offline.

## Remove Timed Pop-Ups

Caravans **never** use timed pop-ups or login pressure:

* ❌ No "caravan expires in 5 minutes" pop-ups
* ❌ No "missed caravan" penalties
* ❌ No time-limited exclusive items
* ✅ Asynchronous processing
* ✅ Auto-buy rules handle everything
* ✅ Logs available for review

## Integration Points

### With Roster System
* Caravans provide recruitment sources
* Auto-buy recruits based on roster policies
* See `10-adventurers-roster.md`

### With Equipment System
* Caravans provide equipment items
* Auto-buy items based on auto-equip rules
* See `11-equipment-auto-equip.md`

### With Resource System
* Caravans provide materials
* Auto-buy materials based on storage capacity
* See `16-resources-economy.md`

## Events

The caravan system emits the following events:

* `CaravanArrived` - New caravan arrived
* `CaravanProcessed` - Caravan processed (auto-buy rules applied)
* `CaravanItemPurchased` - Item purchased from caravan
* `CaravanRecruitPurchased` - Recruit purchased from caravan

## MVP Scope

For MVP, the caravan system includes:

* ✅ 4 caravan types (Recruit, Trade, Rare, Mixed)
* ✅ Auto-buy rules (recruits, items, materials)
* ✅ Capacity limits (material cap, roster cap, gold reserve)
* ✅ Asynchronous processing
* ✅ Caravan logs

Future enhancements (out of MVP scope):

* Caravan scheduling (predictable arrival times)
* Caravan negotiations (bargaining system)
* Faction caravans (special caravans from factions)
* Caravan events (special limited-time caravans)

