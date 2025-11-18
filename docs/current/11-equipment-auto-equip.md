# 11. Equipment & Auto-Equip

Equipment and Auto-Equip System Specification (MVP)
This document describes the equipment system for Idlefinder, which is the primary hands-on engagement layer. Equipment is where players "touch" the world - they curate, craft, repair, and optimize gear, while the system automatically equips it intelligently.

**Related Documentation:**
- `00-idle-first-core-design.md` Section 5.4 - Equipment & Crafting Loop
- `10-adventurers-roster.md` - Adventurer system (equipment integration)
- `12-crafting-armory.md` - Crafting system (creates equipment)
- `09-mission-system.md` - Mission system (uses equipment bonuses)

## Overview

Equipment is the **main place where the player "touches" the world**. Gear is how the guild expresses power, specialization, identity, and progress. While most systems are automated, equipment management is intentionally hands-on.

The system includes:
* **Item Slots**: Each adventurer has 5 equipment slots
* **Rarity Tiers**: Common, Uncommon, Rare items
* **Stat Schema**: Simple stat model (Attack, Damage, AC, DR, Skill, Crit Safety)
* **Auto-Equip Rules**: Player defines rules, system automatically equips gear
* **Durability & Repair**: Items degrade over time, can be repaired
* **Salvage**: Unwanted gear can be salvaged for materials

The **core feeling** is: "I spend my active time curating, crafting, repairing, and optimizing gear. The game uses that gear intelligently while I'm away."

## Item Entity Structure

Items follow the Entity primitive structure defined in `08-systems-primitives-spec.md`:

### Entity Type
- `type: "Item"`

### Attributes

* `itemType: "weapon" | "armor" | "offHand" | "accessory" | "consumable"` - Item slot type
* `rarity: "common" | "uncommon" | "rare"` - Item rarity tier
* `stats: { attackBonus?: number; damageBonus?: number; armorClass?: number; damageReduction?: number; skillBonus?: number; critSafety?: number }` - Item stat bonuses
* `durability: number` - Current durability (0-100)
* `maxDurability: number` - Maximum durability (typically 100)
* `baseValue: number` - Base gold value of item
* (Future) `properties?: string[]` - Special properties (rare items)

### Tags

**Mechanical Tags:**
* Slot tags: `["weapon"]`, `["armor"]`, `["offHand"]`, `["accessory"]`
* Rarity tags: `["common"]`, `["uncommon"]`, `["rare"]`
* Stat focus tags: `["offensive"]`, `["defensive"]`, `["balanced"]`
* Role compatibility tags: `["frontline"]`, `["caster"]`, `["striker"]`, etc.

**Lore Tags (metadata.loreTags):**
* Thematic tags for worldbuilding (e.g., `["ancient", "dwarven-craft"]`)
* No gameplay logic depends on lore tags

### State

Items use a finite state machine:

* `InArmory` - Item is in the Armory, available for equipping
* `Equipped` - Item is currently equipped to an adventurer
* `Broken` - Item durability is 0 (cannot be used)
* (Future) `Salvaged` - Item has been salvaged (removed from game)

### Timers

Items typically don't have timers, but repair operations may use timers:
* `repairCompleteAt?: number` - Timestamp when repair will complete (if item is in repair queue)

## Item Slots (MVP)

Each adventurer has 5 equipment slots:

1. **Weapon** - Primary weapon (sword, bow, staff, etc.)
2. **Armor** - Body armor (leather, chainmail, plate, etc.)
3. **Off-Hand** - Shield, secondary weapon, or utility item
4. **Accessory** - Ring, amulet, or other accessory
5. **Consumable** - Consumable items (conceptually, but not individually micromanaged in MVP)

### Slot Restrictions

* Each slot can only hold items of matching `itemType`
* Each slot can only hold one item at a time
* Items can be swapped between adventurers (via auto-equip)

## Rarity Tiers (MVP)

Items come in three rarity tiers:

