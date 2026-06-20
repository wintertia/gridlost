var Boss = {
    processTurn: function(boss, callback) {
        State.bossTurnCount++;

        if (boss.telegraph) {
            var self = this;
            this.executeTelegraphedAttack(boss, boss.telegraph, function() {
                boss.telegraph = null;
                boss.telegraphTiles = null;
                self.bossBasicMoveAndAttack(boss, callback);
            });
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
            this.bossBasicMoveAndAttack(boss, callback);
        }
    },

    getTelegraphTiles: function(boss, attack) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var tiles = [];

        switch (attack.name) {
            case 'Ground Slam':
            case 'Ground Pound':
                tiles = [
                    { x: centerX, y: centerY },
                    { x: centerX + 1, y: centerY },
                    { x: centerX - 1, y: centerY },
                    { x: centerX, y: centerY + 1 },
                    { x: centerX, y: centerY - 1 }
                ];
                break;
            case 'Boulder Throw':
            case 'Ice Boulder':
            case 'Void Bolt':
                var dx = State.player.x - centerX;
                var dy = State.player.y - centerY;
                var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                for (var i = 1; i <= attack.range; i++) {
                    tiles.push({ x: centerX + stepX * i, y: centerY + stepY * i });
                }
                break;
            case 'Tail Whip':
                tiles = [
                    { x: centerX, y: centerY },
                    { x: centerX + 1, y: centerY },
                    { x: centerX - 1, y: centerY },
                    { x: centerX, y: centerY + 1 },
                    { x: centerX, y: centerY - 1 }
                ];
                break;
            case 'Lightning Breath':
            case 'Poison Spit':
            case 'Fire Breath':
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
            case 'Root Grasp':
                tiles = [
                    { x: centerX, y: centerY },
                    { x: centerX + 1, y: centerY },
                    { x: centerX - 1, y: centerY },
                    { x: centerX, y: centerY + 1 },
                    { x: centerX, y: centerY - 1 },
                    { x: centerX + 1, y: centerY + 1 },
                    { x: centerX - 1, y: centerY - 1 },
                    { x: centerX + 1, y: centerY - 1 },
                    { x: centerX - 1, y: centerY + 1 }
                ];
                break;
            case 'Leaf Storm':
            case 'Blizzard':
            case 'Eruption':
            case 'Darkness':
            case 'Holy Nova':
                for (var dy3 = -attack.range; dy3 <= attack.range; dy3++) {
                    for (var dx3 = -attack.range; dx3 <= attack.range; dx3++) {
                        if (Math.abs(dx3) + Math.abs(dy3) <= attack.range) {
                            tiles.push({ x: centerX + dx3, y: centerY + dy3 });
                        }
                    }
                }
                break;
            case 'Multi-Head':
                tiles = [
                    { x: centerX, y: centerY },
                    { x: centerX + 2, y: centerY },
                    { x: centerX - 2, y: centerY },
                    { x: centerX, y: centerY + 2 },
                    { x: centerX, y: centerY - 2 }
                ];
                break;
            case 'Swallow':
            case 'Smite':
                var dx4 = State.player.x - centerX;
                var dy4 = State.player.y - centerY;
                var stepX4 = dx4 === 0 ? 0 : (dx4 > 0 ? 1 : -1);
                var stepY4 = dy4 === 0 ? 0 : (dy4 > 0 ? 1 : -1);
                var range4 = attack.range || 4;
                for (var i = 1; i <= range4; i++) {
                    tiles.push({ x: centerX + stepX4 * i, y: centerY + stepY4 * i });
                }
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
            'Boulder Throw': 'A boulder is heading your way!',
            'Ground Slam': 'Ground slam! Move away from the center!',
            'Root Grasp': 'Roots erupting from the ground! Move to dodge!',
            'Summon Saplings': boss.name + ' is summoning saplings!',
            'Leaf Storm': 'Leaf storm incoming! Stay clear!',
            'Multi-Head': 'Multiple heads striking at once!',
            'Regen': boss.name + ' is healing!',
            'Poison Spit': 'Poison spit incoming! Dodge the cone!',
            'Burrow': boss.name + ' is burrowing underground!',
            'Swallow': 'A massive jaw approaches in a line!',
            'Ice Boulder': 'Ice boulder heading your way!',
            'Ground Pound': 'Ground pound! Move away from the center!',
            'Blizzard': 'Blizzard incoming! Stay clear!',
            'Fire Breath': 'Fire breath incoming! Dodge the cone!',
            'Wing Buffet': 'Wing buffet incoming!',
            'Eruption': 'Eruption incoming! Stay clear!',
            'Void Bolt': 'Void bolt heading your way!',
            'Darkness': 'Darkness engulfs the area!',
            'Holy Nova': 'Holy nova incoming! Stay clear!',
            'Divine Shield': boss.name + ' is raising a shield!',
            'Smite': 'A smiting bolt heads your way!'
        };

        if (alertMessages[attack.name]) {
            State.addLog(alertMessages[attack.name], 'telegraph');
        }

        switch (attack.name) {
            case 'Ground Slam': this.groundSlam(boss, attack, callback); break;
            case 'Boulder Throw': this.boulderThrow(boss, attack, callback); break;
            case 'Summon Rubble': this.summonRubble(boss, callback); break;
            case 'Root Grasp': this.rootGrasp(boss, attack, callback); break;
            case 'Summon Saplings': this.summonSaplings(boss, callback); break;
            case 'Leaf Storm': this.aoeAttack(boss, attack, callback); break;
            case 'Multi-Head': this.multiDirection(boss, attack, callback); break;
            case 'Regen': this.selfHeal(boss, callback); break;
            case 'Poison Spit': this.coneAttack(boss, attack, callback); break;
            case 'Burrow': this.burrow(boss, callback); break;
            case 'Tail Whip': this.tailSweep(boss, attack, callback); break;
            case 'Swallow': this.executeLine(boss, attack, callback); break;
            case 'Ice Boulder': this.boulderThrow(boss, attack, callback); break;
            case 'Ground Pound': this.groundSlam(boss, attack, callback); break;
            case 'Blizzard': this.aoeAttack(boss, attack, callback); break;
            case 'Fire Breath': this.coneAttack(boss, attack, callback); break;
            case 'Wing Buffet': this.wingGust(boss, callback); break;
            case 'Eruption': this.aoeAttack(boss, attack, callback); break;
            case 'Shadow Clone': this.cloneWraith(boss, callback); break;
            case 'Void Bolt': this.boulderThrow(boss, attack, callback); break;
            case 'Darkness': this.aoeAttack(boss, attack, callback); break;
            case 'Holy Nova': this.aoeAttack(boss, attack, callback); break;
            case 'Divine Shield': this.shieldSelf(boss, callback); break;
            case 'Smite': this.singleTarget(boss, attack, callback); break;
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

    bossBasicMoveAndAttack: function(boss, callback) {
        var size = boss.size || 2;
        var centerX = boss.x + Math.floor(size / 2);
        var centerY = boss.y + Math.floor(size / 2);
        var dist = AI.distance(centerX, centerY, State.player.x, State.player.y);

        if (dist <= size) {
            State.addLog(boss.name + ' uses Basic Attack', 'boss');
            Combat.dealDamageToPlayer(boss.damage);
            var dir = Grid.getDirection(centerX, centerY, State.player.x, State.player.y);
            boss.facing = dir;
        } else {
            var dx = State.player.x - centerX;
            var dy = State.player.y - centerY;
            var moveX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
            var moveY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

            var newX = boss.x + moveX;
            var newY = boss.y + moveY;
            if (newX >= 0 && newX < Data.GRID_SIZE && newY >= 0 && newY < Data.GRID_SIZE && !State.isBlocked(newX, newY)) {
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
                        isSummon: true
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
        for (var dy = -range; dy <= range; dy++) {
            for (var dx = -range; dx <= range; dx++) {
                if (Math.abs(dx) + Math.abs(dy) <= range) {
                    var tx = centerX + dx;
                    var ty = centerY + dy;
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
        for (var i = 0; i < offsets.length; i++) {
            var tx = centerX + offsets[i].x;
            var ty = centerY + offsets[i].y;
            if (tx === State.player.x && ty === State.player.y) {
                Combat.dealDamageToPlayer(attack.damage);
            }
        }
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
            var attempts = 0;
            do {
                boss.x = Math.floor(Math.random() * (Data.GRID_SIZE - size + 1));
                boss.y = Math.floor(Math.random() * (Data.GRID_SIZE - size + 1));
                attempts++;
            } while (attempts < 100 && (Stages.isReserved(boss.x, boss.y) || Stages.isReserved(boss.x + size - 1, boss.y) || Stages.isReserved(boss.x, boss.y + size - 1) || Stages.isReserved(boss.x + size - 1, boss.y + size - 1)));
            boss.untargetable = false;

            var newCenterX = boss.x + Math.floor(size / 2);
            var newCenterY = boss.y + Math.floor(size / 2);
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
    }
};
