# Major Boss Rework Plan

1. Recalculate all common combinations of power scaling from the player (class, item, skill combos) so that bosses don't become pushovers. Ideally a boss dies 20-30 turns of damage.
2. Implement a handler that makes bosses stop taking damage at a specific percentage to trigger phase changes (e.g. I one-shot the boss but the boss hasnt changed phases, so it lands at 66%). When a boss moveset mentions "phase change handler", implement this.
3. Implement a dialogue system where some bosses can speak indicating attacks or phase changes, or flavor text from entering a biome or stepping on hazards, etc. When a boss moveset mentions "dialogue", implement this.
4. When a boss dies, add dialogue before going into the boss item selection screen.
5. All bosses new moveset details will be listed below.

## Dungeon Biome Boss: The Overseer (Medium-Slow Length Kill)

1. This boss does not move from the center and will use basic attacks at melee range when not using a special move.
2. Immediately start the fight with "Activate Traps": transform all 64 tiles in the arena to spike tiles. Add dialogue.
3. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Spear Traps: deal damage to the entire outer ring of the arena
    * Spear Thrust: deal damage at a plus shape to the entire arena (2 rows in center, and 2 columns in middle)
    * Spear Slam: deal damage to 4x4 of the center of the arena
4. At 66%: add a phase change handler that summons 2 weaker HP necromancers at a random corner of the arena. Add dialogue
5. At 33%: add a phase change handler that makes the boss deal instant kill damage to 6 random tiles in the arena every turn alongside its looped attacks. Add dialogue: lorewise the attack is called "Spike Overload"

## Swamp Biome Boss: Mud Colossus (Fast-Medium Length Kill)

1. This boss moves to the player only when not telegraphing an attack and will use basic attacks at melee range when not using a special move.
2. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Swamp Spit: telegraph one random tile in a 3x3 near the player where it will turn into a swamp tile (66% chance)
    * Lesser Quagmire: transform the 2x2 tiles the boss is standing on into a swamp tile (33% chance)