### Common
* Basic equipment
* Standard stat values
* No special properties
* Auto-repair enabled (if policy allows)

### Uncommon
* Improved equipment
* Higher stat values than common
* No special properties (MVP)
* Auto-repair enabled (if policy allows)

### Rare
* Magical equipment
* Highest stat values
* Special properties (future system)
* Manual repair only (player must prioritize)

## Stat Schema (MVP)

Each item affects a small set of stats:

### Attack Bonus
* Adds to attack rolls
* Affects mission success probability
* Typically found on weapons

### Damage Bonus
* Adds to damage dealt
* Affects mission rewards (future system)
* Typically found on weapons

### Armor Class (AC)
* Reduces chance of being hit
* Affects mission success probability
* Typically found on armor

### Damage Reduction (DR)
* Reduces damage taken
* Flat damage reduction value
* Typically found on armor and shields

### Skill Bonus
* Adds to skill checks
* Affects mission resolution rolls
* Can be found on any item type

### Crit Safety
* Reduces critical failure chance
* Slight protection against worst outcomes
* Typically found on accessories

### Stat Scaling by Rarity

* **Common**: Base stat values
* **Uncommon**: +50% stat values
* **Rare**: +100% stat values (or higher)

## Auto-Equip Rules

The auto-equip system automatically assigns gear based on player-defined rules. The player sets policies, and the system executes them.

### Global Auto-Equip Rules

Player defines global priorities:

* **Balanced** - Balance offense and defense
* **Offense-First** - Prioritize attack and damage bonuses
* **Defense-First** - Prioritize AC and DR

* **Allow Rare Items Automatically**: Yes/No
  * If Yes: System automatically equips rare items when better than current
  * If No: Player must manually approve rare item equipping

### Role-Based Auto-Equip Rules

Player defines role-specific priorities:

* **Frontline** (martial_frontliner):
  * Priority: AC → DR → Attack → Skill
  * Focus: Survivability first, then offense

* **Casters** (support_caster):
  * Priority: Skill → Crit Safety → AC
  * Focus: Mission success probability, then safety

* **Strikers** (mobile_striker):
  * Priority: Attack → Damage → AC
  * Focus: Offense first, then survivability

* **Skill Specialists**:
  * Priority: Skill → Crit Safety → Balanced stats
  * Focus: Mission success optimization

### Auto-Equip Triggers

Auto-equip is triggered automatically when:

1. **New Gear Drops**: Mission rewards include new items
2. **Crafting Completes**: New items are crafted
3. **Items Repaired**: Items are repaired and may be better than current
4. **Recruitment**: New adventurer is recruited
5. **Manual Trigger**: Player manually triggers re-equip (optional)

### Auto-Equip Process

1. **Get Available Items**: Find all items in Armory with `state === "InArmory"`
2. **Filter by Slot**: Filter items by slot type needed
3. **Apply Global Rules**: Apply global auto-equip rules (balanced/offense/defense, rare item policy)
4. **Apply Role Rules**: Apply role-based priorities for target adventurer
5. **Calculate Best Item**: Score items based on rules and select best match
6. **Equip Item**: 
   * If slot is empty: Equip item directly
   * If slot has item: Compare stats, equip if better (unequip old item)
7. **Update References**: Set `adventurer.equipment[slotType] = itemId`
8. **Update States**: Set item state to `Equipped`

### Equipment Rebalancing

When auto-equip runs, the system may rebalance equipment across the roster:

1. **Check All Adventurers**: Review all adventurers' equipment
2. **Identify Improvements**: Find better items in Armory that could improve adventurers
3. **Rebalance**: Redistribute equipment to optimize overall roster power
4. **Respect Rules**: Follow auto-equip rules during rebalancing

## Durability & Repair (MVP)

Items degrade over time and must be repaired.

### Durability System

* **Durability Range**: 0-100
* **Durability Loss**: Items lose durability from:
  * Mission usage (wear and tear)
  * Combat (damage to equipment)
  * Time (minimal, if applicable)

