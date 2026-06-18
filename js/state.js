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
        tempBuffs: []
    },

    enemies: [],
    obstacles: [],
    burnTiles: [],
    poisonEffects: [],
    activeSynergies: [],

    hoveredTile: null,
    attackPreview: [],
    floatingTexts: [],
    animations: [],

    isBossStage: false,
    currentBossDef: null,
    bossTurnCount: 0,

    combatLog: [],
    maxLogEntries: 50,
    runStats: {
        totalDamage: 0,
        enemyKills: 0,
        bossesKilled: 0
    },

    reset: function() {
        this.stage = 1;
        this.turn = 1;
        this.phase = 'idle';
        this.screen = 'game';
        this.enemies = [];
        this.obstacles = [];
        this.burnTiles = [];
        this.poisonEffects = [];
        this.activeSynergies = [];
        this.hoveredTile = null;
        this.attackPreview = [];
        this.floatingTexts = [];
        this.animations = [];
        this.isBossStage = false;
        this.currentBossDef = null;
        this.bossTurnCount = 0;
        this.combatLog = [];
        this.runStats = { totalDamage: 0, enemyKills: 0, bossesKilled: 0 };
        Stages.extraObstacles = 0;

        this.player.x = 0;
        this.player.y = 0;
        this.player.hp = Data.PLAYER_BASE_HP;
        this.player.maxHp = Data.PLAYER_BASE_HP;
        this.player.energy = Data.PLAYER_BASE_ENERGY;
        this.player.maxEnergy = Data.PLAYER_BASE_ENERGY;
        this.player.power = Data.PLAYER_BASE_POWER;
        this.player.skills = [null, Data.SKILLS.slash, null, null, null];
        this.player.selectedSlot = 0;
        this.player.statusEffects = [];
        this.player.tempPower = 0;
        this.player.items = {};
        this.player.shield = 0;
        this.player.tempBuffs = [];
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
            life: 70, maxLife: 70
        });
    },

    updateFloatingTexts: function() {
        for (var i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].life--;
            this.floatingTexts[i].y -= 0.25;
            if (this.floatingTexts[i].life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
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

    hasItemSet: function(setId) {
        var set = Data.ITEM_SETS[setId];
        if (!set) return false;
        for (var i = 0; i < set.requires.length; i++) {
            if (!this.hasItem(set.requires[i])) return false;
        }
        return true;
    },

    hasSkillInteraction: function(skillId) {
        for (var key in Data.ITEM_SKILL_INTERACTIONS) {
            var inter = Data.ITEM_SKILL_INTERACTIONS[key];
            if (inter.skill === skillId && this.hasItem(inter.item)) return inter.bonus;
        }
        return null;
    },

    getActiveItemSets: function() {
        var result = [];
        for (var setId in Data.ITEM_SETS) {
            if (this.hasItemSet(setId)) result.push(setId);
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

    updateSynergies: function() {
        var owned = [];
        for (var i = 1; i < this.player.skills.length; i++) {
            if (this.player.skills[i]) owned.push(this.player.skills[i].id);
        }
        this.activeSynergies = [];
        for (var key in Data.SYNERGIES) {
            var syn = Data.SYNERGIES[key];
            var hasAll = true;
            for (var j = 0; j < syn.requires.length; j++) {
                if (owned.indexOf(syn.requires[j]) === -1) { hasAll = false; break; }
            }
            if (hasAll) this.activeSynergies.push(key);
        }
    },

    hasSynergy: function(name) {
        return this.activeSynergies.indexOf(name) !== -1;
    },

    getSelectedSkill: function() {
        if (this.player.selectedSlot === 0) return null;
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
    }
};
