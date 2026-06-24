var State = {
    screen: 'title',
    stage: 1,
    turn: 1,
    phase: 'idle',

    player: {
        x: 0, y: 0,
        hp: Data.PLAYER_BASE_HP,
        maxHp: Data.PLAYER_BASE_HP,
        energy: Data.PLAYER_BASE_ENERGY,
        maxEnergy: Data.PLAYER_BASE_ENERGY,
        power: Data.PLAYER_BASE_POWER,
        critChance: 0,
        critStacks: 0,
        skills: [null, Data.SKILLS.slash, null, null, null],
        selectedSlot: 0,
        statusEffects: [],
        tempPower: 0,
        items: {},
        shield: 0,
        tempBuffs: [],
        guarding: false,
        guardEnergy: 0,
        lifestealAura: 0,
        berserk: 0,
        rejuvenation: 0,
        damageReduction: 0,
        tempPowerTurns: 0,
        damageReductionTurns: 0,
        skillStacks: {},
        chilled: 0,
        diseased: false,
        cursed: false,
        poison: null
    },

    enemies: [],
    obstacles: [],
    burnTiles: [],
    poisonTiles: [],
    poisonEffects: [],
    extraItemDrops: 0,
    spikeTurns: 0,
    spikeLastX: -1,
    spikeLastY: -1,

    debugMode: false,
    debugBiomeOverride: null,
    debugInvincibility: false,

    hoveredTile: null,
    attackPreview: [],
    floatingTexts: [],
    animations: [],

    isBossStage: false,
    currentBossDef: null,
    bossTurnCount: 0,
    selectedClass: 'knight',
    biomeOrder: [],
    currentBiome: null,
    previousBiome: null,

    combatLog: [],
    maxLogEntries: 50,
    runStats: {
        totalDamage: 0,
        totalDamageTaken: 0,
        skillsUsed: 0,
        enemyKills: 0,
        bossesKilled: 0
    },
    lastDamageSource: null,
    turnStartState: null,
    dialogueQueue: [],
    currentDialogue: null,
    phaseChangeTriggered: {},

    reset: function() {
        this.stage = 1;
        this.turn = 1;
        this.phase = 'idle';
        this.screen = 'game';
        this.enemies = [];
        this.obstacles = [];
        this.burnTiles = [];
        this.poisonTiles = [];
        this.poisonEffects = [];
        this.spikeTurns = 0;
        this.spikeLastX = -1;
        this.spikeLastY = -1;
        this.hoveredTile = null;
        this.attackPreview = [];
        this.floatingTexts = [];
        this.animations = [];
        this.isBossStage = false;
        this.currentBossDef = null;
        this.bossTurnCount = 0;
        this.combatLog = [];
        this.runStats = { totalDamage: 0, totalDamageTaken: 0, skillsUsed: 0, enemyKills: 0, bossesKilled: 0 };
        this.lastDamageSource = null;
        this.startTime = Date.now();
        this.turnStartState = null;
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.phaseChangeTriggered = {};
        Stages.extraObstacles = 0;

        this.player.x = 0;
        this.player.y = 0;
        this.player.power = Data.PLAYER_BASE_POWER;
        this.player.selectedSlot = 0;
        this.player.statusEffects = [];
        this.player.tempPower = 0;
        this.player.items = {};
        this.player.shield = 0;
        this.player.tempBuffs = [];
        this.player.guarding = false;
        this.player.guardEnergy = 0;
        this.player.lifestealAura = 0;
        this.player.berserk = 0;
        this.player.rejuvenation = 0;
        this.player.damageReduction = 0;
        this.player.tempPowerTurns = 0;
        this.player.damageReductionTurns = 0;
        this.player.skillStacks = {};
        this.player.chilled = 0;
        this.player.diseased = false;
        this.player.cursed = false;
        this.player.bleed = null;
        this.player.judgment = 0;
        this.extraItemDrops = 0;
        this.player.classId = this.selectedClass || 'knight';

        var cls = Data.CLASSES[this.player.classId];
        this.player.hp = cls.hp;
        this.player.maxHp = cls.hp;
        this.player.energy = cls.energy;
        this.player.maxEnergy = cls.energy;
        this.player.skills = [null, Data.SKILLS[cls.basicAttack], null, null, null];

        this.biomeOrder = Data.BIOME_ORDER.slice();
        for (var i = this.biomeOrder.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = this.biomeOrder[i];
            this.biomeOrder[i] = this.biomeOrder[j];
            this.biomeOrder[j] = tmp;
        }
        var earlyBiomes = ['dungeon', 'forest', 'swamp', 'desert'];
        if (earlyBiomes.indexOf(this.biomeOrder[0]) === -1) {
            for (var k = 1; k < this.biomeOrder.length; k++) {
                if (earlyBiomes.indexOf(this.biomeOrder[k]) !== -1) {
                    var swap = this.biomeOrder[0];
                    this.biomeOrder[0] = this.biomeOrder[k];
                    this.biomeOrder[k] = swap;
                    break;
                }
            }
        }
        for (var c = 1; c < this.biomeOrder.length; c++) {
            if (this.biomeOrder[c] === this.biomeOrder[c - 1]) {
                var swapTarget = c + 1 < this.biomeOrder.length ? c + 1 : 0;
                var tmpSwap = this.biomeOrder[c];
                this.biomeOrder[c] = this.biomeOrder[swapTarget];
                this.biomeOrder[swapTarget] = tmpSwap;
            }
        }
        this.currentBiome = this.biomeOrder[0];
        this.previousBiome = null;
    },

    updateBiome: function() {
        if (this.debugBiomeOverride) {
            this.previousBiome = this.currentBiome;
            this.currentBiome = this.debugBiomeOverride;
            this.addLog('[DEBUG] Biome forced to: ' + Data.BIOMES[this.debugBiomeOverride].name, 'info');
            return;
        }
        this.previousBiome = this.currentBiome;
        var biomeIndex = Math.floor((this.stage - 1) / Data.BOSS_EVERY) % this.biomeOrder.length;
        this.currentBiome = this.biomeOrder[biomeIndex];
    },

    showBiomeFlavor: function() {
        var biome = this.currentBiome;
        var cls = this.selectedClass;
        var variants = Data.BIOME_FLAVOR[biome];
        if (!variants || variants.length === 0) return;
        var pick = variants[Math.floor(Math.random() * variants.length)];
        var text = pick[cls] || pick.knight;
        var biomeName = Data.BIOMES[biome] ? Data.BIOMES[biome].name : biome;
        this.addDialogue(biomeName, text, Data.BIOMES[biome] ? Data.BIOMES[biome].accent : '#ffffff');
    },

    getPlayerDamage: function() {
        var base = this.player.power + this.player.tempPower;
        return base;
    },

    addFloatingText: function(x, y, text, color) {
        var offset = 0;
        for (var i = 0; i < this.floatingTexts.length; i++) {
            var ft = this.floatingTexts[i];
            if (Math.abs(ft.x - x) < 0.5 && Math.abs(ft.y - y) < 1) {
                offset += 0.3;
            }
        }
        this.floatingTexts.push({
            x: x, y: y - offset, text: text, color: color,
            life: 90, maxLife: 90
        });
    },

    updateFloatingTexts: function() {
        for (var i = this.floatingTexts.length - 1; i >= 0; i--) {
        this.floatingTexts[i].life--;
        this.floatingTexts[i].y -= 0.08;
            if (this.floatingTexts[i].life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    },

    addAnimation: function(type, config) {
        config.type = type;
        config.life = config.duration || 20;
        config.maxLife = config.life;
        this.animations.push(config);
    },

    updateAnimations: function() {
        for (var i = this.animations.length - 1; i >= 0; i--) {
            this.animations[i].life--;
            if (this.animations[i].life <= 0) {
                this.animations.splice(i, 1);
            }
        }
    },

    clearAnimations: function() {
        this.animations = [];
    },

    saveTurnStartState: function() {
        this.turnStartState = {
            x: this.player.x,
            y: this.player.y,
            energy: this.player.energy,
            hp: this.player.hp,
            shield: this.player.shield,
            chilled: this.player.chilled,
            diseased: this.player.diseased,
            cursed: this.player.cursed,
            bleed: this.player.bleed ? { damage: this.player.bleed.damage, turns: this.player.bleed.turns } : null,
            poison: this.player.poison ? { damage: this.player.poison.damage, turns: this.player.poison.turns } : null,
            judgment: this.player.judgment
        };
    },

    undoMove: function() {
        if (!this.turnStartState) return false;
        if (this.phase !== 'player') return false;
        var s = this.turnStartState;
        this.player.x = s.x;
        this.player.y = s.y;
        this.player.energy = s.energy;
        this.player.hp = s.hp;
        this.player.shield = s.shield;
        this.player.chilled = s.chilled;
        this.player.diseased = s.diseased;
        this.player.cursed = s.cursed;
        this.player.bleed = s.bleed;
        this.player.poison = s.poison;
        this.player.judgment = s.judgment;
        this.addLog('Turn undone!', 'info');
        this.addFloatingText(this.player.x, this.player.y, 'UNDO', '#88aaff');
        return true;
    },

    animFlash: function(tiles, color, duration) {
        this.addAnimation('flash', {
            tiles: tiles,
            color: color || '#ff4444',
            duration: duration || 20
        });
    },

    animSlash: function(fromX, fromY, toX, toY, color) {
        this.addAnimation('slash', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            duration: 17
        });
    },

    animProjectile: function(fromX, fromY, toX, toY, color) {
        this.addAnimation('projectile', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            duration: 16
        });
    },

    animBeam: function(fromX, fromY, toX, toY, color) {
        this.addAnimation('beam', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            duration: 13
        });
    },

    animMove: function(fromX, fromY, toX, toY, color, eyeColor) {
        this.addAnimation('move', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            eyeColor: eyeColor || '#ffffff',
            duration: 10
        });
    },

    animSlash: function(fromX, fromY, toX, toY, color) {
        this.addAnimation('slash', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            duration: 26
        });
    },

    animProjectile: function(fromX, fromY, toX, toY, color) {
        this.addAnimation('projectile', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            duration: 24
        });
    },

    animBeam: function(fromX, fromY, toX, toY, color) {
        this.addAnimation('beam', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            duration: 20
        });
    },

    animMove: function(fromX, fromY, toX, toY, color, eyeColor) {
        this.addAnimation('move', {
            fromX: fromX, fromY: fromY,
            toX: toX, toY: toY,
            color: color || '#ffffff',
            eyeColor: eyeColor || '#ffffff',
            duration: 16
        });
    },

    animRing: function(cx, cy, color) {
        var tiles = [];
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                tiles.push({ x: cx + dx, y: cy + dy });
            }
        }
        this.animFlash(tiles, color, 17);
    },

    animAoE: function(tiles, color) {
        this.animFlash(tiles, color || '#ff4444', 22);
    },

    animCross: function(cx, cy, color) {
        this.animFlash([
            { x: cx, y: cy },
            { x: cx + 1, y: cy }, { x: cx - 1, y: cy },
            { x: cx, y: cy + 1 }, { x: cx, y: cy - 1 }
        ], color || '#ffff44', 20);
    },

    clearFloatingTexts: function() {
        this.floatingTexts = [];
    },

    hasItem: function(id) {
        return this.player.items[id] > 0;
    },

    getItemStacks: function(id) {
        return this.player.items[id] || 0;
    },

    addItem: function(id) {
        if (!Data.ITEMS[id]) return;
        this.player.items[id] = (this.player.items[id] || 0) + 1;
    },

    getItemsByRarity: function(rarity) {
        var result = [];
        for (var id in this.player.items) {
            if (this.player.items[id] > 0 && Data.ITEMS[id] && Data.ITEMS[id].rarity === rarity) {
                result.push(id);
            }
        }
        return result;
    },

    getEnemyAt: function(x, y) {
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if (e.hp <= 0) continue;
            var size = e.size || 1;
            if (x >= e.x && x < e.x + size && y >= e.y && y < e.y + size) {
                return e;
            }
        }
        return null;
    },

    isBossAt: function(x, y) {
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if (e.hp <= 0 || !e.isBoss) continue;
            var size = e.size || 1;
            if (x >= e.x && x < e.x + size && y >= e.y && y < e.y + size) {
                return true;
            }
        }
        return false;
    },

    getBossTiles: function(boss) {
        var tiles = [];
        var size = boss.size || 1;
        for (var bx = 0; bx < size; bx++) {
            for (var by = 0; by < size; by++) {
                tiles.push({ x: boss.x + bx, y: boss.y + by });
            }
        }
        return tiles;
    },

    getBossCenter: function(boss) {
        var size = boss.size || 1;
        return {
            x: boss.x + Math.floor(size / 2),
            y: boss.y + Math.floor(size / 2)
        };
    },

    isBossOccupying: function(x, y) {
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if (e.hp <= 0 || !e.isBoss) continue;
            var size = e.size || 1;
            if (x >= e.x && x < e.x + size && y >= e.y && y < e.y + size) {
                return true;
            }
        }
        return false;
    },

    getAliveEnemies: function() {
        return this.enemies.filter(function(e) { return e.hp > 0; });
    },

    isBlocked: function(x, y) {
        if (x < 0 || x >= Data.GRID_SIZE || y < 0 || y >= Data.GRID_SIZE) return true;
        for (var i = 0; i < this.obstacles.length; i++) {
            var o = this.obstacles[i];
            if (o.x === x && o.y === y && o.blocksMove) return true;
        }
        return false;
    },

    isBlockedForEnemy: function(x, y) {
        if (this.isBlocked(x, y)) return true;
        if (x === this.player.x && y === this.player.y) return true;
        for (var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if (e.hp <= 0) continue;
            var size = e.size || 1;
            if (x >= e.x && x < e.x + size && y >= e.y && y < e.y + size) return true;
        }
        return false;
    },

    hasLineOfSight: function(x1, y1, x2, y2) {
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        var sx = x1 < x2 ? 1 : -1;
        var sy = y1 < y2 ? 1 : -1;
        var err = dx - dy;
        var cx = x1, cy = y1;

        while (cx !== x2 || cy !== y2) {
            var e2 = 2 * err;
            if (e2 > -dy) { err -= dy; cx += sx; }
            if (e2 < dx) { err += dx; cy += sy; }
            if (cx === x2 && cy === y2) break;
            for (var i = 0; i < this.obstacles.length; i++) {
                var o = this.obstacles[i];
                if (o.x === cx && o.y === cy && o.blocksLOS) return false;
            }
        }
        return true;
    },

    getSelectedSkill: function() {
        if (this.player.selectedSlot === 0) return null;
        if (this.player.selectedSlot === 5) return Data.SKILLS.guard;
        return this.player.skills[this.player.selectedSlot];
    },

    isMoveMode: function() {
        return this.player.selectedSlot === 0;
    },

    getSkillSlots: function() {
        var count = 0;
        for (var i = 2; i < this.player.skills.length; i++) {
            if (this.player.skills[i]) count++;
        }
        return count;
    },

    addLog: function(text, type) {
        this.combatLog.push({
            text: text,
            type: type || 'info',
            turn: this.turn,
            stage: this.stage
        });
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.shift();
        }
    },

    addDialogue: function(bossName, text, color) {
        this.dialogueQueue.push({ bossName: bossName, text: text, color: color || '#ffffff' });
    },

    processDialogueQueue: function(callback) {
        if (this.dialogueQueue.length === 0) {
            if (callback) callback();
            return;
        }
        var dialogue = this.dialogueQueue.shift();
        this.currentDialogue = dialogue;
        var self = this;
        UI.showDialogue(dialogue.bossName, dialogue.text, dialogue.color, function() {
            self.currentDialogue = null;
            self.processDialogueQueue(callback);
        });
    }
};
