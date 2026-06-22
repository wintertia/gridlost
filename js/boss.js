var Boss = {
    processTurn: function(boss, callback) {
        State.bossTurnCount++;

        if (boss.attacks) {
            for (var i = 0; i < boss.attacks.length; i++) {
                if (boss.attacks[i].current > 0) {
                    boss.attacks[i].current--;
                }
            }
        }

        if (boss.isClone) {
            var self = this;
            if (boss.telegraph) {
                this.executeTelegraphedAttack(boss, boss.telegraph, function() {
                    boss.telegraph = null;
                    boss.telegraphTiles = null;
                    self.bossBasicMoveAndAttack(boss, callback);
                });
            } else {
                this.bossBasicMoveAndAttack(boss, callback);
            }
            return;
        }

        if (boss.defId === 'bandit_gang') {
            this.banditGangTurn(boss, callback);
            return;
        }

        this.processBossPerTurnEffects(boss);

        // Execute pending spike overload tiles (telegraphed last turn)
        if (boss.defId === 'overseer' && boss.spikeOverloadTiles && boss.spikeOverloadTiles.length > 0) {
            var self = this;
            State.animAoE(boss.spikeOverloadTiles, '#ff0000');
            for (var si = 0; si < boss.spikeOverloadTiles.length; si++) {
                if (boss.spikeOverloadTiles[si].x === State.player.x && boss.spikeOverloadTiles[si].y === State.player.y) {
                    Combat.dealDamageToPlayer(300);
                }
            }
            boss.spikeOverloadTiles = null;
            Grid.render(); UI.updateAll();
            setTimeout(function() { self.processTurnAfterSpikeOverload(boss, callback); }, 300);
            return;
        }

        // Telegraph new spike overload tiles (then proceed with normal attack cycle)
        if (boss.defId === 'overseer' && boss.spikeOverload) {
            var tiles = [];
            var used = {};
            for (var i = 0; i < 6; i++) {
                var rx, ry, key;
                do {
                    rx = Math.floor(Math.random() * Data.GRID_SIZE);
                    ry = Math.floor(Math.random() * Data.GRID_SIZE);
                    key = rx + ',' + ry;
                } while (used[key]);
                used[key] = true;
                tiles.push({x: rx, y: ry});
            }
            boss.spikeOverloadTiles = tiles;
            State.addFloatingText(4, 4, 'SPIKE OVERLOAD!', '#ff0000');
            Grid.render(); UI.updateAll();
        }

        if (boss.invulnerable) {
            var aliveTreants = 0;
            for (var t = 0; t < State.enemies.length; t++) {
                if (State.enemies[t].defId === 'treant' && State.enemies[t].hp > 0 && State.enemies[t].isSummon) {
                    aliveTreants++;
                }
            }
            if (aliveTreants === 0) {
                boss.invulnerable = false;
                State.addFloatingText(boss.x, boss.y, 'VULNERABLE!', '#ff4444');
            } else {
                State.addFloatingText(boss.x, boss.y, 'INVULNERABLE!', '#446622');
                Grid.render(); UI.updateAll();
                callback();
                return;
            }
        }

        if (boss.trapTurns && boss.trapTurns > 0) {
            if (boss.trapTurns === 1) {
                var wallTiles = [];
                for (var wi = State.obstacles.length - 1; wi >= 0; wi--) {
                    if (State.obstacles[wi].id === 'wall' && State.obstacles[wi].color === '#446622') {
                        wallTiles.push({x: State.obstacles[wi].x, y: State.obstacles[wi].y});
                    }
                }
                if (wallTiles.length > 0) {
                    State.animAoE(wallTiles, '#ff4444');
                    State.addFloatingText(State.player.x, State.player.y, 'WALLS CRACKING!', '#ff4444');
                    Grid.render(); UI.updateAll();
                }
            }
            boss.trapTurns--;
            if (boss.trapTurns === 0) {
                var tcx = boss.trapCenterX !== undefined ? boss.trapCenterX : boss.x + 1;
                var tcy = boss.trapCenterY !== undefined ? boss.trapCenterY : boss.y + 1;
                var hit = Math.abs(State.player.x - tcx) <= 1 && Math.abs(State.player.y - tcy) <= 1;
                for (var ox = State.obstacles.length - 1; ox >= 0; ox--) {
                    var o = State.obstacles[ox];
                    if (o.id === 'wall' && o.color === '#446622') {
                        State.obstacles.splice(ox, 1);
                    }
                }
                if (hit) {
                    Combat.dealDamageToPlayer(300);
                    State.addFloatingText(State.player.x, State.player.y, 'CRUSHED!', '#ff4444');
                }
                var self = this;
                this.bossBasicMoveAndAttack(boss, function() {
                    if (State.dialogueQueue.length > 0) {
                        State.processDialogueQueue(callback);
                    } else {
                        callback();
                    }
                });
                return;
            }
        }

        if (boss.telegraph) {
            var self = this;
            this.executeTelegraphedAttack(boss, boss.telegraph, function() {
                boss.telegraph = null;
                boss.telegraphTiles = null;
                self.bossBasicMoveAndAttack(boss, function() {
                    if (State.dialogueQueue.length > 0) {
                        State.processDialogueQueue(callback);
                    } else {
                        callback();
                    }
                });
            });
            return;
        }

        var nextAttack = this.getNextAttack(boss);
        if (nextAttack) {
            boss.telegraph = nextAttack;
            boss.telegraphTiles = this.getTelegraphTiles(boss, nextAttack);
            State.addLog(boss.name + ' telegraphs: ' + nextAttack.name, 'telegraph');
            AudioMgr.sfx('telegraph');
            Grid.render();
            UI.updateAll();
            if (State.dialogueQueue.length > 0) {
                State.processDialogueQueue(callback);
            } else {
                callback();
            }
        } else {
            this.bossBasicMoveAndAttack(boss, function() {
                if (State.dialogueQueue.length > 0) {
                    State.processDialogueQueue(callback);
                } else {
                    callback();
                }
            });
        }
    },

    processTurnAfterSpikeOverload: function(boss, callback) {
        var self = this;
        if (boss.telegraph) {
            this.executeTelegraphedAttack(boss, boss.telegraph, function() {
                boss.telegraph = null;
                boss.telegraphTiles = null;
                self.bossBasicMoveAndAttack(boss, function() {
                    if (State.dialogueQueue.length > 0) {
                        State.processDialogueQueue(callback);
                    } else {
                        callback();
                    }
                });
            });
        } else {
            var nextAttack = this.getNextAttack(boss);
            if (nextAttack) {
                boss.telegraph = nextAttack;
                boss.telegraphTiles = this.getTelegraphTiles(boss, nextAttack);
                State.addLog(boss.name + ' telegraphs: ' + nextAttack.name, 'telegraph');
                Grid.render();
                UI.updateAll();
                if (State.dialogueQueue.length > 0) {
                    State.processDialogueQueue(callback);
                } else {
                    callback();
                }
            } else {
                this.bossBasicMoveAndAttack(boss, function() {
                    if (State.dialogueQueue.length > 0) {
                        State.processDialogueQueue(callback);
                    } else {
                        callback();
                    }
                });
            }
        }
    },

    processBossPerTurnEffects: function(boss) {
        if (boss.defId === 'mud_colossus') {
            if (boss.floodColumn !== undefined) {
                var col = boss.floodColumn;
                for (var y = 0; y < Data.GRID_SIZE; y++) {
                    for (var i = State.obstacles.length - 1; i >= 0; i--) {
                        if (State.obstacles[i].x === col && State.obstacles[i].y === y) {
                            State.obstacles.splice(i, 1);
                        }
                    }
                    State.obstacles.push({
                        x: col, y: y, id: 'swamp_pool', hp: -1,
                        destructible: false, blocksMove: false, color: '#335522'
                    });
                }
                State.addFloatingText(col, 4, 'SWAMP COLUMN!', '#335522');
                boss.floodColumn += boss.floodDirection;
                if (boss.floodColumn < 0) boss.floodColumn = Data.GRID_SIZE - 1;
                if (boss.floodColumn >= Data.GRID_SIZE) boss.floodColumn = 0;
            }
        }

        if (boss.defId === 'molten_chaos') {
            var lavaCount = boss.lavaTilesPerTurn || 1;
            for (var l = 0; l < lavaCount; l++) {
                var rx = Math.floor(Math.random() * Data.GRID_SIZE);
                var ry = Math.floor(Math.random() * Data.GRID_SIZE);
                for (var i = State.obstacles.length - 1; i >= 0; i--) {
                    if (State.obstacles[i].x === rx && State.obstacles[i].y === ry) {
                        State.obstacles.splice(i, 1);
                    }
                }
                State.obstacles.push({
                    x: rx, y: ry, id: 'lava', hp: -1,
                    destructible: false, blocksMove: false, color: '#ff4400'
                });
            }
        }
    },

    checkPhaseChanges: function(boss, prevHp) {
        if (!boss.phases) return;
        var hpPercent = (boss.hp / boss.maxHp) * 100;

        for (var i = 0; i < boss.phases.length; i++) {
            var phase = boss.phases[i];
            var key = boss.defId + '_phase_' + phase.threshold;
            if (!State.phaseChangeTriggered[key] && prevHp > phase.threshold && hpPercent <= phase.threshold) {
                State.phaseChangeTriggered[key] = true;
                AudioMgr.sfx('phase_change');
                if (phase.dialogue) {
                    State.addDialogue(boss.name, phase.dialogue, boss.color);
                }
                if (phase.handler) {
                    phase.handler(boss);
                }
                Grid.render();
                UI.updateAll();
                if (State.dialogueQueue.length > 0) {
                    State.processDialogueQueue(function() {});
                }
                break;
            }
        }
    },

    getTelegraphTiles: function(boss, attack) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var px = State.player.x;
        var py = State.player.y;
        var tiles = [];

        switch (attack.name) {
            case 'Spear Traps':
                for (var i = 0; i < Data.GRID_SIZE; i++) {
                    tiles.push({x: i, y: 0}, {x: i, y: 7}, {x: 0, y: i}, {x: 7, y: i});
                }
                break;
            case 'Spear Thrust':
                for (var i = 0; i < Data.GRID_SIZE; i++) {
                    tiles.push({x: i, y: 3}, {x: i, y: 4}, {x: 3, y: i}, {x: 4, y: i});
                }
                break;
            case 'Spear Slam':
                for (var dx = 2; dx <= 5; dx++) {
                    for (var dy = 2; dy <= 5; dy++) {
                        tiles.push({x: dx, y: dy});
                    }
                }
                break;
            case 'Swamp Spit':
                var candidates = [];
                for (var sdx = -1; sdx <= 1; sdx++) {
                    for (var sdy = -1; sdy <= 1; sdy++) {
                        var sx = Math.max(0, Math.min(7, px + sdx));
                        var sy = Math.max(0, Math.min(7, py + sdy));
                        var isSwamp = false;
                        for (var si = 0; si < State.obstacles.length; si++) {
                            if (State.obstacles[si].x === sx && State.obstacles[si].y === sy && State.obstacles[si].id === 'swamp_pool') {
                                isSwamp = true;
                                break;
                            }
                        }
                        if (!isSwamp) candidates.push({x: sx, y: sy});
                    }
                }
                if (candidates.length > 0) {
                    tiles.push(candidates[Math.floor(Math.random() * candidates.length)]);
                } else {
                    tiles.push({x: Math.max(0, Math.min(7, px)), y: Math.max(0, Math.min(7, py))});
                }
                break;
            case 'Wooden Thorns':
                var row = 1 + Math.floor(Math.random() * 6);
                var col = 1 + Math.floor(Math.random() * 6);
                boss._thornsRow = row;
                boss._thornsCol = col;
                for (var i = 0; i < Data.GRID_SIZE; i++) {
                    tiles.push({x: i, y: row}, {x: col, y: i});
                }
                break;
            case 'Branch Slam':
                for (var dx = -1; dx <= 1; dx++) {
                    for (var dy = -1; dy <= 1; dy++) {
                        tiles.push({x: px + dx, y: py + dy});
                    }
                }
                break;
            case 'Overgrow':
                for (var dx = 2; dx <= 5; dx++) {
                    for (var dy = 2; dy <= 5; dy++) {
                        tiles.push({x: dx, y: dy});
                    }
                }
                break;
            case 'Magma Collapse':
                var used = {};
                for (var i = 0; i < 16; i++) {
                    var mrx, mry, key;
                    do {
                        mrx = Math.floor(Math.random() * Data.GRID_SIZE);
                        mry = Math.floor(Math.random() * Data.GRID_SIZE);
                        key = mrx + ',' + mry;
                    } while (used[key]);
                    used[key] = true;
                    tiles.push({x: mrx, y: mry});
                }
                break;
            case 'Magma Spit':
                for (var dx = -1; dx <= 1; dx++) {
                    for (var dy = -1; dy <= 1; dy++) {
                        tiles.push({x: px + dx, y: py + dy});
                    }
                }
                break;
            case 'Overheat':
                for (var dx = 2; dx <= 5; dx++) {
                    for (var dy = 2; dy <= 5; dy++) {
                        tiles.push({x: dx, y: dy});
                    }
                }
                break;
            case 'Frozen Axe':
                for (var dx = -2; dx <= 2; dx++) {
                    for (var dy = -2; dy <= 2; dy++) {
                        if (Math.abs(dx) + Math.abs(dy) <= 2 && (dx !== 0 || dy !== 0)) {
                            tiles.push({x: centerX + dx, y: centerY + dy});
                        }
                    }
                }
                break;
            case 'Frozen Stomp':
                for (var dx = 0; dx <= 1; dx++) {
                    for (var dy = 0; dy <= 1; dy++) {
                        tiles.push({x: px + dx, y: py + dy});
                    }
                }
                break;
            case 'Summon Void':
                for (var dx = -1; dx <= 1; dx++) {
                    for (var dy = -1; dy <= 1; dy++) {
                        tiles.push({x: px + dx, y: py + dy});
                    }
                }
                break;
            case 'Holy Smite':
                for (var i = -3; i <= 3; i++) {
                    tiles.push({x: px, y: py + i}, {x: px + i, y: py});
                }
                break;
            case 'Holy Beam':
                var dx = px - centerX;
                var dy = py - centerY;
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                for (var i = 1; i <= 8; i++) {
                    var tx = centerX + stepX * i;
                    var ty = centerY + stepY * i;
                    if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
                    tiles.push({x: tx, y: ty});
                }
                break;
            case 'Holy Thrust':
                var hdx = px - centerX;
                var hdy = py - centerY;
                var hStepX = hdx === 0 ? 0 : (hdx > 0 ? 1 : -1);
                var hStepY = hdy === 0 ? 0 : (hdy > 0 ? 1 : -1);
                for (var i = 1; i <= 8; i++) {
                    var htx = centerX + hStepX * i;
                    var hty = centerY + hStepY * i;
                    if (htx < 0 || htx >= Data.GRID_SIZE || hty < 0 || hty >= Data.GRID_SIZE) break;
                    tiles.push({x: htx, y: hty});
                }
                break;
            case 'North Pull':
                for (var i = -3; i <= 3; i++) {
                    tiles.push({x: px, y: py + i});
                }
                break;
            case 'South Pull':
                for (var i = -3; i <= 3; i++) {
                    tiles.push({x: px, y: py + i});
                }
                break;
            case 'West Pull':
                for (var i = -3; i <= 3; i++) {
                    tiles.push({x: px + i, y: py});
                }
                break;
            case 'East Pull':
                for (var i = -3; i <= 3; i++) {
                    tiles.push({x: px + i, y: py});
                }
                break;
            case 'Summon Shade':
            case 'Summon Portal':
            case 'Lesser Quagmire':
                break;
        }

        return tiles.filter(function(t) {
            return t.x >= 0 && t.x < Data.GRID_SIZE && t.y >= 0 && t.y < Data.GRID_SIZE;
        });
    },

    getNextAttack: function(boss) {
        if (!boss.attacks) return null;
        var ready = [];
        for (var i = 0; i < boss.attacks.length; i++) {
            if (boss.attacks[i].current <= 0) {
                ready.push(boss.attacks[i]);
            }
        }
        if (ready.length === 0) return null;
        return ready[Math.floor(Math.random() * ready.length)];
    },

    executeTelegraphedAttack: function(boss, attack, callback) {
        attack.current = attack.cooldown;

        State.addLog(boss.name + ' uses ' + attack.name, 'boss');

        var alertMessages = {
            'Spear Traps': 'Spear traps on the outer ring! Stay inside!',
            'Spear Thrust': 'Spear thrust in a plus shape! Dodge!',
            'Spear Slam': 'Spear slam in the center! Move away!',
            'Swamp Spit': 'Swamp spit incoming! Watch the tile!',
            'Lesser Quagmire': 'The ground beneath transforms!',
            'Wooden Thorns': 'Thorns erupt in lines! Dodge!',
            'Branch Slam': 'Branch slams down! Move away!',
            'Chain Pull': 'Chain pull incoming! Dodge the pull!',
            'Overgrow': 'Overgrowth in the center! Move away!',
            'Magma Collapse': 'Random tiles erupt with magma! Dodge!',
            'Magma Spit': 'Magma spit incoming! Move away!',
            'Overheat': 'Overheat in the center! Move away!',
            'Frozen Axe': 'Frozen axe swings around! Stay close or far!',
            'Frozen Stomp': 'Frozen stomp! Move away!',
            'Summon Shade': 'Shades are being summoned!',
            'Summon Portal': 'Portals are opening!',
            'Summon Void': 'Void bolt incoming! Move away!',
            'Holy Smite': 'Holy smite in a plus shape! Dodge!',
            'Holy Beam': 'Holy beam incoming! Move away!',
            'North Pull': 'Void pull from the north! Resist!',
            'South Pull': 'Void pull from the south! Resist!',
            'West Pull': 'Void pull from the west! Resist!',
            'East Pull': 'Void pull from the east! Resist!',
            'Holy Thrust': 'Holy thrust incoming! Dodge the line!'
        };

        if (alertMessages[attack.name]) {
            State.addLog(alertMessages[attack.name], 'telegraph');
        }

        switch (attack.name) {
            case 'Spear Traps': this.spearTraps(boss, attack, callback); break;
            case 'Spear Thrust': this.spearThrust(boss, attack, callback); break;
            case 'Spear Slam': this.spearSlam(boss, attack, callback); break;
            case 'Swamp Spit': this.swampSpit(boss, attack, callback); break;
            case 'Lesser Quagmire': this.lesserQuagmire(boss, callback); break;
            case 'Wooden Thorns': this.woodenThorns(boss, attack, callback); break;
            case 'Branch Slam': this.branchSlam(boss, attack, callback); break;
            case 'Overgrow': this.overgrow(boss, attack, callback); break;
            case 'Magma Collapse': this.magmaCollapse(boss, attack, callback); break;
            case 'Magma Spit': this.magmaSpit(boss, attack, callback); break;
            case 'Overheat': this.overheat(boss, attack, callback); break;
            case 'Frozen Axe': this.frozenAxe(boss, attack, callback); break;
            case 'Frozen Stomp': this.frozenStomp(boss, attack, callback); break;
            case 'Summon Shade': this.summonShade(boss, callback); break;
            case 'Summon Portal': this.summonPortalPair(boss, callback); break;
            case 'Summon Void': this.summonVoid(boss, attack, callback); break;
            case 'Holy Smite': this.holySmite(boss, attack, callback); break;
            case 'Holy Beam': this.holyBeam(boss, attack, callback); break;
            case 'Holy Thrust': this.holyThrust(boss, attack, callback); break;
            case 'North Pull': this.pullAttack(boss, attack, 0, -1, callback); break;
            case 'South Pull': this.pullAttack(boss, attack, 0, 1, callback); break;
            case 'West Pull': this.pullAttack(boss, attack, -1, 0, callback); break;
            case 'East Pull': this.pullAttack(boss, attack, 1, 0, callback); break;
            default: this.basicAttack(boss, callback);
        }
    },

    basicAttack: function(boss, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dist = AI.distance(centerX, centerY, State.player.x, State.player.y);
        if (dist <= size) {
            State.addLog(boss.name + ' uses Basic Attack', 'boss');
            State.animSlash(centerX, centerY, State.player.x, State.player.y, boss.color);
            Combat.dealDamageToPlayer(Math.floor(boss.damage * 0.5));
        }
        var dir = Grid.getDirection(centerX, centerY, State.player.x, State.player.y);
        boss.facing = dir;
        Grid.render();
        UI.updateAll();
        callback();
    },

    banditGangTurn: function(boss, callback) {
        var bandits = [];
        for (var i = 0; i < State.enemies.length; i++) {
            var e = State.enemies[i];
            if (e.hp > 0 && e.defId && Data.ENEMIES[e.defId] && (e.defId === 'tech_terry' || e.defId === 'shooter_sally' || e.defId === 'breaker_barry' || e.defId === 'molotov_mary')) {
                bandits.push(e);
            }
        }

        if (bandits.length === 0) {
            callback();
            return;
        }

        var gangState = State.banditGangState || boss;
        var self = this;

        if (gangState.banditTelegraph) {
            var telegraphBandit = gangState.banditTelegraph;
            gangState.banditTelegraph = null;
            if (telegraphBandit.hp > 0) {
                var storedTiles = telegraphBandit.telegraphTiles;
                var storedSnipeAxis = telegraphBandit._snipeAxis;
                var storedSnipePos = telegraphBandit._snipePos;
                var storedMolotovTarget = telegraphBandit._molotovTarget;
                this.banditSpecialAttack(telegraphBandit, function() {
                    telegraphBandit.telegraphTiles = null;
                    telegraphBandit.telegraph = null;
                    self.banditBasicActions(bandits, telegraphBandit, callback);
                });
            } else {
                telegraphBandit.telegraphTiles = null;
                telegraphBandit.telegraph = null;
                self.banditBasicActions(bandits, null, callback);
            }
            return;
        }

        var specialsBandit = bandits[Math.floor(Math.random() * bandits.length)];
        gangState.banditTelegraph = specialsBandit;
        this.showBanditTelegraph(specialsBandit);
        Grid.render();
        UI.updateAll();
        callback();
    },

    showBanditTelegraph: function(bandit) {
        var name = Data.ENEMIES[bandit.defId] ? Data.ENEMIES[bandit.defId].name : bandit.defId;
        var px = State.player.x;
        var py = State.player.y;
        var tiles = [];

        switch (bandit.defId) {
            case 'tech_terry':
                for (var dx = -1; dx <= 1; dx++) {
                    for (var dy = -1; dy <= 1; dy++) {
                        tiles.push({x: px + dx, y: py + dy});
                    }
                }
                break;
            case 'shooter_sally':
                bandit._snipeAxis = Math.random() < 0.5 ? 'row' : 'col';
                bandit._snipePos = bandit._snipeAxis === 'row' ? py : px;
                if (bandit._snipeAxis === 'row') {
                    for (var i = 0; i < Data.GRID_SIZE; i++) tiles.push({x: i, y: py});
                } else {
                    for (var i = 0; i < Data.GRID_SIZE; i++) tiles.push({x: px, y: i});
                }
                break;
            case 'breaker_barry':
                var dx = bandit.x - px;
                var dy = bandit.y - py;
                var pullX = Math.max(0, Math.min(Data.GRID_SIZE - 1, px + Math.sign(dx) * 2));
                var pullY = Math.max(0, Math.min(Data.GRID_SIZE - 1, py + Math.sign(dy) * 2));
                tiles.push({x: pullX, y: pullY});
                for (var bdx = -1; bdx <= 1; bdx++) {
                    for (var bdy = -1; bdy <= 1; bdy++) {
                        tiles.push({x: bandit.x + bdx, y: bandit.y + bdy});
                    }
                }
                bandit._pullTarget = {x: pullX, y: pullY};
                break;
            case 'molotov_mary':
                tiles.push({x: px, y: py});
                bandit._molotovTarget = {x: px, y: py};
                break;
        }

        if (tiles.length > 0) {
            bandit.telegraphTiles = tiles;
            var teleName = 'SPECIAL';
            if (bandit.defId === 'tech_terry') teleName = 'Bomb Throw';
            else if (bandit.defId === 'shooter_sally') teleName = 'Deadeye Snipe';
            else if (bandit.defId === 'breaker_barry') teleName = 'Chain Pull';
            else if (bandit.defId === 'molotov_mary') teleName = 'Desert Flames';
            bandit.telegraph = { name: teleName };
            State.animAoE(tiles, bandit.color);
        }
        State.addLog(name + ' telegraphs a special attack!', 'telegraph');
        State.addFloatingText(bandit.x, bandit.y, 'TELEGRAPH!', '#ff4444');
    },

    banditBasicActions: function(bandits, skipBandit, callback) {
        var self = this;
        var actions = [];

        for (var i = 0; i < bandits.length; i++) {
            if (bandits[i] === skipBandit || bandits[i].hp <= 0) continue;
            actions.push(bandits[i]);
        }

        var executed = 0;
        var maxActions = 2;

        function doNext() {
            if (executed >= maxActions || actions.length === 0) {
                Grid.render();
                UI.updateAll();
                callback();
                return;
            }

            var bandit = actions.shift();
            if (bandit.hp <= 0) {
                doNext();
                return;
            }

            var dist = AI.distance(bandit.x, bandit.y, State.player.x, State.player.y);
            var name = Data.ENEMIES[bandit.defId] ? Data.ENEMIES[bandit.defId].name : bandit.defId;

            if (bandit.defId === 'breaker_barry' && dist <= 1) {
                State.addLog(name + ' attacks!', 'boss');
                State.animSlash(bandit.x, bandit.y, State.player.x, State.player.y, bandit.color);
                Combat.dealDamageToPlayer(bandit.damage);
                executed++;
                doNext();
            } else if (bandit.defId === 'tech_terry') {
                var attempts = 0;
                var sx, sy;
                do {
                    sx = bandit.x + Math.floor(Math.random() * 3) - 1;
                    sy = bandit.y + Math.floor(Math.random() * 3) - 1;
                    attempts++;
                } while (attempts < 10 && (sx < 0 || sx >= Data.GRID_SIZE || sy < 0 || sy >= Data.GRID_SIZE || Stages.isReserved(sx, sy)));
                if (attempts < 10) {
                    State.enemies.push({
                        x: sx, y: sy, hp: 50, maxHp: 50,
                        damage: 15, defId: 'mini_robot',
                        facing: 'down', frozen: 0, freezeImmune: false,
                        freezeImmuneTurns: 0, poison: null,
                        isBoss: false, color: '#aaaaaa',
                        isSummon: true, moveSpeed: 1
                    });
                    State.addFloatingText(sx, sy, 'ROBOT!', '#aaaaaa');
                }
                executed++;
                doNext();
            } else if ((bandit.defId === 'shooter_sally' || bandit.defId === 'molotov_mary') && dist <= 4) {
                State.addLog(name + ' shoots!', 'boss');
                State.animProjectile(bandit.x, bandit.y, State.player.x, State.player.y, bandit.color);
                Combat.dealDamageToPlayer(bandit.damage);
                executed++;
                doNext();
            } else {
                AI.moveToward(bandit, State.player.x, State.player.y, function() {
                    executed++;
                    doNext();
                });
            }
        }
        doNext();
    },

    banditSpecialAttack: function(bandit, callback) {
        var name = Data.ENEMIES[bandit.defId] ? Data.ENEMIES[bandit.defId].name : bandit.defId;
        var px = State.player.x;
        var py = State.player.y;

        switch (bandit.defId) {
            case 'tech_terry':
                State.addLog(name + ' uses Bomb Throw!', 'boss');
                var tiles = bandit.telegraphTiles || [];
                if (tiles.length === 0) {
                    for (var dx = -1; dx <= 1; dx++) {
                        for (var dy = -1; dy <= 1; dy++) {
                            tiles.push({x: State.player.x + dx, y: State.player.y + dy});
                        }
                    }
                }
                State.animAoE(tiles, '#ffaa00');
                for (var j = 0; j < tiles.length; j++) {
                    if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                        Combat.dealDamageToPlayer(120);
                    }
                }
                State.addFloatingText(State.player.x, State.player.y, 'BOMB!', '#ffaa00');
                break;
            case 'shooter_sally':
                State.addLog(name + ' uses Deadeye Snipe!', 'boss');
                var snipeAxis = bandit._snipeAxis || 'row';
                var snipePos = bandit._snipePos !== undefined ? bandit._snipePos : py;
                var snipeTiles = [];
                if (snipeAxis === 'row') {
                    for (var i = 0; i < Data.GRID_SIZE; i++) snipeTiles.push({x: i, y: snipePos});
                } else {
                    for (var i = 0; i < Data.GRID_SIZE; i++) snipeTiles.push({x: snipePos, y: i});
                }
                var teleSpot = snipeTiles[Math.floor(Math.random() * snipeTiles.length)];
                State.animMove(bandit.x, bandit.y, teleSpot.x, teleSpot.y, bandit.color, '#ff0000');
                bandit.x = teleSpot.x;
                bandit.y = teleSpot.y;
                State.animBeam(bandit.x, bandit.y, snipeTiles[snipeTiles.length - 1].x, snipeTiles[snipeTiles.length - 1].y, '#ff4444');
                for (var j = 0; j < snipeTiles.length; j++) {
                    if (snipeTiles[j].x === px && snipeTiles[j].y === py) {
                        Combat.dealDamageToPlayer(130);
                    }
                }
                State.addFloatingText(px, py, 'SNIPE!', '#ff4444');
                bandit._snipeAxis = null;
                bandit._snipePos = undefined;
                break;
            case 'breaker_barry':
                State.addLog(name + ' uses Chain Pull!', 'boss');
                var pullTarget = bandit._pullTarget || {x: px, y: py};
                State.animMove(px, py, pullTarget.x, pullTarget.y, '#ff4444');
                State.player.x = pullTarget.x;
                State.player.y = pullTarget.y;
                State.addFloatingText(pullTarget.x, pullTarget.y, 'PULLED!', '#ff4444');
                Combat.dealDamageToPlayer(40);
                var bDist = AI.distance(State.player.x, State.player.y, bandit.x, bandit.y);
                if (bDist <= 1.5) {
                    State.player.bleed = {damage: 15, turns: 3};
                    State.addFloatingText(State.player.x, State.player.y, 'CHAINED!', '#ff4444');
                }
                bandit._pullTarget = null;
                break;
            case 'molotov_mary':
                State.addLog(name + ' uses Desert Flames!', 'boss');
                var target = bandit._molotovTarget || {x: px, y: py};
                State.animProjectile(bandit.x, bandit.y, target.x, target.y, '#ff4400');
                for (var j = -1; j <= 1; j++) {
                    for (var k = -1; k <= 1; k++) {
                        var fx = target.x + j;
                        var fy = target.y + k;
                        if (fx >= 0 && fx < Data.GRID_SIZE && fy >= 0 && fy < Data.GRID_SIZE) {
                            for (var i = State.obstacles.length - 1; i >= 0; i--) {
                                if (State.obstacles[i].x === fx && State.obstacles[i].y === fy) {
                                    State.obstacles.splice(i, 1);
                                }
                            }
                            State.obstacles.push({
                                x: fx, y: fy, id: 'lava', hp: -1,
                                destructible: false, blocksMove: false, color: '#ff4400'
                            });
                        }
                    }
                }
                if (px >= target.x - 1 && px <= target.x + 1 && py >= target.y - 1 && py <= target.y + 1) {
                    Combat.dealDamageToPlayer(120);
                }
                State.addFloatingText(target.x, target.y, 'FIRE!', '#ff4400');
                bandit._molotovTarget = null;
                break;
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    bossBasicMoveAndAttack: function(boss, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dist = AI.distance(centerX, centerY, State.player.x, State.player.y);

        if (dist <= size) {
            State.addLog(boss.name + ' uses Basic Attack', 'boss');
            State.animSlash(centerX, centerY, State.player.x, State.player.y, boss.color);
            Combat.dealDamageToPlayer(Math.floor(boss.damage * 0.5));
            var dir = Grid.getDirection(centerX, centerY, State.player.x, State.player.y);
            boss.facing = dir;
        } else if (!boss.stationary) {
            var dx = State.player.x - centerX;
            var dy = State.player.y - centerY;
            var moveX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
            var moveY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

            var newX = boss.x + moveX;
            var newY = boss.y + moveY;
            if (newX >= 0 && newX < Data.GRID_SIZE && newY >= 0 && newY < Data.GRID_SIZE && !State.isBlocked(newX, newY)) {
                State.animMove(boss.x, boss.y, newX, newY, boss.color, '#ff0000');
                boss.x = newX;
                boss.y = newY;
            }
            var dir2 = Grid.getDirection(boss.x + Math.floor(size / 2), boss.y + Math.floor(size / 2), State.player.x, State.player.y);
            boss.facing = dir2;
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    groundSlam: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var tiles = [
            { x: centerX, y: centerY },
            { x: centerX + 1, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX, y: centerY + 1 },
            { x: centerX, y: centerY - 1 }
        ];

        State.animCross(centerX, centerY, boss.color);

        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            if (t.x === State.player.x && t.y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    boulderThrow: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

        var lastX = centerX + stepX * attack.range;
        var lastY = centerY + stepY * attack.range;
        lastX = Math.max(0, Math.min(Data.GRID_SIZE - 1, lastX));
        lastY = Math.max(0, Math.min(Data.GRID_SIZE - 1, lastY));
        State.animProjectile(centerX, centerY, lastX, lastY, boss.color);

        for (var i = 1; i <= attack.range; i++) {
            var tx = centerX + stepX * i;
            var ty = centerY + stepY * i;
            if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
            if (State.isBlocked(tx, ty) && !State.getEnemyAt(tx, ty)) break;
            if (tx === State.player.x && ty === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
                break;
            }
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    summonRubble: function(boss, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dirs = [
            { x: -1, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 1 }, { x: 1, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];

        var count = 0;
        var playerAdjOpen = 0;
        for (var i = 0; i < dirs.length; i++) {
            var px = State.player.x + dirs[i].x;
            var py = State.player.y + dirs[i].y;
            if (px >= 0 && px < Data.GRID_SIZE && py >= 0 && py < Data.GRID_SIZE) {
                if (!State.isBlocked(px, py)) playerAdjOpen++;
            }
        }

        for (var i = 0; i < dirs.length && count < 2; i++) {
            var nx = State.player.x + dirs[i].x;
            var ny = State.player.y + dirs[i].y;
            if (nx >= 0 && nx < Data.GRID_SIZE && ny >= 0 && ny < Data.GRID_SIZE) {
                if (!Stages.isReserved(nx, ny) && !State.isBlocked(nx, ny) && playerAdjOpen > 3) {
                    State.obstacles.push({
                        x: nx, y: ny,
                        id: 'wall', hp: 150, destructible: true,
                        blocksMove: true, blocksLOS: true, color: '#886644'
                    });
                    count++;
                    playerAdjOpen--;
                }
            }
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    cloneWraith: function(boss, callback) {
        var dirs = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];

        State.addLog(boss.name + ' uses Clone', 'boss');

        for (var i = 0; i < dirs.length; i++) {
            var nx = boss.x + dirs[i].x;
            var ny = boss.y + dirs[i].y;
            if (!State.isBlockedForEnemy(nx, ny)) {
                State.enemies.push({
                    x: nx, y: ny,
                    hp: 30, maxHp: 30,
                    damage: 5,
                    defId: 'shadow',
                    facing: 'down',
                    frozen: 0,
                    freezeImmune: false,
                    freezeImmuneTurns: 0,
                    poison: null,
                    isBoss: false,
                    color: '#332244',
                    isSummon: true,
                    moveSpeed: 1
                });
                State.addFloatingText(nx, ny, 'CLONE!', '#443366');
                break;
            }
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    wingGust: function(boss, callback) {
        var pushDir = Math.floor(Math.random() * 4);
        var dx = [0, 0, -1, 1][pushDir];
        var dy = [-1, 1, 0, 0][pushDir];

        State.addLog(boss.name + ' uses Wing Gust', 'boss');

        var newX = State.player.x;
        var newY = State.player.y;

        for (var i = 0; i < 3; i++) {
            var nx = newX + dx;
            var ny = newY + dy;
            if (nx >= 0 && nx < Data.GRID_SIZE && ny >= 0 && ny < Data.GRID_SIZE) {
                if (!State.isBlocked(nx, ny)) {
                    newX = nx;
                    newY = ny;
                }
            }
        }

        State.player.x = newX;
        State.player.y = newY;
        State.addFloatingText(newX, newY, 'PUSHED!', '#2244aa');

        Grid.render();
        UI.updateAll();
        callback();
    },

    tailSweep: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dirs = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        State.animRing(centerX, centerY, boss.color);
        for (var i = 0; i < dirs.length; i++) {
            var tx = centerX + dirs[i].x;
            var ty = centerY + dirs[i].y;
            if (tx === State.player.x && ty === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    rootGrasp: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dirs = [
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }
        ];
        for (var i = 0; i < dirs.length; i++) {
            var tx = centerX + dirs[i].x;
            var ty = centerY + dirs[i].y;
            if (tx === State.player.x && ty === State.player.y) {
                State.addLog('Roots entangle the player! Cannot move next turn!', 'boss');
                State.player.chilled = Math.max(State.player.chilled, 2);
                State.addFloatingText(State.player.x, State.player.y, 'ENTANGLED!', '#446622');
            }
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    summonSaplings: function(boss, callback) {
        var dirs = [
            { x: -1, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 1 }, { x: 1, y: 1 }
        ];
        var count = 0;
        for (var i = 0; i < dirs.length && count < 2; i++) {
            var nx = boss.x + dirs[i].x;
            var ny = boss.y + dirs[i].y;
            if (nx >= 0 && nx < Data.GRID_SIZE && ny >= 0 && ny < Data.GRID_SIZE) {
                if (!Stages.isReserved(nx, ny) && !State.isBlocked(nx, ny)) {
                    State.enemies.push({
                        x: nx, y: ny,
                        hp: 80, maxHp: 80,
                        damage: 15,
                        defId: 'treant',
                        facing: 'down',
                        frozen: 0,
                        freezeImmune: false,
                        freezeImmuneTurns: 0,
                        poison: null,
                        isBoss: false,
                        color: '#446622',
                        isSummon: true,
                        moveSpeed: Data.ENEMIES.treant.moveSpeed
                    });
                    State.addFloatingText(nx, ny, 'SAPLING!', '#446622');
                    count++;
                }
            }
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    aoeAttack: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var range = attack.range || 2;
        var aoeTiles = [];
        for (var dy = -range; dy <= range; dy++) {
            for (var dx = -range; dx <= range; dx++) {
                if (Math.abs(dx) + Math.abs(dy) <= range) {
                    aoeTiles.push({ x: centerX + dx, y: centerY + dy });
                }
            }
        }
        State.animAoE(aoeTiles, boss.color);
        for (var dy2 = -range; dy2 <= range; dy2++) {
            for (var dx2 = -range; dx2 <= range; dx2++) {
                if (Math.abs(dx2) + Math.abs(dy2) <= range) {
                    var tx = centerX + dx2;
                    var ty = centerY + dy2;
                    if (tx === State.player.x && ty === State.player.y) {
                        Combat.dealDamageToPlayer(attack.damage);
                    }
                }
            }
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    multiDirection: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var offsets = [
            { x: 2, y: 0 }, { x: -2, y: 0 },
            { x: 0, y: 2 }, { x: 0, y: -2 }
        ];
        var multiTiles = [];
        for (var i = 0; i < offsets.length; i++) {
            multiTiles.push({ x: centerX + offsets[i].x, y: centerY + offsets[i].y });
            var tx = centerX + offsets[i].x;
            var ty = centerY + offsets[i].y;
            if (tx === State.player.x && ty === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        State.animAoE(multiTiles, boss.color);
        Grid.render();
        UI.updateAll();
        callback();
    },

    selfHeal: function(boss, callback) {
        var healAmount = Math.floor(boss.maxHp * 0.15);
        boss.hp = Math.min(boss.maxHp, boss.hp + healAmount);
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        State.addFloatingText(centerX, centerY, '+' + healAmount + ' HP', '#44ff44');
        State.addLog(boss.name + ' heals for ' + healAmount + ' HP', 'boss');
        Grid.render();
        UI.updateAll();
        callback();
    },

    coneAttack: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var dirX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var dirY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

        var lastX = centerX + dirX * attack.range;
        var lastY = centerY + dirY * attack.range;
        lastX = Math.max(0, Math.min(Data.GRID_SIZE - 1, lastX));
        lastY = Math.max(0, Math.min(Data.GRID_SIZE - 1, lastY));
        State.animSlash(centerX, centerY, lastX, lastY, boss.color);

        for (var i = 1; i <= attack.range; i++) {
            for (var spread = -1; spread <= 1; spread++) {
                var tx, ty;
                if (dirX !== 0) {
                    tx = centerX + dirX * i;
                    ty = centerY + spread;
                } else {
                    tx = centerX + spread;
                    ty = centerY + dirY * i;
                }
                if (tx === State.player.x && ty === State.player.y) {
                    Combat.dealDamageToPlayer(attack.damage);
                }
            }
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    burrow: function(boss, callback) {
        boss.untargetable = true;
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        State.addFloatingText(centerX, centerY, 'BURROWED!', '#ccaa44');

        setTimeout(function() {
            if (boss.hp <= 0) {
                boss.untargetable = false;
                Grid.render();
                UI.updateAll();
                callback();
                return;
            }
            var oldCenterX = boss.x + Math.floor(size / 2);
            var oldCenterY = boss.y + Math.floor(size / 2);
            var attempts = 0;
            do {
                boss.x = Math.floor(Math.random() * (Data.GRID_SIZE - size + 1));
                boss.y = Math.floor(Math.random() * (Data.GRID_SIZE - size + 1));
                attempts++;
            } while (attempts < 100 && (Stages.isReserved(boss.x, boss.y) || Stages.isReserved(boss.x + size - 1, boss.y) || Stages.isReserved(boss.x, boss.y + size - 1) || Stages.isReserved(boss.x + size - 1, boss.y + size - 1)));
            boss.untargetable = false;

            var newCenterX = boss.x + Math.floor(size / 2);
            var newCenterY = boss.y + Math.floor(size / 2);
            State.animMove(oldCenterX, oldCenterY, newCenterX, newCenterY, boss.color, '#ff0000');
            var dist = Math.abs(State.player.x - newCenterX) + Math.abs(State.player.y - newCenterY);
            if (dist <= 2) {
                Combat.dealDamageToPlayer(100);
            }
            State.addFloatingText(newCenterX, newCenterY, 'EMERGES!', '#ccaa44');
            Grid.render();
            UI.updateAll();
            callback();
        }, 800);
    },

    executeLine: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        State.animBeam(centerX, centerY, centerX + stepX * 6, centerY + stepY * 6, boss.color);
        for (var i = 1; i <= 6; i++) {
            var tx = centerX + stepX * i;
            var ty = centerY + stepY * i;
            if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
            if (tx === State.player.x && ty === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
                break;
            }
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    shieldSelf: function(boss, callback) {
        boss.shield = (boss.shield || 0) + 200;
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        State.addFloatingText(centerX, centerY, '+200 SHIELD', '#ffdd88');
        State.addLog(boss.name + ' gains a shield!', 'boss');
        Grid.render();
        UI.updateAll();
        callback();
    },

    singleTarget: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

        var lastX = centerX + stepX * attack.range;
        var lastY = centerY + stepY * attack.range;
        lastX = Math.max(0, Math.min(Data.GRID_SIZE - 1, lastX));
        lastY = Math.max(0, Math.min(Data.GRID_SIZE - 1, lastY));
        State.animProjectile(centerX, centerY, lastX, lastY, boss.color);

        for (var i = 1; i <= attack.range; i++) {
            var tx = centerX + stepX * i;
            var ty = centerY + stepY * i;
            if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
            if (State.isBlocked(tx, ty) && !State.getEnemyAt(tx, ty)) break;
            if (tx === State.player.x && ty === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
                break;
            }
        }
        Grid.render();
        UI.updateAll();
        callback();
    },

    // === OVERSEER ATTACKS ===
    spearTraps: function(boss, attack, callback) {
        var tiles = [];
        for (var i = 0; i < Data.GRID_SIZE; i++) {
            tiles.push({x: i, y: 0}, {x: i, y: 7}, {x: 0, y: i}, {x: 7, y: i});
        }
        State.animAoE(tiles, '#ff8800');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    spearThrust: function(boss, attack, callback) {
        var tiles = [];
        for (var i = 0; i < Data.GRID_SIZE; i++) {
            tiles.push({x: i, y: 3}, {x: i, y: 4}, {x: 3, y: i}, {x: 4, y: i});
        }
        State.animAoE(tiles, '#ff8800');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    spearSlam: function(boss, attack, callback) {
        var tiles = [];
        for (var dx = 2; dx <= 5; dx++) {
            for (var dy = 2; dy <= 5; dy++) {
                tiles.push({x: dx, y: dy});
            }
        }
        State.animAoE(tiles, '#ff8800');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    // === MUD COLOSSUS ATTACKS ===
    swampSpit: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var tile = boss.telegraphTiles && boss.telegraphTiles.length > 0 ? boss.telegraphTiles[0] : {x: State.player.x, y: State.player.y};
        State.animProjectile(centerX, centerY, tile.x, tile.y, '#335522');
        for (var i = State.obstacles.length - 1; i >= 0; i--) {
            if (State.obstacles[i].x === tile.x && State.obstacles[i].y === tile.y) {
                State.obstacles.splice(i, 1);
            }
        }
        State.obstacles.push({
            x: tile.x, y: tile.y, id: 'swamp_pool', hp: -1,
            destructible: false, blocksMove: false, color: '#335522'
        });
        State.addFloatingText(tile.x, tile.y, 'SWAMP!', '#335522');
        Grid.render(); UI.updateAll(); callback();
    },

    lesserQuagmire: function(boss, callback) {
        var size = boss.size || 2;
        for (var dx = 0; dx < size; dx++) {
            for (var dy = 0; dy < size; dy++) {
                var tx = boss.x + dx;
                var ty = boss.y + dy;
                for (var i = State.obstacles.length - 1; i >= 0; i--) {
                    if (State.obstacles[i].x === tx && State.obstacles[i].y === ty) {
                        State.obstacles.splice(i, 1);
                    }
                }
                State.obstacles.push({
                    x: tx, y: ty, id: 'swamp_pool', hp: -1,
                    destructible: false, blocksMove: false, color: '#335522'
                });
            }
        }
        State.addFloatingText(boss.x, boss.y, 'QUAGMIRE!', '#335522');
        Grid.render(); UI.updateAll(); callback();
    },

    // === GREATWOOD TITAN ATTACKS ===
    woodenThorns: function(boss, attack, callback) {
        var row = boss._thornsRow !== undefined ? boss._thornsRow : 1 + Math.floor(Math.random() * 6);
        var col = boss._thornsCol !== undefined ? boss._thornsCol : 1 + Math.floor(Math.random() * 6);
        boss._thornsRow = undefined;
        boss._thornsCol = undefined;
        var tiles = [];
        for (var i = 0; i < Data.GRID_SIZE; i++) {
            tiles.push({x: i, y: row}, {x: col, y: i});
        }
        State.animAoE(tiles, '#446622');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    branchSlam: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#446622');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    overgrow: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#446622');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    // === MOLTEN CHAOS ATTACKS ===
    magmaCollapse: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#ff4400');
        for (var j = 0; j < tiles.length; j++) {
            var t = tiles[j];
            if (t.x === State.player.x && t.y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
                State.player.bleed = {damage: 10, turns: 2};
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    magmaSpit: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#ff4400');
        for (var j = 0; j < tiles.length; j++) {
            var t = tiles[j];
            if (t.x === State.player.x && t.y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
                State.player.bleed = {damage: 10, turns: 2};
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    overheat: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#ff4400');
        for (var j = 0; j < tiles.length; j++) {
            var t = tiles[j];
            if (t.x === State.player.x && t.y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
                State.player.bleed = {damage: 10, turns: 2};
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    // === FROST DWARF ATTACKS ===
    frozenAxe: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var tiles = [];
        for (var dx = -2; dx <= 2; dx++) {
            for (var dy = -2; dy <= 2; dy++) {
                if (Math.abs(dx) + Math.abs(dy) <= 2 && (dx !== 0 || dy !== 0)) {
                    tiles.push({x: centerX + dx, y: centerY + dy});
                }
            }
        }
        State.animRing(centerX, centerY, '#88bbdd');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    frozenStomp: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#88bbdd');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    // === FIRST CLONE ATTACKS ===
    summonShade: function(boss, callback) {
        var attempts = 0;
        var cx, cy;
        do {
            cx = Math.floor(Math.random() * Data.GRID_SIZE);
            cy = Math.floor(Math.random() * Data.GRID_SIZE);
            attempts++;
        } while (attempts < 100 && Stages.isReserved(cx, cy));
        State.enemies.push({
            x: cx, y: cy, hp: 150, maxHp: 150,
            damage: 20, defId: 'shade',
            facing: 'down', frozen: 0, freezeImmune: false,
            freezeImmuneTurns: 0, poison: null,
            isBoss: false, color: '#443366',
            isSummon: true, moveSpeed: 1
        });
        State.addFloatingText(cx, cy, 'SHADE!', '#6633aa');
        Grid.render(); UI.updateAll(); callback();
    },

    summonPortalPair: function(boss, callback) {
        var p1 = Stages.findOpenTile();
        var p2 = Stages.findOpenTile();
        if (p1 && p2) {
            State.obstacles.push({
                x: p1.x, y: p1.y, id: 'portal', hp: -1,
                destructible: false, blocksMove: false, color: '#cc44ff'
            });
            State.obstacles.push({
                x: p2.x, y: p2.y, id: 'portal', hp: -1,
                destructible: false, blocksMove: false, color: '#cc44ff'
            });
            State.addFloatingText(p1.x, p1.y, 'PORTAL!', '#cc44ff');
        }
        Grid.render(); UI.updateAll(); callback();
    },

    summonVoid: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#6633aa');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    // === LIGHT GUARDIAN ATTACKS ===
    holySmite: function(boss, attack, callback) {
        var tiles = boss.telegraphTiles || [];
        State.animAoE(tiles, '#ffddaa');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    holyBeam: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        var tiles = [];
        for (var i = 1; i <= 8; i++) {
            var tx = centerX + stepX * i;
            var ty = centerY + stepY * i;
            if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
            tiles.push({x: tx, y: ty});
        }
        State.animBeam(centerX, centerY, tiles[tiles.length - 1].x, tiles[tiles.length - 1].y, '#ffddaa');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    pullAttack: function(boss, attack, dx, dy, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var px = State.player.x;
        var py = State.player.y;
        var tiles = [];
        for (var i = -3; i <= 3; i++) {
            if (dx !== 0) tiles.push({x: px + i, y: py});
            if (dy !== 0) tiles.push({x: px, y: py + i});
        }
        State.animAoE(tiles, '#6633aa');
        var inLine = false;
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === px && tiles[j].y === py) {
                inLine = true;
                break;
            }
        }
        if (inLine) {
            Combat.dealDamageToPlayer(attack.damage);
            var pullX = px + dx * 2;
            var pullY = py + dy * 2;
            pullX = Math.max(0, Math.min(Data.GRID_SIZE - 1, pullX));
            pullY = Math.max(0, Math.min(Data.GRID_SIZE - 1, pullY));
            if (!State.isBlocked(pullX, pullY)) {
                State.player.x = pullX;
                State.player.y = pullY;
                State.addFloatingText(pullX, pullY, 'PULLED!', '#6633aa');
            }
        }
        Grid.render(); UI.updateAll(); callback();
    },

    holyThrust: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        var tiles = [];
        for (var i = 1; i <= 8; i++) {
            var tx = centerX + stepX * i;
            var ty = centerY + stepY * i;
            if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
            tiles.push({x: tx, y: ty});
        }
        State.animBeam(centerX, centerY, tiles[tiles.length - 1].x, tiles[tiles.length - 1].y, '#ffddaa');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
        var teleportAttempts = 0;
        var tx, ty;
        do {
            tx = Math.floor(Math.random() * Data.GRID_SIZE);
            ty = Math.floor(Math.random() * Data.GRID_SIZE);
            teleportAttempts++;
        } while (teleportAttempts < 100 && (Stages.isReserved(tx, ty) || AI.distance(tx, ty, State.player.x, State.player.y) < 2));
        var oldX = centerX;
        var oldY = centerY;
        boss.x = tx;
        boss.y = ty;
        State.animMove(oldX, oldY, tx, ty, boss.color, '#ffddaa');
        State.addFloatingText(tx, ty, 'THRUST!', '#ffddaa');
        Grid.render(); UI.updateAll(); callback();
    }
};
