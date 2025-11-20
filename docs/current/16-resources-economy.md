# 16. Resources & Economy

Resources and Economy Model Specification
This document describes the resource and economy system for Idlefinder, which manages all game currencies and materials through automated income sources and time-based operations.

**Related Documentation:**
- `08-systems-primitives-spec.md` Section 5 - Resources
- `09-mission-system.md` - Mission system (generates resources)
- `12-crafting-armory.md` - Crafting system (consumes resources)
- `13-facilities-upgrades.md` - Facilities (consume resources for upgrades)
- `14-caravans-trade.md` - Caravans (resource trading)

## Overview

The resource system manages all game currencies and materials. Resources are:

* **Earned Passively**: Through automated mission loops
* **Spent Automatically**: Through automated systems (crafting, upgrades, recruitment)
* **Time-Based**: Some operations take real-world time
* **Capacity-Limited**: Storage capacity limits resource accumulation

The economy is designed for **automated throughput** - resources flow continuously through automated systems.

## Resource Types

### Global Resources

Global resources are stored in `GameState.resources` (ResourceBundle):

* **Gold**: Primary currency, earned from missions, spent on upgrades/crafting/recruitment
* **Fame**: Reputation currency, earned from missions, gates content unlocks
* **Materials**: Generic crafting materials, earned from missions/salvage/caravans, spent on crafting

### Per-Entity Resources

Some resources are stored per entity:

* **Adventurer XP**: Stored in `adventurer.attributes.xp`
* **Item Durability**: Stored in `item.attributes.durability`

## Passive Income Sources

Resources are earned passively through automated systems:

### Mission Rewards
* **Gold**: Earned from mission completion (scaled by outcome band)
* **Fame**: Earned from mission completion (scaled by outcome band)
* **Materials**: Earned from mission completion (some mission types)
* **Items**: Equipment drops from missions (added to Armory)

### Caravan Trades
* **Materials**: Purchased from caravans (auto-buy rules)
* **Items**: Purchased from caravans (auto-buy rules)
* **Recruits**: Purchased from caravans (costs gold)

### Salvage Returns
* **Materials**: Salvaging items (higher yield for rare items)

### Passive Generation (Future)
* **Resource Nodes**: Passive generation over time (future system)
* **Facility Production**: Facilities that generate resources (future system)

## Resource Sinks

Resources are spent automatically through automated systems:

### Crafting
* **Materials**: Consumed for crafting items (higher cost for rare items)
* **Gold**: Crafting costs
* **Time**: Crafting takes real-world time

### Facility Upgrades
* **Gold**: Upgrade costs
* **Materials**: May require materials (future system)
* **Fame**: Fame gates for higher tiers
* **Time**: Upgrades may take time (future system)

### Recruitment
* **Gold**: Recruitment costs
* **Fame**: Higher-tier recruits may require fame threshold

### Repair
* **Gold**: Repair costs
* **Time**: Repair takes time

## Time-Based Operations

Many resource operations take real-world time:

* **Crafting**: Takes time to complete
* **Repair**: Takes time to complete
* **Upgrades**: May take time (future system)
* **Recovery**: Takes time (infirmary system)

Time-based operations are processed by the idle loop, ensuring progress continues offline.

## Resource Storage Capacity

Resources are limited by storage capacity:

* **Base Capacity**: Starting storage capacity for each resource
* **Facility Bonus**: Resource Depot facility increases capacity
* **Capacity Formula**: `resourceStorageCap = baseCapacity + depotTierBonus`

If storage is full:
* New resources cannot be added (or are lost)
* Auto-buy rules pause for that resource type
* Player must increase capacity or spend resources

## Rebalance for Automated Throughput

The economy is balanced for **automated throughput**:

* **Income Rates**: Resources earned at rates that support continuous automation
* **Sink Rates**: Resources spent at rates that maintain flow
* **Capacity Limits**: Storage limits prevent infinite accumulation
* **Time Gates**: Time-based operations prevent instant completion

### Economic Balance Principles

* **No Stagnation**: Resources should flow continuously, not accumulate indefinitely
* **No Starvation**: Systems should have enough resources to operate
* **Capacity Pressure**: Storage limits encourage spending
* **Time Pressure**: Time-based operations create natural pacing

## Gold Reserve Rules

Auto-buy systems respect gold reserve rules:

* **Minimum Reserve**: Maintain minimum gold reserve (don't spend below threshold)
* **Reserve Priority**: Reserve takes priority over auto-buy
* **Reserve Exceptions**: Some operations may bypass reserve (critical upgrades)

## Integration Points

### With Mission System
* Missions generate resources as rewards
* See `09-mission-system.md`

### With Crafting System
* Crafting consumes resources
* See `12-crafting-armory.md`

### With Facility System
* Facilities consume resources for upgrades
* Resource Depot provides storage capacity
* See `13-facilities-upgrades.md`

### With Caravan System
* Caravans provide resources through trading
* See `14-caravans-trade.md`

## Events

The resource system emits the following events:

* `ResourcesChanged` - Resources increased or decreased
* `ResourceCapacityReached` - Resource storage at capacity
* `ResourceCapacityIncreased` - Storage capacity increased (facility upgrade)

## MVP Scope

For MVP, the resource system includes:

* ✅ 3 resource types (Gold, Fame, Materials)
* ✅ Passive income sources (missions, caravans, salvage)
* ✅ Resource sinks (crafting, upgrades, recruitment, repair)
* ✅ Time-based operations
* ✅ Storage capacity limits
* ✅ Gold reserve rules

Future enhancements (out of MVP scope):

* Resource nodes (passive generation)
* Advanced resource types
* Resource conversion
* Economic events

