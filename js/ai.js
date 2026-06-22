var AI = {
    findPath: function(startX, startY, endX, endY, maxSteps) {
        var queue = [{ x: startX, y: startY, path: [] }];
        var visited = {};
        visited[startX + ',' + startY] = true;
        var dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

        while (queue.length > 0) {
            var current = queue.shift();
            if (current.path.length >= maxSteps) continue;

            for (var i = 0; i < dirs.length; i++) {
                var nx = current.x + dirs[i].x;
                var ny = current.y + dirs[i].y;
                var key = nx + ',' + ny;

                if (nx < 0 || nx >= Data.GRID_SIZE || ny < 0 || ny >= Data.GRID_SIZE) continue;
                if (visited[key]) continue;
                if (State.isBlocked(nx, ny)) continue;
                if (State.getEnemyAt(nx, ny)) continue;

                var newPath = current.path.concat([{ x: nx, y: ny }]);
                if (nx === endX && ny === endY) return newPath;

                visited[key] = true;
                queue.push({ x: nx, y: ny, path: newPath });
            }
        }
        return null;
    },

    getMovableTiles: function() {
        var tiles = [];
        var energy = State.player.energy;
        var px = State.player.x;
        var py = State.player.y;
        var dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        var visited = {};
        visited[px + ',' + py] = true;
        var queue = [{ x: px, y: py, cost: 0 }];

        while (queue.length > 0) {
            var current = queue.shift();
            if (current.cost >= energy) continue;

            for (var i = 0; i < dirs.length; i++) {
                var nx = current.x + dirs[i].x;
                var ny = current.y + dirs[i].y;
                var key = nx + ',' + ny;

                if (nx < 0 || nx >= Data.GRID_SIZE || ny < 0 || ny >= Data.GRID_SIZE) continue;
                if (visited[key]) continue;
                if (State.isBlocked(nx, ny)) continue;
                if (State.getEnemyAt(nx, ny)) continue;

                var moveCost = 1;
                for (var j = 0; j < State.obstacles.length; j++) {
                    if (State.obstacles[j].x === nx && State.obstacles[j].y === ny && State.obstacles[j].id === 'water') {
                        moveCost = 2;
                        break;
                    }
                }

                if (State.player.chilled > 0) {
                    moveCost *= 2;
                }

                var totalCost = current.cost + moveCost;
                if (totalCost <= energy) {
                    visited[key] = true;
                    tiles.push({ x: nx, y: ny, cost: totalCost });
                    queue.push({ x: nx, y: ny, cost: totalCost });
                }
            }
        }
        return tiles;
    },

    processEnemyTurns: function() {
        var alive = State.getAliveEnemies();
        var index = 0;

        function processNext() {
            if (index >= alive.length) {
                Combat.startNewTurn();
                return;
            }

            var enemy = alive[index];
            index++;

            if (enemy.hp <= 0) {
                processNext();
                return;
            }

            var moveSpeed = enemy.moveSpeed || 1;
            enemy._moveAccum = (enemy._moveAccum || 0) + moveSpeed;
            var movesLeft = Math.floor(enemy._moveAccum);
            enemy._moveAccum -= movesLeft;
            if (movesLeft < 1) {
                State.addFloatingText(enemy.x, enemy.y, 'WAIT', '#888888');
                processNext();
                return;
            }

            function doMove() {
                if (enemy.hp <= 0 || movesLeft <= 0) {
                    processNext();
                    return;
                }
                movesLeft--;
                if (enemy.frozen > 0) {
                    State.addFloatingText(enemy.x, enemy.y, 'FROZEN', '#88ddff');
                    if (enemy.isBoss) {
                        Boss.processTurn(enemy, function() { processNext(); });
                    } else {
                        processNext();
                    }
                    return;
                }
                if (enemy.isBoss) {
                    Boss.processTurn(enemy, function() {
                        if (movesLeft > 0 && enemy.hp > 0) {
                            doMove();
                        } else {
                            processNext();
                        }
                    });
                } else {
                    AI.processEnemy(enemy, function() {
                        if (movesLeft > 0 && enemy.hp > 0) {
                            doMove();
                        } else {
                            processNext();
                        }
                    });
                }
            }
            doMove();
        }

        processNext();
    },

    processEnemy: function(enemy, callback) {
        var def = Data.ENEMIES[enemy.defId];
        if (!def) { callback(); return; }

        if (enemy.isElite) {
            enemy.eliteTurnCount = (enemy.eliteTurnCount || 0) + 1;
            if (enemy.eliteTelegraphing) {
                enemy.eliteTelegraphing = false;
                enemy.eliteTelegraphName = null;
                enemy.eliteTelegraphTiles = null;
                var self = this;
                this.executeEliteSpecial(enemy, function() {
                    var dist2 = self.distance(enemy.x, enemy.y, State.player.x, State.player.y);
                    if (def.type === 'melee') {
                        if (dist2 === 1) {
                            self.meleeAttack(enemy, callback);
                        } else {
                            self.moveToward(enemy, State.player.x, State.player.y, callback);
                        }
                    } else if (def.type === 'ranged') {
                        if (dist2 <= 3 && dist2 >= 2) {
                            self.rangedAttack(enemy, callback);
                        } else if (dist2 < 2) {
                            self.rangedRetreat(enemy, State.player.x, State.player.y, callback);
                        } else {
                            self.moveToward(enemy, State.player.x, State.player.y, callback);
                        }
                    } else {
                        callback();
                    }
                });
                return;
            }
            if (enemy.eliteTurnCount >= Data.ELITE_SPECIAL_INTERVAL) {
                enemy.eliteTurnCount = 0;
                enemy.eliteTelegraphing = true;
                var eliteSpecial = Data.ELITE_SPECIALS[enemy.defId];
                if (eliteSpecial) {
                    enemy.eliteTelegraphName = eliteSpecial.name;
                    enemy.eliteTelegraphTiles = AI.getEliteTelegraphTiles(enemy, eliteSpecial);
                    State.addLog('[ELITE] ' + def.name + ' telegraphs: ' + eliteSpecial.name + '!', 'telegraph');
                    State.addFloatingText(enemy.x, enemy.y, eliteSpecial.name.toUpperCase() + '!', '#ff4444');
                    Grid.render();
                    UI.updateAll();
                }
            }
        }

        var dist = this.distance(enemy.x, enemy.y, State.player.x, State.player.y);

        if (def.behavior === 'stationary' || enemy.isStationary) {
            if (enemy.defId === 'ice_crystal') {
                this.iceCrystalAttack(enemy, callback);
            } else {
                callback();
            }
            return;
        }

        if (def.type === 'melee') {
            if (dist === 1) {
                this.meleeAttack(enemy, callback);
            } else {
                this.moveToward(enemy, State.player.x, State.player.y, callback);
            }
        } else if (def.type === 'ranged') {
            if (dist <= 3 && dist >= 2) {
                this.rangedAttack(enemy, callback);
            } else if (dist < 2) {
                this.rangedRetreat(enemy, State.player.x, State.player.y, callback);
            } else {
                this.moveToward(enemy, State.player.x, State.player.y, callback);
            }
        } else if (def.type === 'summoner') {
            enemy.summonTimer = (enemy.summonTimer || 0) + 1;
            if (enemy.summonTimer >= 2) {
                enemy.summonTimer = 0;
                if (enemy.defId === 'tech_terry') {
                    this.summonMiniRobots(enemy);
                } else {
                    this.summonSkeleton(enemy);
                }
                callback();
            } else if (dist <= 1) {
                this.meleeAttack(enemy, callback);
            } else {
                callback();
            }
        } else if (def.type === 'phaser') {
            enemy.teleportTimer = (enemy.teleportTimer || 0) + 1;
            if (enemy.teleportTimer >= 3) {
                enemy.teleportTimer = 0;
                this.teleportNear(enemy);
                if (dist <= 1) {
                    this.meleeAttack(enemy, callback);
                } else {
                    callback();
                }
            } else if (dist === 1) {
                this.meleeAttack(enemy, callback);
            } else {
                this.moveToward(enemy, State.player.x, State.player.y, callback);
            }
        } else {
            callback();
        }
    },

    iceCrystalAttack: function(enemy, callback) {
        var tiles = [];
        for (var i = -7; i <= 7; i++) {
            tiles.push({x: enemy.x, y: enemy.y + i});
            tiles.push({x: enemy.x + i, y: enemy.y});
        }
        State.animAoE(tiles, '#aaeeff');
        for (var j = 0; j < tiles.length; j++) {
            if (tiles[j].x === State.player.x && tiles[j].y === State.player.y) {
                Combat.dealDamageToPlayer(enemy.damage);
            }
        }
        State.addFloatingText(enemy.x, enemy.y, 'CRYSTAL PULSE!', '#aaeeff');
        Grid.render();
        UI.updateAll();
        callback();
    },

    executeEliteSpecial: function(enemy, callback) {
        var special = Data.ELITE_SPECIALS[enemy.defId];
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Elite';
        var scaledDamage = Math.floor(special.damage * Data.ELITE_DMG_MULT * Data.ELITE_TELEGRAPH_MULT);
        State.addLog('[ELITE] ' + name + ' uses ' + special.name + '!', 'boss');

        switch (special.shape) {
            case 'teleport_strike': {
                var dirs = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
                var bestDir = dirs[0];
                var bestDist = 999;
                for (var i = 0; i < dirs.length; i++) {
                    var nx = State.player.x + dirs[i].x;
                    var ny = State.player.y + dirs[i].y;
                    if (nx >= 0 && nx < Data.GRID_SIZE && ny >= 0 && ny < Data.GRID_SIZE && !State.isBlocked(nx, ny) && !State.getEnemyAt(nx, ny)) {
                        var d = this.distance(nx, ny, enemy.x, enemy.y);
                        if (d < bestDist) { bestDist = d; bestDir = dirs[i]; }
                    }
                }
                var tx = State.player.x + bestDir.x;
                var ty = State.player.y + bestDir.y;
                if (tx >= 0 && tx < Data.GRID_SIZE && ty >= 0 && ty < Data.GRID_SIZE && !State.isBlocked(tx, ty)) {
                    State.animMove(enemy.x, enemy.y, tx, ty, '#ff4444', '#ff0000');
                    enemy.x = tx; enemy.y = ty;
                }
                Combat.dealDamageToPlayer(scaledDamage);
                State.animSlash(enemy.x, enemy.y, State.player.x, State.player.y, '#ff4444');
                State.addFloatingText(enemy.x, enemy.y, 'STRIKE!', '#ff4444');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'line_8': {
                var dx = State.player.x - enemy.x;
                var dy = State.player.y - enemy.y;
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                State.animBeam(enemy.x, enemy.y, enemy.x + stepX * 8, enemy.y + stepY * 8, '#ee8833');
                for (var i = 1; i <= 8; i++) {
                    var lx = enemy.x + stepX * i;
                    var ly = enemy.y + stepY * i;
                    if (lx === State.player.x && ly === State.player.y) {
                        Combat.dealDamageToPlayer(scaledDamage);
                    }
                }
                State.addFloatingText(State.player.x, State.player.y, 'VOLLEY!', '#ee8833');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'summon_skeletons': {
                var sdirs = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
                var scount = 0;
                for (var si = 0; si < sdirs.length && scount < 2; si++) {
                    var sx = enemy.x + sdirs[si].x;
                    var sy = enemy.y + sdirs[si].y;
                    if (sx >= 0 && sx < Data.GRID_SIZE && sy >= 0 && sy < Data.GRID_SIZE && !Stages.isReserved(sx, sy) && !State.isBlocked(sx, sy)) {
                        State.enemies.push({
                            x: sx, y: sy, hp: 60, maxHp: 60, damage: 10,
                            defId: 'skeleton', facing: 'down', frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null, isBoss: false, isElite: false,
                            color: '#ccccaa', isSummon: true, moveSpeed: 1, summonTimer: 0, teleportTimer: 0
                        });
                        State.addFloatingText(sx, sy, 'RAISE!', '#7722aa');
                        scount++;
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'aoe_3x3': {
                State.animFlash([
                    {x: State.player.x-1, y: State.player.y-1}, {x: State.player.x, y: State.player.y-1}, {x: State.player.x+1, y: State.player.y-1},
                    {x: State.player.x-1, y: State.player.y}, {x: State.player.x, y: State.player.y}, {x: State.player.x+1, y: State.player.y},
                    {x: State.player.x-1, y: State.player.y+1}, {x: State.player.x, y: State.player.y+1}, {x: State.player.x+1, y: State.player.y+1}
                ], '#ff4444', 16);
                for (var dy2 = -1; dy2 <= 1; dy2++) {
                    for (var dx2 = -1; dx2 <= 1; dx2++) {
                        if (State.player.x + dx2 === State.player.x && State.player.y + dy2 === State.player.y) {
                            Combat.dealDamageToPlayer(scaledDamage);
                        }
                    }
                }
                if (special.effects && special.effects.indexOf('chilled') !== -1) {
                    State.player.chilled = Math.max(State.player.chilled, 2);
                    State.addFloatingText(State.player.x, State.player.y, 'CHILLED!', '#88ddff');
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'aoe_3x3_target':
            case 'aoe_3x3_burn':
            case 'aoe_3x3_lava': {
                var lavaColor = special.shape === 'aoe_3x3_lava' ? '#ff4400' : '#ff6600';
                State.animFlash([
                    {x: State.player.x-1, y: State.player.y-1}, {x: State.player.x, y: State.player.y-1}, {x: State.player.x+1, y: State.player.y-1},
                    {x: State.player.x-1, y: State.player.y}, {x: State.player.x, y: State.player.y}, {x: State.player.x+1, y: State.player.y},
                    {x: State.player.x-1, y: State.player.y+1}, {x: State.player.x, y: State.player.y+1}, {x: State.player.x+1, y: State.player.y+1}
                ], lavaColor, 16);
                for (var dy3 = -1; dy3 <= 1; dy3++) {
                    for (var dx3 = -1; dx3 <= 1; dx3++) {
                        var bx = State.player.x + dx3;
                        var by = State.player.y + dy3;
                        if (bx >= 0 && bx < Data.GRID_SIZE && by >= 0 && by < Data.GRID_SIZE) {
                            if (bx === State.player.x && by === State.player.y) {
                                Combat.dealDamageToPlayer(scaledDamage);
                            }
                            if (special.shape === 'aoe_3x3_lava') {
                                var hasLava = false;
                                for (var li = 0; li < State.obstacles.length; li++) {
                                    if (State.obstacles[li].x === bx && State.obstacles[li].y === by) { hasLava = true; break; }
                                }
                                if (!hasLava) {
                                    State.obstacles.push({ x: bx, y: by, id: 'lava', hp: -1, destructible: false, blocksMove: false, color: '#ff4400', baseDamage: 30 });
                                }
                            } else {
                                State.burnTiles.push({ x: bx, y: by, turns: 3 });
                            }
                        }
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'cross_2': {
                State.animCross(enemy.x, enemy.y, '#ffff44');
                var crossTiles = [
                    { x: enemy.x, y: enemy.y },
                    { x: enemy.x + 1, y: enemy.y }, { x: enemy.x - 1, y: enemy.y },
                    { x: enemy.x, y: enemy.y + 1 }, { x: enemy.x, y: enemy.y - 1 },
                    { x: enemy.x + 2, y: enemy.y }, { x: enemy.x - 2, y: enemy.y },
                    { x: enemy.x, y: enemy.y + 2 }, { x: enemy.x, y: enemy.y - 2 }
                ];
                for (var cti = 0; cti < crossTiles.length; cti++) {
                    if (crossTiles[cti].x === State.player.x && crossTiles[cti].y === State.player.y) {
                        Combat.dealDamageToPlayer(scaledDamage);
                    }
                }
                if (special.summonObstacle) {
                    var obsDirs = [{ x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 }];
                    for (var oi = 0; oi < obsDirs.length; oi++) {
                        var ox = enemy.x + obsDirs[oi].x;
                        var oy = enemy.y + obsDirs[oi].y;
                        if (ox >= 0 && ox < Data.GRID_SIZE && oy >= 0 && oy < Data.GRID_SIZE && !Stages.isReserved(ox, oy)) {
                            State.obstacles.push({ x: ox, y: oy, id: 'stone', hp: -1, destructible: false, blocksMove: true, blocksLOS: true, color: '#555566' });
                            break;
                        }
                    }
                }
                if (special.effects && special.effects.indexOf('knockback1') !== -1) {
                    var kbDir = Grid.getDirection(enemy.x, enemy.y, State.player.x, State.player.y);
                    var kbX = State.player.x + (kbDir === 'right' ? 1 : kbDir === 'left' ? -1 : 0);
                    var kbY = State.player.y + (kbDir === 'down' ? 1 : kbDir === 'up' ? -1 : 0);
                    if (!State.isBlocked(kbX, kbY)) { State.player.x = kbX; State.player.y = kbY; }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'pull_2': {
                State.animBeam(enemy.x, enemy.y, State.player.x, State.player.y, '#558844');
                var pullDir = Grid.getDirection(enemy.x, enemy.y, State.player.x, State.player.y);
                for (var pi = 0; pi < 2; pi++) {
                    var pnx = State.player.x + (pullDir === 'right' ? -1 : pullDir === 'left' ? 1 : 0);
                    var pny = State.player.y + (pullDir === 'down' ? -1 : pullDir === 'up' ? 1 : 0);
                    if (pnx >= 0 && pnx < Data.GRID_SIZE && pny >= 0 && pny < Data.GRID_SIZE && !State.isBlocked(pnx, pny) && !State.getEnemyAt(pnx, pny)) {
                        State.player.x = pnx; State.player.y = pny;
                    }
                }
                Combat.dealDamageToPlayer(scaledDamage);
                State.addFloatingText(State.player.x, State.player.y, 'PULLED!', '#558844');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'apply_disease': {
                State.player.diseased = true;
                State.addFloatingText(State.player.x, State.player.y, 'DISEASED!', '#aacc22');
                Combat.dealDamageToPlayer(scaledDamage);
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'apply_chilled': {
                State.player.chilled = Math.max(State.player.chilled, 3);
                State.addFloatingText(State.player.x, State.player.y, 'CHILLED!', '#88ddff');
                Combat.dealDamageToPlayer(scaledDamage);
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'aoe_5x5_self': {
                State.animRing(enemy.x + 1, enemy.y + 1, '#335522');
                for (var dy5 = -2; dy5 <= 2; dy5++) {
                    for (var dx5 = -2; dx5 <= 2; dx5++) {
                        var qx = enemy.x + dx5;
                        var qy = enemy.y + dy5;
                        if (qx >= 0 && qx < Data.GRID_SIZE && qy >= 0 && qy < Data.GRID_SIZE) {
                            if (special.summonObstacle === 'swamp_pool' && Math.abs(dx5) + Math.abs(dy5) <= 2) {
                                var hasObstacle = false;
                                for (var wi = 0; wi < State.obstacles.length; wi++) {
                                    if (State.obstacles[wi].x === qx && State.obstacles[wi].y === qy) { hasObstacle = true; break; }
                                }
                                if (!hasObstacle) {
                                    State.obstacles.push({ x: qx, y: qy, id: 'swamp_pool', hp: -1, destructible: false, blocksMove: false, color: '#335522', energyCost: 2 });
                                }
                            }
                        }
                    }
                }
                State.addFloatingText(enemy.x + 1, enemy.y + 1, 'QUAGMIRE!', '#335522');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'single':
            case 'single_3': {
                State.animProjectile(enemy.x, enemy.y, State.player.x, State.player.y, '#ff4444');
                var singleRange = special.shape === 'single_3' ? 3 : 2;
                var sd = this.distance(enemy.x, enemy.y, State.player.x, State.player.y);
                if (sd <= singleRange) {
                    Combat.dealDamageToPlayer(scaledDamage);
                    if (special.effects && special.effects.indexOf('poison') !== -1) {
                        var poisonDmg = Math.floor(15 * (1 + (State.stage - 1) * Data.SCALING_DMG_MULT / 5));
                        State.player.statusEffects.push({ type: 'poison', damage: poisonDmg, turns: 3 });
                        State.addFloatingText(State.player.x, State.player.y, 'POISON!', '#44cc44');
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'apply_curse_summon': {
                State.player.cursed = true;
                State.addFloatingText(State.player.x, State.player.y, 'CURSED!', '#cc44ff');
                var swdirs = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
                for (var swi = 0; swi < swdirs.length; swi++) {
                    var swx = enemy.x + swdirs[swi].x;
                    var swy = enemy.y + swdirs[swi].y;
                    if (swx >= 0 && swx < Data.GRID_SIZE && swy >= 0 && swy < Data.GRID_SIZE && !Stages.isReserved(swx, swy) && !State.isBlocked(swx, swy)) {
                        State.enemies.push({
                            x: swx, y: swy, hp: 150, maxHp: 150, damage: 35,
                            defId: 'sand_wraith', facing: 'down', frozen: 0, freezeImmune: false,
                            freezeImmuneTurns: 0, poison: null, isBoss: false, isElite: false,
                            color: '#ddcc88', isSummon: true, moveSpeed: 1, summonTimer: 0, teleportTimer: 0
                        });
                        State.addFloatingText(swx, swy, 'SUMMONED!', '#ddcc88');
                        break;
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'cone_3': {
                var cdx = State.player.x - enemy.x;
                var cdy = State.player.y - enemy.y;
                var cdirX = cdx === 0 ? 0 : (cdx > 0 ? 1 : -1);
                var cdirY = cdy === 0 ? 0 : (cdy > 0 ? 1 : -1);
                State.animSlash(enemy.x, enemy.y, enemy.x + cdirX * 3, enemy.y + cdirY * 3, '#ff8844');
                for (var ci2 = 1; ci2 <= 3; ci2++) {
                    for (var spread = -1; spread <= 1; spread++) {
                        var ctx2, cty2;
                        if (cdirX !== 0) { ctx2 = enemy.x + cdirX * ci2; cty2 = enemy.y + spread; }
                        else { ctx2 = enemy.x + spread; cty2 = enemy.y + cdirY * ci2; }
                        if (ctx2 === State.player.x && cty2 === State.player.y) {
                            Combat.dealDamageToPlayer(scaledDamage);
                        }
                    }
                }
                if (special.effects && special.effects.indexOf('chilled') !== -1) {
                    State.player.chilled = Math.max(State.player.chilled, 2);
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'summon_magma_slime': {
                State.animProjectile(enemy.x, enemy.y, State.player.x, State.player.y, '#ff4400');
                Combat.dealDamageToPlayer(scaledDamage);
                var summonDirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1}];
                for (var si = 0; si < summonDirs.length; si++) {
                    var sx = State.player.x + summonDirs[si].x;
                    var sy = State.player.y + summonDirs[si].y;
                    if (sx >= 0 && sx < Data.GRID_SIZE && sy >= 0 && sy < Data.GRID_SIZE && !State.isBlocked(sx, sy) && !State.getEnemyAt(sx, sy)) {
                        var slime = { x: sx, y: sy, defId: 'magma_slime', hp: 55, maxHp: 55, damage: 25, moveSpeed: 1, frozen: 0, isElite: false };
                        State.enemies.push(slime);
                        State.addFloatingText(sx, sy, 'SPAWNED!', '#ff4400');
                        break;
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'cross_teleport': {
                State.animCross(enemy.x, enemy.y, '#ffaa00');
                var crossTiles2 = [
                    { x: enemy.x, y: enemy.y },
                    { x: enemy.x + 1, y: enemy.y }, { x: enemy.x - 1, y: enemy.y },
                    { x: enemy.x, y: enemy.y + 1 }, { x: enemy.x, y: enemy.y - 1 }
                ];
                for (var ctj = 0; ctj < crossTiles2.length; ctj++) {
                    if (crossTiles2[ctj].x === State.player.x && crossTiles2[ctj].y === State.player.y) {
                        Combat.dealDamageToPlayer(scaledDamage);
                    }
                }
                State.animMove(enemy.x, enemy.y, State.player.x, State.player.y, '#ffaa00', '#ff0000');
                enemy.x = State.player.x; enemy.y = State.player.y;
                State.addFloatingText(enemy.x, enemy.y, 'DIVE!', '#ffaa00');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'phase_strike': {
                var oldPhX = enemy.x;
                var oldPhY = enemy.y;
                State.animProjectile(enemy.x, enemy.y, State.player.x, State.player.y, '#664488');
                var phaseDir = Grid.getDirection(enemy.x, enemy.y, State.player.x, State.player.y);
                var phX = State.player.x + (phaseDir === 'right' ? -1 : phaseDir === 'left' ? 1 : 0);
                var phY = State.player.y + (phaseDir === 'down' ? -1 : phaseDir === 'up' ? 1 : 0);
                if (phX >= 0 && phX < Data.GRID_SIZE && phY >= 0 && phY < Data.GRID_SIZE && !State.isBlocked(phX, phY)) {
                    State.animMove(oldPhX, oldPhY, phX, phY, '#664488', '#ff0000');
                    enemy.x = phX; enemy.y = phY;
                }
                Combat.dealDamageToPlayer(scaledDamage);
                State.addFloatingText(enemy.x, enemy.y, 'PHASE!', '#664488');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'spawn_portal': {
                var pdirs = [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 }];
                for (var pori = 0; pori < pdirs.length; pori++) {
                    var porx = State.player.x + pdirs[pori].x;
                    var pory = State.player.y + pdirs[pori].y;
                    if (porx >= 0 && porx < Data.GRID_SIZE && pory >= 0 && pory < Data.GRID_SIZE && !Stages.isReserved(porx, pory)) {
                        State.obstacles.push({ x: porx, y: pory, id: 'portal', hp: -1, destructible: false, blocksMove: false, color: '#cc44ff', teleport: true });
                        State.addFloatingText(porx, pory, 'VOID!', '#443366');
                        break;
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'cloak_strike': {
                enemy.untargetable = true;
                State.addFloatingText(enemy.x, enemy.y, 'CLOAKED!', '#555577');
                var self = this;
                setTimeout(function() {
                    enemy.untargetable = false;
                    var dist2 = self.distance(enemy.x, enemy.y, State.player.x, State.player.y);
                    if (dist2 <= 1) {
                        Combat.dealDamageToPlayer(scaledDamage);
                        State.addFloatingText(State.player.x, State.player.y, 'BACKSTAB!', '#555577');
                    }
                    Grid.render(); UI.updateAll(); callback();
                }, 600);
                break;
            }
            case 'apply_judgment': {
                State.animProjectile(enemy.x, enemy.y, State.player.x, State.player.y, '#ffdd88');
                Combat.dealDamageToPlayer(scaledDamage);
                State.player.judgment = 2;
                State.addFloatingText(State.player.x, State.player.y, 'JUDGMENT!', '#ffdd88');
                State.addLog('Player will take double damage from next hit!', 'telegraph');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            default: {
                Combat.dealDamageToPlayer(scaledDamage);
                Grid.render(); UI.updateAll(); callback();
                break;
            }
        }
    },

    meleeAttack: function(enemy, callback) {
        var baseDmg = enemy.damage;
        var roll = 0.9 + Math.random() * 0.1;
        var dmg = Math.floor(baseDmg * roll);
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Enemy';
        State.addLog(name + ' attacks player for ' + dmg + ' dmg', 'enemy');
        State.animSlash(enemy.x, enemy.y, State.player.x, State.player.y, '#ff4444');
        Combat.dealDamageToPlayer(dmg);

        if (enemy.defId === 'plaguebearer') {
            State.player.diseased = true;
            State.addFloatingText(State.player.x, State.player.y, 'DISEASED!', '#44cc44');
        }
        if (enemy.defId === 'scorpion') {
            var bleedDmg = Math.floor(dmg * 0.3);
            if (!State.player.bleed) {
                State.player.bleed = { damage: bleedDmg, turns: 3 };
            } else {
                State.player.bleed.damage += bleedDmg;
                State.player.bleed.turns = 3;
            }
            State.addFloatingText(State.player.x, State.player.y, 'BLEED!', '#ff4444');
        }
        if (enemy.defId === 'void_walker') {
            State.player.cursed = true;
            State.addFloatingText(State.player.x, State.player.y, 'CURSED!', '#8844aa');
        }

        var thorns = Combat.calculateItemStatBonus('thorns');
        if (thorns > 0) {
            var thornsDmg = Math.floor(dmg * thorns / 100);
            if (thornsDmg > 0) {
                enemy.hp -= thornsDmg;
                State.addFloatingText(enemy.x, enemy.y, '-' + thornsDmg + ' THORNS', '#44ff44');
                State.addLog('Thorns reflects ' + thornsDmg + ' dmg', 'item');
                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    State.runStats.enemyKills++;
                    State.addLog(name + ' killed by thorns!', 'kill');
                }
            }
        }

        var dir = Grid.getDirection(enemy.x, enemy.y, State.player.x, State.player.y);
        enemy.facing = dir;
        Grid.render();
        UI.updateAll();
        callback();
    },

    rangedAttack: function(enemy, callback) {
        var dx = State.player.x - enemy.x;
        var dy = State.player.y - enemy.y;
        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Enemy';
        var baseDmg = enemy.damage;
        var roll = 0.9 + Math.random() * 0.1;
        var dmg = Math.floor(baseDmg * roll);

        for (var i = 1; i <= 4; i++) {
            var tx = enemy.x + stepX * i;
            var ty = enemy.y + stepY * i;
            if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) break;
            if (State.isBlocked(tx, ty)) break;
            if (tx === State.player.x && ty === State.player.y) {
                State.addLog(name + ' shoots player for ' + dmg + ' dmg', 'enemy');
                State.animProjectile(enemy.x, enemy.y, State.player.x, State.player.y, def.color);
                Combat.dealDamageToPlayer(dmg);
                State.addFloatingText(tx, ty, 'ARROW!', '#ee8833');
                if (enemy.defId === 'frost_elemental') {
                    State.player.chilled = 2;
                    State.addFloatingText(State.player.x, State.player.y, 'CHILLED!', '#88ddff');
                }
                if (enemy.defId === 'plaguebearer') {
                    State.player.diseased = true;
                    State.addFloatingText(State.player.x, State.player.y, 'DISEASED!', '#44cc44');
                }
                break;
            }
        }

        var dir = Grid.getDirection(enemy.x, enemy.y, State.player.x, State.player.y);
        enemy.facing = dir;
        Grid.render();
        UI.updateAll();
        callback();
    },

    moveToward: function(enemy, targetX, targetY, callback) {
        var bestX = enemy.x;
        var bestY = enemy.y;
        var bestDist = this.distance(enemy.x, enemy.y, targetX, targetY);
        var moved = false;

        var dirs = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        var prevX = enemy._prevX;
        var prevY = enemy._prevY;

        for (var i = 0; i < dirs.length; i++) {
            var nx = enemy.x + dirs[i].x;
            var ny = enemy.y + dirs[i].y;
            if (State.isBlockedForEnemy(nx, ny)) continue;
            if (nx === prevX && ny === prevY) continue;
            var d = this.distance(nx, ny, targetX, targetY);
            if (d < bestDist) {
                bestDist = d;
                bestX = nx;
                bestY = ny;
                moved = true;
            }
        }

        if (!moved) {
            var candidates = [];
            for (var i = 0; i < dirs.length; i++) {
                var nx = enemy.x + dirs[i].x;
                var ny = enemy.y + dirs[i].y;
                if (State.isBlockedForEnemy(nx, ny)) continue;
                var bestReachable = this.distance(nx, ny, targetX, targetY);
                for (var j = 0; j < dirs.length; j++) {
                    var nx2 = nx + dirs[j].x;
                    var ny2 = ny + dirs[j].y;
                    if (State.isBlockedForEnemy(nx2, ny2)) continue;
                    var d2 = this.distance(nx2, ny2, targetX, targetY);
                    if (d2 < bestReachable) bestReachable = d2;
                }
                var penalty = (nx === prevX && ny === prevY) ? 1 : 0;
                candidates.push({ x: nx, y: ny, best2: bestReachable + penalty });
            }
            candidates.sort(function(a, b) {
                if (a.best2 !== b.best2) return a.best2 - b.best2;
                return this.distance(a.x, a.y, targetX, targetY) - this.distance(b.x, b.y, targetX, targetY);
            }.bind(this));
            if (candidates.length > 0) {
                bestX = candidates[0].x;
                bestY = candidates[0].y;
            }
        }

        enemy._prevX = enemy.x;
        enemy._prevY = enemy.y;
        enemy.facing = Grid.getDirection(enemy.x, enemy.y, bestX, bestY);
        var def = Data.ENEMIES[enemy.defId];
        var moveColor = def ? def.color : '#ff4444';
        State.animMove(enemy.x, enemy.y, bestX, bestY, moveColor, '#ff0000');
        enemy.x = bestX;
        enemy.y = bestY;
        this.checkEnemyPortal(enemy);
        Grid.render();
        callback();
    },

    checkEnemyPortal: function(enemy) {
        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            if (o.x === enemy.x && o.y === enemy.y && o.id === 'portal') {
                for (var j = 0; j < State.obstacles.length; j++) {
                    if (j !== i && State.obstacles[j].id === 'portal') {
                        var oldX = enemy.x;
                        var oldY = enemy.y;
                        enemy.x = State.obstacles[j].x;
                        enemy.y = State.obstacles[j].y;
                        State.animProjectile(oldX, oldY, enemy.x, enemy.y, '#cc44ff');
                        State.addFloatingText(enemy.x, enemy.y, 'TELEPORT!', '#cc44ff');
                        return;
                    }
                }
            }
        }
    },

    moveAway: function(enemy, targetX, targetY, callback) {
        var bestX = enemy.x;
        var bestY = enemy.y;
        var bestDist = this.distance(enemy.x, enemy.y, targetX, targetY);
        var moved = false;

        var dirs = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (var i = 0; i < dirs.length; i++) {
            var nx = enemy.x + dirs[i].x;
            var ny = enemy.y + dirs[i].y;
            if (State.isBlockedForEnemy(nx, ny)) continue;
            var d = this.distance(nx, ny, targetX, targetY);
            if (d > bestDist) {
                bestDist = d;
                bestX = nx;
                bestY = ny;
                moved = true;
            }
        }

        if (!moved) {
            var sideDirs = [];
            var towardDirs = [];
            for (var i = 0; i < dirs.length; i++) {
                var nx = enemy.x + dirs[i].x;
                var ny = enemy.y + dirs[i].y;
                if (!State.isBlockedForEnemy(nx, ny)) {
                    var d = this.distance(nx, ny, targetX, targetY);
                    if (d >= bestDist) {
                        sideDirs.push({ x: nx, y: ny });
                    } else {
                        towardDirs.push({ x: nx, y: ny });
                    }
                }
            }
            var pick = sideDirs.length > 0
                ? sideDirs[Math.floor(Math.random() * sideDirs.length)]
                : towardDirs.length > 0 ? towardDirs[Math.floor(Math.random() * towardDirs.length)] : null;
            if (pick) { bestX = pick.x; bestY = pick.y; }
        }

        var def = Data.ENEMIES[enemy.defId];
        var moveColor = def ? def.color : '#ff4444';
        State.animMove(enemy.x, enemy.y, bestX, bestY, moveColor, '#ff0000');
        enemy.x = bestX;
        enemy.y = bestY;
        this.checkEnemyPortal(enemy);
        Grid.render();
        callback();
    },

    countOpenNeighbors: function(x, y) {
        var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
        var count = 0;
        for (var i = 0; i < dirs.length; i++) {
            var nx = x + dirs[i].x;
            var ny = y + dirs[i].y;
            if (nx >= 0 && nx < Data.GRID_SIZE && ny >= 0 && ny < Data.GRID_SIZE && !State.isBlockedForEnemy(nx, ny)) {
                count++;
            }
        }
        return count;
    },

    rangedRetreat: function(enemy, targetX, targetY, callback) {
        var bestX = enemy.x;
        var bestY = enemy.y;
        var bestScore = -999;
        var dx = enemy.x - targetX;
        var dy = enemy.y - targetY;
        var absDx = Math.abs(dx);
        var absDy = Math.abs(dy);

        var dirs = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (var i = 0; i < dirs.length; i++) {
            var nx = enemy.x + dirs[i].x;
            var ny = enemy.y + dirs[i].y;
            if (State.isBlockedForEnemy(nx, ny)) continue;
            var d = this.distance(nx, ny, targetX, targetY);
            var openNeighbors = this.countOpenNeighbors(nx, ny);
            var distGain = d - this.distance(enemy.x, enemy.y, targetX, targetY);
            var score = distGain * 10 + openNeighbors * 3;
            // Strong bonus for moving directly away along the dominant axis
            if (absDx >= absDy && dirs[i].x === (dx > 0 ? 1 : -1)) score += 15;
            if (absDy >= absDx && dirs[i].y === (dy > 0 ? 1 : -1)) score += 15;
            if (openNeighbors <= 2) score -= 5;
            if (score > bestScore) {
                bestScore = score;
                bestX = nx;
                bestY = ny;
            }
        }

        var def = Data.ENEMIES[enemy.defId];
        var moveColor = def ? def.color : '#ff4444';
        State.animMove(enemy.x, enemy.y, bestX, bestY, moveColor, '#ff0000');
        enemy.x = bestX;
        enemy.y = bestY;
        Grid.render();
        callback();
    },

    summonSkeleton: function(enemy) {
        var dirs = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        for (var pi = dirs.length - 1; pi > 0; pi--) {
            var pj = Math.floor(Math.random() * (pi + 1));
            var tmp = dirs[pi]; dirs[pi] = dirs[pj]; dirs[pj] = tmp;
        }
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Enemy';

        for (var i = 0; i < dirs.length; i++) {
            var nx = enemy.x + dirs[i].x;
            var ny = enemy.y + dirs[i].y;
            if (!State.isBlockedForEnemy(nx, ny)) {
                var skelDef = Data.ENEMIES.skeleton;
                var scaling = 1 + (State.stage - 1) * Data.SCALING_HP_MULT;
                State.enemies.push({
                    x: nx, y: ny,
                    hp: Math.floor(skelDef.hp * scaling),
                    maxHp: Math.floor(skelDef.hp * scaling),
                    damage: Math.floor(skelDef.damage * (1 + (State.stage - 1) * Data.SCALING_DMG_MULT)),
                    defId: 'skeleton',
                    facing: 'down',
                    frozen: 0,
                    freezeImmune: false,
                    freezeImmuneTurns: 0,
                    poison: null,
                    isBoss: false,
                    isSummon: true,
                    color: skelDef.color,
                    moveSpeed: skelDef.moveSpeed
                });
                State.addFloatingText(nx, ny, 'SUMMONED!', '#7722aa');
                State.addLog(name + ' summons Skeleton', 'enemy');
                break;
            }
        }
    },

    summonMiniRobots: function(enemy) {
        var dirs = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 1 }, { x: 1, y: 1 }
        ];
        for (var pi = dirs.length - 1; pi > 0; pi--) {
            var pj = Math.floor(Math.random() * (pi + 1));
            var tmp = dirs[pi]; dirs[pi] = dirs[pj]; dirs[pj] = tmp;
        }
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Enemy';
        var robotDef = Data.ENEMIES.mini_robot;
        var scaling = 1 + (State.stage - 1) * Data.SCALING_HP_MULT;
        var count = 0;

        for (var i = 0; i < dirs.length && count < 2; i++) {
            var nx = enemy.x + dirs[i].x;
            var ny = enemy.y + dirs[i].y;
            if (nx >= 0 && nx < Data.GRID_SIZE && ny >= 0 && ny < Data.GRID_SIZE && !Stages.isReserved(nx, ny) && !State.isBlocked(nx, ny)) {
                State.enemies.push({
                    x: nx, y: ny,
                    hp: Math.floor(robotDef.hp * scaling),
                    maxHp: Math.floor(robotDef.hp * scaling),
                    damage: Math.floor(robotDef.damage * (1 + (State.stage - 1) * Data.SCALING_DMG_MULT)),
                    defId: 'mini_robot',
                    facing: 'down', frozen: 0, freezeImmune: false,
                    freezeImmuneTurns: 0, poison: null,
                    isBoss: false, isElite: false,
                    color: robotDef.color, isSummon: true,
                    moveSpeed: robotDef.moveSpeed
                });
                State.addFloatingText(nx, ny, 'ROBOT!', '#aaaaaa');
                count++;
            }
        }
        State.addLog(name + ' deploys Mini Robots', 'enemy');
    },

    teleportNear: function(enemy) {
        var attempts = 0;
        while (attempts < 20) {
            var tx = Math.floor(Math.random() * Data.GRID_SIZE);
            var ty = Math.floor(Math.random() * Data.GRID_SIZE);
            var d = this.distance(tx, ty, State.player.x, State.player.y);
            if (d >= 1 && d <= 2 && !State.isBlockedForEnemy(tx, ty)) {
                enemy.x = tx;
                enemy.y = ty;
                State.addFloatingText(tx, ty, 'TELEPORT!', '#555566');
                break;
            }
            attempts++;
        }
    },

    distance: function(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    },

    getEliteTelegraphTiles: function(enemy, special) {
        var tiles = [];
        switch (special.shape) {
            case 'aoe_3x3':
            case 'aoe_3x3_target':
            case 'aoe_3x3_burn':
            case 'aoe_3x3_lava':
                for (var dy = -1; dy <= 1; dy++) {
                    for (var dx = -1; dx <= 1; dx++) {
                        tiles.push({ x: State.player.x + dx, y: State.player.y + dy });
                    }
                }
                break;
            case 'aoe_5x5_self':
                for (var dy = -2; dy <= 2; dy++) {
                    for (var dx = -2; dx <= 2; dx++) {
                        tiles.push({ x: enemy.x + dx, y: enemy.y + dy });
                    }
                }
                break;
            case 'line_8': {
                var dx = State.player.x - enemy.x;
                var dy = State.player.y - enemy.y;
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                for (var i = 1; i <= 8; i++) {
                    tiles.push({ x: enemy.x + stepX * i, y: enemy.y + stepY * i });
                }
                break;
            }
            case 'cross_2': {
                var dirs2 = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
                             { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 }];
                for (var ci = 0; ci < dirs2.length; ci++) {
                    tiles.push({ x: enemy.x + dirs2[ci].x, y: enemy.y + dirs2[ci].y });
                }
                break;
            }
            case 'single':
            case 'single_3':
                tiles.push({ x: State.player.x, y: State.player.y });
                break;
            case 'pull_2': {
                var pullDir = Grid.getDirection(State.player.x, State.player.y, enemy.x, enemy.y);
                for (var pi2 = 0; pi2 <= 2; pi2++) {
                    var ptx = State.player.x + (pullDir === 'right' ? pi2 : pullDir === 'left' ? -pi2 : 0);
                    var pty = State.player.y + (pullDir === 'down' ? pi2 : pullDir === 'up' ? -pi2 : 0);
                    tiles.push({ x: ptx, y: pty });
                }
                break;
            }
            case 'apply_curse_summon':
                tiles.push({ x: State.player.x, y: State.player.y });
                break;
            case 'cone_3': {
                var cdx = State.player.x - enemy.x;
                var cdy = State.player.y - enemy.y;
                var csx = cdx === 0 ? 0 : (cdx > 0 ? 1 : -1);
                var csy = cdy === 0 ? 0 : (cdy > 0 ? 1 : -1);
                for (var ci2 = 1; ci2 <= 3; ci2++) {
                    tiles.push({ x: enemy.x + csx * ci2, y: enemy.y + csy * ci2 });
                    tiles.push({ x: enemy.x + csx * ci2 + (csy !== 0 ? csy : 0), y: enemy.y + csy * ci2 + (csx !== 0 ? csx : 0) });
                }
                break;
            }
            default:
                tiles.push({ x: State.player.x, y: State.player.y });
                break;
        }
        return tiles;
    }
};
