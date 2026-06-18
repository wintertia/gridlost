var Boss = {
    processTurn: function(boss, callback) {
        State.bossTurnCount++;

        if (boss.telegraph) {
            this.executeTelegraphedAttack(boss, boss.telegraph, callback);
            boss.telegraph = null;
            boss.telegraphTiles = null;
            return;
        }

        var nextAttack = this.getNextAttack(boss);
        if (nextAttack) {
            boss.telegraph = nextAttack;
            boss.telegraphTiles = this.getTelegraphTiles(boss, nextAttack);
            State.addLog(boss.name + ' telegraphs: ' + nextAttack.name, 'telegraph');
            Grid.render();
            UI.updateAll();
            callback();
        } else {
            this.basicAttack(boss, callback);
        }
    },

    getTelegraphTiles: function(boss, attack) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var tiles = [];

        switch (attack.name) {
            case 'Ground Slam':
                tiles = [
                    { x: centerX, y: centerY },
                    { x: centerX + 1, y: centerY },
                    { x: centerX - 1, y: centerY },
                    { x: centerX, y: centerY + 1 },
                    { x: centerX, y: centerY - 1 }
                ];
                break;
            case 'Boulder Throw':
                var dx = State.player.x - centerX;
                var dy = State.player.y - centerY;
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                for (var i = 1; i <= attack.range; i++) {
                    tiles.push({ x: centerX + stepX * i, y: centerY + stepY * i });
                }
                break;
            case 'Tail Sweep':
            case 'Life Drain':
                tiles = [
                    { x: centerX, y: centerY },
                    { x: centerX + 1, y: centerY },
                    { x: centerX - 1, y: centerY },
                    { x: centerX, y: centerY + 1 },
                    { x: centerX, y: centerY - 1 }
                ];
                break;
            case 'Lightning Breath':
                var dx2 = State.player.x - centerX;
                var dy2 = State.player.y - centerY;
                var dirX = dx2 === 0 ? 0 : (dx2 > 0 ? 1 : -1);
                var dirY = dy2 === 0 ? 0 : (dy2 > 0 ? 1 : -1);
                for (var i = 1; i <= attack.range; i++) {
                    for (var spread = -1; spread <= 1; spread++) {
                        if (dirX !== 0) {
                            tiles.push({ x: centerX + dirX * i, y: centerY + spread });
                        } else {
                            tiles.push({ x: centerX + spread, y: centerY + dirY * i });
                        }
                    }
                }
                break;
            case 'Fly Up':
                tiles = [{ x: State.player.x, y: State.player.y }];
                break;
        }

        return tiles.filter(function(t) {
            return t.x >= 0 && t.x < Data.GRID_SIZE && t.y >= 0 && t.y < Data.GRID_SIZE;
        });
    },

    getNextAttack: function(boss) {
        if (!boss.attacks) return null;
        for (var i = 0; i < boss.attacks.length; i++) {
            var atk = boss.attacks[i];
            if (atk.current <= 0) {
                return atk;
            }
        }
        return null;
    },

    executeTelegraphedAttack: function(boss, attack, callback) {
        attack.current = attack.cooldown;
        for (var i = 0; i < boss.attacks.length; i++) {
            if (boss.attacks[i].current > 0) {
                boss.attacks[i].current--;
            }
        }

        State.addLog(boss.name + ' uses ' + attack.name, 'boss');

        var alertMessages = {
            'Summon Rubble': boss.name + ' summoned rubble on yourself! Destroy the rubble to move',
            'Fly Up': boss.name + ' is flying up high! Avoid the dangerous landing area',
            'Shadow Step': boss.name + ' is teleporting behind you!',
            'Clone': boss.name + ' is creating a clone!',
            'Boulder Throw': 'A boulder is heading your way!',
            'Lightning Breath': 'Lightning breath incoming! Dodge the cone!',
            'Ground Slam': 'Ground slam! Move away from the center!',
            'Tail Sweep': 'Tail sweep! Stay clear of adjacent tiles!'
        };

        if (alertMessages[attack.name]) {
            State.addLog(alertMessages[attack.name], 'telegraph');
        }

        switch (attack.name) {
            case 'Ground Slam': this.groundSlam(boss, attack, callback); break;
            case 'Boulder Throw': this.boulderThrow(boss, attack, callback); break;
            case 'Summon Rubble': this.summonRubble(boss, callback); break;
            case 'Shadow Step': this.shadowStep(boss, attack, callback); break;
            case 'Life Drain': this.lifeDrain(boss, attack, callback); break;
            case 'Clone': this.cloneWraith(boss, callback); break;
            case 'Lightning Breath': this.lightningBreath(boss, attack, callback); break;
            case 'Wing Gust': this.wingGust(boss, callback); break;
            case 'Tail Sweep': this.tailSweep(boss, attack, callback); break;
            case 'Fly Up': this.flyUp(boss, attack, callback); break;
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
            Combat.dealDamageToPlayer(boss.damage);
        }
        var dir = Grid.getDirection(centerX, centerY, State.player.x, State.player.y);
        boss.facing = dir;
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

    shadowStep: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);

        var behindX = State.player.x;
        var behindY = State.player.y;

        if (boss.facing === 'up') behindY = State.player.y + 1;
        else if (boss.facing === 'down') behindY = State.player.y - 1;
        else if (boss.facing === 'left') behindX = State.player.x + 1;
        else behindX = State.player.x - 1;

        if (behindX >= 0 && behindX < Data.GRID_SIZE && behindY >= 0 && behindY < Data.GRID_SIZE) {
            if (!State.isBlocked(behindX, behindY)) {
                boss.x = behindX;
                boss.y = behindY;
            }
        }

        Combat.dealDamageToPlayer(attack.damage);

        Grid.render();
        UI.updateAll();
        callback();
    },

    lifeDrain: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dist = AI.distance(centerX, centerY, State.player.x, State.player.y);
        if (dist <= 2) {
            Combat.dealDamageToPlayer(attack.damage);
            boss.hp = Math.min(boss.maxHp, boss.hp + (attack.heal || 0));
            State.addFloatingText(centerX, centerY, '+' + (attack.heal || 0), '#44ff44');
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
                    isSummon: true
                });
                State.addFloatingText(nx, ny, 'CLONE!', '#443366');
                break;
            }
        }

        Grid.render();
        UI.updateAll();
        callback();
    },

    lightningBreath: function(boss, attack, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dx = State.player.x - centerX;
        var dy = State.player.y - centerY;
        var dirX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var dirY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

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

    flyUp: function(boss, attack, callback) {
        boss.untargetable = true;
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        State.addFloatingText(centerX, centerY, 'FLYING!', '#2244aa');

        setTimeout(function() {
            if (boss.hp <= 0) {
                boss.untargetable = false;
                Grid.render();
                UI.updateAll();
                callback();
                return;
            }

            var attempts = 0;
            do {
                boss.x = Math.floor(Math.random() * (Data.GRID_SIZE - size + 1));
                boss.y = Math.floor(Math.random() * (Data.GRID_SIZE - size + 1));
                attempts++;
            } while (attempts < 100 && (Stages.isReserved(boss.x, boss.y) || Stages.isReserved(boss.x + size - 1, boss.y) || Stages.isReserved(boss.x, boss.y + size - 1) || Stages.isReserved(boss.x + size - 1, boss.y + size - 1)));

            boss.untargetable = false;

            var newCenterX = boss.x + Math.floor(size / 2);
            var newCenterY = boss.y + Math.floor(size / 2);
            var tiles = [
                { x: newCenterX, y: newCenterY },
                { x: newCenterX + 1, y: newCenterY },
                { x: newCenterX - 1, y: newCenterY },
                { x: newCenterX, y: newCenterY + 1 },
                { x: newCenterX, y: newCenterY - 1 }
            ];

            for (var i = 0; i < tiles.length; i++) {
                if (tiles[i].x === State.player.x && tiles[i].y === State.player.y) {
                    Combat.dealDamageToPlayer(attack.damage);
                }
            }

            State.addFloatingText(newCenterX, newCenterY, 'CRASH!', '#ff4466');
            Grid.render();
            UI.updateAll();
            callback();
        }, 800);
    }
};
