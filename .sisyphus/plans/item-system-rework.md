# Item System Rework

## TL;DR

> **Quick Summary**: Replace the 3-stat-choice system with a Risk of Rain 2-style item system. ~20 items across 3 rarity tiers, infinite stacking, pick 1 of 3 after each stage. Synergies become item-item set bonuses and item-skill interactions.
> 
> **Deliverables**:
> - 20 items (Common/Uncommon/Rare) with stacking effects
> - Item reward screen (pick 1 of 3)
> - On-hit/on-kill/conditional combat effects
> - Item-item synergy sets
> - Item-skill interaction system (replaces old skill synergies)
> - Sidebar item display
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: data.js → state.js → combat.js → ui.js → main.js

---

## Context

### Original Request
Rework stat boost system into an item system inspired by Risk of Rain 2. Replace skill synergies with item-based synergies.

### Decisions Made
- **3 rarity tiers**: Common (white), Uncommon (green), Rare (red)
- **Infinite stacking**: Same item = increased effect per stack
- **Presentation**: Pick 1 of 3 random items after each stage clear
- **~20 items total**
- **Effect types**: Passive stats, on-hit effects, on-kill effects, conditional effects
- **Synergies**: Both item-item set bonuses AND item-skill interactions
- **Existing synergies**: Convert Firestorm, Shatter, Juggernaut, Assassin, Empowered, Combust to item-skill interactions

---

## Work Objectives

### Core Objective
Replace the stat upgrade system with a full item system. Items are the primary progression mechanic, replacing both stat choices and skill synergies.

### Concrete Deliverables
- `Data.ITEMS` object with ~20 items across 3 rarities
- `Data.ITEM_SETS` for item-item synergy sets
- Player `items` property (object: `{itemId: stackCount}`)
- `State.hasItem(id)`, `State.getItemStacks(id)` helpers
- `UI.showItemChoices(callback)` replacing `UI.showStatChoices()`
- On-hit effect hooks in `Combat.dealDamage()`
- On-kill effect hooks in kill/death processing
- Conditional effect checks in `Combat.calculateDamage()`
- `hasSynergy()` reworked to check item sets + item-skill combos
- Sidebar section showing owned items with stack counts

### Definition of Done
- [ ] All 20 items functional with correct stacking
- [ ] Item choice screen works after every stage
- [ ] On-hit effects trigger correctly in combat
- [ ] On-kill effects trigger correctly
- [ ] Conditional effects apply under correct conditions
- [ ] Item synergies activate when requirements met
- [ ] Item-skill interactions modify skill behavior
- [ ] Owned items display in sidebar
- [ ] Old stat upgrade system fully removed
- [ ] Old skill synergy system fully replaced

### Must Have
- 20 items with unique effects
- Infinite stacking (each stack adds base effect)
- Rarity weighting (Common > Uncommon > Rare)
- Pick 1 of 3 presentation
- Item-item synergy sets
- Item-skill interactions (converting old synergies)

### Must NOT Have (Guardrails)
- No active ability items (passive effects only)
- No item trading/selling
- No item locking/favoriting
- No run-specific item themes (keep it simple)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO (no test framework)
- **Automated tests**: None
- **Framework**: none

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright - navigate, interact, assert DOM, screenshot
- **Combat logic**: Use Bash (curl/manual) - verify via console output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - MUST complete first):
├── Task 1: Design item pool (20 items, 3 rarities) [writing]
├── Task 2: Add Data.ITEMS + Data.ITEM_SETS to data.js [quick]
├── Task 3: Add player.items + helpers to state.js [quick]
└── Task 4: Add item display UI to sidebar [quick]

Wave 2 (Core mechanics - after Wave 1):
├── Task 5: Replace stat choices with item choices in ui.js [unspecified-high]
├── Task 6: On-hit/on-kill effects in combat.js [deep]
├── Task 7: Conditional effects in combat.js [deep]
└── Task 8: Item-item synergy system [deep]

