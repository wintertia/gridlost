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
