var Stages = {
    extraObstacles: 0,

    generate: function() {
        State.obstacles = [];
        State.enemies = [];
        State.burnTiles = [];

        var stage = State.stage;
        State.isBossStage = (stage % Data.BOSS_EVERY === 0);

        if (State.isBossStage) {
            this.generateBossStage();
            this.placePlayer();
        } else {
            this.placePlayer();
            this.generateRegularStage(stage);
        }
    },

    placePlayer: function() {
        var attempts = 0;
        while (attempts < 200) {
            var px = Math.floor(Math.random() * Data.GRID_SIZE);
            var py = Math.floor(Math.random() * Data.GRID_SIZE);
            var blocked = false;

            for (var i = 0; i < State.enemies.length; i++) {
                var e = State.enemies[i];
                if (e.hp <= 0) continue;
                var size = e.size || 1;
                if (px >= e.x && px < e.x + size && py >= e.y && py < e.y + size) {
                    blocked = true;
                    break;
                }
            }

            if (!blocked && !State.isBlocked(px, py)) {
                State.player.x = px;
                State.player.y = py;
                return;
            }
            attempts++;
        }
        for (var x = 0; x < Data.GRID_SIZE; x++) {
            for (var y = 0; y < Data.GRID_SIZE; y++) {
                if (!State.isBlocked(x, y) && !State.getEnemyAt(x, y)) {
                    State.player.x = x;
                    State.player.y = y;
                    return;
                }
            }
        }
        State.player.x = 0;
        State.player.y = 0;
    },

    generateRegularStage: function(stage) {
        var numEnemies = Math.min(
            Data.ENEMIES_PER_STAGE_BASE + Math.floor(stage / 3),
            Data.ENEMIES_PER_STAGE_MAX
        );

        this.placeEnemies(numEnemies);
        this.placeBiomeHazards(stage);
    },

    generateBossStage: function() {
        var bossKey = 'colossus';
        if (State.currentBiome && Data.BIOMES[State.currentBiome] && Data.BIOMES[State.currentBiome].bossId) {
            bossKey = Data.BIOMES[State.currentBiome].bossId;
        }
        var bossDef = Data.BOSS_DEFS[bossKey];

        var bossScaleSteps = Math.floor(State.stage / Data.BOSS_EVERY);
        var loopScaling = 1 + bossScaleSteps * Data.BOSS_STAT_SCALE;

        State.currentBossDef = bossDef;
        State.bossTurnCount = 0;

        var centerX = Math.floor(Data.GRID_SIZE / 2) - 1;
        var centerY = Math.floor(Data.GRID_SIZE / 2) - 1;

        var boss = {
            x: centerX,
            y: centerY,
            size: bossDef.size || 2,
            hp: Math.floor(bossDef.hp * loopScaling),
            maxHp: Math.floor(bossDef.hp * loopScaling),
            damage: Math.floor(bossDef.damage * loopScaling),
            defId: bossKey,
            facing: 'down',
            frozen: 0,
            freezeImmune: false,
            freezeImmuneTurns: 0,
            poison: null,
            isBoss: true,
            color: bossDef.color,
            name: bossDef.name,
            attacks: JSON.parse(JSON.stringify(bossDef.attacks)).map(function(a) {
                if (a.damage > 0) a.damage = Math.floor(a.damage * loopScaling);
                return a;
            }),
            nextAttack: null,
            telegraph: null
        };

        State.enemies.push(boss);
    },

    placeBiomeHazards: function(stage) {
        var biome = State.currentBiome ? Data.BIOMES[State.currentBiome] : null;
        if (!biome || !biome.hazards) return;

        var wallHp = Math.floor(150 + (stage - 1) * 30);
        var wallColor = biome.wallColor || '#886644';
        var biomeStage = (stage - 1) % 5;
        var isAbsoluteStage1 = stage === 1;

        for (var h = 0; h < biome.hazards.length; h++) {
            var hazardType = biome.hazards[h];
            var spawnMode = biome.hazardSpawn || 'scatter';

            if (hazardType === 'wall') {
                var wallCount = biome.wallCount || (2 + Math.floor(Math.random() * 2));
                this.spawnWalls(wallCount, wallHp, wallColor);
            } else if (isAbsoluteStage1) {
                continue;
            } else if (hazardType === 'spike_trap' && spawnMode === 'line') {
                this.spawnSpikeLine();
                this.spawnSpikeTraps(2 + Math.floor(Math.random() * 3));
            } else if (hazardType === 'spike_trap') {
                this.spawnSpikeTraps(2 + Math.floor(Math.random() * 3));
            } else if (hazardType === 'portal') {
                this.spawnPortalPairs(1 + Math.floor(Math.random() * 2));
            } else if (spawnMode === 'line') {
                this.spawnWaterLine();
            } else if (spawnMode === 'oasis') {
                this.spawnOasis();
            } else {
                var count = biome.hazardCount || (2 + Math.floor(Math.random() * 4));
                this.spawnScatter(hazardType, count);
            }
        }
    },

    spawnWalls: function(count, hp, color) {
        var placed = 0;
        var attempts = 0;
        while (placed < count && attempts < 100) {
            var x = Math.floor(Math.random() * Data.GRID_SIZE);
            var y = Math.floor(Math.random() * Data.GRID_SIZE);
            if (this.isReserved(x, y)) { attempts++; continue; }
            State.obstacles.push({
                x: x, y: y, id: 'wall', hp: hp, maxHp: hp,
                destructible: true, blocksMove: true, blocksLOS: true, color: color
            });
            placed++;
            attempts++;
        }
    },

    spawnSpikeTraps: function(count) {
        var placed = 0;
        var attempts = 0;
        while (placed < count && attempts < 100) {
            var x = Math.floor(Math.random() * Data.GRID_SIZE);
            var y = Math.floor(Math.random() * Data.GRID_SIZE);
            if (this.isReserved(x, y)) { attempts++; continue; }
            State.obstacles.push({
                x: x, y: y, id: 'spike_trap', hp: -1, destructible: false,
                blocksMove: false, color: '#888899'
            });
            placed++;
            attempts++;
        }
    },

    spawnSpikeLine: function() {
        var horizontal = Math.random() < 0.5;
        var pos = 1 + Math.floor(Math.random() * (Data.GRID_SIZE - 2));
        for (var i = 0; i < Data.GRID_SIZE; i++) {
            var x = horizontal ? i : pos;
            var y = horizontal ? pos : i;
            if (this.isReserved(x, y)) continue;
            State.obstacles.push({
                x: x, y: y, id: 'spike_trap', hp: -1, destructible: false,
                blocksMove: false, color: '#888899'
            });
        }
    },

    spawnPortalPairs: function(count) {
        for (var p = 0; p < count; p++) {
            var portal1 = this.findOpenTile();
            var portal2 = this.findOpenTile();
            if (portal1 && portal2) {
                State.obstacles.push({
                    x: portal1.x, y: portal1.y, id: 'portal', hp: -1,
                    destructible: false, blocksMove: false, blocksLOS: false, color: '#cc44ff'
                });
                State.obstacles.push({
                    x: portal2.x, y: portal2.y, id: 'portal', hp: -1,
                    destructible: false, blocksMove: false, blocksLOS: false, color: '#cc44ff'
                });
            }
        }
    },

    spawnWaterLine: function() {
        var horizontal = Math.random() < 0.5;
        var pos = 1 + Math.floor(Math.random() * (Data.GRID_SIZE - 2));
        for (var i = 0; i < Data.GRID_SIZE; i++) {
            var x = horizontal ? i : pos;
            var y = horizontal ? pos : i;
            if (this.isReserved(x, y)) continue;
            State.obstacles.push({
                x: x, y: y, id: 'water', hp: -1, destructible: false,
                blocksMove: false, color: '#2266cc'
            });
        }
    },

    spawnOasis: function() {
        var cx = 2 + Math.floor(Math.random() * (Data.GRID_SIZE - 4));
        var cy = 2 + Math.floor(Math.random() * (Data.GRID_SIZE - 4));
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                var x = cx + dx;
                var y = cy + dy;
                if (this.isReserved(x, y)) continue;
                State.obstacles.push({
                    x: x, y: y, id: 'water', hp: -1, destructible: false,
                    blocksMove: false, color: '#2266cc'
                });
            }
        }
    },

    spawnScatter: function(type, count) {
        var placed = 0;
        var attempts = 0;
        while (placed < count && attempts < 100) {
            var x = Math.floor(Math.random() * Data.GRID_SIZE);
            var y = Math.floor(Math.random() * Data.GRID_SIZE);
            if (this.isReserved(x, y)) { attempts++; continue; }
            var def = Data.OBSTACLES[type];
            State.obstacles.push({
                x: x, y: y, id: type, hp: def.hp, destructible: def.destructible || false,
                blocksMove: def.blocksMove || false, blocksLOS: def.blocksLOS || false,
                color: def.color
            });
            placed++;
            attempts++;
        }
    },

    placeEnemies: function(count) {
        var stage = State.stage;
        var availableTypes = [];

        if (State.currentBiome && Data.BIOMES[State.currentBiome]) {
            var biomeEnemies = Data.BIOMES[State.currentBiome].enemies;
            if (stage <= 1) {
                availableTypes = [biomeEnemies[0]];
            } else {
                availableTypes = biomeEnemies.slice();
            }
        } else {
            availableTypes = ['goblin'];
            if (stage >= 2) availableTypes.push('archer');
            if (stage >= 3) availableTypes.push('necromancer');
        }

        var placed = 0;
        var attempts = 0;
        var biomeNum = Math.floor((stage - 1) / 5);
        var biomeStage = (stage - 1) % 5;
        var elitesToSpawn = 0;
        if (biomeNum >= 3) {
            if (biomeStage === 0 || biomeStage === 1) elitesToSpawn = 1;
            else if (biomeStage === 2 || biomeStage === 3) elitesToSpawn = 2;
        } else {
            if (biomeStage === 2 || biomeStage === 3) elitesToSpawn = 1;
        }
        var elitesSpawned = 0;

        while (placed < count && attempts < 100) {
            var x = Math.floor(Math.random() * Data.GRID_SIZE);
            var y = Math.floor(Math.random() * Data.GRID_SIZE);

            if (this.isReserved(x, y)) { attempts++; continue; }

            var dist = AI.distance(x, y, State.player.x, State.player.y);
            if (dist < 3) { attempts++; continue; }

            var typeKey = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            var def = Data.ENEMIES[typeKey];

            var scaling = 1 + (stage - 1) * Data.SCALING_HP_MULT;
            var dmgScaling = 1 + (stage - 1) * Data.SCALING_DMG_MULT;
            var isElite = elitesSpawned < elitesToSpawn;

            var hp = Math.floor(def.hp * scaling);
            var dmg = Math.floor(def.damage * dmgScaling);
            if (isElite) {
                hp = Math.floor(hp * Data.ELITE_HP_MULT);
                dmg = Math.floor(dmg * Data.ELITE_DMG_MULT);
                elitesSpawned++;
            }

            State.enemies.push({
                x: x, y: y,
                hp: hp,
                maxHp: hp,
                damage: dmg,
                defId: typeKey,
                facing: 'down',
                frozen: 0,
                freezeImmune: false,
                freezeImmuneTurns: 0,
                poison: null,
                isBoss: false,
                isElite: isElite,
                eliteTurnCount: 0,
                eliteTelegraphing: false,
                color: def.color,
                moveSpeed: def.moveSpeed,
                summonTimer: 0,
                teleportTimer: 0
            });

            placed++;
            attempts++;
        }
    },

    findOpenTile: function() {
        var attempts = 0;
        while (attempts < 50) {
            var x = Math.floor(Math.random() * Data.GRID_SIZE);
            var y = Math.floor(Math.random() * Data.GRID_SIZE);
            if (!this.isReserved(x, y)) {
                return { x: x, y: y };
            }
            attempts++;
        }
        return null;
    },

    isReserved: function(x, y) {
        if (x === State.player.x && y === State.player.y) return true;

        for (var i = 0; i < State.enemies.length; i++) {
            var e = State.enemies[i];
            if (e.hp <= 0) continue;
            var size = e.size || 1;
            if (x >= e.x && x < e.x + size && y >= e.y && y < e.y + size) return true;
        }

        for (var i = 0; i < State.obstacles.length; i++) {
            if (State.obstacles[i].x === x && State.obstacles[i].y === y) return true;
        }

        return false;
    }
};