Wave 3 (Integration - after Wave 2):
├── Task 9: Item-skill interactions (convert old synergies) [deep]
├── Task 10: Update main.js reward flow [quick]
├── Task 11: Remove old stat/synergy systems [quick]
└── Task 12: Polish + edge cases [unspecified-high]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 2, 3, 4 |
| 2 | 1 | 5, 6, 7, 8 |
| 3 | 1 | 5, 6, 7, 8 |
| 4 | 1 | 5 |
| 5 | 2, 3, 4 | 10 |
| 6 | 2, 3 | 9 |
| 7 | 2, 3 | 9 |
| 8 | 2, 3 | 9 |
| 9 | 6, 7, 8 | 12 |
| 10 | 5 | 12 |
| 11 | 5, 9 | 12 |
| 12 | 9, 10, 11 | - |

---

## TODOs

> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

- [ ] 1. Design Item Pool (20 items, 3 rarities)

  **What to do**:
  - Design 20 items across 3 rarity tiers: Common (8-9), Uncommon (6-7), Rare (4-5)
  - Each item needs: id, name, desc, rarity, effect type, base value, stacking formula
  - Effect types: passive (stat boost), on-hit (chance on attack), on-kill (on enemy death), conditional (when HP below X, etc.)
  - Include item-item synergy sets (2-3 sets, 2-3 items each)
  - Include item-skill interactions (convert old synergies: Firestorm, Shatter, Juggernaut, Assassin, Empowered, Combust)

  **Item Pool Design**:

  **Common (White) - 9 items:**
  1. `tough_shell` - +50 max HP per stack
  2. `power_stone` - +8% damage per stack
  3. `swift_boots` - +10% move speed per stack
  4. `iron_skin` - +5 armor per stack (reduces damage taken)
  5. `vampiric_fangs` - +2% lifesteal per stack
  6. `wide_grip` - +15% AoE size per stack
  7. `sharp_edge` - +5% crit chance per stack
  8. `burning_touch` - 10% chance to burn on hit, +5% per stack
  9. `frozen_core` - 10% chance to freeze on hit, +5% per stack

  **Uncommon (Green) - 7 items:**
  1. `critical_lens` - +20% crit damage per stack
  2. `guardian_angel` - +100 shield per stack (regenerates after 5s)
  3. `explosive_rounds` - On kill: 30% chance to explode (50% base damage AoE)
  4. `haste_rune` - On kill: +20% attack speed for 3s, +1s per stack
  5. `desperate_strength` - +20% damage when below 50% HP per stack
  6. `thorns_armor` - Reflect 15% melee damage taken per stack
  7. `chain_lightning` - On hit: 20% chance to chain to 1 nearby enemy, +1 target per stack

  **Rare (Red) - 4 items:**
  1. `glass_cannon` - +100% damage, -50% max HP per stack
  2. `chaos_embrace` - On hit: apply random status (burn/freeze/poison) per stack
  3. `berserker_blood` - +15% damage per 10% missing HP per stack
  4. `shield_generator` - +200 shield per stack (regenerates after 5s)

  **Item Sets (Synergies):**
  1. `elemental_mastery`: `burning_touch` + `frozen_core` + `chain_lightning` → All on-hit effects chance doubled
  2. `juggernaut`: `tough_shell` + `iron_skin` + `thorns_armor` → +50% max HP, reflect 30% damage
  3. `glass_cannon_set`: `glass_cannon` + `critical_lens` → Crits deal 3x instead of 2x

  **Item-Skill Interactions (replacing old synergies):**
  1. `fireball` + `burning_touch` item → Fireball AoE becomes 5x5 (was Firestorm)
  2. `ice_shard` + `frozen_core` item → Frozen enemies take 2x damage (was Shatter)
  3. `shield_bash` + `iron_skin` item → Shield bash knockback + stun 1 turn
  4. `dash` + `swift_boots` item → Dash freezes nearby enemies
  5. `war_cry` + `berserker_blood` item → War Cry grants +100% damage (was Empowered)
  6. `poison_cloud` + `burning_touch` item → Poison tiles deal double DoT (was Combust)

  **QA Scenarios:**
  ```
  Scenario: Item pool validation
    Tool: Bash (console)
    Steps:
      1. Open game in browser
      2. Verify Data.ITEMS has 20 entries
      3. Verify each item has: id, name, desc, rarity, effect, value
      4. Verify rarity distribution: ~9 common, ~7 uncommon, ~4 rare
    Expected Result: All 20 items present with correct structure
    Evidence: .sisyphus/evidence/task-1-item-pool-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(items): design complete item pool with 20 items, 3 rarities, synergies`
  - Files: `js/data.js`

