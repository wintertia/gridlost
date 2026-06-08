var Combat = {
    getAffectedTiles: function(px, py, tx, ty, skill) {
        var tiles = [];
        var dx = tx - px;
        var dy = ty - py;

        switch (skill.shape) {
            case 'single':
                tiles.push({ x: tx, y: ty });
                break;
            case 'line':
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                if (Math.abs(dx) >= Math.abs(dy)) {
                    stepY = 0;
                } else {
                    stepX = 0;
                }
                for (var i = 1; i <= skill.range; i++) {
                    tiles.push({ x: px + stepX * i, y: py + stepY * i });
                }
                break;
            case 'cone':
                var dirX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var dirY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                for (var i = 1; i <= skill.range; i++) {
                    tiles.push({ x: px + dirX * i, y: py + dirY * i });
                    if (dirX !== 0) {
                        tiles.push({ x: px + dirX * i, y: py + dirY * i - 1 });
                        tiles.push({ x: px + dirX * i, y: py + dirY * i + 1 });
                    } else {
                        tiles.push({ x: px + dirX * i - 1, y: py + dirY * i });
                        tiles.push({ x: px + dirX * i + 1, y: py + dirY * i });
                    }
                }
                break;
            case 'cross':
                tiles.push({ x: tx, y: ty });
                tiles.push({ x: tx + 1, y: ty });
                tiles.push({ x: tx - 1, y: ty });
                tiles.push({ x: tx, y: ty + 1 });
                tiles.push({ x: tx, y: ty - 1 });
                break;
            case 'ring':
                for (var dy2 = -1; dy2 <= 1; dy2++) {
                    for (var dx2 = -1; dx2 <= 1; dx2++) {
                        if (dx2 === 0 && dy2 === 0) continue;
                        if (Math.abs(dx2) + Math.abs(dy2) === 1) {
                            tiles.push({ x: px + dx2, y: py + dy2 });
                        }
                    }
                }
                break;
            case 'aoe':
                for (var dy2 = -1; dy2 <= 1; dy2++) {
                    for (var dx2 = -1; dx2 <= 1; dx2++) {
                        tiles.push({ x: tx + dx2, y: ty + dy2 });
                    }
                }
                break;
        }

        return tiles.filter(function(t) {
            return t.x >= 0 && t.x < Data.GRID_SIZE && t.y >= 0 && t.y < Data.GRID_SIZE;
        });
    },

    calculateDamage: function(baseDmg, skill) {
        var bonus = State.getPlayerDamage();
        var dmg = baseDmg + bonus;

        if (State.hasSynergy('empowered') && State.player.tempPower > 0) {
            dmg = Math.floor(dmg * 1.5);
        }

        var isCrit = Math.random() * 100 < State.player.critChance;
        if (isCrit) {
            dmg = Math.floor(dmg * 2);
        }

        return { damage: Math.max(1, dmg), isCrit: isCrit };
    },

    dealDamage: function(target, dmg, source, isCrit) {
        var actualDmg = dmg;
        if (target.frozen && target.frozen > 0 && State.hasSynergy('shatter')) {
            actualDmg = dmg * 2;
        }

        target.hp -= actualDmg;
        State.runStats.totalDamage += actualDmg;
        var color = isCrit ? '#ffff00' : '#ff4444';
        var text = isCrit ? 'CRIT! -' + actualDmg : '-' + actualDmg;
        var size = target.size || 1;
        var centerX = target.x + Math.floor(size / 2);
        var centerY = target.y + Math.floor(size / 2);
        State.addFloatingText(centerX, centerY, text, color);

        var targetName = target.isBoss ? target.name : (Data.ENEMIES[target.defId] ? Data.ENEMIES[target.defId].name : 'Enemy');
        var critText = isCrit ? ' (CRIT)' : '';
        State.addLog('Player deals ' + actualDmg + ' dmg to ' + targetName + critText, 'player');

        if (target.hp <= 0) {
            target.hp = 0;
            if (target.isBoss) {
                State.runStats.bossesKilled++;
                State.addLog(targetName + ' defeated!', 'boss');
            } else {
                State.runStats.enemyKills++;
                State.addLog(targetName + ' killed!', 'kill');
            }
        }

        return actualDmg;
    },

    dealDamageToPlayer: function(dmg) {
        State.player.hp -= dmg;
        State.addFloatingText(State.player.x, State.player.y, '-' + dmg, '#ff4444');
        State.addLog('Player takes ' + dmg + ' damage', 'damage');
        if (State.player.hp <= 0) {
            State.player.hp = 0;
        }
    },

    executeSingleAttack: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;
        if (State.isBlocked(tx, ty)) return;

        var dist = Math.abs(tx - State.player.x) + Math.abs(ty - State.player.y);
        if (dist > skill.range) return;

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        var enemy = State.getEnemyAt(tx, ty);
        if (enemy) {
            var result = this.calculateDamage(skill.damage, skill);
            var dmg = result.damage;
            var isCrit = result.isCrit;

            if (skill.effects.indexOf('backstab') !== -1) {
                var playerDir = Grid.getDirection(State.player.x, State.player.y, tx, ty);
                var enemyDir = enemy.facing || 'up';
                var opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
                if (playerDir === opposite[enemyDir]) {
                    var backstabResult = this.calculateDamage(skill.damage * 2, skill);
                    dmg = backstabResult.damage;
                    isCrit = backstabResult.isCrit;
                    State.addFloatingText(tx, ty, 'BACKSTAB!', '#ff8800');
                }
            }

            this.dealDamage(enemy, dmg, 'player', isCrit);

            if (skill.effects.indexOf('push') !== -1) {
                var pushDir = Grid.getDirection(State.player.x, State.player.y, tx, ty);
                var pushX = tx, pushY = ty;
                for (var p = 0; p < 2; p++) {
                    var nx = pushX + (pushDir === 'right' ? 1 : pushDir === 'left' ? -1 : 0);
                    var ny = pushY + (pushDir === 'down' ? 1 : pushDir === 'up' ? -1 : 0);
                    if (!State.isBlocked(nx, ny) && !State.getEnemyAt(nx, ny)) {
                        pushX = nx;
                        pushY = ny;
                    }
                }
                enemy.x = pushX;
                enemy.y = pushY;
            }

            if (skill.effects.indexOf('freeze') !== -1) {
                enemy.frozen = 2;
            }
            if (skill.effects.indexOf('burn') !== -1) {
                State.burnTiles.push({ x: tx, y: ty, turns: 3 });
            }
            if (skill.effects.indexOf('poison') !== -1) {
                enemy.poison = { damage: 3, turns: 3 };
            }
        } else {
            this.hitObstacle(tx, ty, skill.damage);
        }

        this.endPlayerTurn();
    },

    executeDirectionalSkill: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, tx, ty, skill);
        var hitSomething = false;
        var lastHitEnemy = null;

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            if (State.isBlocked(t.x, t.y) && !State.getEnemyAt(t.x, t.y)) break;

            var enemy = State.getEnemyAt(t.x, t.y);
            if (enemy) {
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
                hitSomething = true;
                lastHitEnemy = enemy;

                if (skill.effects.indexOf('freeze') !== -1) enemy.frozen = 2;
                if (skill.effects.indexOf('burn') !== -1) State.burnTiles.push({ x: t.x, y: t.y, turns: 3 });
                if (skill.effects.indexOf('poison') !== -1) enemy.poison = { damage: 2, turns: 3 };
            } else {
                this.hitObstacle(t.x, t.y, skill.damage);
            }
        }

        if (skill.effects.indexOf('chain') !== -1 && lastHitEnemy) {
            var alive = State.getAliveEnemies();
            var nearby = [];
            for (var i = 0; i < alive.length; i++) {
                if (alive[i] !== lastHitEnemy && alive[i].hp > 0) {
                    var d = Math.abs(alive[i].x - lastHitEnemy.x) + Math.abs(alive[i].y - lastHitEnemy.y);
                    if (d <= 2) nearby.push(alive[i]);
                }
            }
            if (nearby.length > 0) {
                var chainTarget = nearby[Math.floor(Math.random() * nearby.length)];
                var chainResult = this.calculateDamage(Math.floor(skill.damage * 0.5), skill);
                this.dealDamage(chainTarget, chainResult.damage, 'player', chainResult.isCrit);
                State.addFloatingText(chainTarget.x, chainTarget.y, 'CHAIN!', '#ffff44');
            }
        }

        this.endPlayerTurn();
    },

    executeRingSkill: function(skill) {
        if (State.player.energy < skill.energyCost) return;
        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        if (skill.effects.indexOf('empower') !== -1) {
            State.player.tempPower = 3;
            State.addFloatingText(State.player.x, State.player.y, 'EMPOWERED!', '#ffaa00');
        }

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, State.player.x, State.player.y, skill);
        for (var i = 0; i < tiles.length; i++) {
            var enemy = State.getEnemyAt(tiles[i].x, tiles[i].y);
            if (enemy) {
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
            }
        }

        this.endPlayerTurn();
    },

    executeAoE: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;
        if (State.isBlocked(tx, ty)) return;

        var dist = Math.abs(tx - State.player.x) + Math.abs(ty - State.player.y);
        if (dist > skill.range) return;

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, tx, ty, skill);
        var hitCount = 0;

        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var enemy = State.getEnemyAt(t.x, t.y);
            if (enemy) {
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
                hitCount++;

                if (skill.effects.indexOf('burn') !== -1) {
                    State.burnTiles.push({ x: t.x, y: t.y, turns: 3 });
                }
                if (skill.effects.indexOf('poison') !== -1) {
                    enemy.poison = { damage: 2, turns: 3 };
                }
            } else {
                this.hitObstacle(t.x, t.y, skill.damage);
            }
        }

        if (hitCount === 0) {
            State.addFloatingText(tx, ty, 'MISS', '#888888');
        }

        this.endPlayerTurn();
    },

    executeDash: function(tx, ty) {
        if (State.player.energy < 1) return;

        var dx = tx - State.player.x;
        var dy = ty - State.player.y;
        var dist = Math.abs(dx) + Math.abs(dy);
        if (dist > 3 || dist === 0) return;

        State.addLog('Player uses Dash', 'action');

        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        if (Math.abs(dx) >= Math.abs(dy)) stepY = 0;
        else stepX = 0;

        var finalX = State.player.x;
        var finalY = State.player.y;

        for (var i = 0; i < 3; i++) {
            var nx = finalX + stepX;
            var ny = finalY + stepY;
            if (nx < 0 || nx >= Data.GRID_SIZE || ny < 0 || ny >= Data.GRID_SIZE) break;
            if (State.isBlocked(nx, ny)) break;
            finalX = nx;
            finalY = ny;
        }

        State.player.energy -= 1;
        State.player.x = finalX;
        State.player.y = finalY;
        Input.checkTileEffects(finalX, finalY);
        this.endPlayerTurn();
    },

    hitObstacle: function(x, y, dmg) {
        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            if (o.x === x && o.y === y && o.destructible) {
                o.hp -= dmg;
                State.addFloatingText(x, y, '-' + dmg, '#886644');
                if (o.hp <= 0) {
                    State.obstacles.splice(i, 1);
                }
                return true;
            }
        }
        return false;
    },

    endPlayerTurn: function() {
        State.phase = 'enemy';
        State.player.tempPower = 0;
        State.hoveredTile = null;
        State.attackPreview = [];
        UI.updateAll();

        setTimeout(function() {
            AI.processEnemyTurns();
        }, 300);
    },

    startNewTurn: function() {
        State.turn++;
        State.phase = 'player';
        var regenAmount = Math.ceil(State.player.maxEnergy / 2);
        State.player.energy = Math.min(State.player.energy + regenAmount, State.player.maxEnergy);

        this.processStatusEffects();
        this.processBurnTiles();

        if (State.player.hp <= 0) {
            Main.gameOver();
            return;
        }

        var alive = State.getAliveEnemies();
        if (alive.length === 0) {
            Main.stageClear();
            return;
        }

        UI.updateAll();
    },

    processStatusEffects: function() {
        for (var i = State.enemies.length - 1; i >= 0; i--) {
            var e = State.enemies[i];
            if (e.hp <= 0) continue;

            if (e.frozen > 0) {
                e.frozen--;
                if (e.frozen === 0) {
                    State.addFloatingText(e.x, e.y, 'THAWED', '#88ddff');
                }
            }

            if (e.poison && e.poison.turns > 0) {
                var poisonDmg = e.poison.damage;
                if (State.hasSynergy('combust')) {
                    var onBurn = State.burnTiles.some(function(b) { return b.x === e.x && b.y === e.y; });
                    if (onBurn) poisonDmg *= 2;
                }
                e.hp -= poisonDmg;
                var def = Data.ENEMIES[e.defId];
                var name = def ? def.name : 'Enemy';
                State.addLog(name + ' takes ' + poisonDmg + ' poison dmg', 'dot');
                State.addFloatingText(e.x, e.y, '-' + poisonDmg + ' POISON', '#44cc44');
                e.poison.turns--;
                if (e.poison.turns <= 0) e.poison = null;
                if (e.hp <= 0) {
                    e.hp = 0;
                    State.runStats.enemyKills++;
                    State.addLog(name + ' killed by poison!', 'kill');
                }
            }
        }
    },

    processBurnTiles: function() {
        for (var i = State.burnTiles.length - 1; i >= 0; i--) {
            State.burnTiles[i].turns--;
            if (State.burnTiles[i].turns <= 0) {
                State.burnTiles.splice(i, 1);
            }
        }
    }
};
