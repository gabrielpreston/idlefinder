## 1. High-Level Vision

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

> “I run an ever-busy adventuring guild in a PF2E-flavored world that never sleeps, and my job is to make high-level decisions about how it runs — not to push every button.”

---

## 2. Core Design Principles

### 2.1 Idle-First, Not “Idle-Lite”

* **All major gameplay loops must run without player input.**
* If something requires frequent manual interaction to work, it’s either:

  * turned into a **policy**, or
  * pushed out of MVP scope.

### 2.2 Strategic, Not Operational

* Player interacts in **bursts of meaningful decisions**, not constant micro.
* The “work” of:

  * selecting missions,
  * assigning heroes,
  * upgrading buildings at the exact moment resources hit the threshold
    is never the player’s job.

### 2.3 PF2E-Inspired, Not PF2E-Complete

* PF2E math concepts (DCs, success/crit bands, stats, roles) shape:

  * mission resolution,
  * build choices,
  * class identity.
* But you **simplify subsystems** dramatically for an idle context:

  * minimal stats
  * minimal item complexity
  * simplified roles.

### 2.4 Equipment is Identity

* Equipment is the **main place where the player “touches” the world**.
* Gear is how the guild expresses:

  * power,
  * specialization,
  * identity,
  * progress.
* Gear management is one of the few intentionally hands-on systems.

### 2.5 Offline Respect & Deterministic Progress

* Progress during offline time is:

  * calculable,
  * fair,
  * bounded by doctrine and capacity.
* No actions are lost because the player didn’t log in during a window.
* No “missed caravans” or “expired missions” punish low-engagement players.

### 2.6 Monetization via Efficiency + Expression (Not Raw Power)

* Paying players get:

  * **more efficient automation**,
  * **better QoL**,
  * **more expressive cosmetics**.
* They **do not** buy direct stats that trivialize the game’s math.

---

## 3. The Player’s Role

The player is not “controlling heroes.” They are **writing the operating manual** for the guild.

They define:

1. **Mission Doctrine**

   * What the guild is trying to maximize (XP, gold, materials, fame).
   * How much risk is acceptable (safe, balanced, aggressive).

2. **Team Formation Policies**

   * Preferred compositions (frontline/caster/support patterns).
   * Minimum thresholds to send a mission (e.g., “don’t send under-geared heroes”).

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

---

## 4. Time & Progression Model

### 4.1 Continuous Time

* Missions, crafting, upgrading, recovery all take **real-world time**.
* The server (or local sim, for MVP) uses timestamps to:

  * compute how many cycles of missions/crafting/upgrades occurred while the player was away,
  * resolve results in batch when the player returns.

### 4.2 Tick Granularity (Conceptual)

* Internally, you can treat time as discrete “ticks” (e.g., 1 second, 10 seconds, etc.), but:

  * externally, missions just show “duration,”
  * offline resolution does math based on total elapsed seconds.

### 4.3 Offline Catch-Up

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

No UI “fast-forward” mini-game; just deterministic summarized results.

---

## 5. Core Loops (Idle-First)

### 5.1 Mission Automation Loop (Primary Engine)

**Goal:** Convert time + roster + equipment + doctrine → XP, gold, materials, fame, and items, continuously.

1. **Mission Generation**

   * The world provides a pool of missions.
   * Missions have:

     * category (combat, resource, defense, diplomacy, etc.),
     * difficulty tier (tied to fame),
     * rewards (XP/gold/materials/fame),
     * duration.

2. **Doctrine-Driven Selection**

   * System chooses missions based on player’s doctrine:

     * “Maximize fame/hour”
     * “Farm gold”
     * “Balance XP and materials”
     * “Avoid lethal-tier missions”
   * Missions are “pulled” into a queue according to these rules.

3. **Automatic Team Formation**

   * From the available roster, system forms a party:

     * follows role templates,
     * respects minimum power thresholds,
     * prefers healthier/durability-safe heroes based on rules.

4. **Auto-Deployment**

   * Party is sent out automatically.
   * Timer starts.

5. **Resolution (PF2E-inspired)**

   * When mission completes:

     * checks success vs DC,
     * applies crit bands (crit success / success / fail / crit fail),
     * computes rewards and consequences (XP, loot, injuries, deaths).

6. **Auto-Recovery**

   * Survivors go to rest → return to active pool after time.
   * Gear durability updates.
   * Injuries may cause downtime (infirmary).

