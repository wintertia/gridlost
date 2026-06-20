var Data = {
    GRID_SIZE: 8,
    PLAYER_BASE_HP: 1000,
    PLAYER_BASE_ENERGY: 6,
    PLAYER_BASE_POWER: 0,
    PLAYER_BASE_VITALITY: 0,
    PLAYER_BASE_AGILITY: 0,

    CLASSES: {
        knight: {
            id: 'knight', name: 'KNIGHT', desc: 'Frontline melee warrior',
            passiveName: 'Melee Expert',
            passive: 'Deals bonus damage to nearby enemies',
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
            passive: 'Deals bonus damage to distant enemies',
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
            hp: 700, energy: 6,
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
            id: 'guardian_angel', name: 'Guardian Angel', desc: '+75 shield, regen 5%/turn',
            rarity: 'uncommon', effect: { type: 'passive', stat: 'shield', value: 75, shieldRegenPercent: 5 },
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
            id: 'shield_generator', name: 'Shield Generator', desc: '+125 shield, regen 7%/turn',
            rarity: 'rare', effect: { type: 'passive', stat: 'shield', value: 125, shieldRegenPercent: 7 },
            icon: '\u25CE', iconBg: '#4488ff'
        },
        vampiric_edge: {
            id: 'vampiric_edge', name: 'Vampiric Edge', desc: 'On crit: heal 1% max HP',
            rarity: 'rare', effect: { type: 'on_crit', healPercent: 1 },
            icon: '\u2620', iconBg: '#cc2244'
        },
        blight_amulet: {
            id: 'blight_amulet', name: 'Blight Amulet', desc: '+30% crit dmg vs enemies on DoT',
            rarity: 'rare', effect: { type: 'passive', stat: 'critDamageDot', value: 30 },
            icon: '\u2601', iconBg: '#66aa44'
        },
        lone_wolf: {
            id: 'lone_wolf', name: 'Lone Wolf', desc: '+10% crit chance & dmg vs isolated',
            rarity: 'rare', effect: { type: 'passive', stat: 'critIsolated', value: 10 },
            icon: '\u263A', iconBg: '#8888aa'
        },

        // === BOSS (Gold) ===
        boss_heart: {
            id: 'boss_heart', name: 'Boss Heart', desc: '+25% max HP (stacks)',
            rarity: 'boss', effect: { type: 'passive', stat: 'maxHpPercent', value: 25 },
            icon: '\u2665', iconBg: '#ffaa00'
        },
        boss_weapon: {
            id: 'boss_weapon', name: 'Boss Weapon', desc: '+20% flat damage',
            rarity: 'boss', effect: { type: 'passive', stat: 'power', value: 20 },
            icon: '\u2694', iconBg: '#ff4444'
        },
        boss_crown: {
            id: 'boss_crown', name: 'Boss Crown', desc: '+1 skill reroll per stage',
            rarity: 'boss', effect: { type: 'passive', stat: 'extraRerolls', value: 1 },
            icon: '\u265B', iconBg: '#ffdd00'
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
            energyCost: 4, damage: 60, shape: 'aoe', range: 3,
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
            id: 'blink_strike', name: 'Blink Strike', desc: 'Teleport to target, attack',
            energyCost: 3, damage: 70, shape: 'blink', range: 3,
            color: '#cc44ff', isBasic: false, effects: []
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
            energyCost: 2, damage: 60, shape: 'cone', range: 1,
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
            energyCost: 3, damage: 60, shape: 'line', range: 5,
            color: '#88ff44', isBasic: false, effects: []
        },
        ricochet: {
            id: 'ricochet', name: 'Ricochet', desc: 'Bounce shot hits 3 enemies',
            energyCost: 3, damage: 50, shape: 'single', range: 3,
            color: '#ffaa44', isBasic: false, effects: ['chain_2']
        },
        arrow_rain: {
            id: 'arrow_rain', name: 'Arrow Rain', desc: 'Ranged AoE arrow volley',
            energyCost: 3, damage: 40, shape: 'aoe', range: 3,
            color: '#aadd44', isBasic: false, effects: []
        },
        snipe: {
            id: 'snipe', name: 'Snipe', desc: 'High damage long range shot',
            energyCost: 4, damage: 100, shape: 'single', range: 5,
            color: '#ff4488', isBasic: false, effects: []
        }
    },

    SKILL_POOL: ['thrust', 'fireball', 'whirlwind', 'holy_smite', 'ice_shard', 'backstab', 'shield_bash', 'lightning', 'poison_cloud', 'war_cry', 'dash', 'blink_strike', 'rend', 'execute', 'cleave', 'heal', 'reave', 'fire_nova', 'frost_nova', 'mark', 'lifesteal_aura', 'berserk', 'rejuvenation', 'piercing_arrow', 'ricochet', 'arrow_rain', 'snipe'],

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
            desc: 'Poison tiles deal double damage'
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
        },
        wolf: {
            id: 'wolf', name: 'Wolf', hp: 200, damage: 25, moveSpeed: 2,
            type: 'melee', color: '#886644', behavior: 'charge'
        },
        druid: {
            id: 'druid', name: 'Druid', hp: 180, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#448844', behavior: 'keep_distance'
        },
        treant: {
            id: 'treant', name: 'Treant', hp: 600, damage: 25, moveSpeed: 0.5,
            type: 'melee', color: '#664422', behavior: 'charge'
        },
        toad: {
            id: 'toad', name: 'Toad', hp: 300, damage: 35, moveSpeed: 1,
            type: 'melee', color: '#558844', behavior: 'charge'
        },
        plaguebearer: {
            id: 'plaguebearer', name: 'Plague Bearer', hp: 250, damage: 25, moveSpeed: 1,
            type: 'ranged', color: '#88aa44', behavior: 'keep_distance'
        },
        mud_golem: {
            id: 'mud_golem', name: 'Mud Golem', hp: 700, damage: 20, moveSpeed: 0.5,
            type: 'melee', color: '#886644', behavior: 'charge'
        },
        scorpion: {
            id: 'scorpion', name: 'Scorpion', hp: 220, damage: 40, moveSpeed: 1,
            type: 'melee', color: '#cc8844', behavior: 'charge'
        },
        mummy: {
            id: 'mummy', name: 'Mummy', hp: 350, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#ccaa88', behavior: 'keep_distance'
        },
        sand_wraith: {
            id: 'sand_wraith', name: 'Sand Wraith', hp: 200, damage: 45, moveSpeed: 1,
            type: 'phaser', color: '#ddcc88', behavior: 'teleport'
        },
        frost_elemental: {
            id: 'frost_elemental', name: 'Frost Elemental', hp: 280, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#88bbee', behavior: 'keep_distance'
        },
        ice_wyrm: {
            id: 'ice_wyrm', name: 'Ice Wyrm', hp: 400, damage: 35, moveSpeed: 1,
            type: 'melee', color: '#aaddff', behavior: 'charge'
        },
        yeti: {
            id: 'yeti', name: 'Yeti', hp: 500, damage: 40, moveSpeed: 1,
            type: 'melee', color: '#ccddee', behavior: 'charge'
        },
        fire_elemental: {
            id: 'fire_elemental', name: 'Fire Elemental', hp: 250, damage: 35, moveSpeed: 1,
            type: 'ranged', color: '#ff6622', behavior: 'keep_distance'
        },
        magma_slime: {
            id: 'magma_slime', name: 'Magma Slime', hp: 80, damage: 25, moveSpeed: 1,
            type: 'melee', color: '#ff4400', behavior: 'charge'
        },
        phoenix: {
            id: 'phoenix', name: 'Phoenix', hp: 80, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#ffaa00', behavior: 'keep_distance'
        },
        wraith_enemy: {
            id: 'wraith_enemy', name: 'Wraith', hp: 220, damage: 40, moveSpeed: 1,
            type: 'phaser', color: '#664488', behavior: 'teleport'
        },
        void_walker: {
            id: 'void_walker', name: 'Void Walker', hp: 300, damage: 35, moveSpeed: 1,
            type: 'melee', color: '#443366', behavior: 'charge'
        },
        shade: {
            id: 'shade', name: 'Shade', hp: 180, damage: 30, moveSpeed: 1,
            type: 'ranged', color: '#555577', behavior: 'keep_distance'
        },
        angel: {
            id: 'angel', name: 'Angel', hp: 250, damage: 35, moveSpeed: 1,
            type: 'ranged', color: '#ffdd88', behavior: 'keep_distance'
        },
        cherub: {
            id: 'cherub', name: 'Cherub', hp: 200, damage: 30, moveSpeed: 2,
            type: 'melee', color: '#ffeeaa', behavior: 'charge'
        },
        seraph: {
            id: 'seraph', name: 'Seraph', hp: 300, damage: 25, moveSpeed: 0,
            type: 'summoner', color: '#ffffcc', behavior: 'stay_far'
        }
    },

    BOSS_DEFS: {
        colossus: {
            id: 'colossus', name: 'Stone Colossus', hp: 1600, damage: 60,
            color: '#778899', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Ground Slam', shape: 'cross', range: 1, damage: 160, cooldown: 3, current: 0 },
                { name: 'Boulder Throw', shape: 'line', range: 4, damage: 110, cooldown: 2, current: 0 },
                { name: 'Summon Rubble', shape: 'summon_rubble', damage: 0, cooldown: 4, current: 0 }
            ]
        },
        wraith: {
            id: 'wraith', name: 'Shadow Wraith', hp: 1300, damage: 60,
            color: '#443366', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Shadow Step', shape: 'shadow_step', damage: 140, cooldown: 3, current: 0 },
                { name: 'Life Drain', shape: 'ring', range: 1, damage: 80, heal: 40, cooldown: 2, current: 0 },
                { name: 'Clone', shape: 'clone', damage: 0, cooldown: 5, current: 0 }
            ]
        },
        dragon: {
            id: 'dragon', name: 'Storm Dragon', hp: 2000, damage: 80,
            color: '#2244aa', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Lightning Breath', shape: 'cone', range: 3, damage: 130, cooldown: 2, current: 0 },
                { name: 'Wing Gust', shape: 'push_player', damage: 0, cooldown: 3, current: 0 },
                { name: 'Tail Sweep', shape: 'ring', range: 1, damage: 110, cooldown: 2, current: 0 },
                { name: 'Fly Up', shape: 'fly_up', damage: 200, cooldown: 5, current: 0 }
            ]
        },
        ancient_tree: {
            id: 'ancient_tree', name: 'Ancient Tree', hp: 1800, damage: 50,
            color: '#446622', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Root Grasp', shape: 'root', damage: 0, cooldown: 3, current: 0 },
                { name: 'Summon Saplings', shape: 'summon_sapling', damage: 0, cooldown: 4, current: 0 },
                { name: 'Leaf Storm', shape: 'aoe', range: 2, damage: 100, cooldown: 2, current: 0 }
            ]
        },
        hydra: {
            id: 'hydra', name: 'Hydra', hp: 2000, damage: 45,
            color: '#446644', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Multi-Head', shape: 'multi_direction', damage: 110, cooldown: 2, current: 0 },
                { name: 'Regen', shape: 'self_heal', damage: 0, cooldown: 4, current: 0 },
                { name: 'Poison Spit', shape: 'cone', range: 3, damage: 90, cooldown: 2, current: 0 }
            ]
        },
        sandworm: {
            id: 'sandworm', name: 'Sandworm', hp: 2200, damage: 55,
            color: '#ccaa44', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Burrow', shape: 'burrow', damage: 0, cooldown: 4, current: 0 },
                { name: 'Tail Whip', shape: 'ring', range: 1, damage: 120, cooldown: 2, current: 0 },
                { name: 'Swallow', shape: 'execute_line', damage: 160, cooldown: 5, current: 0 }
            ]
        },
        frost_giant: {
            id: 'frost_giant', name: 'Frost Giant', hp: 2400, damage: 50,
            color: '#88bbdd', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Ice Boulder', shape: 'line', range: 4, damage: 110, cooldown: 2, current: 0 },
                { name: 'Ground Pound', shape: 'cross', range: 1, damage: 140, cooldown: 3, current: 0 },
                { name: 'Blizzard', shape: 'aoe', range: 3, damage: 90, cooldown: 3, current: 0 }
            ]
        },
        fire_dragon: {
            id: 'fire_dragon', name: 'Fire Dragon', hp: 2600, damage: 60,
            color: '#ff4400', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Fire Breath', shape: 'cone', range: 3, damage: 140, cooldown: 2, current: 0 },
                { name: 'Wing Buffet', shape: 'push_player', damage: 0, cooldown: 3, current: 0 },
                { name: 'Eruption', shape: 'aoe', range: 2, damage: 120, cooldown: 3, current: 0 }
            ]
        },
        shadow_lord: {
            id: 'shadow_lord', name: 'Shadow Lord', hp: 2000, damage: 50,
            color: '#6633aa', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Shadow Clone', shape: 'clone', damage: 0, cooldown: 5, current: 0 },
                { name: 'Void Bolt', shape: 'line', range: 4, damage: 110, cooldown: 2, current: 0 },
                { name: 'Darkness', shape: 'aoe', range: 3, damage: 80, cooldown: 3, current: 0 }
            ]
        },
        archangel: {
            id: 'archangel', name: 'Archangel', hp: 2800, damage: 55,
            color: '#ffddaa', behavior: 'boss', size: 2,
            attacks: [
                { name: 'Holy Nova', shape: 'aoe', range: 2, damage: 120, cooldown: 2, current: 0 },
                { name: 'Divine Shield', shape: 'shield_self', damage: 0, cooldown: 5, current: 0 },
                { name: 'Smite', shape: 'single', range: 3, damage: 170, cooldown: 3, current: 0 }
            ]
        }
    },

    BOSS_ORDER: ['colossus', 'wraith', 'dragon'],

    BIOMES: {
        dungeon: {
            id: 'dungeon', name: 'DUNGEON',
            bg: '#0f0a1a', tileBase: '#1a1525', tileBorder: '#2a2040', accent: '#ff8800',
            enemies: ['goblin', 'archer', 'necromancer'], bossId: 'colossus'
        },
        forest: {
            id: 'forest', name: 'FOREST',
            bg: '#0a1a0a', tileBase: '#1a2a1a', tileBorder: '#2a3a2a', accent: '#44aa44',
            enemies: ['wolf', 'druid', 'treant'], bossId: 'ancient_tree'
        },
        swamp: {
            id: 'swamp', name: 'SWAMP',
            bg: '#0a0a1a', tileBase: '#1a1a2a', tileBorder: '#2a2a3a', accent: '#44aa88',
            enemies: ['toad', 'plaguebearer', 'mud_golem'], bossId: 'hydra'
        },
        desert: {
            id: 'desert', name: 'DESERT',
            bg: '#1a1500', tileBase: '#2a2510', tileBorder: '#3a3520', accent: '#ddaa44',
            enemies: ['scorpion', 'mummy', 'sand_wraith'], bossId: 'sandworm'
        },
        frozen: {
            id: 'frozen', name: 'FROZEN',
            bg: '#0a1a2a', tileBase: '#1a2a3a', tileBorder: '#2a3a4a', accent: '#88ddff',
            enemies: ['frost_elemental', 'ice_wyrm', 'yeti'], bossId: 'frost_giant'
        },
        volcanic: {
            id: 'volcanic', name: 'VOLCANIC',
            bg: '#1a0a0a', tileBase: '#2a1a1a', tileBorder: '#3a2a2a', accent: '#ff4422',
            enemies: ['fire_elemental', 'magma_slime', 'phoenix'], bossId: 'fire_dragon'
        },
        shadow_realm: {
            id: 'shadow_realm', name: 'SHADOW',
            bg: '#0a0a15', tileBase: '#1a1a25', tileBorder: '#2a2a35', accent: '#8844aa',
            enemies: ['wraith_enemy', 'void_walker', 'shade'], bossId: 'shadow_lord'
        },
        celestial: {
            id: 'celestial', name: 'CELESTIAL',
            bg: '#1a1a0a', tileBase: '#2a2a1a', tileBorder: '#3a3a2a', accent: '#ffdd88',
            enemies: ['angel', 'cherub', 'seraph'], bossId: 'archangel'
        }
    },

    BIOME_ORDER: ['dungeon', 'forest', 'swamp', 'desert', 'frozen', 'volcanic', 'shadow_realm', 'celestial'],

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

        SCALING_HP_MULT: 0.30,
        SCALING_DMG_MULT: 0.15,

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
            shape: 'teleport_strike', damage: 40
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
            shape: 'teleport_strike', damage: 50
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
            name: 'Quagmire', desc: '5x5 AoE around self, spawns water tiles',
            shape: 'aoe_5x5_self', damage: 30, summonObstacle: 'water'
        },
        scorpion: {
            name: 'Venom Strike', desc: 'Single target + poison',
            shape: 'single', damage: 50, effects: ['poison']
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
            name: 'Inferno', desc: '3x3 AoE around player + burn tiles',
            shape: 'aoe_3x3_burn', damage: 50
        },
        magma_slime: {
            name: 'Eruption', desc: 'Spawn 5 lava tiles around player',
            shape: 'eruption', damage: 0
        },
        phoenix: {
            name: 'Dive Bomb', desc: 'Cross AoE at player + teleport',
            shape: 'cross_teleport', damage: 50
        },
        wraith_enemy: {
            name: 'Phase Strike', desc: 'Teleport behind + 60 dmg ignores guard',
            shape: 'phase_strike', damage: 60, ignoreGuard: true
        },
        void_walker: {
            name: 'Void Rift', desc: 'Spawn portal near player',
            shape: 'spawn_portal', damage: 0
        },
        shade: {
            name: 'Shadow Cloak', desc: 'Untargetable 1 turn, then 70 dmg',
            shape: 'cloak_strike', damage: 70
        },
        angel: {
            name: 'Holy Beam', desc: 'Single target 3-range 80 dmg',
            shape: 'single_3', damage: 80
        },
        cherub: {
            name: 'Smite', desc: 'Cross AoE range 2 + knockback',
            shape: 'cross_2', damage: 50, effects: ['knockback1']
        },
        seraph: {
            name: 'Divine Judgment', desc: 'Player takes double damage next hit',
            shape: 'apply_judgment', damage: 0
        }
    },

    ELITE_HP_MULT: 2,
    ELITE_SPECIAL_INTERVAL: 2
};
