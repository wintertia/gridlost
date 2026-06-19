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
                        tiles.push({ x: px + dx2, y: py + dy2 });
                    }
                }
                break;
            case 'aoe':
                var aoeRange = 1;
                var fireInter = State.hasSkillInteraction('fireball');
                if (fireInter && fireInter.range && skill.id === 'fireball') {
                    aoeRange = fireInter.range;
                }
                for (var dy2 = -aoeRange; dy2 <= aoeRange; dy2++) {
                    for (var dx2 = -aoeRange; dx2 <= aoeRange; dx2++) {
                        tiles.push({ x: tx + dx2, y: ty + dy2 });
                    }
                }
                break;
            case 'self':
                tiles.push({ x: State.player.x, y: State.player.y });
                break;
            case 'blink':
                tiles.push({ x: tx, y: ty });
                break;
        }

        return tiles.filter(function(t) {
            return t.x >= 0 && t.x < Data.GRID_SIZE && t.y >= 0 && t.y < Data.GRID_SIZE;
        });
    },

    calculateDamage: function(baseDmg, skill) {
        var bonus = State.getPlayerDamage();
        var itemPowerBonus = this.calculateItemStatBonus('power');
        var conditionalBonus = this.getConditionalDamageBonus();
        var dmg = baseDmg + bonus + itemPowerBonus + conditionalBonus;

        if (skill && skill.id) {
            var skillStacks = State.player.skillStacks[skill.id] || 0;
            if (skillStacks > 0 && !['war_cry', 'heal', 'lifesteal_aura', 'rejuvenation', 'mark', 'berserk', 'guard'].includes(skill.id)) {
                var stackMultiplier = 1 + (skillStacks * 0.2);
                dmg = Math.floor(dmg * stackMultiplier);
            }
        }

        if (State.player.tempPower > 0) {
            dmg = Math.floor(dmg * (1 + State.player.tempPower / 100));
        }

        if (State.player.berserk && State.player.berserk > 0) {
            var berserkStacks = State.player.skillStacks['berserk'] || 0;
            var berserkMultiplier = 1.5 + (berserkStacks * 0.25);
            dmg = Math.floor(dmg * berserkMultiplier);
        }

        var empowerInter = State.hasSkillInteraction('war_cry');
        if (empowerInter && empowerInter.value && State.player.tempPower > 0) {
            dmg = Math.floor(dmg * (1 + empowerInter.value / 100));
        }

        var isCrit = Math.random() * 100 < (State.player.critChance + this.calculateItemStatBonus('critChance'));
        if (isCrit) {
            var critMultiplier = 2;
            var hasGlassCannonSet = State.hasItemSet('glass_cannon_synergy');
            if (hasGlassCannonSet) critMultiplier = 3;
            var critDamageBonus = this.calculateItemStatBonus('critDamage');
            dmg = Math.floor(dmg * (critMultiplier + critDamageBonus / 100));
        }

        var roll = 0.9 + Math.random() * 0.1;
        dmg = Math.floor(dmg * roll);

        return { damage: Math.max(1, dmg), isCrit: isCrit };
    },

    dealDamage: function(target, dmg, source, isCrit) {
        var actualDmg = dmg;

        var shatterInter = State.hasSkillInteraction('ice_shard');
        if (target.frozen && target.frozen > 0 && shatterInter && shatterInter.multiplier) {
            actualDmg = dmg * shatterInter.multiplier;
        }

        var iceShardShatter = State.hasItem('frozen_core') && State.hasSkillInteraction('ice_shard');
        if (target.frozen && target.frozen > 0 && iceShardShatter) {
            actualDmg = dmg * 2;
        }

        if (target.marked && target.marked > 0) {
            actualDmg = Math.floor(actualDmg * target.marked);
            target.marked = 0;
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

        if (source === 'player') {
            this.processOnHitEffects(target, centerX, centerY);
        }

        if (target.hp <= 0) {
            target.hp = 0;
            if (target.isBoss) {
                State.runStats.bossesKilled++;
                State.addLog(targetName + ' defeated!', 'boss');
            } else {
                State.runStats.enemyKills++;
                State.addLog(targetName + ' killed!', 'kill');
                this.processOnKillEffects(target);

                var defId = target.defId;
                if (defId !== 'skeleton') {
                    var healPercent = 1 + Math.random() * 2;
                    var healAmount = Math.floor(State.player.maxHp * healPercent / 100);
                    State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
                    State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
                    State.addLog('Healed for ' + healAmount + ' HP', 'info');
                }
            }
        }

        if (source === 'player' && State.player.lifestealAura && State.player.lifestealAura > 0) {
            var lifestealStacks = State.player.skillStacks['lifesteal_aura'] || 0;
            var lifestealPercent = 0.2 + (lifestealStacks * 0.025);
            var lifestealHeal = Math.floor(actualDmg * lifestealPercent);
            if (lifestealHeal > 0) {
                State.player.hp = Math.min(State.player.hp + lifestealHeal, State.player.maxHp);
                State.addFloatingText(State.player.x, State.player.y, '+' + lifestealHeal + ' LIFESTEAL', '#cc4444');
            }
        }

        if (target.bleed && target.bleed.turns > 0) {
                var bleedDmg = target.bleed.damage;
                target.hp -= bleedDmg;
                var def = Data.ENEMIES[target.defId];
                var name = def ? def.name : 'Enemy';
                State.addLog(name + ' takes ' + bleedDmg + ' bleed dmg', 'dot');
                State.addFloatingText(target.x, target.y, '-' + bleedDmg + ' BLEED', '#cc2222');
                target.bleed.turns--;
                if (target.bleed.turns <= 0) target.bleed = null;
                if (target.hp <= 0) {
                    target.hp = 0;
                    State.runStats.enemyKills++;
                    State.addLog(name + ' killed by bleed!', 'kill');
                    var defId = target.defId;
                    if (defId !== 'skeleton') {
                        var healPercent = 1 + Math.random() * 2;
                        var healAmount = Math.floor(State.player.maxHp * healPercent / 100);
                        State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
                        State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
                        State.addLog('Healed for ' + healAmount + ' HP', 'info');
                    }
                }
        }
    },

    processOnHitEffects: function(target, hitX, hitY) {
        var items = State.player.items;
        var hasElementalMastery = State.hasItemSet('elemental_mastery');

        if (items['burning_touch'] > 0) {
            var chance = 10 * items['burning_touch'];
            if (hasElementalMastery) chance *= 2;
            if (Math.random() * 100 < chance) {
                State.burnTiles.push({ x: hitX, y: hitY, turns: 3 });
                State.addFloatingText(hitX, hitY, 'BURN!', '#ff6600');
            }
        }

        if (items['frozen_core'] > 0 && !target.isBoss && target.frozen === 0) {
            var chance = 10 * items['frozen_core'];
            if (hasElementalMastery) chance *= 2;
            if (Math.random() * 100 < chance) {
                target.frozen = 2;
                target.freezeImmune = true;
                State.addFloatingText(hitX, hitY, 'FREEZE!', '#88ddff');
            }
        }

        if (items['chain_lightning'] > 0) {
            var chance = 20 * items['chain_lightning'];
            if (hasElementalMastery) chance *= 2;
            if (Math.random() * 100 < chance) {
                var alive = State.getAliveEnemies();
                var nearby = [];
                for (var i = 0; i < alive.length; i++) {
                    if (alive[i] !== target && alive[i].hp > 0) {
                        var d = Math.abs(alive[i].x - hitX) + Math.abs(alive[i].y - hitY);
                        if (d <= 2) nearby.push(alive[i]);
                    }
                }
                if (nearby.length > 0) {
                    var chainTarget = nearby[Math.floor(Math.random() * nearby.length)];
                    var chainDmg = Math.floor(this.calculateDamage(30 * items['chain_lightning']).damage);
                    this.dealDamage(chainTarget, chainDmg, 'chain', false);
                    State.addFloatingText(chainTarget.x, chainTarget.y, 'CHAIN!', '#ffff44');
                }
            }
        }

        if (items['chaos_embrace'] > 0) {
            var chance = 25 * items['chaos_embrace'];
            if (Math.random() * 100 < chance) {
                var statuses = ['burn', 'freeze', 'poison'];
                var status = statuses[Math.floor(Math.random() * statuses.length)];
                if (status === 'freeze' && !target.isBoss && target.frozen === 0) {
                    target.frozen = 2;
                    target.freezeImmune = true;
                    State.addFloatingText(hitX, hitY, 'CHAOS FREEZE!', '#88ddff');
                } else if (status === 'burn') {
                    State.burnTiles.push({ x: hitX, y: hitY, turns: 3 });
                    State.addFloatingText(hitX, hitY, 'CHAOS BURN!', '#ff6600');
                } else if (status === 'poison') {
                    var poisonDmg = Math.floor(20 * (1 + State.player.power / 100));
                    target.poison = { damage: poisonDmg, turns: 3 };
                    State.addFloatingText(hitX, hitY, 'CHAOS POISON!', '#44cc44');
                }
            }
        }
    },

    processOnKillEffects: function(target) {
        var items = State.player.items;
        var size = target.size || 1;
        var centerX = target.x + Math.floor(size / 2);
        var centerY = target.y + Math.floor(size / 2);

        if (items['explosive_rounds'] > 0) {
            var chance = 30 * items['explosive_rounds'];
            if (Math.random() * 100 < chance) {
                var aoeDmg = Math.floor(this.calculateDamage(50).damage);
                var nearby = State.getAliveEnemies();
                for (var i = 0; i < nearby.length; i++) {
                    var e = nearby[i];
                    if (e === target || e.hp <= 0) continue;
                    var d = Math.abs(e.x - centerX) + Math.abs(e.y - centerY);
                    if (d <= 2) {
                        this.dealDamage(e, aoeDmg, 'explosion', false);
                        State.addFloatingText(e.x, e.y, 'BOOM!', '#ff8800');
                    }
                }
                State.addFloatingText(centerX, centerY, 'EXPLOSION!', '#ff4400');
            }
        }

        if (items['second_wind'] > 0) {
            var healPercent = 3 * items['second_wind'];
            var healAmount = Math.floor(State.player.maxHp * healPercent / 100);
            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
            State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
        }

        if (items['blood_focus'] > 0 || items['battle_momentum'] > 0) {
            var energyRestore = 0;
            if (items['blood_focus']) energyRestore += items['blood_focus'];
            if (items['battle_momentum']) energyRestore += items['battle_momentum'];
            State.player.energy = Math.min(State.player.energy + energyRestore, State.player.maxEnergy);
            State.addFloatingText(State.player.x, State.player.y, '+' + energyRestore + ' ⚡', '#ffaa00');
        }
    },

    dealDamageToPlayer: function(dmg) {
        var stacks = State.getItemStacks('iron_skin');
        var reduction = 1;
        if (stacks > 0) {
            reduction = 1 - (0.07 * Math.log2(stacks + 1));
            reduction = Math.max(0.3, reduction);
        }
        var reducedDmg = Math.max(1, Math.floor(dmg * reduction));

        if (State.player.guarding) {
            var guardMitigation = State.player.guardEnergy * 5;
            var guardReduction = 1 - (guardMitigation / 100);
            reducedDmg = Math.max(1, Math.floor(reducedDmg * guardReduction));
            State.addFloatingText(State.player.x, State.player.y, 'GUARD -' + guardMitigation + '%', '#6688aa');
        }

        if (State.player.berserk && State.player.berserk > 0) {
            var berserkStacks = State.player.skillStacks['berserk'] || 0;
            var berserkMultiplier = 1.5 + (berserkStacks * 0.25);
            reducedDmg = Math.floor(reducedDmg * berserkMultiplier);
        }

        if (State.player.damageReduction > 0) {
            reducedDmg = Math.floor(reducedDmg * 0.8);
        }

        if (State.player.shield > 0) {
            var shieldAbsorb = Math.min(State.player.shield, reducedDmg);
            State.player.shield -= shieldAbsorb;
            reducedDmg -= shieldAbsorb;
            if (shieldAbsorb > 0) {
                State.addFloatingText(State.player.x, State.player.y, '-' + shieldAbsorb + ' SHIELD', '#4488ff');
            }
        }

        State.player.hp -= reducedDmg;
        State.addFloatingText(State.player.x, State.player.y, '-' + reducedDmg, '#ff4444');
        State.addLog('Player takes ' + reducedDmg + ' damage', 'damage');
        if (State.player.hp <= 0) {
            State.player.hp = 0;
        }
    },

    executeSingleAttack: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;

        var dist = Math.abs(tx - State.player.x) + Math.abs(ty - State.player.y);
        if (dist > skill.range) return;

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        var enemy = State.getEnemyAt(tx, ty);
        if (enemy) {
            var result = this.calculateDamage(skill.damage, skill);
            var dmg = result.damage;
            var isCrit = result.isCrit;

            if (skill.effects.indexOf('backstab') !== -1 && enemy.frozen > 0) {
                var backstabResult = this.calculateDamage(skill.damage * 3, skill);
                dmg = backstabResult.damage;
                isCrit = backstabResult.isCrit;
                State.addFloatingText(tx, ty, 'SHATTER!', '#ff8800');
            }

            if (skill.effects.indexOf('execute') !== -1) {
                var hpPct = enemy.hp / enemy.maxHp;
                if (hpPct < 0.5) {
                    dmg = Math.floor(dmg * 2);
                    State.addFloatingText(tx, ty, 'EXECUTE!', '#ff4444');
                }
            }

            if (skill.effects.indexOf('reave') !== -1) {
                var alive = State.getAliveEnemies();
                var adjacentEnemies = 0;
                for (var i = 0; i < alive.length; i++) {
                    if (alive[i] !== enemy && alive[i].hp > 0) {
                        var d = Math.abs(alive[i].x - tx) + Math.abs(alive[i].y - ty);
                        if (d <= 1) adjacentEnemies++;
                    }
                }
                if (adjacentEnemies === 0) {
                    dmg = Math.floor(dmg * 1.5);
                    State.addFloatingText(tx, ty, 'REAVE!', '#aa4444');
                }
            }

            this.dealDamage(enemy, dmg, 'player', isCrit);

            if (skill.effects.indexOf('bleed') !== -1 && !enemy.isBoss) {
                var bleedDmg = Math.floor(15 * (1 + State.player.power / 100));
                if (!enemy.bleed) {
                    enemy.bleed = { damage: bleedDmg, turns: 3 };
                } else {
                    enemy.bleed.damage += bleedDmg;
                    enemy.bleed.turns = 3;
                }
                State.addFloatingText(tx, ty, 'BLEED!', '#cc2222');
            }

            if (skill.effects.indexOf('knockback3') !== -1 && !enemy.isBoss) {
                var pushDir = Grid.getDirection(State.player.x, State.player.y, tx, ty);
                var pushX = tx, pushY = ty;
                for (var p = 0; p < 3; p++) {
                    var nx = pushX + (pushDir === 'right' ? 1 : pushDir === 'left' ? -1 : 0);
                    var ny = pushY + (pushDir === 'down' ? 1 : pushDir === 'up' ? -1 : 0);
                    if (!State.isBlocked(nx, ny) && !State.getEnemyAt(nx, ny)) {
                        pushX = nx;
                        pushY = ny;
                    } else {
                        break;
                    }
                }
                enemy.x = pushX;
                enemy.y = pushY;
                State.addFloatingText(tx, ty, 'PUSHED!', '#8888ff');
            }

            if (skill.effects.indexOf('freeze') !== -1 && !enemy.isBoss && !enemy.freezeImmune && enemy.frozen === 0) {
                enemy.frozen = 2;
                enemy.freezeImmune = true;
            }
            if (skill.effects.indexOf('burn') !== -1) {
                State.burnTiles.push({ x: tx, y: ty, turns: 3 });
            }
            if (skill.effects.indexOf('poison') !== -1) {
                var poisonDmg = Math.floor(20 * (1 + State.player.power / 100));
                enemy.poison = { damage: poisonDmg, turns: 3 };
            }

            if (skill.effects.indexOf('mark') !== -1 && !enemy.isBoss) {
                var markStacks = State.player.skillStacks['mark'] || 0;
                var markMultiplier = 2 + (markStacks * 0.25);
                enemy.marked = markMultiplier;
                State.addFloatingText(tx, ty, 'MARKED! ' + Math.floor(markMultiplier * 100) + '%', '#ff8800');
            }
        } else {
            this.hitObstacle(tx, ty, skill.damage);
        }

        this.endPlayerTurn();
    },

    executeBlinkStrike: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;

        var dist = Math.abs(tx - State.player.x) + Math.abs(ty - State.player.y);
        if (dist > skill.range) return;

        var enemy = State.getEnemyAt(tx, ty);
        if (!enemy) return;

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses Blink Strike', 'action');

        var oldX = State.player.x;
        var oldY = State.player.y;

        var dirX = tx === oldX ? 0 : (tx > oldX ? 1 : -1);
        var dirY = ty === oldY ? 0 : (ty > oldY ? 1 : -1);
        var blinkX = tx - dirX;
        var blinkY = ty - dirY;

        if (blinkX < 0 || blinkX >= Data.GRID_SIZE || blinkY < 0 || blinkY >= Data.GRID_SIZE) {
            blinkX = oldX;
            blinkY = oldY;
        } else if (State.isBlocked(blinkX, blinkY) || State.getEnemyAt(blinkX, blinkY)) {
            blinkX = oldX;
            blinkY = oldY;
        }

        State.player.x = blinkX;
        State.player.y = blinkY;

        var result = this.calculateDamage(skill.damage, skill);
        this.dealDamage(enemy, result.damage, 'player', result.isCrit);

        this.endPlayerTurn();
    },

    executeSelfSkill: function(skill) {
        if (State.player.energy < skill.energyCost) return;

        if (skill.effects.indexOf('lifesteal_aura') !== -1 && State.player.lifestealAura > 0) {
            State.addFloatingText(State.player.x, State.player.y, 'ALREADY ACTIVE!', '#ff4444');
            return;
        }
        if (skill.effects.indexOf('berserk') !== -1 && State.player.berserk > 0) {
            State.addFloatingText(State.player.x, State.player.y, 'ALREADY ACTIVE!', '#ff4444');
            return;
        }
        if (skill.effects.indexOf('rejuvenation') !== -1 && State.player.rejuvenation > 0) {
            State.addFloatingText(State.player.x, State.player.y, 'ALREADY ACTIVE!', '#ff4444');
            return;
        }

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        if (skill.effects.indexOf('heal') !== -1) {
            var healStacks = State.player.skillStacks['heal'] || 0;
            var healPercent = 0.2 + (healStacks * 0.025);
            var healAmount = Math.floor(State.player.maxHp * healPercent);
            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
            State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff88');
            State.addLog('Healed for ' + healAmount + ' HP', 'info');
        }

        if (skill.effects.indexOf('lifesteal_aura') !== -1) {
            State.player.lifestealAura = 3;
            State.addFloatingText(State.player.x, State.player.y, 'LIFESTEAL AURA!', '#cc4444');
        }

        if (skill.effects.indexOf('berserk') !== -1) {
            State.player.berserk = 3;
            State.addFloatingText(State.player.x, State.player.y, 'BERSERK!', '#ff4444');
        }

        if (skill.effects.indexOf('rejuvenation') !== -1) {
            State.player.rejuvenation = 3;
            State.addFloatingText(State.player.x, State.player.y, 'REJUVENATION!', '#44ff88');
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
            if (State.isBlocked(t.x, t.y)) {
                var obstacle = null;
                for (var j = 0; j < State.obstacles.length; j++) {
                    if (State.obstacles[j].x === t.x && State.obstacles[j].y === t.y) {
                        obstacle = State.obstacles[j];
                        break;
                    }
                }
                if (!obstacle || !obstacle.destructible) break;
            }

            var enemy = State.getEnemyAt(t.x, t.y);
            if (enemy) {
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
                hitSomething = true;
                lastHitEnemy = enemy;

                if (skill.effects.indexOf('freeze') !== -1 && !enemy.isBoss && !enemy.freezeImmune && enemy.frozen === 0) enemy.frozen = 2;
                if (skill.effects.indexOf('burn') !== -1) State.burnTiles.push({ x: t.x, y: t.y, turns: 3 });
                if (skill.effects.indexOf('poison') !== -1) {
                    var poisonDmg = Math.floor(20 * (1 + State.player.power / 100));
                    enemy.poison = { damage: poisonDmg, turns: 3 };
                    State.poisonTiles.push({ x: t.x, y: t.y, turns: 3, damage: poisonDmg });
                }
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
            var empowerValue = 100;
            var warCryStacks = State.player.skillStacks['war_cry'] || 0;
            empowerValue += warCryStacks * 10;
            var empowerInter = State.hasSkillInteraction('war_cry');
            if (empowerInter && empowerInter.value) {
                empowerValue = empowerInter.value;
            }
            State.player.tempPower = empowerValue;
            State.addFloatingText(State.player.x, State.player.y, 'EMPOWERED! +' + empowerValue + '%', '#ffaa00');
        }

        if (skill.effects.indexOf('damage_reduction') !== -1) {
            State.player.damageReduction = 1;
            State.addFloatingText(State.player.x, State.player.y, 'DAMAGE REDUCTION!', '#ffaa00');
        }

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, State.player.x, State.player.y, skill);
        for (var i = 0; i < tiles.length; i++) {
            var enemy = State.getEnemyAt(tiles[i].x, tiles[i].y);
            if (enemy) {
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);

                if (skill.effects.indexOf('knockback1') !== -1 && !enemy.isBoss) {
                    var kbDir = Grid.getDirection(State.player.x, State.player.y, tiles[i].x, tiles[i].y);
                    var kbX = tiles[i].x + (kbDir === 'right' ? 1 : kbDir === 'left' ? -1 : 0);
                    var kbY = tiles[i].y + (kbDir === 'down' ? 1 : kbDir === 'up' ? -1 : 0);
                    if (!State.isBlocked(kbX, kbY) && !State.getEnemyAt(kbX, kbY)) {
                        enemy.x = kbX;
                        enemy.y = kbY;
                    }
                }

                if (skill.effects.indexOf('burn') !== -1) {
                    State.burnTiles.push({ x: tiles[i].x, y: tiles[i].y, turns: 3 });
                }

                if (skill.effects.indexOf('freeze') !== -1 && !enemy.isBoss && !enemy.freezeImmune && enemy.frozen === 0) {
                    enemy.frozen = 2;
                    enemy.freezeImmune = true;
                }
            }
        }

        this.endPlayerTurn();
    },

    executeAoE: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;

        var dist = Math.abs(tx - State.player.x) + Math.abs(ty - State.player.y);
        if (dist > skill.range) return;

        State.player.energy -= skill.energyCost;
        State.addLog('Player uses ' + skill.name, 'action');

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, tx, ty, skill);
        var hitCount = 0;
        var hitEnemies = [];

        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var enemy = State.getEnemyAt(t.x, t.y);
            if (enemy && hitEnemies.indexOf(enemy) === -1) {
                hitEnemies.push(enemy);
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
                hitCount++;

                if (skill.effects.indexOf('knockback1') !== -1 && !enemy.isBoss) {
                    var kbDir = Grid.getDirection(State.player.x, State.player.y, t.x, t.y);
                    var kbX = t.x + (kbDir === 'right' ? 1 : kbDir === 'left' ? -1 : 0);
                    var kbY = t.y + (kbDir === 'down' ? 1 : kbDir === 'up' ? -1 : 0);
                    if (!State.isBlocked(kbX, kbY) && !State.getEnemyAt(kbX, kbY)) {
                        enemy.x = kbX;
                        enemy.y = kbY;
                    }
                }

                if (skill.effects.indexOf('burn') !== -1) {
                    State.burnTiles.push({ x: t.x, y: t.y, turns: 3 });
                }
                if (skill.effects.indexOf('poison') !== -1) {
                    var poisonDmg = Math.floor(20 * (1 + State.player.power / 100));
                    enemy.poison = { damage: poisonDmg, turns: 3 };
                }
            } else if (!enemy) {
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
        var enemiesHit = [];

        for (var i = 0; i < 3; i++) {
            var nx = finalX + stepX;
            var ny = finalY + stepY;
            if (nx < 0 || nx >= Data.GRID_SIZE || ny < 0 || ny >= Data.GRID_SIZE) break;
            if (State.isBlocked(nx, ny)) break;
            
            var enemy = State.getEnemyAt(nx, ny);
            if (enemy && enemiesHit.indexOf(enemy) === -1) {
                enemiesHit.push(enemy);
            }
            
            finalX = nx;
            finalY = ny;
        }

        State.player.energy -= 1;
        State.player.x = finalX;
        State.player.y = finalY;
        Input.checkTileEffects(finalX, finalY);

        if (enemiesHit.length > 0) {
            var skill = Data.SKILLS.dash;
            for (var j = 0; j < enemiesHit.length; j++) {
                var enemy = enemiesHit[j];
                var result = this.calculateDamage(skill.damage, skill);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
            }
        }

        var dashInter = State.hasSkillInteraction('dash');
        if (dashInter && dashInter.healPercent) {
            var healAmount = Math.floor(State.player.maxHp * dashInter.healPercent / 100);
            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
            State.addFloatingText(finalX, finalY, '+' + healAmount + ' HP', '#44ff44');
        }

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

    executeGuard: function() {
        var energy = State.player.energy;
        if (energy <= 0) return;

        State.player.guarding = true;
        State.player.guardEnergy = energy;
        State.player.energy = 0;

        var pct = energy * 5;
        State.addLog('Player guards! Mitigating ' + pct + '% damage (' + energy + ' energy)', 'action');
        State.addFloatingText(State.player.x, State.player.y, 'GUARD ' + pct + '%', '#6688aa');

        this.endPlayerTurn();
    },

    endPlayerTurn: function() {
        State.phase = 'enemy';
        State.player.tempPower = 0;
        State.player.damageReduction = 0;
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
        State.player.guarding = false;
        State.player.guardEnergy = 0;

        this.processStatusEffects();
        this.processBurnTiles();
        this.processPoisonTiles();
        this.processItemEffects();
        this.processPlayerStatusEffects();

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
                    if (!e.isBoss) {
                        e.freezeImmuneTurns = 2;
                    }
                }
            }

            if (e.freezeImmuneTurns > 0) {
                e.freezeImmuneTurns--;
                if (e.freezeImmuneTurns === 0) {
                    e.freezeImmune = false;
                }
            }

            if (e.poison && e.poison.turns > 0) {
                var poisonDmg = e.poison.damage;
                if (State.hasSkillInteraction('poison_cloud')) {
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

                    var defId = e.defId;
                    if (defId !== 'skeleton') {
                        var healPercent = 1 + Math.random() * 2;
                        var healAmount = Math.floor(State.player.maxHp * healPercent / 100);
                        State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
                        State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
                        State.addLog('Healed for ' + healAmount + ' HP', 'info');
                    }
                }
            }

            if (e.marked && e.marked > 0) {
                e.marked--;
                if (e.marked === 0) {
                    State.addFloatingText(e.x, e.y, 'MARK FADED', '#ff8800');
                }
            }
        }
    },

    processItemEffects: function() {
        var items = State.player.items;
        var p = State.player;

        if (items['guardian_angel'] > 0 || items['shield_generator'] > 0) {
            var maxShield = 0;
            var regenPercent = 0;
            if (items['guardian_angel']) {
                maxShield += 100 * items['guardian_angel'];
                regenPercent += 7 * items['guardian_angel'];
            }
            if (items['shield_generator']) {
                maxShield += 200 * items['shield_generator'];
                regenPercent += 10 * items['shield_generator'];
            }

            var hasJuggernaut = State.hasItemSet('juggernaut_set');
            if (hasJuggernaut) {
                maxShield = Math.floor(maxShield * 1.5);
            }

            if (p.shield < maxShield) {
                var regen = Math.max(1, Math.floor(maxShield * regenPercent / 100));
                p.shield = Math.min(p.shield + regen, maxShield);
                if (regen > 0) {
                    State.addFloatingText(p.x, p.y, '+' + regen + ' SHIELD', '#4488ff');
                }
            }
        }
    },

    calculateItemStatBonus: function(stat) {
        var items = State.player.items;
        var total = 0;

        for (var id in items) {
            if (items[id] <= 0) continue;
            var item = Data.ITEMS[id];
            if (!item || item.effect.type !== 'passive') continue;
            if (item.effect.stat === stat) {
                total += item.effect.value * items[id];
            }
        }

        var hasJuggernaut = State.hasItemSet('juggernaut_set');
        if (hasJuggernaut && stat === 'maxHp') {
            total += Math.floor(State.player.maxHp * 0.5);
        }

        return total;
    },

    getConditionalDamageBonus: function() {
        var items = State.player.items;
        var bonus = 0;
        var p = State.player;

        if (items['desperate_strength'] > 0 && p.hp < p.maxHp * 0.5) {
            bonus += 20 * items['desperate_strength'];
        }

        if (items['berserker_blood'] > 0) {
            var missingHpPercent = Math.floor((1 - p.hp / p.maxHp) * 100);
            var stacks = Math.floor(missingHpPercent / 10);
            bonus += 15 * stacks * items['berserker_blood'];
        }

        return bonus;
    },

    processBurnTiles: function() {
        for (var i = State.burnTiles.length - 1; i >= 0; i--) {
            State.burnTiles[i].turns--;
            if (State.burnTiles[i].turns <= 0) {
                State.burnTiles.splice(i, 1);
            }
        }
    },

    processPoisonTiles: function() {
        var hasCombust = State.hasSynergy('combust');
        for (var i = State.poisonTiles.length - 1; i >= 0; i--) {
            var pt = State.poisonTiles[i];
            for (var j = 0; j < State.enemies.length; j++) {
                var e = State.enemies[j];
                if (e.hp <= 0) continue;
                if (e.x === pt.x && e.y === pt.y) {
                    var dmg = hasCombust ? pt.damage * 2 : pt.damage;
                    e.hp -= dmg;
                    var def = Data.ENEMIES[e.defId];
                    var name = def ? def.name : 'Enemy';
                    State.addLog(name + ' takes ' + dmg + ' poison ground dmg', 'dot');
                    State.addFloatingText(e.x, e.y, '-' + dmg + ' POISON', '#44cc44');
                    if (e.hp <= 0) {
                        e.hp = 0;
                        State.runStats.enemyKills++;
                        State.addLog(name + ' killed by poison!', 'kill');
                        var defId = e.defId;
                        if (defId !== 'skeleton') {
                            var healPercent = 1 + Math.random() * 2;
                            var healAmount = Math.floor(State.player.maxHp * healPercent / 100);
                            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
                            State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
                            State.addLog('Healed for ' + healAmount + ' HP', 'info');
                        }
                    }
                }
            }
            pt.turns--;
            if (pt.turns <= 0) {
                State.poisonTiles.splice(i, 1);
            }
        }
    },

    processPlayerStatusEffects: function() {
        if (State.player.rejuvenation && State.player.rejuvenation > 0) {
            var rejuvStacks = State.player.skillStacks['rejuvenation'] || 0;
            var rejuvPercent = 0.05 + (rejuvStacks * 0.025);
            var healAmount = Math.floor(State.player.maxHp * rejuvPercent);
            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
            State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff88');
            State.player.rejuvenation--;
            if (State.player.rejuvenation === 0) {
                State.addFloatingText(State.player.x, State.player.y, 'REJUVENATION ENDED', '#44ff88');
            }
        }

        if (State.player.berserk && State.player.berserk > 0) {
            State.player.berserk--;
            if (State.player.berserk === 0) {
                State.addFloatingText(State.player.x, State.player.y, 'BERSERK ENDED', '#ff4444');
            }
        }

        if (State.player.lifestealAura && State.player.lifestealAura > 0) {
            State.player.lifestealAura--;
            if (State.player.lifestealAura === 0) {
                State.addFloatingText(State.player.x, State.player.y, 'LIFESTEAL AURA ENDED', '#cc4444');
            }
        }
    }
};