7. **Loop**

   * As soon as a mission slot is free:

     * doctrine chooses new mission,
     * new party formed,
     * cycle repeats.

The loop runs without player input 24/7.

---

### 5.2 Facility Upgrade & Operations Loop

Facilities are **always-on multipliers** and queues, not “click-to-activate” features.

1. Player defines an **upgrade queue**:

   * Example order: Dorms → Mission Command → Training Grounds → Resource Depot.
2. Each upgrade:

   * costs gold/materials,
   * takes real time,
   * increases some capacity:

     * mission slots,
     * roster cap,
     * crafting throughput,
     * healing/repair speed, etc.
3. When resources + slot are available, the system:

   * automatically starts the next upgrade in the queue.
4. Facilities also:

   * auto-run background effects (e.g., passive XP gain, repair throughput).

The player’s job is deciding **what gets improved and in what order**, not when to press “upgrade.”

---

### 5.3 Roster Automation Loop

Adventurers flow through a lifecycle that is largely automated.

1. **Recruitment Rules**

   * Player sets:

     * target roster size,
     * role distribution (e.g., 40% frontline, 30% casters, 30% support),
     * minimum quality thresholds.
2. **Auto-Recruitment**

   * When roster falls below target:

     * system automatically recruits from:

       * caravans,
       * local pools,
       * special sources (later content).
3. **Auto-Equipping**

   * On recruitment, auto-equip logic assigns gear from the Armory.
4. **Mission Usage**

   * Missions draw from this roster automatically.
5. **Death & Replacement**

   * When adventurers die:

     * they may be recorded in Hall of Fame,
     * roster drops below target,
     * auto-recruit rules kick in and backfill.

The player can still **curate** or lock specific heroes for manual attention later — but MVP assumes fully automated roster maintenance.

---

### 5.4 Equipment & Crafting Loop (Hands-On Core)

This is where the player **leans in**.

#### 5.4.1 Minimal Slot Model (MVP)

Each adventurer has:

* Weapon
* Armor
* Off-Hand (shield / secondary item)
* Accessory
* Consumable (conceptually, but not individually micromanaged)

#### 5.4.2 Item Tiers (MVP)

* Common
* Uncommon
* Rare (magical properties)

#### 5.4.3 Simple Stat Model (MVP)

Each item affects a small set from:

* Attack bonus
* Damage bonus
* Armor Class
* Flat DR or mitigation
* Skill bonus (for mission checks)
* Crit safety (reduces crit fail chance slightly)

#### 5.4.4 Auto-Equip Logic

Player defines **rules** like:

* Global:

  * “Balanced / Offense-first / Defense-first.”
  * “Allow rare items automatically: yes/no.”
* Role-based:

  * Frontline: prioritize AC → DR → Attack.
  * Casters: prioritize Skill bonus → Crit safety.
  * Rogues: prioritize Attack → Damage.

When:

* new gear drops,
* crafting completes,
* items are repaired or improved,
  the system automatically re-balances gear according to these rules.

#### 5.4.5 Crafting (MVP)

* Player can:

  * craft basic gear,
  * upgrade to uncommon,
  * craft a small set of rare variants per slot.
* Costs:

  * materials + gold + time.
* Crafting runs via **queues**:

  * “Craft 3 common armors → 2 uncommon weapons → 1 rare accessory.”

#### 5.4.6 Durability & Repair (MVP)

* Durability 0–100 on items.
* Lower durability reduces effectiveness.
* System can auto-repair common/uncommon items based on player policy.
* Player may:

  * manually prioritize rare gear for repair,
  * feed them into a repair queue (time + gold).

#### 5.4.7 Salvage

* Player can salvage unwanted gear for:

  * generic materials,
  * rare essences (from rares).
* This fuels crafting and keeps the inventory clean.

The **core feeling** is:

> “I spend my active time curating, crafting, repairing, and optimizing gear. The game uses that gear intelligently while I’m away.”

---

### 5.5 Caravans & Trade Loop

Caravans are **asynchronous economic events**, not login pressure.

1. Caravans appear over time with:

   * recruits,
   * gear,
   * materials,
   * rare items.
2. Player sets **auto-buy rules**:

   * “Auto-buy recruits above level X if we need their role.”
   * “Auto-buy rare items under Y cost.”
   * “Auto-buy materials up to storage cap.”
