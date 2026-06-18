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

            if (enemy.frozen > 0) {
                State.addFloatingText(enemy.x, enemy.y, 'FROZEN', '#88ddff');
                if (enemy.isBoss) {
                    if (enemy.isBoss) {
                        Boss.processTurn(enemy, processNext);
                    } else {
                        AI.processEnemy(enemy, processNext);
                    }
                } else {
                    processNext();
                }
                return;
            }

            if (enemy.isBoss) {
                Boss.processTurn(enemy, processNext);
            } else {
                AI.processEnemy(enemy, processNext);
            }
        }

        processNext();
    },

    processEnemy: function(enemy, callback) {
        var def = Data.ENEMIES[enemy.defId];
        if (!def) { callback(); return; }

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
                this.moveAway(enemy, State.player.x, State.player.y, callback);
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

    meleeAttack: function(enemy, callback) {
        var baseDmg = enemy.damage;
        var roll = 0.9 + Math.random() * 0.1;
        var dmg = Math.floor(baseDmg * roll);
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Enemy';
        State.addLog(name + ' attacks player for ' + dmg + ' dmg', 'enemy');
        Combat.dealDamageToPlayer(dmg);
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
            }
        }

        enemy.facing = Grid.getDirection(enemy.x, enemy.y, bestX, bestY);
        enemy.x = bestX;
        enemy.y = bestY;
        Grid.render();
        callback();
    },

    moveAway: function(enemy, targetX, targetY, callback) {
        var bestX = enemy.x;
        var bestY = enemy.y;
        var bestDist = this.distance(enemy.x, enemy.y, targetX, targetY);

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
        var shuffled = dirs.sort(function() { return Math.random() - 0.5; });
        var def = Data.ENEMIES[enemy.defId];
        var name = def ? def.name : 'Enemy';

        for (var i = 0; i < shuffled.length; i++) {
            var nx = enemy.x + shuffled[i].x;
            var ny = enemy.y + shuffled[i].y;
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
                    color: skelDef.color
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
    }
};
