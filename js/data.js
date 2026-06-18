var Data = {
    GRID_SIZE: 8,
    PLAYER_BASE_HP: 1000,
    PLAYER_BASE_ENERGY: 6,
    PLAYER_BASE_POWER: 0,
    PLAYER_BASE_VITALITY: 0,
    PLAYER_BASE_AGILITY: 0,

    STAT_UPGRADES: {
        vitality: { name: 'Vitality', desc: 'Heal 30% HP', healPercent: 30 },
        power: { name: 'Power', desc: '+10% damage', powerBonusPercent: 10 },
        crit: { name: 'Precision', desc: 'Crit chance +8% (log)', critBonus: 8 }
    },

    ITEM_RARITY: {
        common: { name: 'Common', color: '#ffffff', weight: 60 },
        uncommon: { name: 'Uncommon', color: '#44ff44', weight: 30 },
        rare: { name: 'Rare', color: '#ff4444', weight: 10 }
    },

    ITEMS: {
        // === COMMON (White) ===
        tough_shell: {
            id: 'tough_shell', name: 'Tough Shell', desc: '+50 max HP',
            rarity: 'common', effect: { type: 'passive', stat: 'maxHp', value: 50 },
            icon: '\u25C6', iconBg: '#4488cc'
        },
        power_stone: {
            id: 'power_stone', name: 'Power Stone', desc: '+8% damage',
            rarity: 'common', effect: { type: 'passive', stat: 'power', value: 8 },
            icon: '\u25B2', iconBg: '#ff8844'
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
        blood_focus: {
            id: 'blood_focus', name: 'Blood Focus', desc: '+1 energy on kill',
            rarity: 'common', effect: { type: 'on_kill', energyRestore: 1 },
            icon: '\u26A1', iconBg: '#ffcc00'
        },

        // === UNCOMMON (Green) ===
        critical_lens: {
            id: 'critical_lens', name: 'Critical Lens', desc: '+20% crit damage',
            rarity: 'uncommon', effect: { type: 'passive', stat: 'critDamage', value: 20 },
            icon: '\u25CF', iconBg: '#aa44dd'
        },
        guardian_angel: {
            id: 'guardian_angel', name: 'Guardian Angel', desc: '+150 shield, regen 10%/turn',
            rarity: 'uncommon', effect: { type: 'passive', stat: 'shield', value: 150, shieldRegenPercent: 10 },
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
            id: 'chaos_embrace', name: 'Chaos Embrace', desc: 'On hit: random status',
            rarity: 'rare', effect: { type: 'on_hit', chance: 25, status: 'random' },
            icon: '\u2727', iconBg: '#aa44ff'
        },
        berserker_blood: {
            id: 'berserker_blood', name: "Berserker's Blood", desc: '+15% dmg per 10% missing HP',
            rarity: 'rare', effect: { type: 'conditional', condition: 'missingHp', stat: 'power', valuePer10: 15 },
            icon: '\u2665', iconBg: '#aa0022'
        },
        shield_generator: {
            id: 'shield_generator', name: 'Shield Generator', desc: '+300 shield, regen 15%/turn',
            rarity: 'rare', effect: { type: 'passive', stat: 'shield', value: 300, shieldRegenPercent: 15 },
            icon: '\u25CE', iconBg: '#4488ff'
        }
    },

    ITEM_SETS: {
        elemental_mastery: {
            name: 'Elemental Mastery',
            requires: ['burning_touch', 'frozen_core', 'chain_lightning'],
            desc: 'All on-hit effects chance doubled',
            bonus: { type: 'double_onhit_chance' }
        },
        juggernaut_set: {
            name: 'Juggernaut',
            requires: ['tough_shell', 'iron_skin', 'thorns_armor'],
            desc: '+50% max HP, reflect 30% damage',
            bonus: { type: 'juggernaut_bonus' }
        },
        glass_cannon_synergy: {
            name: 'Glass Cannon+',
            requires: ['glass_cannon', 'critical_lens'],
            desc: 'Crits deal 3x instead of 2x',
            bonus: { type: 'triple_crit' }
        }
    },

    ITEM_SKILL_INTERACTIONS: {
        fireball_burning: {
            skill: 'fireball', item: 'burning_touch',
            desc: 'Fireball AoE becomes 5x5',
            bonus: { type: 'aoe_expand', range: 2 }
        },
        ice_shard_shatter: {
            skill: 'ice_shard', item: 'frozen_core',
            desc: 'Frozen enemies take 2x damage',
            bonus: { type: 'frozen_damage', multiplier: 2 }
        },
        shield_bash_stun: {
            skill: 'shield_bash', item: 'iron_skin',
            desc: 'Shield bash knocks back + stuns 1 turn',
            bonus: { type: 'add_stun', duration: 1 }
        },
        dash_heal: {
            skill: 'dash', item: 'second_wind',
            desc: 'Dash heals 5% HP on use',
            bonus: { type: 'dash_heal', healPercent: 5 }
        },
        war_cry_empower: {
            skill: 'war_cry', item: 'berserker_blood',
            desc: 'War Cry grants +100% damage',
            bonus: { type: 'empower_boost', value: 100 }
        },
        poison_burn: {
            skill: 'poison_cloud', item: 'burning_touch',
            desc: 'Poison tiles deal double DoT',
            bonus: { type: 'dot_double' }
        }
    },

    SKILLS: {
        slash: {
            id: 'slash', name: 'Slash', desc: 'Basic melee attack',
            energyCost: 1, damage: 60, shape: 'single', range: 1,
            color: '#ffffff', isBasic: true, effects: []
        },
        thrust: {
            id: 'thrust', name: 'Thrust', desc: 'Piercing line attack',
            energyCost: 2, damage: 80, shape: 'line', range: 3,
            color: '#aaddff', isBasic: false, effects: []
        },
        fireball: {
            id: 'fireball', name: 'Fireball', desc: 'Explosive 3x3 AoE, leaves burning ground',
            energyCost: 2, damage: 60, shape: 'aoe', range: 3,
            color: '#ff6622', isBasic: false, effects: ['burn']
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
            energyCost: 2, damage: 40, shape: 'line', range: 4,
            color: '#88ddff', isBasic: false, effects: ['freeze']
        },
        backstab: {
            id: 'backstab', name: 'Shatter Strike', desc: '2x damage against frozen enemies',
            energyCost: 2, damage: 120, shape: 'single', range: 1,
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
            id: 'poison_cloud', name: 'Poison Cloud', desc: 'Toxic cone, DoT',
            energyCost: 2, damage: 20, shape: 'cone', range: 2,
            color: '#44cc44', isBasic: false, effects: ['poison']
        },
        war_cry: {
            id: 'war_cry', name: 'War Cry', desc: '+50% power to next attack',
            energyCost: 1, damage: 0, shape: 'ring', range: 1,
            color: '#ffaa00', isBasic: false, effects: ['empower']
        },
        dash: {
            id: 'dash', name: 'Dash', desc: 'Move 3 tiles, pass through enemies',
            energyCost: 1, damage: 0, shape: 'dash', range: 3,
            color: '#88ff88', isBasic: false, effects: ['dash']
        }
    },

    SKILL_POOL: ['thrust', 'fireball', 'whirlwind', 'holy_smite', 'ice_shard', 'backstab', 'shield_bash', 'lightning', 'poison_cloud', 'war_cry', 'dash'],

    SYNERGIES: {
        firestorm: {
            name: 'Firestorm', requires: ['fireball', 'thrust'],
            desc: 'Fireball AoE becomes 5x5'
        },
        shatter: {
            name: 'Shatter', requires: ['ice_shard', 'lightning'],
            desc: 'Frozen enemies take 2x damage'
        },
        juggernaut: {
            name: 'Juggernaut', requires: ['shield_bash', 'thrust'],
            desc: 'Push then pierce through enemies'
        },
        assassin: {
            name: 'Assassin', requires: ['backstab', 'dash'],
            desc: 'Dash freezes nearby enemies, Shatter Strike costs 0'
        },
        empowered: {
            name: 'Empowered', requires: ['war_cry'],
            desc: '+50% damage on next attack'
        },
        combust: {
            name: 'Combust', requires: ['poison_cloud', 'fireball'],
            desc: 'Burning poison tiles deal double DoT'
        }
    },

    ENEMIES: {
        goblin: {
            id: 'goblin', name: 'Goblin', hp: 240, damage: 30, moveSpeed: 1,
            type: 'melee', color: '#44cc44', behavior: 'charge'
        },
        archer: {
            id: 'archer', name: 'Archer', hp: 180, damage: 40, moveSpeed: 1,
            type: 'ranged', color: '#ee8833', behavior: 'keep_distance'
        },
        slime: {
            id: 'slime', name: 'Slime', hp: 450, damage: 20, moveSpeed: 0.5,
            type: 'melee', color: '#aa44dd', behavior: 'charge'
        },
        necromancer: {
            id: 'necromancer', name: 'Necromancer', hp: 300, damage: 20, moveSpeed: 0,
            type: 'summoner', color: '#7722aa', behavior: 'stay_far'
        },
        shadow: {
            id: 'shadow', name: 'Shadow', hp: 200, damage: 50, moveSpeed: 1,
            type: 'phaser', color: '#555566', behavior: 'teleport'
        },
        skeleton: {
            id: 'skeleton', name: 'Skeleton', hp: 100, damage: 15, moveSpeed: 1,
            type: 'melee', color: '#ccccaa', behavior: 'charge', isSummon: true
        }
    },

    BOSS_DEFS: {
        colossus: {
            id: 'colossus', name: 'Stone Colossus', hp: 1600, damage: 60,
            color: '#778899', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Ground Slam', shape: 'cross', range: 1, damage: 120, cooldown: 3, current: 0 },
                { name: 'Boulder Throw', shape: 'line', range: 4, damage: 80, cooldown: 2, current: 0 },
                { name: 'Summon Rubble', shape: 'summon_rubble', damage: 0, cooldown: 4, current: 0 }
            ]
        },
        wraith: {
            id: 'wraith', name: 'Shadow Wraith', hp: 1300, damage: 60,
            color: '#443366', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Shadow Step', shape: 'shadow_step', damage: 100, cooldown: 3, current: 0 },
                { name: 'Life Drain', shape: 'ring', range: 1, damage: 60, heal: 40, cooldown: 2, current: 0 },
                { name: 'Clone', shape: 'clone', damage: 0, cooldown: 5, current: 0 }
            ]
        },
        dragon: {
            id: 'dragon', name: 'Storm Dragon', hp: 2000, damage: 80,
            color: '#2244aa', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Lightning Breath', shape: 'cone', range: 3, damage: 100, cooldown: 2, current: 0 },
                { name: 'Wing Gust', shape: 'push_player', damage: 0, cooldown: 3, current: 0 },
                { name: 'Tail Sweep', shape: 'ring', range: 1, damage: 80, cooldown: 2, current: 0 },
                { name: 'Fly Up', shape: 'fly_up', damage: 150, cooldown: 5, current: 0 }
            ]
        }
    },

    BOSS_ORDER: ['colossus', 'wraith', 'dragon'],

    OBSTACLES: {
        stone: { id: 'stone', name: 'Stone Wall', desc: 'Impassable wall. Cannot be destroyed.', hp: -1, destructible: false, color: '#555566', blocksMove: true, blocksLOS: true },
        wall: { id: 'wall', name: 'Crumbling Wall', desc: 'Breakable wall. Can be attacked.', hp: 150, destructible: true, color: '#886644', blocksMove: true, blocksLOS: true },
        lava: { id: 'lava', name: 'Lava', desc: 'Deals 20 damage when stepped on.', hp: -1, destructible: false, color: '#ff4400', blocksMove: false, damage: 20 },
        water: { id: 'water', name: 'Water', desc: 'Costs 2 energy to move through.', hp: -1, destructible: false, color: '#2266cc', blocksMove: false, energyCost: 2 },
        portal: { id: 'portal', name: 'Portal', desc: 'Teleports you to a random location.', hp: -1, destructible: false, color: '#cc44ff', blocksMove: false, teleport: true }
    },

    ENEMIES_PER_STAGE_BASE: 3,
    ENEMIES_PER_STAGE_MAX: 6,
    OBSTACLES_PER_STAGE_BASE: 2,
    OBSTACLES_PER_STAGE_MAX: 5,

    SCALING_HP_MULT: 0.15,
    SCALING_DMG_MULT: 0.10,

    BOSS_EVERY: 5,
    BOSS_STAT_SCALE: 0.20,

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
    }
};
