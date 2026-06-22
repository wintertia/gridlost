var Data = {
    GRID_SIZE: 8,
    PLAYER_BASE_HP: 1000,
    PLAYER_BASE_ENERGY: 6,
    PLAYER_BASE_POWER: 0,

    CLASSES: {
        knight: {
            id: 'knight', name: 'KNIGHT', desc: 'Frontline melee warrior',
            passiveName: 'Melee Expert',
            passive: 'Deals bonus damage to nearby enemies with more items.',
            passiveId: 'melee_expert',
            hp: 1000, energy: 6,
            basicAttack: 'slash',
            color: '#ffffff',
            icon: '&#9876;',
            spriteBody: '#5599ff', spriteHead: '#88ccff', spriteArms: '#3366cc'
        },
        ranger: {
            id: 'ranger', name: 'RANGER', desc: 'Ranged skirmisher',
            passiveName: 'Range Master',
            passive: 'Deals bonus damage to distant enemies with more items.',
            passiveId: 'range_master',
            hp: 700, energy: 5,
            basicAttack: 'arrow_shot',
            color: '#44cc44',
            icon: '&#127993;',
            spriteBody: '#33aa33', spriteHead: '#66cc66', spriteArms: '#228822'
        },
        paladin: {
            id: 'paladin', name: 'PALADIN', desc: 'Holy tank who heals through combat',
            passiveName: 'Holy Aura',
            passive: 'Heals more when low. Lifesteals all attacks.',
            passiveId: 'holy_tank',
            hp: 1200, energy: 6,
            basicAttack: 'holy_strike',
            color: '#ffdd44',
            icon: '&#9883;',
            spriteBody: '#ddaa22', spriteHead: '#ffcc44', spriteArms: '#bb8800'
        },
        rogue: {
            id: 'rogue', name: 'ROGUE', desc: 'Critical hit specialist',
            passiveName: 'Deadly Precision',
            passive: '10% base crit chance. Gains crit chance and crit damage with more items.',
            passiveId: 'crit_master',
            hp: 700, energy: 8,
            basicAttack: 'stab',
            color: '#cc44ff',
            icon: '&#128481;',
            spriteBody: '#9944cc', spriteHead: '#bb77dd', spriteArms: '#7733aa'
        }
    },

    STAT_UPGRADES: {
        vitality: { name: 'Vitality', desc: 'Heal 30% HP', healPercent: 30 },
        power: { name: 'Power', desc: '+10% damage', powerBonusPercent: 10 },
        crit: { name: 'Precision', desc: 'Crit chance +8% (log)', critBonus: 8 }
    },

    ITEM_RARITY: {
        common: { name: 'Common', color: '#ffffff', weight: 60 },
        uncommon: { name: 'Uncommon', color: '#44ff44', weight: 30 },
        rare: { name: 'Rare', color: '#ff4444', weight: 10 },
        boss: { name: 'Boss', color: '#ffdd00', weight: 0 }
    },

    ITEMS: {
        // === COMMON (White) ===
        tough_shell: {
            id: 'tough_shell', name: 'Tough Shell', desc: '+50 max HP',
            rarity: 'common', effect: { type: 'passive', stat: 'maxHp', value: 50 },
            icon: '\u25C6', iconBg: '#4488cc'
        },
        iron_skin: {
            id: 'iron_skin', name: 'Iron Skin', desc: '7% dmg reduction (log)',
            rarity: 'common', effect: { type: 'passive', stat: 'damageReduction', value: 7 },
            icon: '\u25A0', iconBg: '#888899'
        },
        vampiric_fangs: {
            id: 'vampiric_fangs', name: 'Vampiric Fangs', desc: '+2% lifesteal',
            rarity: 'common', effect: { type: 'passive', stat: 'lifesteal', value: 2 },
            icon: '\u25BC', iconBg: '#cc4444'
        },
        second_wind: {
            id: 'second_wind', name: 'Second Wind', desc: 'Heal 3% HP on kill',
            rarity: 'common', effect: { type: 'on_kill', healPercent: 3 },
            icon: '\u25CB', iconBg: '#88cc88'
        },
        sharp_edge: {
            id: 'sharp_edge', name: 'Sharp Edge', desc: '+5% crit chance',
            rarity: 'common', effect: { type: 'passive', stat: 'critChance', value: 5 },
            icon: '\u2726', iconBg: '#bbbbcc'
        },
        burning_touch: {
            id: 'burning_touch', name: 'Burning Touch', desc: '10% chance to burn on hit',
            rarity: 'common', effect: { type: 'on_hit', chance: 10, status: 'burn', value: 20 },
            icon: '\u2666', iconBg: '#ff4422'
        },
        frozen_core: {
            id: 'frozen_core', name: 'Frozen Core', desc: '10% chance to freeze on hit',
            rarity: 'common', effect: { type: 'on_hit', chance: 10, status: 'freeze', value: 2 },
            icon: '\u25C7', iconBg: '#44ccff'
        },

        // === UNCOMMON (Green) ===
        critical_lens: {
            id: 'critical_lens', name: 'Critical Lens', desc: '+20% crit damage',
            rarity: 'uncommon', effect: { type: 'passive', stat: 'critDamage', value: 20 },
            icon: '\u25CF', iconBg: '#aa44dd'
        },
        guardian_angel: {
            id: 'guardian_angel', name: 'Guardian Angel', desc: '+75 shield, regen 10%/turn',
            rarity: 'uncommon', effect: { type: 'passive', stat: 'shield', value: 75, shieldRegenPercent: 10 },
            icon: '\u25C8', iconBg: '#ffdd44'
        },
        explosive_rounds: {
            id: 'explosive_rounds', name: 'Explosive Rounds', desc: 'On kill: 30% explode (50% AoE)',
            rarity: 'uncommon', effect: { type: 'on_kill', chance: 30, damagePercent: 50 },
            icon: '\u2738', iconBg: '#ff6622'
        },
        battle_momentum: {
            id: 'battle_momentum', name: 'Battle Momentum', desc: 'On kill: +1 energy',
            rarity: 'uncommon', effect: { type: 'on_kill', chance: 100, energyRestore: 1 },
            icon: '\u25BA', iconBg: '#ee4444'
        },
        desperate_strength: {
            id: 'desperate_strength', name: 'Desperate Strength', desc: '+20% dmg below 50% HP',
            rarity: 'uncommon', effect: { type: 'conditional', condition: 'belowHp50', stat: 'power', value: 20 },
            icon: '\u2660', iconBg: '#cc2222'
        },
        thorns_armor: {
            id: 'thorns_armor', name: 'Thorns Armor', desc: 'Reflect 15% melee damage',
            rarity: 'uncommon', effect: { type: 'passive', stat: 'thorns', value: 15 },
            icon: '\u2663', iconBg: '#44aa44'
        },
        chain_lightning: {
            id: 'chain_lightning', name: 'Chain Lightning', desc: 'On hit: 20% chain to 1 enemy',
            rarity: 'uncommon', effect: { type: 'on_hit', chance: 20, chain: 1, damagePercent: 30 },
            icon: '\u26A1', iconBg: '#cccc44'
        },

        // === RARE (Red) ===
        glass_cannon: {
            id: 'glass_cannon', name: 'Glass Cannon', desc: '+100% dmg, -50% max HP',
            rarity: 'rare', effect: { type: 'passive', stat: 'power', value: 100, penalty: { stat: 'maxHpPercent', value: -50 } },
            icon: '\u2756', iconBg: '#ff88cc'
        },
        chaos_embrace: {
            id: 'chaos_embrace', name: 'Chaos Embrace', desc: 'On hit: 15% random status',
            rarity: 'rare', effect: { type: 'on_hit', chance: 15, status: 'random' },
            icon: '\u2727', iconBg: '#aa44ff'
        },
        berserker_blood: {
            id: 'berserker_blood', name: "Berserker's Blood", desc: '+15% dmg per 10% missing HP',
            rarity: 'rare', effect: { type: 'conditional', condition: 'missingHp', stat: 'power', valuePer10: 15 },
            icon: '\u2665', iconBg: '#aa0022'
        },
        vampiric_edge: {
            id: 'vampiric_edge', name: 'Vampiric Edge', desc: 'On crit: heal 2% max HP',
            rarity: 'rare', effect: { type: 'on_crit', healPercent: 2 },
            icon: '\u2620', iconBg: '#cc2244'
        },
        blight_amulet: {
            id: 'blight_amulet', name: 'Blight Amulet', desc: '+100% DoT damage',
            rarity: 'rare', effect: { type: 'passive', stat: 'dotDamage', value: 100 },
            icon: '\u2601', iconBg: '#66aa44'
        },
        lone_wolf: {
        id: 'lone_wolf', name: 'Lone Wolf', desc: '+15% crit chance & +50% crit dmg vs isolated (no effect on bosses)',
            rarity: 'rare', effect: { type: 'passive', stat: 'critIsolated', value: 25 },
            icon: '\u263A', iconBg: '#8888aa'
        },

        // === BOSS (Gold) ===
        boss_tome: {
            id: 'boss_tome', name: 'Boss Tome', desc: '+50% basic attack potency (stacks)',
            rarity: 'boss', effect: { type: 'passive', stat: 'basicPotency', value: 50 },
            icon: '\u2666', iconBg: '#ffaa00'
        },
        boss_weapon: {
            id: 'boss_weapon', name: 'Boss Weapon', desc: '+10% flat damage',
            rarity: 'boss', effect: { type: 'passive', stat: 'power', value: 10 },
            icon: '\u2694', iconBg: '#ff4444'
        },
        boss_crown: {
            id: 'boss_crown', name: 'Boss Crown', desc: '+1 skill reroll per stage',
            rarity: 'boss', effect: { type: 'passive', stat: 'extraRerolls', value: 1 },
            icon: '\u265B', iconBg: '#ffdd00'
        }
    },

    SKILLS: {
        slash: {
            id: 'slash', name: 'Slash', desc: 'Basic melee attack',
            energyCost: 1, damage: 60, shape: 'single', range: 1,
            color: '#ffffff', isBasic: true, effects: []
        },
        arrow_shot: {
            id: 'arrow_shot', name: 'Arrow Shot', desc: 'Basic ranged attack',
            energyCost: 1, damage: 40, shape: 'single', range: 3,
            color: '#44cc44', isBasic: true, effects: []
        },
        holy_strike: {
            id: 'holy_strike', name: 'Holy Strike', desc: 'Basic melee attack',
            energyCost: 1, damage: 50, shape: 'single', range: 1,
            color: '#ffdd44', isBasic: true, effects: []
        },
        stab: {
            id: 'stab', name: 'Stab', desc: 'Basic melee attack',
            energyCost: 1, damage: 40, shape: 'single', range: 1,
            color: '#cc44ff', isBasic: true, effects: []
        },
        thrust: {
            id: 'thrust', name: 'Thrust', desc: 'Piercing line attack',
            energyCost: 2, damage: 80, shape: 'line', range: 3,
            color: '#aaddff', isBasic: false, effects: []
        },
        fireball: {
            id: 'fireball', name: 'Fireball', desc: 'Explosive 3x3 AoE',
            energyCost: 2, damage: 50, shape: 'aoe', range: 3,
            color: '#ff6622', isBasic: false, effects: []
        },
        whirlwind: {
            id: 'whirlwind', name: 'Whirlwind', desc: 'Spin attack, knockback enemies 1 tile',
            energyCost: 2, damage: 50, shape: 'ring', range: 1,
            color: '#ccddff', isBasic: false, effects: ['knockback1']
        },
        holy_smite: {
            id: 'holy_smite', name: 'Holy Smite', desc: 'Divine cross smite',
            energyCost: 3, damage: 100, shape: 'cross', range: 2,
            color: '#ffee44', isBasic: false, effects: []
        },
        ice_shard: {
            id: 'ice_shard', name: 'Ice Shard', desc: 'Freezing line, freezes enemies',
            energyCost: 4, damage: 40, shape: 'line', range: 4,
            color: '#88ddff', isBasic: false, effects: ['freeze']
        },
        backstab: {
            id: 'backstab', name: 'Shatter Strike', desc: 'Deals bonus damage against frozen enemies',
            energyCost: 2, damage: 50, shape: 'single', range: 1,
            color: '#ff4444', isBasic: false, effects: ['backstab']
        },
        shield_bash: {
            id: 'shield_bash', name: 'Shield Bash', desc: 'Push enemy 3 tiles back',
            energyCost: 2, damage: 40, shape: 'single', range: 1,
            color: '#888899', isBasic: false, effects: ['knockback3']
        },
        lightning: {
            id: 'lightning', name: 'Lightning', desc: 'Piercing bolt, chains to nearby',
            energyCost: 3, damage: 80, shape: 'line', range: 4,
            color: '#ffff44', isBasic: false, effects: ['chain']
        },
        poison_cloud: {
            id: 'poison_cloud', name: 'Poison Cloud', desc: 'Toxic cone, leaves poison ground',
            energyCost: 2, damage: 50, shape: 'cone', range: 2,
            color: '#44cc44', isBasic: false, effects: ['poison']
        },
        war_cry: {
            id: 'war_cry', name: 'War Cry', desc: '+50% power, -20% dmg taken for 1 turn',
            energyCost: 1, damage: 0, shape: 'ring', range: 1,
            color: '#ffaa00', isBasic: false, effects: ['empower', 'damage_reduction']
        },
        dash: {
            id: 'dash', name: 'Dash', desc: 'Move 3 tiles, damage enemies in path',
            energyCost: 1, damage: 30, shape: 'dash', range: 3,
            color: '#88ff88', isBasic: false, effects: ['dash']
        },
        guard: {
            id: 'guard', name: 'Guard', desc: 'Spend all energy, mitigate damage',
            energyCost: 0, damage: 0, shape: 'guard', range: 0,
            color: '#6688aa', isBasic: true, effects: ['guard']
        },
        blink_strike: {
            id: 'blink_strike', name: 'Blink Strike', desc: 'Teleport and 3x3 AoE',
            energyCost: 3, damage: 60, shape: 'blink', range: 3,
            color: '#cc44ff', isBasic: false, effects: ['blink_aoe']
        },
        rend: {
            id: 'rend', name: 'Rend', desc: 'Bleed: 15 dmg/turn for 3 turns',
            energyCost: 2, damage: 40, shape: 'single', range: 1,
            color: '#cc2222', isBasic: false, effects: ['bleed']
        },
        execute: {
            id: 'execute', name: 'Execute', desc: '+100% dmg vs enemies below 50% HP',
            energyCost: 2, damage: 50, shape: 'single', range: 1,
            color: '#ff4444', isBasic: false, effects: ['execute']
        },
        cleave: {
            id: 'cleave', name: 'Cleave', desc: 'Wide front arc attack',
            energyCost: 2, damage: 60, shape: 'cone', range: 2,
            color: '#ff8844', isBasic: false, effects: []
        },
        heal: {
            id: 'heal', name: 'Heal', desc: 'Restore 20% HP',
            energyCost: 5, damage: 0, shape: 'self', range: 0,
            color: '#44ff88', isBasic: false, effects: ['heal']
        },
        reave: {
            id: 'reave', name: 'Reave', desc: '+50% dmg if target is isolated',
            energyCost: 2, damage: 80, shape: 'single', range: 1,
            color: '#aa4444', isBasic: false, effects: ['reave']
        },
        fire_nova: {
            id: 'fire_nova', name: 'Fire Nova', desc: 'AoE around self, leaves burn tiles',
            energyCost: 2, damage: 40, shape: 'ring', range: 1,
            color: '#ff6622', isBasic: false, effects: ['burn']
        },
        frost_nova: {
            id: 'frost_nova', name: 'Frost Nova', desc: 'AoE around self, freezes enemies',
            energyCost: 3, damage: 30, shape: 'ring', range: 1,
            color: '#88ddff', isBasic: false, effects: ['freeze']
        },
        mark: {
            id: 'mark', name: 'Mark', desc: 'Enemy takes 100% more damage next turn',
            energyCost: 1, damage: 0, shape: 'single', range: 3,
            color: '#ff8800', isBasic: false, effects: ['mark']
        },
        lifesteal_aura: {
            id: 'lifesteal_aura', name: 'Lifesteal Aura', desc: 'Heal 20% of damage dealt for 3 turns',
            energyCost: 3, damage: 0, shape: 'self', range: 0,
            color: '#cc4444', isBasic: false, effects: ['lifesteal_aura']
        },
        berserk: {
            id: 'berserk', name: 'Berserk', desc: '+50% damage but +50% damage taken for 3 turns',
            energyCost: 1, damage: 0, shape: 'self', range: 0,
            color: '#ff4444', isBasic: false, effects: ['berserk']
        },
        rejuvenation: {
            id: 'rejuvenation', name: 'Rejuvenation', desc: 'Heal 5% HP for 3 turns',
            energyCost: 3, damage: 0, shape: 'self', range: 0,
            color: '#44ff88', isBasic: false, effects: ['rejuvenation']
        },
        piercing_arrow: {
            id: 'piercing_arrow', name: 'Piercing Arrow', desc: 'Long range piercing line',
            energyCost: 3, damage: 50, shape: 'line', range: 5,
            color: '#88ff44', isBasic: false, effects: []
        },
        ricochet: {
            id: 'ricochet', name: 'Ricochet', desc: 'Bounce shot hits 3 enemies',
            energyCost: 3, damage: 50, shape: 'single', range: 3,
            color: '#ffaa44', isBasic: false, effects: ['chain_2']
        },
        arrow_rain: {
            id: 'arrow_rain', name: 'Arrow Rain', desc: 'Long range AoE arrow volley',
            energyCost: 3, damage: 60, shape: 'aoe', range: 4,
            color: '#aadd44', isBasic: false, effects: []
        },
        snipe: {
            id: 'snipe', name: 'Snipe', desc: 'High damage long range shot',
            energyCost: 5, damage: 100, shape: 'single', range: 5,
            color: '#ff4488', isBasic: false, effects: []
        }
    },

    SKILL_POOL: ['thrust', 'fireball', 'whirlwind', 'holy_smite', 'ice_shard', 'backstab', 'shield_bash', 'lightning', 'poison_cloud', 'war_cry', 'dash', 'blink_strike', 'rend', 'execute', 'cleave', 'heal', 'reave', 'fire_nova', 'frost_nova', 'mark', 'lifesteal_aura', 'berserk', 'rejuvenation', 'piercing_arrow', 'ricochet', 'arrow_rain', 'snipe'],

    ENEMIES: {
        goblin: {
            id: 'goblin', name: 'Goblin', hp: 170, damage: 30, moveSpeed: 1,
            type: 'melee', color: '#44cc44', behavior: 'charge'
        },
        archer: {
            id: 'archer', name: 'Archer', hp: 130, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#ee8833', behavior: 'keep_distance'
        },
        necromancer: {
            id: 'necromancer', name: 'Necromancer', hp: 210, damage: 20, moveSpeed: 0,
            type: 'summoner', color: '#7722aa', behavior: 'stay_far'
        },
        skeleton: {
            id: 'skeleton', name: 'Skeleton', hp: 70, damage: 15, moveSpeed: 1,
            type: 'melee', color: '#ccccaa', behavior: 'charge', isSummon: true
        },
        wolf: {
            id: 'wolf', name: 'Wolf', hp: 110, damage: 12, moveSpeed: 2,
            type: 'melee', color: '#886644', behavior: 'charge'
        },
        druid: {
            id: 'druid', name: 'Druid', hp: 130, damage: 20, moveSpeed: 1,
            type: 'ranged', color: '#448844', behavior: 'keep_distance'
        },
        treant: {
            id: 'treant', name: 'Treant', hp: 300, damage: 40, moveSpeed: 0.5,
            type: 'melee', color: '#664422', behavior: 'charge'
        },
        toad: {
            id: 'toad', name: 'Toad', hp: 170, damage: 35, moveSpeed: 1,
            type: 'melee', color: '#558844', behavior: 'charge'
        },
        plaguebearer: {
            id: 'plaguebearer', name: 'Plague Bearer', hp: 175, damage: 15, moveSpeed: 1,
            type: 'ranged', color: '#88aa44', behavior: 'keep_distance'
        },
        mud_golem: {
            id: 'mud_golem', name: 'Mud Golem', hp: 350, damage: 40, moveSpeed: 0.5,
            type: 'melee', color: '#886644', behavior: 'charge'
        },
        scorpion: {
            id: 'scorpion', name: 'Scorpion', hp: 135, damage: 20, moveSpeed: 1,
            type: 'melee', color: '#cc8844', behavior: 'charge'
        },
        mummy: {
            id: 'mummy', name: 'Mummy', hp: 245, damage: 20, moveSpeed: 1,
            type: 'ranged', color: '#ccaa88', behavior: 'keep_distance'
        },
        sand_wraith: {
            id: 'sand_wraith', name: 'Sand Wraith', hp: 140, damage: 35, moveSpeed: 1,
            type: 'phaser', color: '#ddcc88', behavior: 'teleport'
        },
        frost_elemental: {
            id: 'frost_elemental', name: 'Frost Elemental', hp: 195, damage: 15, moveSpeed: 1,
            type: 'ranged', color: '#88bbee', behavior: 'keep_distance'
        },
        ice_wyrm: {
            id: 'ice_wyrm', name: 'Ice Wyrm', hp: 210, damage: 35, moveSpeed: 1,
            type: 'melee', color: '#aaddff', behavior: 'charge'
        },
        yeti: {
            id: 'yeti', name: 'Yeti', hp: 350, damage: 40, moveSpeed: 0.5,
            type: 'melee', color: '#ccddee', behavior: 'charge'
        },
        fire_elemental: {
            id: 'fire_elemental', name: 'Fire Elemental', hp: 175, damage: 25, moveSpeed: 1,
            type: 'ranged', color: '#ff6622', behavior: 'keep_distance'
        },
        magma_slime: {
            id: 'magma_slime', name: 'Magma Slime', hp: 55, damage: 25, moveSpeed: 1,
            type: 'melee', color: '#ff4400', behavior: 'charge'
        },
        phoenix: {
            id: 'phoenix', name: 'Phoenix', hp: 55, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#ffaa00', behavior: 'keep_distance'
        },
        wraith_enemy: {
            id: 'wraith_enemy', name: 'Wraith', hp: 155, damage: 40, moveSpeed: 1,
            type: 'phaser', color: '#664488', behavior: 'teleport'
        },
        void_walker: {
            id: 'void_walker', name: 'Void Walker', hp: 210, damage: 20, moveSpeed: 1,
            type: 'melee', color: '#443366', behavior: 'charge'
        },
        shade: {
            id: 'shade', name: 'Shade', hp: 130, damage: 20, moveSpeed: 1,
            type: 'ranged', color: '#555577', behavior: 'keep_distance'
        },
        angel: {
            id: 'angel', name: 'Angel', hp: 175, damage: 25, moveSpeed: 1,
            type: 'ranged', color: '#ffdd88', behavior: 'keep_distance'
        },
        chariot: {
            id: 'chariot', name: 'Chariot', hp: 70, damage: 20, moveSpeed: 2,
            type: 'melee', color: '#ffeeaa', behavior: 'charge'
        },
        seraph: {
            id: 'seraph', name: 'Seraph', hp: 210, damage: 25, moveSpeed: 0,
            type: 'summoner', color: '#ffffcc', behavior: 'stay_far'
        },
        tech_terry: {
            id: 'tech_terry', name: 'Tech Terry', hp: 960, damage: 25, moveSpeed: 1,
            type: 'summoner', color: '#aaaaaa', behavior: 'stay_far'
        },
        shooter_sally: {
            id: 'shooter_sally', name: 'Shooter Sally', hp: 960, damage: 35, moveSpeed: 1,
            type: 'ranged', color: '#ff4444', behavior: 'keep_distance'
        },
        breaker_barry: {
            id: 'breaker_barry', name: 'Breaker Barry', hp: 960, damage: 45, moveSpeed: 1,
            type: 'melee', color: '#ff8844', behavior: 'charge'
        },
        molotov_mary: {
            id: 'molotov_mary', name: 'Molotov Mary', hp: 960, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#ff6622', behavior: 'keep_distance'
        },
        mini_robot: {
            id: 'mini_robot', name: 'Mini Robot', hp: 50, damage: 15, moveSpeed: 1,
            type: 'melee', color: '#aaaaaa', behavior: 'charge', isSummon: true
        },
        ice_crystal: {
            id: 'ice_crystal', name: 'Ice Crystal', hp: 300, damage: 40, moveSpeed: 0,
            type: 'ranged', color: '#aaeeff', behavior: 'stationary'
        }
    },

    BOSS_DEFS: {
        overseer: {
            id: 'overseer', name: 'The Overseer', hp: 3500, damage: 55,
            color: '#ff8800', behavior: 'boss', size: 2, stationary: true,
            attacks: [
                { name: 'Spear Traps', shape: 'spear_traps', damage: 120, cooldown: 2, current: 0 },
                { name: 'Spear Thrust', shape: 'spear_thrust', damage: 100, cooldown: 2, current: 0 },
                { name: 'Spear Slam', shape: 'spear_slam', damage: 140, cooldown: 2, current: 0 }
            ],
            phases: [
                {
                    threshold: 66,
                    dialogue: 'You think you can defy me? Witness my true power!',
                    handler: function(boss) {
                        var dirs = [{x:0,y:0},{x:7,y:0},{x:0,y:7},{x:7,y:7}];
                        for (var i = 0; i < 4; i++) {
                            var d = dirs[i];
                            State.enemies.push({
                                x: d.x, y: d.y, hp: 200, maxHp: 200,
                                damage: 25, defId: 'necromancer',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#7722aa',
                                isSummon: true, moveSpeed: 1
                            });
                        }
                        State.addFloatingText(4, 4, 'NECROMANCERS SUMMONED!', '#ff8800');
                    }
                },
                {
                    threshold: 33,
                    dialogue: 'Spike Overload! You will be pierced!',
                    handler: function(boss) {
                        boss.spikeOverload = true;
                        State.addFloatingText(4, 4, 'SPIKE OVERLOAD!', '#ff4444');
                    }
                }
            ],
            deathDialogue: 'Impossible... the traps... fail...',
            startDialogue: 'Welcome to my domain. Every step will be your last.',
            startEffect: function(boss) {
                for (var x = 0; x < Data.GRID_SIZE; x++) {
                    for (var y = 0; y < Data.GRID_SIZE; y++) {
                        for (var i = State.obstacles.length - 1; i >= 0; i--) {
                            if (State.obstacles[i].x === x && State.obstacles[i].y === y) {
                                State.obstacles.splice(i, 1);
                            }
                        }
                        State.obstacles.push({
                            x: x, y: y, id: 'spike_trap', hp: -1,
                            destructible: false, blocksMove: false, color: '#888899'
                        });
                    }
                }
                State.addFloatingText(4, 4, 'ACTIVATE TRAPS!', '#ff8800');
            }
        },
        mud_colossus: {
            id: 'mud_colossus', name: 'Mud Colossus', hp: 3000, damage: 50,
            color: '#664422', behavior: 'boss', size: 2, mobile: true,
            attacks: [
                { name: 'Swamp Spit', shape: 'swamp_spit', damage: 0, cooldown: 2, current: 0 },
                { name: 'Lesser Quagmire', shape: 'lesser_quagmire', damage: 0, cooldown: 3, current: 0 }
            ],
            phases: [
                {
                    threshold: 75,
                    dialogue: 'The swamp rises to answer my call!',
                    handler: function(boss) {
                        var dirs = [{x:0,y:0},{x:7,y:0},{x:0,y:7},{x:7,y:7}];
                        for (var i = 0; i < 2; i++) {
                            var d = dirs[i];
                            State.enemies.push({
                                x: d.x, y: d.y, hp: 350, maxHp: 350,
                                damage: 30, defId: 'mud_golem',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#553322',
                                isSummon: true, moveSpeed: 1
                            });
                        }
                        State.addFloatingText(4, 4, 'MUD GOLEMS SUMMONED!', '#664422');
                    }
                },
                {
                    threshold: 50,
                    dialogue: 'The mud recedes... but something worse comes!',
                    handler: function(boss) {
                        for (var i = State.obstacles.length - 1; i >= 0; i--) {
                            if (State.obstacles[i].id === 'swamp_pool') {
                                State.obstacles.splice(i, 1);
                            }
                        }
                        var attempts = 0;
                        var ex, ey;
                        do {
                            ex = Math.floor(Math.random() * Data.GRID_SIZE);
                            ey = Math.floor(Math.random() * Data.GRID_SIZE);
                            attempts++;
                        } while (attempts < 100 && (Stages.isReserved(ex, ey) || AI.distance(ex, ey, State.player.x, State.player.y) < 2));
                        State.enemies.push({
                            x: ex, y: ey, hp: 400, maxHp: 400,
                            damage: 40, defId: 'mud_golem',
                            facing: 'down', frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null,
                            isBoss: false, isElite: true,
                            eliteTurnCount: 0, eliteTelegraphing: false,
                            color: '#553322', isSummon: true, moveSpeed: 1
                        });
                        State.addFloatingText(ex, ey, 'ELITE MUD GOLEM!', '#ff4444');
                    }
                },
                {
                    threshold: 20,
                    dialogue: 'The entire swamp converges on you!',
                    handler: function(boss) {
                        for (var i = State.obstacles.length - 1; i >= 0; i--) {
                            if (State.obstacles[i].id === 'swamp_pool') {
                                State.obstacles.splice(i, 1);
                            }
                        }
                        if (Math.random() < 0.5) {
                            boss.floodColumn = 0;
                            boss.floodDirection = 1;
                        } else {
                            boss.floodColumn = 7;
                            boss.floodDirection = -1;
                        }
                        State.addFloatingText(4, 4, 'SWAMP FLOOD!', '#335522');
                    }
                }
            ],
            deathDialogue: 'The mud... settles...',
            startDialogue: 'You dare enter my swamp? You will sink!'
        },
        greatwood_titan: {
            id: 'greatwood_titan', name: 'Greatwood Titan', hp: 4000, damage: 45,
            color: '#446622', behavior: 'boss', size: 2, stationary: true,
            attacks: [
                { name: 'Wooden Thorns', shape: 'wooden_thorns', damage: 110, cooldown: 2, current: 0 },
                { name: 'Branch Slam', shape: 'branch_slam', damage: 130, cooldown: 2, current: 0 },
                { name: 'Overgrow', shape: 'overgrow', damage: 90, cooldown: 3, current: 0 }
            ],
            phases: [
                {
                    threshold: 75,
                    dialogue: 'The woods answer my call! Fight my children!',
                    handler: function(boss) {
                        var dirs = [{x:0,y:0},{x:7,y:0},{x:0,y:7},{x:7,y:7}];
                        for (var i = 0; i < 2; i++) {
                            var d = dirs[i];
                            State.enemies.push({
                                x: d.x, y: d.y, hp: 250, maxHp: 250,
                                damage: 20, defId: 'treant',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#446622',
                                isSummon: true, moveSpeed: 0.5
                            });
                        }
                        boss.invulnerable = true;
                        State.addFloatingText(4, 4, 'TREANTS SUMMONED! KILL THEM!', '#446622');
                    }
                },
                {
                    threshold: 50,
                    dialogue: 'Feel the rivers of the forest!',
                    handler: function(boss) {
                        for (var i = 0; i < Data.GRID_SIZE; i++) {
                            var positions = [
                                {x: i, y: 0}, {x: i, y: 7},
                                {x: 0, y: i}, {x: 7, y: i}
                            ];
                            for (var j = 0; j < positions.length; j++) {
                                var p = positions[j];
                                var alreadyWater = false;
                                for (var w = 0; w < State.obstacles.length; w++) {
                                    if (State.obstacles[w].x === p.x && State.obstacles[w].y === p.y && State.obstacles[w].id === 'water') {
                                        alreadyWater = true;
                                        break;
                                    }
                                }
                                if (!alreadyWater) {
                                    State.obstacles.push({
                                        x: p.x, y: p.y, id: 'water', hp: -1,
                                        destructible: false, blocksMove: false,
                                        color: '#2266cc'
                                    });
                                }
                            }
                        }
                        State.addFloatingText(4, 4, 'WATERS RISE!', '#2266cc');
                    }
                },
                {
                    threshold: 25,
                    dialogue: 'This ends here, mortal!',
                    handler: function(boss) {
                        var px = State.player.x;
                        var py = State.player.y;
                        for (var dx = -1; dx <= 1; dx++) {
                            for (var dy = -1; dy <= 1; dy++) {
                                var tx = px + dx;
                                var ty = py + dy;
                                if (tx >= 0 && tx < Data.GRID_SIZE && ty >= 0 && ty < Data.GRID_SIZE) {
                                    for (var i = State.obstacles.length - 1; i >= 0; i--) {
                                        if (State.obstacles[i].x === tx && State.obstacles[i].y === ty && State.obstacles[i].id === 'water') {
                                            State.obstacles.splice(i, 1);
                                        }
                                    }
                                    if (!Stages.isReserved(tx, ty)) {
                                        State.obstacles.push({
                                            x: tx, y: ty, id: 'wall', hp: 100,
                                            destructible: true, blocksMove: true,
                                            blocksLOS: true, color: '#446622'
                                        });
                                    }
                                }
                            }
                        }
                        boss.trapTurns = 3;
                        boss.trapCenterX = px;
                        boss.trapCenterY = py;
                        State.addFloatingText(px, py, 'TRAPPED! BREAK FREE!', '#ff4444');
                    }
                }
            ],
            deathDialogue: 'The forest... mourns...',
            startDialogue: 'You stand before the Greatwood. The trees will consume you.'
        },
        bandit_gang: {
            id: 'bandit_gang', name: 'Bandit Gang', hp: 2400, damage: 35,
            color: '#ddaa44', behavior: 'boss', size: 1,
            attacks: [],
            phases: [],
            deathDialogue: 'You beat us all... not bad...',
            startDialogue: 'Four against one? Too easy for us!'
        },
        molten_chaos: {
            id: 'molten_chaos', name: 'Molten Chaos', hp: 3800, damage: 50,
            color: '#ff4400', behavior: 'boss', size: 2, stationary: true,
            attacks: [
                { name: 'Magma Collapse', shape: 'magma_collapse', damage: 100, cooldown: 2, current: 0 },
                { name: 'Magma Spit', shape: 'magma_spit', damage: 110, cooldown: 2, current: 0 },
                { name: 'Overheat', shape: 'overheat', damage: 120, cooldown: 3, current: 0 }
            ],
            phases: [
                {
                    threshold: 66,
                    dialogue: 'The magma calls for servants!',
                    handler: function(boss) {
                        var dirs = [{x:0,y:0},{x:7,y:0}];
                        for (var i = 0; i < 2; i++) {
                            var d = dirs[i];
                            State.enemies.push({
                                x: d.x, y: d.y, hp: 200, maxHp: 200,
                                damage: 25, defId: 'magma_slime',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#ff4400',
                                isSummon: true, moveSpeed: 1
                            });
                        }
                        State.addFloatingText(4, 4, 'MAGMA SLIMES SUMMONED!', '#ff4400');
                    }
                },
                {
                    threshold: 33,
                    dialogue: 'The heat intensifies! Two tiles now!',
                    handler: function(boss) {
                        boss.lavaTilesPerTurn = 2;
                        State.addFloatingText(4, 4, 'DOUBLE LAVA!', '#ff4400');
                    }
                }
            ],
            deathDialogue: 'The flames... cool...',
            startDialogue: 'Feel the heat of a thousand suns!'
        },
        frost_dwarf: {
            id: 'frost_dwarf', name: 'Frost Dwarf', hp: 3200, damage: 45,
            color: '#88bbdd', behavior: 'boss', size: 2, mobile: true,
            attacks: [
                { name: 'Frozen Axe', shape: 'frozen_axe', damage: 120, cooldown: 2, current: 0 },
                { name: 'Frozen Stomp', shape: 'frozen_stomp', damage: 140, cooldown: 2, current: 0 }
            ],
            phases: [
                {
                    threshold: 75,
                    dialogue: 'The ice obeys my command!',
                    handler: function(boss) {
                        for (var i = 0; i < 2; i++) {
                            var attempts = 0;
                            var cx, cy;
                            do {
                                cx = Math.floor(Math.random() * Data.GRID_SIZE);
                                cy = Math.floor(Math.random() * Data.GRID_SIZE);
                                attempts++;
                            } while (attempts < 100 && Stages.isReserved(cx, cy));
                            State.enemies.push({
                                x: cx, y: cy, hp: 300, maxHp: 300,
                                damage: 40, defId: 'ice_crystal',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#aaeeff',
                                isSummon: true, moveSpeed: 0,
                                isStationary: true
                            });
                        }
                        State.addFloatingText(4, 4, 'ICE CRYSTALS SUMMONED!', '#aaeeff');
                    }
                },
                {
                    threshold: 50,
                    dialogue: 'More crystals! The cold deepens!',
                    handler: function(boss) {
                        for (var i = 0; i < 3; i++) {
                            var attempts = 0;
                            var cx, cy;
                            do {
                                cx = Math.floor(Math.random() * Data.GRID_SIZE);
                                cy = Math.floor(Math.random() * Data.GRID_SIZE);
                                attempts++;
                            } while (attempts < 100 && Stages.isReserved(cx, cy));
                            State.enemies.push({
                                x: cx, y: cy, hp: 300, maxHp: 300,
                                damage: 40, defId: 'ice_crystal',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#aaeeff',
                                isSummon: true, moveSpeed: 0,
                                isStationary: true
                            });
                        }
                        State.addFloatingText(4, 4, 'MORE CRYSTALS!', '#aaeeff');
                    }
                },
                {
                    threshold: 25,
                    dialogue: 'The frozen depths consume all!',
                    handler: function(boss) {
                        for (var x = 0; x < Data.GRID_SIZE; x++) {
                            for (var y = 0; y < Data.GRID_SIZE; y++) {
                                for (var i = State.obstacles.length - 1; i >= 0; i--) {
                                    if (State.obstacles[i].x === x && State.obstacles[i].y === y) {
                                        State.obstacles.splice(i, 1);
                                    }
                                }
                                State.obstacles.push({
                                    x: x, y: y, id: 'chill_water', hp: -1,
                                    destructible: false, blocksMove: false,
                                    color: '#4488cc'
                                });
                            }
                        }
                        State.addFloatingText(4, 4, 'FROZEN TUNDRA!', '#88ddff');
                    }
                }
            ],
            deathDialogue: 'The cold... fades...',
            startDialogue: 'You dare challenge the Frost Dwarf? Freeze!'
        },
        first_clone: {
            id: 'first_clone', name: 'The First Clone', hp: 3600, damage: 45,
            color: '#6633aa', behavior: 'boss', size: 2, mobile: true,
            attacks: [
                { name: 'Summon Void', shape: 'summon_void', damage: 100, cooldown: 2, current: 0 },
                { name: 'North Pull', shape: 'north_pull', damage: 0, cooldown: 2, current: 0 },
                { name: 'South Pull', shape: 'south_pull', damage: 0, cooldown: 2, current: 0 },
                { name: 'West Pull', shape: 'west_pull', damage: 0, cooldown: 2, current: 0 },
                { name: 'East Pull', shape: 'east_pull', damage: 0, cooldown: 2, current: 0 }
            ],
            phases: [
                {
                    threshold: 75,
                    dialogue: 'The darkness answers my call!',
                    handler: function(boss) {
                        for (var i = 0; i < 2; i++) {
                            var attempts = 0;
                            var cx, cy;
                            do {
                                cx = Math.floor(Math.random() * Data.GRID_SIZE);
                                cy = Math.floor(Math.random() * Data.GRID_SIZE);
                                attempts++;
                            } while (attempts < 100 && Stages.isReserved(cx, cy));
                            State.enemies.push({
                                x: cx, y: cy, hp: 200, maxHp: 200,
                                damage: 25, defId: 'wraith_enemy',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#443366',
                                isSummon: true, moveSpeed: 1
                            });
                        }
                        for (var x = 0; x < Data.GRID_SIZE; x++) {
                            for (var y = 0; y < Data.GRID_SIZE; y++) {
                                if (x === 0 || x === 7 || y === 0 || y === 7) {
                                    var reserved = false;
                                    for (var r = 0; r < State.obstacles.length; r++) {
                                        if (State.obstacles[r].x === x && State.obstacles[r].y === y) {
                                            reserved = true;
                                            break;
                                        }
                                    }
                                    if (!reserved) {
                                        State.obstacles.push({
                                            x: x, y: y, id: 'void', hp: -1,
                                            destructible: false, blocksMove: false, color: '#6633aa'
                                        });
                                    }
                                }
                            }
                        }
                        State.addFloatingText(4, 4, 'WRAITHS SUMMONED! VOID SPREADS!', '#6633aa');
                    }
                },
                {
                    threshold: 50,
                    dialogue: 'I am legion. We are many.',
                    handler: function(boss) {
                        var cloneHp = Math.floor(boss.hp / 2);
                        boss.hp = cloneHp;
                        boss.size = 1;
                        var attempts = 0;
                        var cx, cy;
                        do {
                            cx = Math.floor(Math.random() * Data.GRID_SIZE);
                            cy = Math.floor(Math.random() * Data.GRID_SIZE);
                            attempts++;
                        } while (attempts < 100 && Stages.isReserved(cx, cy));
                        var clone = {
                            x: cx, y: cy, size: 1,
                            hp: cloneHp, maxHp: cloneHp,
                            damage: boss.damage,
                            defId: boss.defId, facing: 'down',
                            frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null,
                            isBoss: true, color: boss.color,
                            name: boss.name + ' Clone',
                            attacks: JSON.parse(JSON.stringify(boss.attacks)),
                            telegraph: null, isClone: true
                        };
                        State.enemies.push(clone);
                        State.addFloatingText(cx, cy, 'CLONE CREATED!', '#6633aa');
                    }
                },
                {
                    threshold: 25,
                    dialogue: 'I call upon the void once more!',
                    handler: function(boss) {
                        var attempts = 0;
                        var cx, cy;
                        do {
                            cx = Math.floor(Math.random() * Data.GRID_SIZE);
                            cy = Math.floor(Math.random() * Data.GRID_SIZE);
                            attempts++;
                        } while (attempts < 100 && Stages.isReserved(cx, cy));
                        State.enemies.push({
                            x: cx, y: cy, hp: 350, maxHp: 350,
                            damage: 35, defId: 'wraith_enemy',
                            facing: 'down', frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null,
                            isBoss: false, isElite: true,
                            eliteTurnCount: 0, eliteTelegraphing: false,
                            color: '#443366', isSummon: true, moveSpeed: 1
                        });
                        State.addFloatingText(cx, cy, 'ELITE WRAITH!', '#ff4444');
                    }
                }
            ],
            deathDialogue: 'We... are... one...',
            startDialogue: 'You face the original. But which is real?'
        },
        light_guardian: {
            id: 'light_guardian', name: 'Light Guardian', hp: 4200, damage: 50,
            color: '#ffddaa', behavior: 'boss', size: 2, mobile: true,
            attacks: [
                { name: 'Holy Smite', shape: 'holy_smite', damage: 130, cooldown: 2, current: 0 },
                { name: 'Holy Beam', shape: 'holy_beam', damage: 110, cooldown: 2, current: 0 },
                { name: 'Holy Thrust', shape: 'holy_thrust', damage: 120, cooldown: 2, current: 0 }
            ],
            phases: [
                {
                    threshold: 75,
                    dialogue: 'Angels, descend!',
                    handler: function(boss) {
                        for (var i = 0; i < 2; i++) {
                            var attempts = 0;
                            var cx, cy;
                            do {
                                cx = Math.floor(Math.random() * Data.GRID_SIZE);
                                cy = Math.floor(Math.random() * Data.GRID_SIZE);
                                attempts++;
                            } while (attempts < 100 && Stages.isReserved(cx, cy));
                            State.enemies.push({
                                x: cx, y: cy, hp: 250, maxHp: 250,
                                damage: 30, defId: 'angel',
                                facing: 'down', frozen: 0, freezeImmune: false,
                                freezeImmuneTurns: 0, poison: null,
                                isBoss: false, color: '#ffddaa',
                                isSummon: true, moveSpeed: 1
                            });
                        }
                        State.addFloatingText(4, 4, 'ANGELS SUMMONED!', '#ffddaa');
                    }
                },
                {
                    threshold: 50,
                    dialogue: 'Chariot, charge!',
                    handler: function(boss) {
                        var attempts = 0;
                        var cx, cy;
                        do {
                            cx = Math.floor(Math.random() * Data.GRID_SIZE);
                            cy = Math.floor(Math.random() * Data.GRID_SIZE);
                            attempts++;
                        } while (attempts < 100 && Stages.isReserved(cx, cy));
                        State.enemies.push({
                            x: cx, y: cy, hp: 400, maxHp: 400,
                            damage: 40, defId: 'chariot',
                            facing: 'down', frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null,
                            isBoss: false, isElite: true,
                            eliteTurnCount: 0, eliteTelegraphing: false,
                            color: '#ffcc44', isSummon: true, moveSpeed: 1
                        });
                        State.addFloatingText(cx, cy, 'ELITE CHARIOT!', '#ff4444');
                    }
                },
                {
                    threshold: 25,
                    dialogue: 'Atone for your sins!',
                    handler: function(boss) {
                        for (var x = 0; x < Data.GRID_SIZE; x++) {
                            for (var y = 0; y < Data.GRID_SIZE; y++) {
                                for (var i = State.obstacles.length - 1; i >= 0; i--) {
                                    if (State.obstacles[i].x === x && State.obstacles[i].y === y) {
                                        State.obstacles.splice(i, 1);
                                    }
                                }
                                State.obstacles.push({
                                    x: x, y: y, id: 'judgement_sigil', hp: -1,
                                    destructible: false, blocksMove: false,
                                    color: '#ffdd88'
                                });
                            }
                        }
                        var attempts = 0;
                        var cx, cy;
                        do {
                            cx = Math.floor(Math.random() * Data.GRID_SIZE);
                            cy = Math.floor(Math.random() * Data.GRID_SIZE);
                            attempts++;
                        } while (attempts < 100 && Stages.isReserved(cx, cy));
                        State.enemies.push({
                            x: cx, y: cy, hp: 350, maxHp: 350,
                            damage: 35, defId: 'seraph',
                            facing: 'down', frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null,
                            isBoss: false, color: '#ffffff',
                            isSummon: true, moveSpeed: 1
                        });
                        State.addFloatingText(4, 4, 'JUDGEMENT! SERAPH SUMMONED!', '#ffdd88');
                    }
                }
            ],
            deathDialogue: 'The light... dims...',
            startDialogue: 'I am the Guardian of Light. You shall not pass.'
        }
    },

    BIOMES: {
        dungeon: {
            id: 'dungeon', name: 'DUNGEON',
            bg: '#0f0a1a', tileBase: '#1a1525', tileBorder: '#2a2040', accent: '#ff8800',
            enemies: ['goblin', 'archer', 'necromancer'], bossId: 'overseer',
            hazards: ['wall', 'spike_trap'], wallColor: '#555566',
            hazardSpawn: 'line'
        },
        forest: {
            id: 'forest', name: 'FOREST',
            bg: '#0a1a0a', tileBase: '#1a2a1a', tileBorder: '#2a3a2a', accent: '#44aa44',
            enemies: ['wolf', 'druid', 'treant'], bossId: 'greatwood_titan',
            hazards: ['wall', 'water'], wallColor: '#446622',
            hazardSpawn: 'line'
        },
        swamp: {
            id: 'swamp', name: 'SWAMP',
            bg: '#0a0a1a', tileBase: '#1a1a2a', tileBorder: '#2a2a3a', accent: '#44aa88',
            enemies: ['toad', 'plaguebearer', 'mud_golem'], bossId: 'mud_colossus',
            hazards: ['wall', 'swamp_pool'], wallColor: '#334433',
            hazardCount: 12, wallCount: 4
        },
        desert: {
            id: 'desert', name: 'DESERT',
            bg: '#1a1500', tileBase: '#2a2510', tileBorder: '#3a3520', accent: '#ddaa44',
            enemies: ['scorpion', 'mummy', 'sand_wraith'], bossId: 'bandit_gang',
            hazards: ['wall', 'water'], wallColor: '#aa8844',
            hazardSpawn: 'oasis'
        },
        frozen: {
            id: 'frozen', name: 'FROZEN',
            bg: '#0a1a2a', tileBase: '#1a2a3a', tileBorder: '#2a3a4a', accent: '#88ddff',
            enemies: ['frost_elemental', 'ice_wyrm', 'yeti'], bossId: 'frost_dwarf',
            hazards: ['wall', 'chill_water'], wallColor: '#6688aa',
            hazardCount: 12, wallCount: 4
        },
        volcanic: {
            id: 'volcanic', name: 'VOLCANIC',
            bg: '#1a0a0a', tileBase: '#2a1a1a', tileBorder: '#3a2a2a', accent: '#ff4422',
            enemies: ['fire_elemental', 'magma_slime', 'phoenix'], bossId: 'molten_chaos',
            hazards: ['wall', 'lava'], wallColor: '#663322',
            hazardCount: 12, wallCount: 4
        },
        shadow_realm: {
            id: 'shadow_realm', name: 'SHADOW',
            bg: '#0a0a15', tileBase: '#1a1a25', tileBorder: '#2a2a35', accent: '#8844aa',
            enemies: ['wraith_enemy', 'void_walker', 'shade'], bossId: 'first_clone',
            hazards: ['wall', 'portal', 'void'], wallColor: '#332244',
            hazardCount: 13, wallCount: 5
        },
        celestial: {
            id: 'celestial', name: 'CELESTIAL',
            bg: '#1a1a0a', tileBase: '#2a2a1a', tileBorder: '#3a3a2a', accent: '#ffdd88',
            enemies: ['angel', 'chariot', 'seraph'], bossId: 'light_guardian',
            hazards: ['wall', 'judgement_sigil'], wallColor: '#aa9966',
            wallCount: 8, hazardCount: 10
        }
    },

    BIOME_ORDER: ['dungeon', 'forest', 'swamp', 'desert', 'frozen', 'volcanic', 'shadow_realm', 'celestial'],

    OBSTACLES: {
        stone: { id: 'stone', name: 'Stone Wall', desc: 'Impassable wall. Cannot be destroyed.', hp: -1, destructible: false, color: '#555566', blocksMove: true, blocksLOS: true },
        wall: { id: 'wall', name: 'Crumbling Wall', desc: 'Breakable wall. Can be attacked.', hp: 150, destructible: true, color: '#886644', blocksMove: true, blocksLOS: true },
        lava: { id: 'lava', name: 'Lava', desc: 'Deals damage when stepped on.', hp: -1, destructible: false, color: '#ff4400', blocksMove: false, baseDamage: 30 },
        water: { id: 'water', name: 'Water', desc: 'Costs 2 energy to move through.', hp: -1, destructible: false, color: '#2266cc', blocksMove: false, energyCost: 2 },
        portal: { id: 'portal', name: 'Portal', desc: 'Teleports you to a random location.', hp: -1, destructible: false, color: '#cc44ff', blocksMove: false, teleport: true },
        spike_trap: { id: 'spike_trap', name: 'Spike Trap', desc: 'Deals heavy damage if you stand on it for 2 consecutive turns.', hp: -1, destructible: false, color: '#888899', blocksMove: false, baseDamage: 100 },
        void: { id: 'void', name: 'Void', desc: 'Inflicts Cursed and Diseased for 2 turns when stepped on.', hp: -1, destructible: false, color: '#6633aa', blocksMove: false },
        chill_water: { id: 'chill_water', name: 'Frigid Water', desc: 'Costs 2 energy and applies Chilled.', hp: -1, destructible: false, color: '#4488cc', blocksMove: false, energyCost: 2, applyChilled: true },
        swamp_pool: { id: 'swamp_pool', name: 'Toxic Pool', desc: 'Costs 2 energy to move through and applies poison.', hp: -1, destructible: false, color: '#335522', blocksMove: false, energyCost: 2 },
        judgement_sigil: { id: 'judgement_sigil', name: 'Judgement Sigil', desc: 'Applies Judgement status. Next hit deals double damage.', hp: -1, destructible: false, color: '#ffdd88', blocksMove: false }
    },

    ENEMIES_PER_STAGE_BASE: 3,
    ENEMIES_PER_STAGE_MAX: 6,
    OBSTACLES_PER_STAGE_BASE: 3,
    OBSTACLES_PER_STAGE_MAX: 12,

    SCALING_HP_MULT: 0.30,
    SCALING_DMG_MULT: 0.25,

    BOSS_EVERY: 5,
        BOSS_STAT_SCALE: 0.40,

    COLORS: {
        bg: '#0f0a1a',
        tileBase: '#1a1525',
        tileBorder: '#2a2040',
        tileHover: 'rgba(255, 255, 255, 0.1)',
        tileAttack: 'rgba(255, 68, 68, 0.35)',
        playerBody: '#5599ff',
        playerHead: '#88ccff',
        playerEyes: '#ffffff',
        hpBarBg: '#1a0a0a',
        hpBarFg: '#ff3344',
        lava1: '#ff4400',
        lava2: '#ff8800',
        water1: '#2266cc',
        water2: '#4488ee',
        portalGlow: '#cc44ff',
        damageText: '#ff4444',
        healText: '#44ff44'
    },

    ELITE_SPECIALS: {
        goblin: {
            name: 'Steal', desc: 'Teleport near player and attack',
            shape: 'teleport_strike', damage: 25
        },
        archer: {
            name: 'Piercing Volley', desc: '8-range line AoE',
            shape: 'line_8', damage: 50
        },
        necromancer: {
            name: 'Mass Raise', desc: 'Summon 2 skeletons',
            shape: 'summon_skeletons', damage: 0
        },
        wolf: {
            name: 'Pack Howl', desc: 'Teleport behind player + attack',
            shape: 'teleport_strike', damage: 30
        },
        druid: {
            name: 'Entangling Roots', desc: '3x3 AoE around player, applies chilled',
            shape: 'aoe_3x3', damage: 30, effects: ['chilled']
        },
        treant: {
            name: 'Quake', desc: 'Cross AoE range 2 + spawns obstacle',
            shape: 'cross_2', damage: 60, summonObstacle: true
        },
        toad: {
            name: 'Tongue Lash', desc: 'Pull player 2 tiles + damage',
            shape: 'pull_2', damage: 30
        },
        plaguebearer: {
            name: 'Pandemic', desc: 'Apply disease for 3 turns',
            shape: 'apply_disease', damage: 0
        },
        mud_golem: {
            name: 'Quagmire', desc: '5x5 AoE around self, spawns swamp pools',
            shape: 'aoe_5x5_self', damage: 0, summonObstacle: 'swamp_pool'
        },
        scorpion: {
            name: 'Venom Strike', desc: 'Single target + poison',
            shape: 'single', damage: 30, effects: ['poison']
        },
        mummy: {
            name: 'Curse of Ages', desc: 'Apply curse + summon sand wraith',
            shape: 'apply_curse_summon', damage: 0
        },
        sand_wraith: {
            name: 'Sandstorm', desc: '3x3 AoE around player + chilled',
            shape: 'aoe_3x3', damage: 40, effects: ['chilled']
        },
        frost_elemental: {
            name: 'Flash Freeze', desc: 'Apply chilled to player',
            shape: 'apply_chilled', damage: 30
        },
        ice_wyrm: {
            name: 'Frost Breath', desc: 'Cone AoE range 3 + chilled',
            shape: 'cone_3', damage: 60, effects: ['chilled']
        },
        yeti: {
            name: 'Boulder Hurl', desc: '3x3 AoE at player position',
            shape: 'aoe_3x3_target', damage: 70
        },
        fire_elemental: {
            name: 'Inferno', desc: '3x3 AoE around player + lava tiles',
            shape: 'aoe_3x3_lava', damage: 20
        },
        magma_slime: {
            name: 'Magma Spit', desc: 'Ranged attack + summons magma slime near player',
            shape: 'summon_magma_slime', damage: 20
        },
        phoenix: {
            name: 'Dive Bomb', desc: 'Cross AoE at player + teleport',
            shape: 'cross_teleport', damage: 30
        },
        wraith_enemy: {
            name: 'Phase Strike', desc: 'Teleport behind + 60 dmg ignores guard',
            shape: 'phase_strike', damage: 35, ignoreGuard: true
        },
        void_walker: {
            name: 'Void Rift', desc: 'Spawn portal near player',
            shape: 'spawn_portal', damage: 0
        },
        shade: {
            name: 'Shadow Cloak', desc: 'Untargetable 1 turn, then attack',
            shape: 'cloak_strike', damage: 40
        },
        angel: {
            name: 'Holy Beam', desc: 'Single target 3-range',
            shape: 'single_3', damage: 80
        },
        chariot: {
            name: 'Smite', desc: 'Cross AoE range 2 + knockback',
            shape: 'cross_2', damage: 50, effects: ['knockback1']
        },
        seraph: {
            name: 'Divine Judgment', desc: 'Small hit + double damage next hit',
            shape: 'apply_judgment', damage: 20
        }
    },

    ELITE_HP_MULT: 2,
    ELITE_DMG_MULT: 1.3,
    ELITE_TELEGRAPH_MULT: 1.6,
    ELITE_SPECIAL_INTERVAL: 3,

    BIOME_FLAVOR: {
        dungeon: [
            { knight: 'Stone walls. Traps everywhere. Good — I was born in places like this.', ranger: 'Dark. Tight corridors. I hate close quarters.', paladin: 'The dark gnaws at the light. Stay close, stay faithful.', rogue: 'Smells like coin and ambush. My kind of place.' },
            { knight: 'Another dungeon. The walls remember every fool who walked in.', ranger: 'Every shadow could hide an arrow. Keep moving.', paladin: 'Even here, the light finds a way. So shall I.', rogue: 'Dungeons always have something worth stealing.' },
            { knight: 'I can feel the traps in the floor. My armor knows the sound.', ranger: 'No sky above. No wind. Just stone and waiting death.', paladin: 'This place reeks of forgotten prayers. I will remind them.', rogue: 'Goblins, traps, treasure. The usual equation.' }
        ],
        forest: [
            { knight: 'Trees. At least I can see what wants to kill me here.', ranger: 'Finally, somewhere I can breathe. The canopy knows my name.', paladin: 'The old forest watches. The old forest judges.', rogue: 'Wood and leaves. Someone left a fortune in lumber out here.' },
            { knight: 'Green everywhere. Hard to spot enemies in all this.', ranger: 'Every branch is a perch. Every root is a snare. I know them all.', paladin: "Nature's cathedral. Even the beasts pray here.", rogue: 'Forests are simple. Things hide, things die. I do both.' },
            { knight: 'The trees are old. Older than any fortress I have seen.', ranger: 'Wind through leaves. The forest is talking. I am listening.', paladin: 'Life thrives here. I will not let it wither.', rogue: 'Druids and treants. Nature\'s bodyguards. Annoying.' }
        ],
        swamp: [
            { knight: 'Mud and rot. My boots will never recover.', ranger: 'Everything here is poisonous. Stay sharp, stay dry.', paladin: 'The swamp tests the faithful. I will not sink.', rogue: 'Stinking muck. There\'s treasure under the water. There always is.' },
            { knight: 'The ground gives way. Fight standing or die sinking.', ranger: 'Poison in the water, poison in the air. Poison in the mud.', paladin: 'Even in filth, the light endures. I am the light.', rogue: 'Swamps hide the worst kind of people. And the best kind of loot.' },
            { knight: 'I have marched through worse than mud.', ranger: 'Watch your step. Every puddle is a grave.', paladin: 'The plaguebearer\'s stench. I will cleanse this rot.', rogue: 'Toads, plague, muck. At least the pay is good.' }
        ],
        desert: [
            { knight: 'Sand and sun. At least the enemies are visible.', ranger: 'Open ground. No cover. This is going to hurt.', paladin: 'The desert sun burns, but my faith burns hotter.', rogue: 'Heat, sand, bandits. The perfect crime scene.' },
            { knight: 'Heat haze. Hard to tell mirages from mummies.', ranger: 'No shade. No water. No mercy. Classic desert.', paladin: 'The sun is relentless. So am I.', rogue: 'Deserts are where fortunes are made. And lost. Mostly made.' },
            { knight: 'Bandits in the sand. I have broken harder men than them.', ranger: 'Scorpions, mummies, wraiths. The desert kills creative.', paladin: 'The light of the sun is nothing compared to the light within.', rogue: 'Sand in my boots. Gold in my pockets. Worth it.' }
        ],
        frozen: [
            { knight: 'Cold. My armor freezes. The enemy will too.', ranger: 'Ice and wind. Every step is a gamble.', paladin: 'The cold tries to extinguish me. It will fail.', rogue: 'Frozen solid. Perfect for hiding bodies.' },
            { knight: 'The ice is beautiful. I will not die admiring it.', ranger: 'Frost elementals. Ice wyrms. Everything here bites.', paladin: 'In the cold, the fire of the soul burns brightest.', rogue: 'Cold means slow. Slow means I win.' },
            { knight: 'I have faced worse cold. The battlefield is always colder.', ranger: 'Snow hides everything. Tracks, traps, teeth.', paladin: 'Even in winter, the divine light warms.', rogue: 'Frozen enemies are easier to rob. Just saying.' }
        ],
        volcanic: [
            { knight: 'Fire and stone. The earth itself fights here.', ranger: 'Lava, magma, fire. I am not built for this.', paladin: 'The flames of judgment. I carry my own.', rogue: 'Hot. Very hot. The kind of heat that melts gold.' },
            { knight: 'The ground burns. Keep moving or burn.', ranger: 'Magma slimes, phoenixes, fire elementals. Everything burns.', paladin: 'The forge of the divine. I am tempered here.', rogue: 'Fire elementals are worth a fortune in the right market.' },
            { knight: 'Volcanic rock. Harder than any wall I have broken.', ranger: 'Heat distortion. Everything looks like a target.', paladin: 'The volcano rages. My faith is the mountain.', rogue: 'Where there is fire, there is treasure. Where there is treasure, there is me.' }
        ],
        shadow_realm: [
            { knight: 'Darkness. I have fought in worse. The light is mine to carry.', ranger: 'Shadows. Portals. Nothing here is what it seems.', paladin: 'The void stares back. I stare harder.', rogue: 'Shadow realm. The name says it all. Spooky.' },
            { knight: 'Wraiths and void. My sword does not care about dimensions.', ranger: 'Portals everywhere. One step wrong and you are dead.', paladin: 'The shadow fears the light. I am the light.', rogue: 'Shadow creatures. Easier to rob when they are intangible.' },
            { knight: 'The shadows whisper. I do not listen.', ranger: 'Void walkers. Shades. Everything here wants your soul.', paladin: 'Even in the darkest realm, hope persists. I am hope.', rogue: 'Shadows are just places where the light has not been stolen yet.' }
        ],
        celestial: [
            { knight: 'Angels and chariots. At least the ceiling is nice.', ranger: 'Celestial beings. They hit hard and they hit holy.', paladin: 'The divine host. I walk among them now.', rogue: 'Angels. They guard the biggest treasure of all.' },
            { knight: 'Holy ground. My blade has never been sharper.', ranger: 'Judgement sigils. Seraphs. This is above my pay grade.', paladin: 'The celestial realm. My pilgrimage ends here.', rogue: 'Angels drop the best loot. Just do not tell them I said that.' },
            { knight: 'I stand before the divine. I do not kneel.', ranger: 'Chariots. Seraphs. The sky itself fights.', paladin: 'I have walked the path of faith. This is its end.', rogue: 'Holy treasures. Unholy intentions. Perfect.' }
        ]
    }
};
