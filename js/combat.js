var Combat = {
    hazardDamage: function(baseDamage) {
        return Math.floor(baseDamage + (State.stage - 1) * 10);
    },

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

    calculateDamage: function(baseDmg, skill, target) {
        var bonus = State.getPlayerDamage();
        var itemPowerBonus = this.calculateItemStatBonus('power');
        var conditionalBonus = this.getConditionalDamageBonus(target);
        var dmg = baseDmg + bonus + itemPowerBonus + conditionalBonus;

        if (State.player.diseased) {
            dmg = Math.floor(dmg * 0.7);
        }

        if (skill && skill.id) {
            var skillStacks = State.player.skillStacks[skill.id] || 0;
            if (skillStacks > 0 && !['war_cry', 'heal', 'lifesteal_aura', 'rejuvenation', 'mark', 'berserk', 'guard'].includes(skill.id)) {
                var perStack = skill.isBasic ? 0.3 : 0.2;
                var stackMultiplier = 1 + (skillStacks * perStack);
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

        var p = State.player;
        var cls = Data.CLASSES[p.classId];

        if (cls && cls.passiveId === 'crit_master') {
            var itemCount = 0;
            for (var k in p.items) {
                if (p.items[k] > 0) itemCount++;
            }
            p._rogueInnateCrit = 10;
            p._rogueCritChanceBonus = itemCount * 2.5;
            p._rogueCritDmgBonus = itemCount * 10;
        }

        var critChance = State.player.critChance + this.calculateItemStatBonus('critChance');
        if (cls && cls.passiveId === 'crit_master') {
            critChance += 10 + (p._rogueCritChanceBonus || 0);
        }
        if (target && p.items['lone_wolf'] > 0) {
            var alive = State.getAliveEnemies();
            var adjacentAllies = 0;
            for (var lw = 0; lw < alive.length; lw++) {
                if (alive[lw] !== target && alive[lw].hp > 0) {
                    var ld = Math.abs(alive[lw].x - target.x) + Math.abs(alive[lw].y - target.y);
                    if (ld <= 1) adjacentAllies++;
                }
            }
            if (adjacentAllies === 0) {
                critChance += 15 * p.items['lone_wolf'];
            }
        }
        var excessCrit = 0;
        if (critChance > 100) {
            excessCrit = critChance - 100;
            critChance = 100;
        }
        var isCrit = Math.random() * 100 < critChance;
        if (isCrit) {
            var critMultiplier = 2;
            var critDamageBonus = this.calculateItemStatBonus('critDamage') + excessCrit;
            if (cls && cls.passiveId === 'crit_master') {
                critDamageBonus += (p._rogueCritDmgBonus || 0);
            }
            if (target && p.items['lone_wolf'] > 0) {
                var alive2 = State.getAliveEnemies();
                var adj2 = 0;
                for (var lw2 = 0; lw2 < alive2.length; lw2++) {
                    if (alive2[lw2] !== target && alive2[lw2].hp > 0) {
                        var ld2 = Math.abs(alive2[lw2].x - target.x) + Math.abs(alive2[lw2].y - target.y);
                        if (ld2 <= 1) adj2++;
                    }
                }
                if (adj2 === 0) critDamageBonus += 50 * p.items['lone_wolf'];
            }
            dmg = Math.floor(dmg * (critMultiplier + critDamageBonus / 100));
        }

        var totalItems = 0;
        for (var ik in State.player.items) {
            if (State.player.items[ik] > 0) totalItems += State.player.items[ik];
        }
        if (totalItems > 0) {
            dmg = Math.floor(dmg * (1 + totalItems * 0.08));
        }

        // Knight/Ranger class passive: +25% base + 5% per item
        if (target && target.x !== undefined && target.y !== undefined) {
            var cls = Data.CLASSES[p.classId];
            if (cls && (cls.passiveId === 'melee_expert' || cls.passiveId === 'range_master')) {
                var tSize = target.size || 1;
                var minDx = Math.abs(p.x - target.x);
                var minDy = Math.abs(p.y - target.y);
                for (var ts = 1; ts < tSize; ts++) {
                    var dxt = Math.abs(p.x - (target.x + ts));
                    var dyt = Math.abs(p.y - (target.y + ts));
                    if (dxt < minDx) minDx = dxt;
                    if (dyt < minDy) minDy = dyt;
                }
                var inMeleeRange = minDx <= 1 && minDy <= 1;
                var passiveActive = (cls.passiveId === 'melee_expert' && inMeleeRange) ||
                                    (cls.passiveId === 'range_master' && !inMeleeRange);
                if (passiveActive) {
                    var passivePercent = 25 + totalItems * 5;
                    p._classPassiveBonus = passivePercent;
                    dmg = Math.floor(dmg * (1 + passivePercent / 100));
                } else {
                    p._classPassiveBonus = 0;
                }
            }
        }

        var roll = 0.9 + Math.random() * 0.1;
        dmg = Math.floor(dmg * roll);

        return { damage: Math.max(1, dmg), isCrit: isCrit };
    },

    dealDamage: function(target, dmg, source, isCrit) {
        if (target.isBoss && target.invulnerable) {
            State.addFloatingText(target.x, target.y, 'INVULNERABLE!', '#446622');
            return;
        }
        var actualDmg = dmg;

        if (target.marked && target.marked > 0) {
            actualDmg = Math.floor(actualDmg * target.marked);
            target.marked = 0;
        }

        if (target.shield && target.shield > 0) {
            if (actualDmg <= target.shield) {
                target.shield -= actualDmg;
                State.addFloatingText(target.x, target.y, 'BLOCKED!', '#ffdd88');
                return;
            } else {
                actualDmg -= target.shield;
                target.shield = 0;
            }
        }

        var prevHp = target.hp;

        // Boss phase snap: if damage would skip a phase, snap to highest untriggered threshold
        if (target.isBoss && target.phases && target.hp > 0) {
            var projectedHp = target.hp - actualDmg;
            var projectedPercent = (projectedHp / target.maxHp) * 100;
            for (var pi = 0; pi < target.phases.length; pi++) {
                var phase = target.phases[pi];
                var phaseKey = target.defId + '_phase_' + phase.threshold;
                if (!State.phaseChangeTriggered[phaseKey] && prevHp > phase.threshold && projectedPercent <= phase.threshold) {
                    // Snap HP to just above threshold so phase triggers naturally
                    target.hp = Math.floor(target.maxHp * (phase.threshold / 100)) + 1;
                    actualDmg = prevHp - target.hp;
                    break;
                }
            }
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

        if (isCrit) {
            AudioMgr.sfx('crit');
        } else {
            AudioMgr.sfx('hit');
        }

        if (target.isBoss && target.hp > 0) {
            Boss.checkPhaseChanges(target, prevHp);
        }

        if (source === 'player') {
            this.processOnHitEffects(target, centerX, centerY);
        }

        if (target.hp <= 0) {
            target.hp = 0;
            if (target.isBoss) {
                State.runStats.bossesKilled++;
                State.addLog(targetName + ' defeated!', 'boss');
                AudioMgr.sfx('death');
            } else {
                State.runStats.enemyKills++;
                State.addLog(targetName + ' killed!', 'kill');
                AudioMgr.sfx('death');
                this.processOnKillEffects(target);

                if (target.defId === 'magma_slime' && !target.hasSplit) {
                    var dirs = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
                    var splitCount = 0;
                    for (var si = 0; si < dirs.length && splitCount < 2; si++) {
                        var sx = target.x + dirs[si].x;
                        var sy = target.y + dirs[si].y;
                        if (sx >= 0 && sx < Data.GRID_SIZE && sy >= 0 && sy < Data.GRID_SIZE) {
                            if (!Stages.isReserved(sx, sy) && !State.isBlocked(sx, sy)) {
                                State.enemies.push({
                                    x: sx, y: sy, hp: 40, maxHp: 40,
                                    damage: Math.floor(target.damage * 0.6),
                                    defId: 'magma_slime', facing: 'down',
                                    frozen: 0, freezeImmune: false, freezeImmuneTurns: 0,
                                    poison: null, isBoss: false, color: '#ff4400',
                                    moveSpeed: 1, hasSplit: true
                                });
                                State.addFloatingText(sx, sy, 'SPLIT!', '#ff4400');
                                splitCount++;
                }
            }

            if (target.isElite && !State.isBossStage) {
                State.extraItemDrops++;
                State.addLog('Elite defeated! +1 item drop at stage end.', 'boss');
                State.addFloatingText(centerX, centerY, 'ELITE KILL!', '#ffaa00');
                AudioMgr.sfx('levelup');
            }
        }
                }

                if (target.defId === 'phoenix' && !target.hasRevived) {
                    target.hp = Math.floor(target.maxHp * 0.5);
                    target.hasRevived = true;
                    State.addFloatingText(target.x, target.y, 'REVIVE!', '#ffaa00');
                    State.addLog('Phoenix revives!', 'boss');
                    Grid.render();
                    UI.updateAll();
                    return;
                }

                var defId = target.defId;
                if (defId !== 'skeleton' && !target.isSummon) {
                    var healPercent = 1 + Math.random() * 2;
                    var cls = Data.CLASSES[State.player.classId];
                    if (cls && cls.passiveId === 'holy_tank') {
                        var missingHpRatio = 1 - (State.player.hp / State.player.maxHp);
                        healPercent *= (1 + missingHpRatio * 0.5);
                    }
                    var healAmount = Math.floor(State.player.maxHp * healPercent / 100);
                    State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
                    if (State.player.items['second_wind'] > 0) {
                        State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
                        State.addLog('Healed for ' + healAmount + ' HP', 'info');
                    }
                }
            }
        }

        if (source === 'player' && State.player.lifestealAura && State.player.lifestealAura > 0) {
            var lifestealStacks = State.player.skillStacks['lifesteal_aura'] || 0;
            var lifestealPercent = 0.5 + (lifestealStacks * 0.10);
            var lifestealHeal = Math.floor(actualDmg * lifestealPercent);
            if (lifestealHeal > 0) {
                State.player.hp = Math.min(State.player.hp + lifestealHeal, State.player.maxHp);
                State.addFloatingText(State.player.x, State.player.y, '+' + lifestealHeal + ' LIFESTEAL', '#cc4444');
            }
        }

        if (source === 'player') {
            var cls = Data.CLASSES[State.player.classId];
            if (cls && cls.passiveId === 'holy_tank') {
                var paladinHeal = Math.floor(actualDmg * 0.15);
                if (paladinHeal > 0) {
                    State.player.hp = Math.min(State.player.hp + paladinHeal, State.player.maxHp);
                    State.addFloatingText(State.player.x, State.player.y, '+' + paladinHeal + ' HOLY', '#ffdd44');
                }
            }
        }

        if (target.bleed && target.bleed.turns > 0) {
                var bleedDmg = target.bleed.damage;
                var blightStacks = State.player.items['blight_amulet'] || 0;
                if (blightStacks > 0) bleedDmg = Math.floor(bleedDmg * (1 + blightStacks));
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

        if (target.hp <= 0 && State.phase === 'player') {
            var remaining = State.getAliveEnemies();
            if (remaining.length === 0) {
                var self = this;
                Grid.render();
                UI.updateAll();
                setTimeout(function() { Main.stageClear(); }, 400);
            }
        }
    },

    processOnHitEffects: function(target, hitX, hitY) {
        var items = State.player.items;

        if (items['burning_touch'] > 0) {
            var chance = 10 * items['burning_touch'];
            if (Math.random() * 100 < chance) {
                State.burnTiles.push({ x: hitX, y: hitY, turns: 3, damage: this.calculateDotDamage(15) });
                State.addFloatingText(hitX, hitY, 'BURN!', '#ff6600');
            }
        }

        if (items['frozen_core'] > 0 && target.frozen === 0) {
            var chance = 10 * items['frozen_core'];
            if (Math.random() * 100 < chance) {
                target.frozen = 2;
                target.freezeImmune = true;
                State.addFloatingText(hitX, hitY, 'FREEZE!', '#88ddff');
            }
        }

        if (items['chain_lightning'] > 0) {
            var chance = 20 * items['chain_lightning'];
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
                if (status === 'freeze' && target.frozen === 0) {
                    target.frozen = 2;
                    target.freezeImmune = true;
                    State.addFloatingText(hitX, hitY, 'CHAOS FREEZE!', '#88ddff');
                } else if (status === 'burn') {
                    State.burnTiles.push({ x: hitX, y: hitY, turns: 3, damage: this.calculateDotDamage(15) });
                    State.addFloatingText(hitX, hitY, 'CHAOS BURN!', '#ff6600');
                } else if (status === 'poison') {
                    var poisonDmg = this.calculateDotDamage(20);
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
            AudioMgr.sfx('heal');
        }

        if (items['battle_momentum'] > 0) {
            var momentumStacks = items['battle_momentum'];
            var momentumChance = 25 * momentumStacks;
            if (Math.random() * 100 < momentumChance) {
                State.player.energy = Math.min(State.player.energy + 1, State.player.maxEnergy);
                State.addFloatingText(State.player.x, State.player.y, '+1 ⚡', '#ffaa00');
            }
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

        if (State.player.cursed) {
            reducedDmg = Math.floor(reducedDmg * 1.3);
        }

        if (State.player.judgment && State.player.judgment > 0) {
            reducedDmg = Math.floor(reducedDmg * 2);
            State.player.judgment = 0;
            State.addFloatingText(State.player.x, State.player.y, 'JUDGMENT x2!', '#ffdd88');
        }

        var p = State.player;
        var cls = Data.CLASSES[p.classId];

        if (cls && cls.passiveId === 'holy_tank') {
            var hpRatio = p.hp / p.maxHp;
            var classDR = 0.05 + (hpRatio * 0.2);
            reducedDmg = Math.floor(reducedDmg * (1 - classDR));
            State.addFloatingText(p.x, p.y, 'HOLY AURA -' + Math.floor(classDR * 100) + '%', '#ffdd44');
        }

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
        State.runStats.totalDamageTaken += reducedDmg;
        if (State.debugInvincibility && State.player.hp <= 1) {
            State.player.hp = 1;
            State.addFloatingText(State.player.x, State.player.y, 'INVINCIBLE!', '#ff00ff');
        }
        State.addFloatingText(State.player.x, State.player.y, '-' + reducedDmg, '#ff4444');
        State.addLog('Player takes ' + reducedDmg + ' damage', 'damage');
        if (reducedDmg >= 50) {
            AudioMgr.sfx('boss_special');
        } else {
            AudioMgr.sfx('hit');
        }
        if (State.player.hp <= 0) {
            State.player.hp = 0;
        }
    },

    executeSingleAttack: function(tx, ty, skill) {
        if (State.player.energy < skill.energyCost) return;

        var dist = Math.abs(tx - State.player.x) + Math.abs(ty - State.player.y);
        if (dist > skill.range) return;

        State.player.energy -= skill.energyCost;
        State.runStats.skillsUsed++;
        State.addLog('Player uses ' + skill.name, 'action');

        var isRanged = skill.range > 1;
        if (isRanged) {
            State.animProjectile(State.player.x, State.player.y, tx, ty, skill.color);
        } else {
            State.animSlash(State.player.x, State.player.y, tx, ty, skill.color);
        }

        var cls = Data.CLASSES[State.player.classId];

        var enemy = State.getEnemyAt(tx, ty);
        if (enemy) {
            var dmg = 0;
            var isCrit = false;

            if (skill.damage > 0) {
                var result = this.calculateDamage(skill.damage, skill, enemy);
                dmg = result.damage;
                isCrit = result.isCrit;

                if (skill.effects.indexOf('backstab') !== -1 && enemy.frozen > 0) {
                    var backstabStacks = State.player.skillStacks['backstab'] || 0;
                    var backstabMultiplier = 3 + (backstabStacks * 0.5);
                    var backstabResult = this.calculateDamage(skill.damage * backstabMultiplier, skill, enemy);
                    dmg = backstabResult.damage;
                    isCrit = backstabResult.isCrit;
                    State.addFloatingText(tx, ty, 'SHATTER! ×' + backstabMultiplier.toFixed(1), '#ff8800');
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

                if (isCrit && State.player.items['vampiric_edge'] > 0) {
                    var healAmt = Math.floor(State.player.maxHp * 0.01 * State.player.items['vampiric_edge']);
                    State.player.hp = Math.min(State.player.hp + healAmt, State.player.maxHp);
                    State.addFloatingText(tx, ty, '+' + healAmt + ' HP', '#44ff88');
                }
            }

            if (skill.effects.indexOf('bleed') !== -1 && !enemy.isBoss) {
                var bleedDmg = this.calculateDotDamage(15);
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

            if (skill.effects.indexOf('freeze') !== -1 && !enemy.freezeImmune && enemy.frozen === 0) {
                enemy.frozen = 2;
                enemy.freezeImmune = true;
            }
            if (skill.effects.indexOf('burn') !== -1) {
                State.burnTiles.push({ x: tx, y: ty, turns: 3, damage: this.calculateDotDamage(15) });
            }
            if (skill.effects.indexOf('poison') !== -1) {
                var poisonDmg = this.calculateDotDamage(20);
                enemy.poison = { damage: poisonDmg, turns: 3 };
            }

            if (skill.effects.indexOf('mark') !== -1 && !enemy.isBoss) {
                var markStacks = State.player.skillStacks['mark'] || 0;
                var markMultiplier = 2 + (markStacks * 0.25);
                enemy.marked = markMultiplier;
                State.addFloatingText(tx, ty, 'MARKED! ' + Math.floor(markMultiplier * 100) + '%', '#ff8800');
            }

            if (skill.effects.indexOf('chain_2') !== -1) {
                var chainCount = 2;
                var lastX = tx, lastY = ty;
                var hitIds = [enemy.id || enemy.defId];
                for (var ci = 0; ci < chainCount; ci++) {
                    var nearby = State.getAliveEnemies();
                    var candidates = [];
                    for (var ni = 0; ni < nearby.length; ni++) {
                        var ne = nearby[ni];
                        if (ne.hp <= 0) continue;
                        var nd = Math.abs(ne.x - lastX) + Math.abs(ne.y - lastY);
                        if (nd <= 3 && hitIds.indexOf(ne.defId) === -1) {
                            candidates.push(ne);
                        }
                    }
                    if (candidates.length === 0) break;
                    var next = candidates[Math.floor(Math.random() * candidates.length)];
                    hitIds.push(next.defId);
                    var chainResult = this.calculateDamage(Math.floor(skill.damage * 0.6), skill);
                    this.dealDamage(next, chainResult.damage, 'player', chainResult.isCrit);
                    State.addFloatingText(next.x, next.y, 'BOUNCE!', '#ffaa44');
                    lastX = next.x;
                    lastY = next.y;
                }
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
        State.runStats.skillsUsed++;
        State.addLog('Player uses Blink Strike', 'action');

        State.animProjectile(State.player.x, State.player.y, tx, ty, skill.color);

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

        State.animMove(oldX, oldY, blinkX, blinkY, '#cc44ff', '#ffffff');
        State.player.x = blinkX;
        State.player.y = blinkY;

        State.animFlash([
            {x: blinkX-1, y: blinkY-1}, {x: blinkX, y: blinkY-1}, {x: blinkX+1, y: blinkY-1},
            {x: blinkX-1, y: blinkY}, {x: blinkX, y: blinkY}, {x: blinkX+1, y: blinkY},
            {x: blinkX-1, y: blinkY+1}, {x: blinkX, y: blinkY+1}, {x: blinkX+1, y: blinkY+1}
        ], '#cc44ff', 16);

        // 3x3 AoE centered on landing position
        var hitEnemies = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                var ax = blinkX + dx;
                var ay = blinkY + dy;
                if (ax < 0 || ax >= Data.GRID_SIZE || ay < 0 || ay >= Data.GRID_SIZE) continue;
                var e = State.getEnemyAt(ax, ay);
                if (e && hitEnemies.indexOf(e) === -1) {
                    hitEnemies.push(e);
                }
            }
        }

        for (var i = 0; i < hitEnemies.length; i++) {
            var result = this.calculateDamage(skill.damage, skill, hitEnemies[i]);
            this.dealDamage(hitEnemies[i], result.damage, 'player', result.isCrit);
        }

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
        State.runStats.skillsUsed++;
        State.addLog('Player uses ' + skill.name, 'action');

        State.animRing(State.player.x, State.player.y, skill.color);

        if (skill.effects.indexOf('heal') !== -1) {
            var healStacks = State.player.skillStacks['heal'] || 0;
            var healPercent = 0.2 + (healStacks * 0.05);
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

        State.player.energy -= skill.energyCost;
        State.runStats.skillsUsed++;
        var tiles = this.getAffectedTiles(State.player.x, State.player.y, tx, ty, skill);

        if (skill.shape === 'line') {
            var lastTile = tiles[tiles.length - 1] || {x: tx, y: ty};
            State.animBeam(State.player.x, State.player.y, lastTile.x, lastTile.y, skill.color);
        } else if (skill.shape === 'cone') {
            State.animSlash(State.player.x, State.player.y, tx, ty, skill.color);
            State.animFlash(tiles, skill.color, 17);
        }
        var hitSomething = false;
        var lastHitEnemy = null;
        var hitEnemies = [];

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
            if (enemy && hitEnemies.indexOf(enemy) === -1) {
                hitEnemies.push(enemy);
                var result = this.calculateDamage(skill.damage, skill, enemy);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
                hitSomething = true;
                lastHitEnemy = enemy;

                if (skill.effects.indexOf('freeze') !== -1 && !enemy.freezeImmune && enemy.frozen === 0) enemy.frozen = 2;
                if (skill.effects.indexOf('burn') !== -1) State.burnTiles.push({ x: t.x, y: t.y, turns: 3, damage: this.calculateDotDamage(15) });
                if (skill.effects.indexOf('poison') !== -1) {
                    var poisonDmg = this.calculateDotDamage(20);
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
        State.runStats.skillsUsed++;
        State.addLog('Player uses ' + skill.name, 'action');

        State.animRing(State.player.x, State.player.y, skill.color);

        if (skill.effects.indexOf('empower') !== -1) {
            var empowerValue = 100;
            var warCryStacks = State.player.skillStacks['war_cry'] || 0;
            empowerValue += warCryStacks * 10;
            State.player.tempPower = empowerValue;
            State.player.tempPowerTurns = 2;
            State.addFloatingText(State.player.x, State.player.y, 'EMPOWERED! +' + empowerValue + '%', '#ffaa00');
        }

        if (skill.effects.indexOf('damage_reduction') !== -1) {
            State.player.damageReduction = 1;
            State.player.damageReductionTurns = 2;
            State.addFloatingText(State.player.x, State.player.y, 'DAMAGE REDUCTION!', '#ffaa00');
        }

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, State.player.x, State.player.y, skill);
        var hitEnemies = [];
        for (var i = 0; i < tiles.length; i++) {
            var enemy = State.getEnemyAt(tiles[i].x, tiles[i].y);
            if (enemy && hitEnemies.indexOf(enemy) === -1) {
                hitEnemies.push(enemy);
                if (skill.damage > 0) {
                    var result = this.calculateDamage(skill.damage, skill, enemy);
                    this.dealDamage(enemy, result.damage, 'player', result.isCrit);
                }

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
                    State.burnTiles.push({ x: tiles[i].x, y: tiles[i].y, turns: 3, damage: this.calculateDotDamage(15) });
                }

                if (skill.effects.indexOf('freeze') !== -1 && !enemy.freezeImmune && enemy.frozen === 0) {
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
        State.runStats.skillsUsed++;
        State.addLog('Player uses ' + skill.name, 'action');

        var tiles = this.getAffectedTiles(State.player.x, State.player.y, tx, ty, skill);
        State.animProjectile(State.player.x, State.player.y, tx, ty, skill.color);
        State.animAoE(tiles, skill.color);
        var hitCount = 0;
        var hitEnemies = [];

        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var enemy = State.getEnemyAt(t.x, t.y);
            if (enemy && hitEnemies.indexOf(enemy) === -1) {
                hitEnemies.push(enemy);
                var result = this.calculateDamage(skill.damage, skill, enemy);
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
                    State.burnTiles.push({ x: t.x, y: t.y, turns: 3, damage: this.calculateDotDamage(15) });
                }
                if (skill.effects.indexOf('poison') !== -1) {
                    var poisonDmg = this.calculateDotDamage(20);
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

        State.runStats.skillsUsed++;
        State.addLog('Player uses Dash', 'action');

        var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        if (Math.abs(dx) >= Math.abs(dy)) stepY = 0;
        else stepX = 0;

        var finalX = State.player.x;
        var finalY = State.player.y;
        var dashTiles = [];
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
            dashTiles.push({x: nx, y: ny});
            finalX = nx;
            finalY = ny;
        }

        if (dashTiles.length > 0) {
            State.animBeam(State.player.x, State.player.y, finalX, finalY, '#88ff88');
            State.animMove(State.player.x, State.player.y, finalX, finalY, '#88ff88', '#ffffff');
        }

        State.player.energy -= 1;
        State.player.x = finalX;
        State.player.y = finalY;
        Input.checkTileEffects(finalX, finalY);

        if (enemiesHit.length > 0) {
            var skill = Data.SKILLS.dash;
            for (var j = 0; j < enemiesHit.length; j++) {
                var enemy = enemiesHit[j];
                var result = this.calculateDamage(skill.damage, skill, enemy);
                this.dealDamage(enemy, result.damage, 'player', result.isCrit);
            }
        }

        this.endPlayerTurn();
    },

    hitObstacle: function(x, y, dmg) {
        var bonus = State.getPlayerDamage();
        var itemPowerBonus = this.calculateItemStatBonus('power');
        var modifiedDmg = dmg + bonus + itemPowerBonus;

        if (State.player.tempPower > 0) {
            modifiedDmg = Math.floor(modifiedDmg * (1 + State.player.tempPower / 100));
        }
        if (State.player.berserk && State.player.berserk > 0) {
            var berserkStacks = State.player.skillStacks['berserk'] || 0;
            var berserkMultiplier = 1.5 + (berserkStacks * 0.25);
            modifiedDmg = Math.floor(modifiedDmg * berserkMultiplier);
        }

        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            if (o.x === x && o.y === y && o.destructible) {
                o.hp -= modifiedDmg;
                State.addFloatingText(x, y, '-' + modifiedDmg, '#886644');
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

        State.runStats.skillsUsed++;
        State.player.guarding = true;
        State.player.guardEnergy = energy;
        State.player.energy = 0;

        var pct = energy * 5;
        State.addLog('Player guards! Mitigating ' + pct + '% damage (' + energy + ' energy)', 'action');
        State.addFloatingText(State.player.x, State.player.y, 'GUARD ' + pct + '%', '#6688aa');
        State.animFlash([{x: State.player.x, y: State.player.y}], '#6688aa', 13);

        this.endPlayerTurn();
    },

    endPlayerTurn: function() {
        State.phase = 'enemy';
        State.hoveredTile = null;
        State.attackPreview = [];
        State.turnStartState = null;
        UI.updateAll();

        setTimeout(function() {
            AI.processEnemyTurns();
        }, 300);
    },

    startNewTurn: function() {
        State.turn++;
        State.phase = 'player';

        if (State.player.tempPowerTurns > 0) {
            State.player.tempPowerTurns--;
            if (State.player.tempPowerTurns === 0) State.player.tempPower = 0;
        }
        if (State.player.damageReductionTurns > 0) {
            State.player.damageReductionTurns--;
            if (State.player.damageReductionTurns === 0) State.player.damageReduction = 0;
        }

        var regenAmount = Math.ceil(State.player.maxEnergy / 2);
        State.player.energy = Math.min(State.player.energy + regenAmount, State.player.maxEnergy);
        State.player.guarding = false;
        State.player.guardEnergy = 0;

        this.processStatusEffects();
        this.processBurnTiles();
        this.processPoisonTiles();
        this.processItemEffects();
        this.processPlayerStatusEffects();
        this.processHazardTiles();

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

        State.saveTurnStartState();
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
                        e.freezeImmune = true;
                        e.freezeImmuneTurns = 3;
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
                var blightStacks = State.player.items['blight_amulet'] || 0;
                if (blightStacks > 0) poisonDmg = Math.floor(poisonDmg * (1 + blightStacks));
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

        if (items['guardian_angel'] > 0) {
            var maxShield = 75 * items['guardian_angel'];
            var regenPercent = 5 * items['guardian_angel'];

            if (p.shield < maxShield) {
                var regen = Math.max(1, Math.floor(maxShield * regenPercent / 100));
                p.shield = Math.min(p.shield + regen, maxShield);
                if (regen > 0) {
                    State.addFloatingText(p.x, p.y, '+' + regen + ' SHIELD', '#4488ff');
                }
            }
        }
    },

    calculateDotDamage: function(baseDmg) {
        var p = State.player;
        var dmg = baseDmg + Math.floor(p.power * 0.5);

        if (p.diseased) {
            dmg = Math.floor(dmg * 0.7);
        }

        var totalItems = 0;
        for (var ik in p.items) {
            if (p.items[ik] > 0) totalItems += p.items[ik];
        }
        if (totalItems > 0) {
            dmg = Math.floor(dmg * (1 + totalItems * 0.03));
        }

        return Math.max(1, dmg);
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

        return total;
    },

    getConditionalDamageBonus: function(target) {
        var items = State.player.items;
        var bonus = 0;
        var p = State.player;

        if (items['desperate_strength'] > 0 && p.hp < p.maxHp * 0.5) {
            bonus += 20 * items['desperate_strength'];
        }

        if (items['berserker_blood'] > 0) {
            var missingHpPercent = Math.floor((1 - p.hp / p.maxHp) * 100);
            var stacks = Math.floor(missingHpPercent / 10);
            bonus += 12 * stacks * items['berserker_blood'];
        }

        return bonus;
    },

    processBurnTiles: function() {
        for (var i = State.burnTiles.length - 1; i >= 0; i--) {
            var bt = State.burnTiles[i];
            for (var j = 0; j < State.enemies.length; j++) {
                var e = State.enemies[j];
                if (e.hp <= 0) continue;
                if (e.x === bt.x && e.y === bt.y) {
                    var dmg = bt.damage || 15;
                    e.hp -= dmg;
                    var def = Data.ENEMIES[e.defId];
                    var name = def ? def.name : 'Enemy';
                    State.addLog(name + ' takes ' + dmg + ' burn ground dmg', 'dot');
                    State.addFloatingText(e.x, e.y, '-' + dmg + ' BURN', '#ff6600');
                    if (e.hp <= 0) {
                        e.hp = 0;
                        State.runStats.enemyKills++;
                        State.addLog(name + ' killed by burn!', 'kill');
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
            bt.turns--;
            if (bt.turns <= 0) {
                State.burnTiles.splice(i, 1);
            }
        }
    },

    processPoisonTiles: function() {
        for (var i = State.poisonTiles.length - 1; i >= 0; i--) {
            var pt = State.poisonTiles[i];
            for (var j = 0; j < State.enemies.length; j++) {
                var e = State.enemies[j];
                if (e.hp <= 0) continue;
                if (e.x === pt.x && e.y === pt.y) {
                    var dmg = pt.damage;
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
            var rejuvPercent = 0.08 + (rejuvStacks * 0.04);
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

        if (State.player.chilled > 0) {
            State.player.chilled--;
            if (State.player.chilled === 0) {
                State.addFloatingText(State.player.x, State.player.y, 'CHILLED ENDED', '#88ddff');
            }
        }

        if (State.player.bleed && State.player.bleed.turns > 0) {
            State.lastDamageSource = 'Bleed';
            var pbDmg = State.player.bleed.damage;
            State.player.hp -= pbDmg;
            State.addFloatingText(State.player.x, State.player.y, '-' + pbDmg + ' BLEED', '#ff4444');
            State.addLog('You take ' + pbDmg + ' bleed damage!', 'enemy');
            State.player.bleed.turns--;
            if (State.player.bleed.turns <= 0) State.player.bleed = null;
            if (State.player.hp <= 0) {
                State.player.hp = 0;
                UI.showDeathScreen();
                return;
            }
        }

        if (State.player.poison && State.player.poison.turns > 0) {
            State.lastDamageSource = 'Poison';
            var poDmg = State.player.poison.damage;
            State.player.hp -= poDmg;
            State.addFloatingText(State.player.x, State.player.y, '-' + poDmg + ' POISON', '#44cc44');
            State.addLog('You take ' + poDmg + ' poison damage!', 'enemy');
            State.player.poison.turns--;
            if (State.player.poison.turns <= 0) State.player.poison = null;
            if (State.player.hp <= 0) {
                State.player.hp = 0;
                UI.showDeathScreen();
                return;
            }
        }

        var alive = State.getAliveEnemies();
        var nearPlague = false;
        var nearMummy = false;
        for (var i = 0; i < alive.length; i++) {
            var e = alive[i];
            if (e.hp <= 0) continue;
            var dx = Math.abs(e.x - State.player.x);
            var dy = Math.abs(e.y - State.player.y);
            if (dx <= 1 && dy <= 1) {
                if (e.defId === 'plaguebearer') nearPlague = true;
                if (e.defId === 'mummy') nearMummy = true;
            }
        }
        State.player.diseased = nearPlague;
        State.player.cursed = nearMummy;

        if (State.player.hp <= 0) {
            State.player.hp = 0;
            UI.showDeathScreen();
            return;
        }
    },

    processHazardTiles: function() {
        var px = State.player.x;
        var py = State.player.y;
        var moved = (px !== State.spikeLastX || py !== State.spikeLastY);
        State.spikeLastX = px;
        State.spikeLastY = py;

        if (moved) {
            State.spikeTurns = 0;
        }

        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            if (o.x !== px || o.y !== py) continue;

            if (o.id === 'lava') {
                State.lastDamageSource = 'Lava';
                var lavaDmg = this.hazardDamage(30);
                State.player.hp -= lavaDmg;
                State.runStats.totalDamageTaken += lavaDmg;
                State.addFloatingText(px, py, '-' + lavaDmg + ' BURN', '#ff4400');
                State.addLog('Lava burns you for ' + lavaDmg + ' damage!', 'enemy');
                AudioMgr.sfx('lava');
            }
            if (o.id === 'swamp_pool') {
                var poolPoisonDmg = this.hazardDamage(20);
                if (!State.player.poison) {
                    State.player.poison = { damage: poolPoisonDmg, turns: 3 };
                } else {
                    State.player.poison.turns += 3;
                }
                State.addFloatingText(px, py, 'POISONED!', '#44cc44');
                State.addLog('Toxic pool applies poison for 3 turns!', 'enemy');
                AudioMgr.sfx('debuff');
            }
            if (o.id === 'chill_water') {
                State.player.chilled = Math.max(State.player.chilled, 2);
                State.addFloatingText(px, py, 'CHILLED!', '#88ddff');
                State.addLog('Chill water refreshes frozen!', 'enemy');
                AudioMgr.sfx('freeze');
            }
            if (o.id === 'spike_trap') {
                State.spikeTurns++;
                if (State.spikeTurns >= 2) {
                    State.lastDamageSource = 'Spike Trap';
                    var spikeDmg = this.hazardDamage(100);
                    State.player.hp -= spikeDmg;
                    State.runStats.totalDamageTaken += spikeDmg;
                    State.addFloatingText(px, py, '-' + spikeDmg + ' SPIKES!', '#ff4444');
                    State.addLog('Spike trap impales you for ' + spikeDmg + ' damage!', 'enemy');
                    State.spikeTurns = 0;
                    AudioMgr.sfx('spike');
                }
            }
            if (o.id === 'void') {
                State.lastDamageSource = 'Void';
                var voidDmg = this.hazardDamage(20);
                State.player.hp -= voidDmg;
                State.runStats.totalDamageTaken += voidDmg;
                State.player.cursed = Math.max(State.player.cursed || 0, 2);
                State.player.diseased = Math.max(State.player.diseased || 0, 2);
                State.addFloatingText(px, py, '-' + voidDmg + ' VOID!', '#6633aa');
                State.addLog('Void drains you for ' + voidDmg + ' damage and inflicts cursed + diseased!', 'enemy');
                AudioMgr.sfx('debuff');
            }
            if (o.id === 'judgement_sigil') {
                State.player.judgment = (State.player.judgment || 0) + 2;
                State.addFloatingText(px, py, 'JUDGEMENT +' + State.player.judgment, '#ffdd88');
            }
        }

        if (State.player.hp <= 0) {
            State.player.hp = 0;
            UI.showDeathScreen();
        }
    }
};