---

- [ ] 2. Add Data.ITEMS + Data.ITEM_SETS to data.js

  **What to do**:
  - Add `Data.ITEMS` object with all 20 items
  - Add `Data.ITEM_SETS` for item-item synergies
  - Add `Data.ITEM_SKILL_INTERACTIONS` for item-skill combos
  - Add rarity weights for random selection: Common 60%, Uncommon 30%, Rare 10%
  - Keep existing Data.SKILLS, Data.ENEMIES, Data.SYNERGIES (will be removed in Task 11)

  **Item Structure**:
  ```javascript
  {
      id: 'tough_shell',
      name: 'Tough Shell',
      desc: '+50 max HP',
      rarity: 'common', // common, uncommon, rare
      effect: {
          type: 'passive', // passive, on_hit, on_kill, conditional
          stat: 'maxHp', // for passive
          value: 50, // base value
          stacking: 'additive' // additive or multiplicative
      },
      color: '#ffffff' // white for common, green for uncommon, red for rare
  }
  ```

  **QA Scenarios:**
  ```
  Scenario: data.js structure valid
    Tool: Bash (console)
    Steps:
      1. Open game in browser
      2. Verify Data.ITEMS is defined and has 20 entries
      3. Verify Data.ITEM_SETS is defined
      4. Verify Data.ITEM_SKILL_INTERACTIONS is defined
      5. Check no JavaScript errors in console
    Expected Result: All data structures present, no errors
    Evidence: .sisyphus/evidence/task-2-data-structure.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(items): add item pool, synergies, and skill interactions to data.js`
  - Files: `js/data.js`

---

- [ ] 3. Add player.items + helpers to state.js

  **What to do**:
  - Add `player.items: {}` (object keyed by item id, value = stack count)
  - Add `State.hasItem(id)` - returns true if player has item
  - Add `State.getItemStacks(id)` - returns stack count (0 if not owned)
  - Add `State.addItem(id)` - adds item or increments stack
  - Add `State.getPlayerStat(stat)` - calculates total stat from items
  - Update `State.reset()` to clear items

  **QA Scenarios:**
  ```
  Scenario: Item state functions work
    Tool: Bash (console)
    Steps:
      1. Open game in browser
      2. Verify State.player.items is defined as empty object
      3. Verify State.hasItem('tough_shell') returns false
      4. Verify State.getItemStacks('tough_shell') returns 0
      5. Call State.addItem('tough_shell')
      6. Verify State.hasItem('tough_shell') returns true
      7. Verify State.getItemStacks('tough_shell') returns 1
      8. Call State.addItem('tough_shell') again
      9. Verify State.getItemStacks('tough_shell') returns 2
    Expected Result: All helper functions work correctly
    Evidence: .sisyphus/evidence/task-3-state-helpers.txt
  ```

  **Commit**: YES
  - Message: `feat(items): add player items state and helper functions`
  - Files: `js/state.js`

---