* **Effectiveness Reduction**: Lower durability reduces item effectiveness:
  * `effectiveStat = baseStat * (durability / 100)`
  * At 0 durability, item is `Broken` and provides no bonuses

### Auto-Repair Policy

Player defines auto-repair policy:

* **Auto-Repair Common**: Yes/No
* **Auto-Repair Uncommon**: Yes/No
* **Auto-Repair Rare**: No (always manual)

When auto-repair is enabled:
1. Item durability drops below threshold (e.g., 50%)
2. System automatically queues item for repair
3. Repair completes after time (based on facility tier)
4. Gold cost automatically deducted

### Manual Repair

For rare items or when auto-repair is disabled:

1. **Player Selects Item**: Player manually selects item for repair
2. **Queue Repair**: Item added to repair queue
3. **Repair Time**: Repair takes time (based on facility tier)
4. **Repair Cost**: Gold cost (based on item rarity and damage)
5. **Repair Complete**: Item durability restored to maximum

### Repair Queue

Repairs run via a queue system:

* **Queue Slots**: 1 free slot, additional slots via monetization
* **Queue Processing**: Repairs process automatically when slot available
* **Queue Order**: Player can prioritize items in queue

## Salvage

Unwanted gear can be salvaged for materials.

### Salvage Process

1. **Player Selects Item**: Player selects item to salvage
2. **Confirm Salvage**: Player confirms salvage action
3. **Calculate Returns**:
   * **Common Items**: Generic materials (based on item value)
   * **Uncommon Items**: Generic materials + small amount of rare essence
   * **Rare Items**: Generic materials + rare essence (significant amount)
4. **Remove Item**: Item removed from game (state → `Salvaged`)
5. **Add Materials**: Materials added to global resources

### Salvage Returns

* **Generic Materials**: Used for crafting common and uncommon items
* **Rare Essence**: Used for crafting rare items
* **Gold**: Small gold return (optional, based on design)

### Auto-Salvage Policy

Player can set auto-salvage policy:

* **Auto-Salvage Common Below X Durability**: Yes/No
* **Auto-Salvage When Better Item Available**: Yes/No

When enabled, system automatically salvages items matching criteria.

## Equipment Integration

### With Adventurer System

* Equipment is stored in `adventurer.equipment` attributes
* Equipment bonuses affect adventurer capabilities
* Auto-equip runs on recruitment and gear changes
* See `10-adventurers-roster.md`

### With Mission System

* Equipment bonuses affect mission resolution rolls
* Skill bonus adds to mission checks
* Attack/AC bonuses affect combat missions
* See `09-mission-system.md`

### With Crafting System

* Crafting creates new items
* Crafted items automatically enter Armory
* Auto-equip may equip newly crafted items
* See `12-crafting-armory.md`

### With Facility System

* Armory facility provides storage capacity
* Repair facilities provide repair speed
* See `13-facilities-upgrades.md`

## Events

The equipment system emits the following events:

* `ItemCreated` - New item created (crafting, drop, etc.)
* `ItemEquipped` - Item equipped to adventurer
* `ItemUnequipped` - Item unequipped from adventurer
* `ItemRepaired` - Item repaired
* `ItemSalvaged` - Item salvaged for materials

## MVP Scope

For MVP, the equipment system includes:

* ✅ 5 item slots (Weapon, Armor, Off-Hand, Accessory, Consumable)
* ✅ 3 rarity tiers (Common, Uncommon, Rare)
* ✅ 6 stat types (Attack, Damage, AC, DR, Skill, Crit Safety)
* ✅ Auto-equip rules (global and role-based)
* ✅ Durability system (0-100)
* ✅ Repair system (auto and manual)
* ✅ Salvage system

Future enhancements (out of MVP scope):

* Item properties (rare item special abilities)
* Item sets (set bonuses)
* Item upgrades/enhancements
* Item sockets/gems
* Advanced salvage options