3. When a caravan “arrives” in the sim:

   * system processes those rules,
   * purchases items and recruits automatically,
   * integrates them into roster/armory/materials.

The player can still browse caravan logs when online, but **nothing is missed** by being offline.

---

### 5.6 Fame, Unlocks, and Meta Progression

Fame measures “how big and important your guild is.”

1. Fame is earned naturally from missions.
2. Thresholds unlock:

   * higher-tier missions,
   * new regions/biomes,
   * new facility tiers,
   * new caravan types,
   * new item types or crafting options.
3. Because missions run continuously:

   * fame slowly but steadily increases over time, governed by doctrine and power level.
4. The player’s role:

   * choose when to lean into risk to accelerate fame,
   * adjust doctrine to push toward fame or economy.

Later, prestige/rebirth systems can hook into fame, but MVP just needs linear unlocks.

---

## 6. Doctrine, Policies, and AI “Brains”

This is the conceptual glue that turns a busy management sim into a true idle game.

### 6.1 Global Doctrine

High-level switches:

* Risk: Safe / Balanced / Aggressive.
* Focus: XP / Gold / Materials / Fame / Mixed.
* Safety nets (e.g., “Do not run missions with death risk > X%”).

### 6.2 System-Specific Policies

Each subsystem has its own small policy set:

* **Missions:**

  * Prefer short/long missions.
  * Avoid certain categories if healing is constrained.
* **Roster:**

  * Auto-retire low-performing heroes.
  * Maintain extra bench for high-risk doctrines.
* **Equipment:**

  * How aggressively to upgrade items.
  * Whether to auto-salvage commons.
* **Facilities:**

  * Default heuristic to reorder queue (e.g., economy first).
* **Trade:**

  * Minimum gold reserve.
  * Prioritization of recruits vs gear vs materials.

These policies turn into **lightweight AI heuristics** driving daily simulation.

---

## 7. Monetization Surfaces in this Model

Monetization is about **efficiency, convenience, and expression**:

### 7.1 Efficiency / QoL

* Extra facility upgrade queues.
* Extra crafting queues.
* Slightly faster:

  * crafting,
  * repair,
  * infirmary recovery (within bounds).
* Advanced doctrine slots (more granular control).
* Additional auto-equip rule slots (more nuanced optimization).
* Enhanced caravan visibility or rerolls (better selection, not guaranteed power).

### 7.2 Expression

* Cosmetic skins for:

  * Guildhall,
  * Facilities,
  * Adventurers,
  * UI themes,
  * Special effect styles.
* Cosmetic memorials/statues for fallen heroes in the Hall of Fame.
* Alternate visual styles for rare gear.

### 7.3 Knowledge / Meta Tools

* “Advisor” modules that:

  * suggest optimal doctrines,
  * recommend equipment builds,
  * highlight weak spots in the roster.
* These are **assistive**, not force-multipliers.

The key: the **core math of missions and gear remains fair**. Paying users smooth the edges but don’t invalidate non-paying players.

---

## 8. Typical Player Session Flow (Daily Check-In)

To make it concrete, a day looks like:

1. **Login**

   * See summary:

     * missions completed,
     * XP gained,
     * adventurers who died,
     * items found,
     * fame increased,
     * facilities upgraded,
     * crafting finished.

2. **Inspect & Adjust**

   * Check Hall of Fame for notable deaths.
   * Review new rare items.
   * Salvage junk gear.
   * Repair or prioritize special items.
   * Adjust auto-equip rules if needed.

3. **Strategic Choices**

   * Start new crafting recipes.
   * Adjust facility upgrade queue (e.g., shift toward more mission slots).
   * Tweak mission doctrines (e.g., push fame harder now that you’re stronger).
   * Update recruit policies if roster composition looks off.

4. **Log Out**

   * The guild continues to operate:

     * missions loop endlessly,
     * crafting ticks down,
     * facilities upgrade,
     * caravan rules execute,
     * fame climbs.

The game does not punish you for logging out; it relies on you to **steer**, then steps aside to run.

---

That’s the fully fleshed-out “new idle-first approach” in one coherent pass:

* **Always-on, rule-driven simulation**
* **Player as policy-maker and armory master**
* **Missions, facilities, roster, trade all automated**
* **Equipment and crafting as the main active engagement layer**
* **Fame and facilities as your long-term spine**
* **Monetization built into automation, not stats**