- [ ] 4. Add item display UI to sidebar

  **What to do**:
  - Add `#items-panel` section to sidebar in index.html
  - Add CSS for item display: icon (colored square by rarity), name, stack count
  - Add `UI.updateItems()` to refresh item display
  - Items sorted by rarity (Common → Uncommon → Rare)
  - Show stack count badge on each item

  **QA Scenarios:**
  ```
  Scenario: Item panel renders
    Tool: Playwright
    Steps:
      1. Navigate to game
      2. Verify #items-panel exists in sidebar
      3. Verify panel has correct styling (border, padding)
      4. Add test item via console: State.addItem('tough_shell')
      5. Call UI.updateItems()
      6. Verify item appears in panel with correct name and stack count
    Expected Result: Item panel renders and displays items correctly
    Evidence: .sisyphus/evidence/task-4-item-panel.png
  ```

  **Commit**: YES
  - Message: `feat(items): add item display panel to sidebar`
  - Files: `index.html`, `css/style.css`, `js/ui.js`

---

- [ ] 5. Replace stat choices with item choices in ui.js

  **What to do**:
  - Create `UI.showItemChoices(callback)` function
  - Randomly select 3 items from pool (weighted by rarity)
  - Display as choice cards (like stat choices but with rarity colors)
  - Each card shows: item name, description, rarity badge, effect preview
  - On selection: callback with chosen item id
  - Remove or deprecate `UI.showStatChoices()`

  **QA Scenarios:**
  ```
  Scenario: Item choice screen works
    Tool: Playwright
    Steps:
      1. Navigate to game, start new run
      2. Clear stage 1 (kill all enemies)
      3. Verify item choice screen appears
      4. Verify 3 items shown with different rarities
      5. Verify each item has name, description, rarity color
      6. Click first item
      7. Verify choice screen closes
      8. Verify item added to player.items
    Expected Result: Item choice flow works end-to-end
    Evidence: .sisyphus/evidence/task-5-item-choice.png
  ```

  **Commit**: YES
  - Message: `feat(items): implement item choice screen with rarity weighting`
  - Files: `js/ui.js`

---

- [ ] 6. On-hit/on-kill effects in combat.js

  **What to do**:
  - Add `Combat.processOnHitEffects(enemy, skill)` - called after player hits enemy
  - Handle: burning_touch (burn chance), frozen_core (freeze chance), chain_lightning (chain), chaos_embrace (random status)
  - Add `Combat.processOnKillEffects(enemy)` - called when enemy dies
  - Handle: explosive_rounds (AoE explosion), haste_rune (speed buff)
  - Integrate into dealDamage() and kill processing

  **QA Scenarios:**
  ```
  Scenario: On-hit effects trigger
    Tool: Bash (console)
    Steps:
      1. Start game, add burning_touch item: State.addItem('burning_touch')
      2. Attack enemy 10 times
      3. Verify burn effect applied on some hits (~10% chance)
      4. Add frozen_core, verify freeze chance works
      5. Add chain_lightning, verify chain effect works
    Expected Result: On-hit effects trigger at correct rates
    Evidence: .sisyphus/evidence/task-6-onhit-effects.txt

  Scenario: On-kill effects trigger
    Tool: Bash (console)
    Steps:
      1. Start game, add explosive_rounds item
      2. Kill an enemy near other enemies
      3. Verify explosion triggers and damages nearby enemies
      4. Add haste_rune, kill enemy, verify speed buff applied
    Expected Result: On-kill effects trigger correctly
    Evidence: .sisyphus/evidence/task-6-onkill-effects.txt
  ```

  **Commit**: YES
  - Message: `feat(items): implement on-hit and on-kill item effects`
  - Files: `js/combat.js`

---

