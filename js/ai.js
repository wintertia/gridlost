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
            var movesLeft = (enemy.moveSpeed || 1);
            index++;

            if (enemy.hp <= 0) {
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
                this.executeEliteSpecial(enemy, function() {
                    if (def.type === 'melee') {
                        AI.moveToward(enemy, State.player.x, State.player.y, callback);
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
                this.summonSkeleton(enemy);
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
                    enemy.x = tx; enemy.y = ty;
                }
                Combat.dealDamageToPlayer(scaledDamage);
                State.addFloatingText(enemy.x, enemy.y, 'STRIKE!', '#ff4444');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'line_8': {
                var dx = State.player.x - enemy.x;
                var dy = State.player.y - enemy.y;
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
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
            case 'aoe_3x3_burn': {
                for (var dy3 = -1; dy3 <= 1; dy3++) {
                    for (var dx3 = -1; dx3 <= 1; dx3++) {
                        var bx = State.player.x + dx3;
                        var by = State.player.y + dy3;
                        if (bx >= 0 && bx < Data.GRID_SIZE && by >= 0 && by < Data.GRID_SIZE) {
                            if (bx === State.player.x && by === State.player.y) {
                                Combat.dealDamageToPlayer(scaledDamage);
                            }
                            if (special.shape === 'aoe_3x3_burn') {
                                State.burnTiles.push({ x: bx, y: by, turns: 3 });
                            }
                        }
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'cross_2': {
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
                for (var dy5 = -2; dy5 <= 2; dy5++) {
                    for (var dx5 = -2; dx5 <= 2; dx5++) {
                        var qx = enemy.x + dx5;
                        var qy = enemy.y + dy5;
                        if (qx >= 0 && qx < Data.GRID_SIZE && qy >= 0 && qy < Data.GRID_SIZE) {
                            if (qx === State.player.x && qy === State.player.y) {
                                Combat.dealDamageToPlayer(scaledDamage);
                            }
                            if (special.summonObstacle === 'water' && !Stages.isReserved(qx, qy) && Math.abs(dx5) + Math.abs(dy5) <= 2) {
                                State.obstacles.push({ x: qx, y: qy, id: 'water', hp: -1, destructible: false, blocksMove: false, color: '#2266cc', energyCost: 2 });
                            }
                        }
                    }
                }
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'single':
            case 'single_3': {
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
            case 'eruption': {
                var edirs = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: 0, y: 0 }];
                for (var ei = 0; ei < edirs.length; ei++) {
                    var elx = State.player.x + edirs[ei].x;
                    var ely = State.player.y + edirs[ei].y;
                    if (elx >= 0 && elx < Data.GRID_SIZE && ely >= 0 && ely < Data.GRID_SIZE && !Stages.isReserved(elx, ely)) {
                        State.obstacles.push({ x: elx, y: ely, id: 'lava', hp: -1, destructible: false, blocksMove: false, color: '#ff4400', damage: 20 });
                    }
                }
                State.addFloatingText(State.player.x, State.player.y, 'ERUPTION!', '#ff4400');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'cross_teleport': {
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
                enemy.x = State.player.x; enemy.y = State.player.y;
                State.addFloatingText(enemy.x, enemy.y, 'DIVE!', '#ffaa00');
                Grid.render(); UI.updateAll(); callback();
                break;
            }
            case 'phase_strike': {
                var phaseDir = Grid.getDirection(enemy.x, enemy.y, State.player.x, State.player.y);
                var phX = State.player.x + (phaseDir === 'right' ? -1 : phaseDir === 'left' ? 1 : 0);
                var phY = State.player.y + (phaseDir === 'down' ? -1 : phaseDir === 'up' ? 1 : 0);
                if (phX >= 0 && phX < Data.GRID_SIZE && phY >= 0 && phY < Data.GRID_SIZE && !State.isBlocked(phX, phY)) {
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
                Combat.dealDamageToPlayer(dmg);
                State.addFloatingText(tx, ty, 'ARROW!', '#ee8833');
                if (enemy.defId === 'frost_elemental') {
                    State.player.chilled = 2;
                    State.addFloatingText(State.player.x, State.player.y, 'CHILLED!', '#88ddff');
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

        for (var i = 0; i < dirs.length; i++) {
            var nx = enemy.x + dirs[i].x;
            var ny = enemy.y + dirs[i].y;
            if (State.isBlockedForEnemy(nx, ny)) continue;
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
                var canImproveNextTurn = false;
                for (var j = 0; j < dirs.length; j++) {
                    var nx2 = nx + dirs[j].x;
                    var ny2 = ny + dirs[j].y;
                    if (State.isBlockedForEnemy(nx2, ny2)) continue;
                    if (this.distance(nx2, ny2, targetX, targetY) < bestDist) {
                        canImproveNextTurn = true;
                        break;
                    }
                }
                candidates.push({ x: nx, y: ny, good: canImproveNextTurn });
            }
            var goodOnes = candidates.filter(function(c) { return c.good; });
            var pick;
            if (goodOnes.length > 0) {
                pick = goodOnes[Math.floor(Math.random() * goodOnes.length)];
            } else if (candidates.length > 0) {
                pick = candidates[Math.floor(Math.random() * candidates.length)];
            }
            if (pick) { bestX = pick.x; bestY = pick.y; }
        }

        enemy.facing = Grid.getDirection(enemy.x, enemy.y, bestX, bestY);
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
                        enemy.x = State.obstacles[j].x;
                        enemy.y = State.obstacles[j].y;
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
            case 'aoe_5x5_self':
                var r = special.shape === 'aoe_5x5_self' ? 2 : 1;
                for (var dy = -r; dy <= r; dy++) {
                    for (var dx = -r; dx <= r; dx++) {
                        tiles.push({ x: State.player.x + dx, y: State.player.y + dy });
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
            case 'pull_2':
            case 'apply_curse_summon':
                for (var py2 = -1; py2 <= 1; py2++) {
                    for (var px2 = -1; px2 <= 1; px2++) {
                        tiles.push({ x: State.player.x + px2, y: State.player.y + py2 });
                    }
                }
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