3. At 75%: add a phase change handler that summons 2 mud golems
3. At 50%: add a phase change handler that wipes the entire arena clean from swamp tiles, then summon one slightly weaker elite mud golem (make sure it doesn't add an extra item drop from being killed). Yes, it can cast Quagmire.
4. At 20%: add a phase change handler that wipes the entire arena clean from swamp tiles, then starts covering the entire arena in swamp tiles starting from the left/right column every turn (example: turn 1 at 20% left summons a column of swamp tiles at column 1, next turn column 2, etc. or turn 1 at 20% summons a column of swamp tiles at column 8, next turn column 7, etc.)

## Forest Biome Boss: Greatwood Titan (Medium-Slow Length Kill)

1. This boss does not move from the center and will use basic attacks at melee range when not using a special move.
2. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Wooden Thorns: two line AoEs, one at a random row, one at a random column
    * Branch Slam: target a 3x3 area at the player that they need to move out of
    * Overgrow: deal damage to 4x4 of the center of the arena
3. At 75%: add a phase change handler that summons 2 weaker treants at a random corner, the boss will be invulnerable until all treants are killed. Add dialogue about the power of the woods
4. At 50%: replace the entire outer ring of the arena with water tiles. Add dialogue about the rivers of the forest
5. At 25%: add a phase change handler that covers the 3x3 area around tbe player with breakable blocks (replace water tiles if it has to spawn breakable blocks there). After 3 turns target the 3x3 breakable block area with massive damage. This forces the player to quickly break the blocks and escape from the trap to avoid getting killed. Add dialogue about "this ends here mortal"

## Desert Biome Boss: Bandit Gang (Fast Kill)

1. This boss is the only bosses with 1x1 size. Spawn 4 different minibosses at the corners of the arena with 40% of regular boss hp each and moves like a regular enemy (need balancing analysis, consider AoE cleave damage). Each miniboss will have these characteristics explained below.
2. There will be 4 bandits spawned at each corner of the arena:
    * Tech Terry: works like a necromancer, spawns mini robots
    * Shooter Sally: ranged attacker
    * Breaker Barry: melee attacker
    * Molotov Mary: ranged attacker
2. Every turn, one of the bandits will be picked at random to telegraph a special attack (telegraph).
    * Tech Terry: Bomb Throw: target a 3x3 at the player that they need to move out of
    * Shooter Sally: Deadeye Snipe: teleport to a random spot at the arena that can shoot a line at the player horizontally/vertically at a straight line the player needs to move out of
    * Breaker Barry: Blink Strike: teleport to a random tile near the player to do small damage but inflict bleeding
    * Molotov Mary: Desert Flames: target the tile the player is currently standing on to turn to a lava tile
3. When a bandit isn't using their special attack, pick one of the non-special attacking bandits to use their basic attack in this priority order: Barry (if in melee range) -> Sally or Mary at random, and Terry always spawns mini robots when not special attacking. At most there will only be two bandits using a basic attack. Here is an example turn that can happen:
    * Tech Terry: spawns a mini robot
    * Shooter Sally: uses Deadeye Snipe
    * Breaker Barry: does nothing, because out of melee range
    * Molotov Mary: use basic ranged attack
4. Each bandit death will trigger a dialogue

## Volcanic Biome Boss: Molten Chaos (Fast-Medium Length Kill)

1. This boss does not move from the center and will use basic attacks at melee range when not using a special move.
2. Every turn a random tile will be converted to lava
3. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Magma Collapse: 16 random tiles will be picked to be attacked, inflict burning if hit
    * Magma Spit: target a 3x3 area at the player that they need to move out of, inflict burning if hit
    * Overheat: deal damage to 4x4 of the center of the arena, inflict burning if hit
4. At 66%, trigger a phase change handler that summon two magma slimes at two random corners of the arena.
5. At 33% the "Every turn a random tile will be converted to lava" will become "Every turn two random tiles will be converted to lava"

## Frozen Biome Boss: Frost Dwarf (Medium-Slow Length Kill)

1. This boss moves to the player only when not telegraphing an attack and will use basic attacks at melee range when not using a special move.
2. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Frozen Axe: ring AoE around the boss
    * Frozen Stomp: target a 2x2 area on the player that they need to move out of
3. At 75%: add a phase change handler that summons 1 Ice Crystal enemy at a random spot in the arena, they dont move, they can be killed, these ice crystals will hit a plus shaped AoE every turn it's alive with a range that hits the entire row/column of the arena
3. At 50%: add a phase change handler that summons 2 Ice Crystal enemies at random spots in the arena
4. At 25%: add a phase change handler that converts all 64 tiles of the arena to chill water

## Shadow Biome Boss: The First Clone

1. This boss moves to the player only when not telegraphing an attack and will use basic attacks at melee range when not using a special move.
2. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Summon Shade: summon a shade
    * Summon Portal: summon a pair of portals
    * Summon Void: target a 3x3 AoE at the player that they need to move out of
3. At 75%: add a phase change handler that summons 2 wraiths at random tiles. Add dialogue about calling the darkness
3. At 50%: add a phase change handler that summons an elite wraith at a random tile. Add dialogue about calling the darkness once more
4. At 25%: add a phase change handler that summons a clone of itself. It will split its HP into itself and its clone. Both of them will use attacks at the same time. Kill both to win.

## Celestial Biome Boss: Light Guardian

1. This boss moves to the player only when not telegraphing an attack and will use basic attacks at melee range when not using a special move.
2. Loop between these moves at a random order every other turn for the rest of the fight (telegraph):
    * Holy Smite: target a large plus shape attack on the player that they ahve to move out of
    * Holy Beam: target a large beam on the player that they have to move out of
3. At 75%: add a phase change handler that summons 2 angels at random tiles. Add dialogue about calling angels
3. At 50%: add a phase change handler that summons an elite chariot. Add dialogue again
4. At 25%: add a phase change handler that converts all 64 tiles of the arena to Judgement tiles. Summon a seraph at a random tile. Add dialogue about "atone for your sins"