- [ ] 7. Conditional effects in combat.js

  **What to do**:
  - Add `Combat.applyConditionalEffects()` - called at start of player turn
  - Handle: desperate_strength (+20% dmg below 50% HP), berserker_blood (+15% per 10% missing HP)
  - Add `Combat.applyShieldEffects()` - called to regenerate shields
  - Handle: guardian_angel, shield_generator (shield regeneration)
  - Integrate into turn flow

  **QA Scenarios:**
  ```
  Scenario: Conditional effects apply correctly
    Tool: Bash (console)
    Steps:
      1. Start game, add desperate_strength item
      2. Set player HP to 40% of max
      3. Verify damage boost applies
      4. Set player HP to 60% of max
      5. Verify damage boost does NOT apply
      6. Add berserker_blood, verify missing HP scaling works
    Expected Result: Conditional effects apply under correct conditions
    Evidence: .sisyphus/evidence/task-7-conditional-effects.txt
  ```

  **Commit**: YES
  - Message: `feat(items): implement conditional effects and shield regeneration`
  - Files: `js/combat.js`

---

- [ ] 8. Item-item synergy system

  **What to do**:
  - Add `State.hasItemSet(setId)` - checks if player has all items in a set
  - Add `State.getItemSetBonus(setId)` - returns bonus description if active
  - Implement set bonuses:
    - elemental_mastery: All on-hit effects chance doubled
    - juggernaut: +50% max HP, reflect 30% damage
    - glass_cannon_set: Crits deal 3x instead of 2x
  - Display active synergies in sidebar

  **QA Scenarios:**
  ```
  Scenario: Item synergies activate
    Tool: Bash (console)
    Steps:
      1. Start game
      2. Add burning_touch + frozen_core + chain_lightning
      3. Verify elemental_mastery synergy activates
      4. Verify on-hit chances are doubled
      5. Add tough_shell + iron_skin + thorns_armor
      6. Verify juggernaut synergy activates
      7. Verify +50% max HP applies
    Expected Result: Synergies activate when requirements met
    Evidence: .sisyphus/evidence/task-8-item-synergies.txt
  ```

  **Commit**: YES
  - Message: `feat(items): implement item-item synergy system with set bonuses`
  - Files: `js/state.js`, `js/combat.js`

---

- [ ] 9. Item-skill interactions (convert old synergies)

  **What to do**:
  - Convert old skill synergies to item-skill interactions
  - Add `State.hasSkillInteraction(skillId)` - checks if player has required item for skill
  - Implement interactions:
    - fireball + burning_touch → AoE becomes 5x5
    - ice_shard + frozen_core → Frozen enemies take 2x damage
    - shield_bash + iron_skin → Knockback + stun 1 turn
    - dash + swift_boots → Dash freezes nearby enemies
    - war_cry + berserker_blood → +100% damage buff
    - poison_cloud + burning_touch → Poison tiles deal double DoT
  - Update skill execution to check for interactions

  **QA Scenarios:**
  ```
  Scenario: Item-skill interactions work
    Tool: Bash (console)
    Steps:
      1. Start game, equip fireball skill
      2. Add burning_touch item
      3. Use fireball
      4. Verify AoE is 5x5 (was 3x3)
      5. Equip ice_shard, add frozen_core
      6. Freeze enemy, attack with ice_shard
      7. Verify 2x damage on frozen enemy
    Expected Result: Item-skill interactions modify skill behavior
    Evidence: .sisyphus/evidence/task-9-item-skill-interactions.txt
  ```

  **Commit**: YES
  - Message: `feat(items): implement item-skill interactions, convert old synergies`
  - Files: `js/combat.js`, `js/data.js`

---

- [ ] 10. Update main.js reward flow

  **What to do**:
  - Update `Main.stageClear()` to use `UI.showItemChoices()` instead of `UI.showStatChoices()`
  - Update `Main.applyStatUpgrade()` → `Main.applyItemReward(itemId)`
  - Remove old stat upgrade application code
  - Ensure boss bonus flow still works (boss bonus → item choice → skill choice)

  **QA Scenarios:**
  ```
  Scenario: Reward flow works end-to-end
    Tool: Playwright
    Steps:
      1. Start new game
      2. Clear stage 1
      3. Verify item choice screen appears (not stat choice)
      4. Pick an item
      5. Verify skill choice screen appears after
      6. Clear stage 2 (non-boss)
      7. Verify same flow: item → skill
      8. Clear stage 5 (boss)
      9. Verify: boss bonus → item → skill
    Expected Result: Complete reward flow works correctly
    Evidence: .sisyphus/evidence/task-10-reward-flow.png
  ```

  **Commit**: YES
  - Message: `feat(items): update reward flow to use item choices`
  - Files: `js/main.js`

---

- [ ] 11. Remove old stat/synergy systems

  **What to do**:
  - Remove `Data.STAT_UPGRADES` from data.js
  - Remove old `Data.SYNERGIES` (replaced by item sets + item-skill interactions)
  - Remove `State.player.critStacks` (no longer needed)
  - Remove old stat upgrade code from main.js
  - Remove old synergy check code from combat.js
  - Update UI to remove stat choice references
  - Clean up any dead code

  **QA Scenarios:**
  ```
  Scenario: Old systems fully removed
    Tool: Bash (grep)
    Steps:
      1. Search codebase for STAT_UPGRADES references
      2. Search for old SYNERGIES references
      3. Search for critStacks references
      4. Verify no JavaScript errors in console
      5. Play through 3 stages, verify no crashes
    Expected Result: Old code removed, game runs without errors
    Evidence: .sisyphus/evidence/task-11-cleanup.txt
  ```

  **Commit**: YES
  - Message: `refactor(items): remove old stat upgrade and synergy systems`
  - Files: `js/data.js`, `js/state.js`, `js/main.js`, `js/combat.js`, `js/ui.js`

---

- [ ] 12. Polish + edge cases

  **What to do**:
  - Handle edge cases: full inventory, duplicate items, max stacks
  - Add visual feedback for on-hit/on-kill effects (floating text)
  - Ensure item effects scale correctly with stacking
  - Balance pass: verify all 20 items are viable
  - Add item tooltips with exact numbers
  - Test synergy activation/deactivation

  **QA Scenarios:**
  ```
  Scenario: Edge cases handled
    Tool: Bash (console)
    Steps:
      1. Add same item 10 times, verify stacking works
      2. Verify no stack limit (infinite stacking)
      3. Test all item-skill interactions
      4. Test all item-item synergies
      5. Verify floating text for on-hit/on-kill effects
    Expected Result: All edge cases handled gracefully
    Evidence: .sisyphus/evidence/task-12-polish.txt
  ```

  **Commit**: YES
  - Message: `fix(items): polish edge cases, visual feedback, balance`
  - Files: `js/combat.js`, `js/ui.js`, `js/state.js`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run linter. Review all changed files for: `as any`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction.
  Output: `Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Play through 5+ stages. Verify: items appear after each stage, items stack correctly, on-hit/on-kill effects trigger, synergies activate, sidebar shows items. Save evidence.
  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | VERDICT`

---

## Commit Strategy

- After Wave 1: `feat(items): add item pool, player items state, sidebar display`
- After Wave 2: `feat(items): implement item rewards, on-hit/on-kill/conditional effects, synergies`
- After Wave 3: `feat(items): item-skill interactions, remove old systems, polish`

---

## Success Criteria

### Verification Commands
```bash
# Game loads without errors
# Open index.html in browser, start game
# After clearing stage 1: item choice screen appears with 3 items
# Pick an item: it appears in sidebar with stack count
# Clear stage 2: get another item choice (may be same item, stacks)
# Combat: on-hit effects trigger, on-kill effects trigger
# synergies activate when item requirements met
```

### Final Checklist
- [ ] 20 items exist with unique effects
- [ ] 3 rarity tiers with correct colors
- [ ] Infinite stacking works
- [ ] Pick 1 of 3 presentation
- [ ] On-hit effects trigger in combat
- [ ] On-kill effects trigger on enemy death
- [ ] Conditional effects apply correctly
- [ ] Item-item synergies activate
- [ ] Item-skill interactions work
- [ ] Old stat system removed
- [ ] Old synergy system replaced
- [ ] Sidebar shows owned items
