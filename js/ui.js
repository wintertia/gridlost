var UI = {
    updateAll: function() {
        this.updateStats();
        this.updateSkillBar();
        this.updateEnemyList();
        this.updateItems();
        this.updateTopBar();
        this.updateCombatLog();
        this.updateBuffBar();
        Grid.render();
    },

    _lastBuffSig: '',

    updateBuffBar: function() {
        var p = State.player;
        var sig = [
            p.chilled, p.diseased ? 1 : 0, p.cursed ? 1 : 0, p.judgment,
            p.berserk, p.lifestealAura, p.rejuvenation, p.tempPower, p.shield, p.damageReduction, p.tempPowerTurns, p.damageReductionTurns
        ].join(',');
        if (sig === this._lastBuffSig) return;
        this._lastBuffSig = sig;

        var buffs = [];
        if (p.chilled > 0) buffs.push({ icon: '~', color: '#88ddff', bg: '#1a3a5a', turns: p.chilled, name: 'Chilled', desc: 'Movement costs 2x energy' });
        if (p.diseased) buffs.push({ icon: '%', color: '#44cc44', bg: '#1a3a1a', turns: -1, name: 'Diseased', desc: 'Damage reduced by 30%' });
        if (p.cursed) buffs.push({ icon: '#', color: '#8844aa', bg: '#2a1a3a', turns: -1, name: 'Cursed', desc: 'Take 30% more damage' });
        if (p.judgment > 0) buffs.push({ icon: '!', color: '#ffdd88', bg: '#3a3a1a', turns: p.judgment, name: 'Judgment', desc: 'Next hit deals double damage' });
        if (p.berserk > 0) buffs.push({ icon: 'X', color: '#ff4444', bg: '#3a1a1a', turns: p.berserk, name: 'Berserk', desc: '+50% damage dealt and taken' });
        if (p.lifestealAura > 0) buffs.push({ icon: 'L', color: '#cc4444', bg: '#3a1a1a', turns: p.lifestealAura, name: 'Lifesteal Aura', desc: 'Heal 20% of damage dealt' });
        if (p.rejuvenation > 0) buffs.push({ icon: '+', color: '#44ff88', bg: '#1a3a2a', turns: p.rejuvenation, name: 'Rejuvenation', desc: 'Heal 5% HP per turn' });
        if (p.tempPower > 0) buffs.push({ icon: 'P', color: '#ffaa00', bg: '#3a2a0a', turns: p.tempPowerTurns || 1, name: 'Empowered', desc: ' +' + p.tempPower + '% damage this turn' });
        if (p.damageReduction > 0) buffs.push({ icon: 'D', color: '#88aacc', bg: '#1a2a3a', turns: p.damageReductionTurns || 1, name: 'Fortified', desc: 'Take 20% less damage this turn' });
        if (p.shield > 0) buffs.push({ icon: 'S', color: '#4488ff', bg: '#1a2a3a', turns: -1, name: 'Shield', desc: p.shield + ' shield HP' });

        var $bar = $('#buff-bar');
        $bar.empty();
        for (var i = 0; i < buffs.length; i++) {
            var b = buffs[i];
            var turnsText = b.turns > 0 ? b.turns : '';
            var $icon = $('<div class="buff-icon"></div>')
                .css({ background: b.bg, borderColor: b.color, color: b.color })
                .attr('data-buff-name', b.name)
                .attr('data-buff-desc', b.desc)
                .text(b.icon);
            if (turnsText !== '') {
                $icon.append('<span class="buff-turns">' + turnsText + '</span>');
            }
            $bar.append($icon);
        }
    },

    updateStats: function() {
        var p = State.player;
        var hpPct = (p.hp / p.maxHp) * 100;
        var nrjPct = (p.energy / p.maxEnergy) * 100;

        var cls = Data.CLASSES[p.classId];
        if (cls) {
            $('#player-class-name').text(cls.name);
            var passiveTooltip = cls.passive;
            if (cls.passiveId === 'melee_expert' || cls.passiveId === 'range_master') {
                var itemCount = 0;
                for (var k in p.items) {
                    if (p.items[k] > 0) itemCount++;
                }
                var passivePercent = 25 + itemCount * 5;
                passiveTooltip += '\nActive bonus: +' + passivePercent + '% damage';
            }
            $('#player-passive').text(cls.passiveName).attr('data-tooltip', passiveTooltip);
        }

        $('#hp-bar').css('width', hpPct + '%');
        var hpText = p.hp + '/' + p.maxHp;
        if (p.shield > 0) hpText += ' (+' + p.shield + ')';
        $('#hp-text').text(hpText);
        $('#energy-bar').css('width', nrjPct + '%');
        $('#energy-text').text(p.energy + '/' + p.maxEnergy);

        var shield = Combat.calculateItemStatBonus('shield');
        if (p.shield > 0 || shield > 0) {
            $('#stat-shield-row').show();
            $('#shield-text').text(p.shield + ' / ' + shield);
        } else {
            $('#stat-shield-row').hide();
        }

        if (p.power > 0) {
            $('#stat-power-row').show();
            $('#power-text').text('+' + p.power + '%');
        } else {
            $('#stat-power-row').hide();
        }

        var totalCrit = p.critChance + Combat.calculateItemStatBonus('critChance');
        if (cls && cls.passiveId === 'crit_master') {
            var itemCount = 0;
            for (var k in p.items) {
                if (p.items[k] > 0) itemCount++;
            }
            totalCrit += 10 + itemCount * 2.5;
        }
        if (totalCrit > 0) {
            $('#stat-crit-row').show();
            $('#crit-text').text(totalCrit + '%');
        } else {
            $('#stat-crit-row').hide();
        }

        var critDmg = Combat.calculateItemStatBonus('critDamage');
        if (cls && cls.passiveId === 'crit_master') {
            var itemCount = 0;
            for (var k in p.items) {
                if (p.items[k] > 0) itemCount++;
            }
            critDmg += itemCount * 10;
        }
        if (critDmg > 0) {
            $('#stat-critdmg-row').show();
            $('#critdmg-text').text('+' + critDmg + '%');
        } else {
            $('#stat-critdmg-row').hide();
        }

        var lifesteal = Combat.calculateItemStatBonus('lifesteal');
        if (lifesteal > 0) {
            $('#stat-lifesteal-row').show();
            $('#lifesteal-text').text(lifesteal + '%');
        } else {
            $('#stat-lifesteal-row').hide();
        }
    },

    updateSkillBar: function() {
        var p = State.player;

        for (var i = 0; i < 6; i++) {
            var $slot = $('.skill-slot[data-slot="' + i + '"]');
            var skill = p.skills[i];

            $slot.removeClass('active empty');
            if (i === p.selectedSlot) $slot.addClass('active');
            if (i >= 2 && i <= 4 && !skill) $slot.addClass('empty');

            if (i === 0) {
                $slot.find('.skill-name').text('Move');
                $slot.find('.skill-cost').text('1⚡');
                $slot.attr('data-tooltip', 'Move to an adjacent tile\nCost: 1 energy');
            } else if (i === 1) {
                var basicSkill = p.skills[1];
                if (basicSkill) {
                    var stacks = p.skillStacks[basicSkill.id] || 0;
                    var displayName = stacks > 0 ? basicSkill.name + ' Lv.' + (stacks + 1) : basicSkill.name;
                    $slot.find('.skill-name').text(displayName);
                    $slot.find('.skill-cost').text('1⚡');
                    var tooltipText = displayName + '\n';
                    if (stacks > 0) {
                        var newDmg = Math.floor(basicSkill.damage * (1 + stacks * 0.5));
                        var pct = stacks * 50;
                        tooltipText += 'Damage: ' + basicSkill.damage + ' → ' + newDmg + ' (+' + pct + '%)\n';
                    } else {
                        tooltipText += 'Damage: ' + basicSkill.damage + '\n';
                    }
                    tooltipText += 'Cost: 1 energy\nRange: ' + basicSkill.range;
                    $slot.attr('data-tooltip', tooltipText);
                } else {
                    $slot.find('.skill-name').text('Slash');
                    $slot.find('.skill-cost').text('1⚡');
                    $slot.attr('data-tooltip', 'Slash\nDamage: 60\nCost: 1 energy\nRange: 1');
                }
            } else if (i === 5) {
                $slot.find('.skill-name').text('Guard');
                $slot.find('.skill-cost').text('All⚡');
                var guardPct = p.energy * 5;
                $slot.attr('data-tooltip', 'Guard: spend all remaining energy\nMitigate ' + guardPct + '% damage this turn\n(' + p.energy + ' energy × 5%)');
            } else if (skill) {
                var stacks = p.skillStacks[skill.id] || 0;
                var displayName = stacks > 0 ? skill.name + ' Lv.' + (stacks + 1) : skill.name;
                $slot.find('.skill-name').text(displayName);
                $slot.find('.skill-cost').text(skill.energyCost + '⚡');
                var iconClass = skill.id.replace('_', '-') + '-icon';
                var $icon = $slot.find('.skill-icon');
                $icon.removeClass().addClass('skill-icon ' + iconClass);
                $icon.css('background', skill.color);

                var tooltipText = displayName + '\n';
                if (stacks > 0) {
                    var newDmg = Math.floor(skill.damage * (1 + stacks * 0.2));
                    var pct = stacks * 20;
                    tooltipText += 'Damage: ' + skill.damage + ' → ' + newDmg + ' (+' + pct + '%)\n';
                } else {
                    tooltipText += 'Damage: ' + skill.damage + '\n';
                }
                tooltipText += 'Cost: ' + skill.energyCost + ' energy\n';
                tooltipText += 'Shape: ' + this.getShapeName(skill.shape) + '\n';
                if (skill.effects.length > 0) {
                    tooltipText += 'Effects: ' + skill.effects.join(', ');
                }
                $slot.attr('data-tooltip', tooltipText);
            } else {
                $slot.find('.skill-name').text('Empty');
                $slot.find('.skill-cost').text('-');
                $slot.attr('data-tooltip', 'Empty skill slot\nLearn a new skill on stage clear');
            }
        }
    },

    getShapeName: function(shape) {
        var names = {
            'single': 'Single target',
            'line': 'Line (piercing)',
            'cone': 'Cone (3-tile fan)',
            'cross': 'Cross (cross-shaped)',
            'ring': 'Ring (all adjacent)',
            'aoe': 'AoE (3x3 area)',
            'dash': 'Movement (3 tiles)',
            'self': 'Self',
            'blink': 'Teleport (3 tiles)',
            'guard': 'Guard'
        };
        return names[shape] || shape;
    },

    updateItems: function() {
        var $list = $('#items-list');
        $list.empty();
        var items = State.player.items;
        var hasItems = false;
        for (var id in items) {
            if (items[id] > 0) {
                hasItems = true;
                var item = Data.ITEMS[id];
                if (!item) continue;
                var stack = items[id];
                var stackText = stack > 1 ? ' x' + stack : '';
                var tipText = item.name + '\n' + item.desc;
                if (stack > 1) tipText += '\nStacks: ' + stack;
                $list.append('<div class="item-badge" data-tooltip="' + tipText.replace(/"/g, '&quot;') + '">' +
                    '<span class="item-badge-icon" style="color:' + (item.color || '#888') + '">' + (item.icon || '\u25CF') + '</span>' +
                    '<span class="item-badge-name">' + item.name + stackText + '</span>' +
                    '</div>');
            }
        }
        if (!hasItems) {
            $list.append('<p class="empty-text">No items</p>');
        }
    },

    updateEnemyList: function() {
        var $list = $('#enemy-list');
        $list.empty();

        var alive = State.getAliveEnemies();
        if (alive.length === 0) {
            $list.append('<p class="empty-text">No enemies</p>');
            return;
        }

        for (var i = 0; i < alive.length; i++) {
            var e = alive[i];
            var def = e.isBoss ? { name: e.name } : Data.ENEMIES[e.defId];
            var name = def ? def.name : 'Unknown';
            var color = e.color || '#ff4444';
            var hpPct = (e.hp / e.maxHp) * 100;

            var html = '<div class="enemy-item">' +
                '<div class="enemy-dot" style="background:' + color + '"></div>' +
                '<div class="enemy-info">' +
                '<span class="enemy-name">' + name + '</span>' +
                '<div class="enemy-hp-bar"><div class="enemy-hp-fill" style="width:' + hpPct + '%"></div></div>' +
                '<span class="enemy-hp-text">' + e.hp + '/' + e.maxHp + '</span>' +
                '</div></div>';
            $list.append(html);
        }
    },

    updateCombatLog: function() {
        var $log = $('#combat-log');
        $log.empty();

        var log = State.combatLog;
        var start = Math.max(0, log.length - 20);
        for (var i = start; i < log.length; i++) {
            var entry = log[i];
            var typeClass = 'log-' + entry.type;
            $log.append('<div class="log-entry ' + typeClass + '">' + entry.text + '</div>');
        }

        $log.scrollTop($log[0] ? $log[0].scrollHeight : 0);
    },

    updateTopBar: function() {
        $('#stage-num').text(State.stage);
        $('#floor-num').text(Math.ceil(State.stage / Data.BOSS_EVERY));
        var bossIn = Data.BOSS_EVERY - (State.stage % Data.BOSS_EVERY);
        if (bossIn === 0) bossIn = Data.BOSS_EVERY;
        $('#boss-in').text(bossIn);
        $('#turn-num').text(State.turn);
        if (State.currentBiome && Data.BIOMES[State.currentBiome]) {
            var biome = Data.BIOMES[State.currentBiome];
            $('#biome-name').text(biome.name).css('color', biome.accent);
        }
    },

    showScreen: function(screenId) {
        $('.screen').removeClass('active');
        $('#' + screenId).addClass('active');
    },

    hideScreen: function(screenId) {
        $('#' + screenId).removeClass('active');
    },

    showClassSelect: function() {
        var $grid = $('#class-grid');
        $grid.empty();

        var classIds = Object.keys(Data.CLASSES);
        var lockedClasses = [];

        for (var i = 0; i < classIds.length; i++) {
            var cls = Data.CLASSES[classIds[i]];
            var isLocked = lockedClasses.indexOf(cls.id) !== -1;
            var $card = $('<div class="class-card' + (isLocked ? ' disabled' : '') + '" data-class="' + cls.id + '">' +
                '<div class="class-icon" style="color:' + cls.color + '">' + cls.icon + '</div>' +
                '<div class="class-name">' + cls.name + '</div>' +
                '<div class="class-desc">' + cls.desc + '</div>' +
                '<div class="class-passive">' + cls.passive + '</div>' +
                '<div class="class-stats">' +
                    '<span class="stat-item"><span class="stat-icon hp-icon">&#9829;</span> ' + cls.hp + '</span>' +
                    '<span class="stat-item"><span class="stat-icon energy-icon">&#9889;</span> ' + cls.energy + '</span>' +
                '</div>' +
                '</div>');
            $grid.append($card);
        }

        $grid.find('.class-card:not(.disabled)').on('click', function() {
            var classId = $(this).data('class');
            $grid.find('.class-card').off('click');
            Main.startGame(classId);
        });

        this.showScreen('class-screen');
    },

    showStatChoices: function(callback) {
        var keys = ['vitality', 'power', 'crit'];
        var shuffled = keys.sort(function() { return Math.random() - 0.5; });
        var choices = shuffled.slice(0, 3);

        var $grid = $('#stat-choices');
        $grid.empty();

        for (var i = 0; i < choices.length; i++) {
            var upgrade = Data.STAT_UPGRADES[choices[i]];
            var $card = $('<div class="choice-card" data-choice="' + choices[i] + '">' +
                '<div class="choice-title">' + upgrade.name + '</div>' +
                '<div class="choice-desc">' + upgrade.desc + '</div>' +
                '</div>');
            $grid.append($card);
        }

        $grid.find('.choice-card').on('click', function() {
            var choice = $(this).data('choice');
            $grid.find('.choice-card').off('click');
            callback(choice);
        });

        this.showScreen('complete-screen');
    },

    showItemChoices: function(callback) {
        var pool = [];
        for (var id in Data.ITEMS) {
            if (Data.ITEMS[id].rarity === 'boss') continue;
            pool.push(id);
        }

        var weighted = [];
        for (var i = 0; i < pool.length; i++) {
            var item = Data.ITEMS[pool[i]];
            var rarity = Data.ITEM_RARITY[item.rarity];
            for (var w = 0; w < rarity.weight; w++) {
                weighted.push(pool[i]);
            }
        }

        var picked = [];
        var tempPool = weighted.slice();
        while (picked.length < 3 && tempPool.length > 0) {
            var idx = Math.floor(Math.random() * tempPool.length);
            var candidate = tempPool[idx];
            if (picked.indexOf(candidate) === -1) {
                picked.push(candidate);
            }
            tempPool.splice(idx, 1);
        }

        var $grid = $('#item-choices');
        $grid.empty();

        for (var j = 0; j < picked.length; j++) {
            var item = Data.ITEMS[picked[j]];
            var rarityColor = Data.ITEM_RARITY[item.rarity].color;
            var rarityName = Data.ITEM_RARITY[item.rarity].name;
            var stacks = State.getItemStacks(picked[j]);
            var stackHint = stacks > 0 ? ' (will have ' + (stacks + 1) + ')' : '';
            var iconChar = item.icon || '\u25CF';
            var iconBg = item.iconBg || '#666666';

            var $card = $('<div class="choice-card item-card" data-choice="' + picked[j] + '">' +
                '<div class="item-card-icon" style="background:' + iconBg + '">' + iconChar + '</div>' +
                '<div class="item-card-info">' +
                '<div class="item-card-name" style="color:' + rarityColor + '">' + item.name + '</div>' +
                '<div class="item-card-desc">' + item.desc + '</div>' +
                '<div class="item-card-rarity" style="color:' + rarityColor + '">' + rarityName + stackHint + '</div>' +
                '</div></div>');
            $grid.append($card);
        }

        $grid.find('.choice-card').on('click', function() {
            var choice = $(this).data('choice');
            $grid.find('.choice-card').off('click');
            callback(choice);
        });

        this.showScreen('complete-screen');
    },

    showSkillChoices: function(callback) {
        var self = this;
        var rerollsLeft = 1 + (State.player.items['boss_crown'] || 0);

        function generateChoices() {
            var pool = Data.SKILL_POOL.slice();
            var shuffled = pool.sort(function() { return Math.random() - 0.5; });
            var choices = [];
            var seen = {};
            for (var si = 0; si < shuffled.length && choices.length < 3; si++) {
                if (!seen[shuffled[si]]) {
                    seen[shuffled[si]] = true;
                    choices.push(shuffled[si]);
                }
            }

            var $grid = $('#skill-choices');
            $grid.empty();

            for (var i = 0; i < choices.length; i++) {
                var skill = Data.SKILLS[choices[i]];
                var stacks = State.player.skillStacks[skill.id] || 0;
                var curLv = stacks + 1;
                var displayName = stacks > 0 ? skill.name + ' Lv.' + curLv + '→Lv.' + (curLv + 1) : skill.name;
                var dmgText = 'Damage: ' + skill.damage;
                if (stacks > 0) {
                    var totalPct = (stacks + 1) * 20;
                    var newDmg = Math.floor(skill.damage * (1 + (stacks + 1) * 0.2));
                    dmgText = 'Damage: ' + skill.damage + ' → ' + newDmg + ' (+' + totalPct + '%)';
                }
                var $card = $('<div class="choice-card" data-skill="' + skill.id + '">' +
                    '<div class="choice-title" style="color:' + skill.color + '">' + displayName + '</div>' +
                    '<div class="choice-desc">' + skill.desc + '</div>' +
                    '<div class="choice-stat">Cost: ' + skill.energyCost + '⚡ | ' + dmgText + '</div>' +
                    '</div>');
                $grid.append($card);
            }

            $grid.find('.choice-card').on('click', function() {
                var skillId = $(this).data('skill');
                $grid.find('.choice-card').off('click');
                $('#btn-reroll-skill').off('click');
                callback(skillId);
            });

            $('#btn-reroll-skill').text('REROLL (' + rerollsLeft + ')');
            if (rerollsLeft <= 0) {
                $('#btn-reroll-skill').prop('disabled', true).addClass('disabled');
            } else {
                $('#btn-reroll-skill').prop('disabled', false).removeClass('disabled');
            }
        }

        generateChoices();

        $('#btn-reroll-skill').off('click').on('click', function() {
            if (rerollsLeft > 0) {
                rerollsLeft--;
                generateChoices();
            }
        });

        $('#btn-skip-skill').off('click').on('click', function() {
            var healAmount = Math.floor(State.player.maxHp * 0.05);
            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
            State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
            State.addLog('Skipped skill selection, healed for ' + healAmount + ' HP', 'info');
            callback(null);
        });

        this.showScreen('skill-screen');
    },

    showReplaceChoices: function(newSkillId, callback) {
        var $grid = $('#replace-choices');
        $grid.empty();

        for (var i = 2; i < State.player.skills.length; i++) {
            var skill = State.player.skills[i];
            if (!skill) continue;

            var $card = $('<div class="choice-card" data-slot="' + i + '">' +
                '<div class="choice-title" style="color:' + skill.color + '">' + skill.name + '</div>' +
                '<div class="choice-desc">' + skill.desc + '</div>' +
                '</div>');
            $grid.append($card);
        }

        $grid.find('.choice-card').on('click', function() {
            var slot = parseInt($(this).data('slot'));
            $grid.find('.choice-card').off('click');
            callback(slot);
        });

        $('#btn-skip-replace').off('click').on('click', function() {
            callback(-1);
        });

        this.showScreen('replace-screen');
    },

    showBossWarning: function(bossName, callback) {
        $('#boss-name').text(bossName);
        $('#boss-warning').addClass('active');
        setTimeout(function() {
            $('#boss-warning').removeClass('active');
            if (callback) callback();
        }, 2000);
    },

    showDeathScreen: function() {
        $('#death-stage-num').text(State.stage);
        $('#death-turns').text(State.turn);
        $('#stat-stages').text(State.stage - 1);
        $('#stat-damage').text(State.runStats.totalDamage);
        $('#stat-kills').text(State.runStats.enemyKills);
        $('#stat-bosses').text(State.runStats.bossesKilled);

        var itemCount = 0;
        var $itemsList = $('#stat-items-list');
        $itemsList.empty();
        for (var id in State.player.items) {
            if (State.player.items[id] > 0) {
                itemCount += State.player.items[id];
                var item = Data.ITEMS[id];
                if (item) {
                    var rarityColor = Data.ITEM_RARITY[item.rarity].color;
                    var stackText = State.player.items[id] > 1 ? ' x' + State.player.items[id] : '';
                    var iconChar = item.icon || '\u25CF';
                    var iconBg = item.iconBg || '#666666';
                    $itemsList.append('<div class="death-item-badge">' +
                        '<span class="death-item-icon" style="background:' + iconBg + '">' + iconChar + '</span>' +
                        '<span class="death-item-name" style="color:' + rarityColor + '">' + item.name + '</span>' +
                        '<span class="death-item-stack">' + stackText + '</span>' +
                        '</div>');
                }
            }
        }
        $('#stat-items').text(itemCount);

        var $skillsList = $('#stat-skills-list');
        $skillsList.empty();
        for (var si = 0; si < State.player.skills.length; si++) {
            var sk = State.player.skills[si];
            if (!sk) continue;
            var skStacks = State.player.skillStacks[sk.id] || 0;
            var skName = skStacks > 0 ? sk.name + ' Lv.' + (skStacks + 1) : sk.name;
            $skillsList.append('<div class="death-item-badge">' +
                '<span class="death-item-icon" style="background:' + sk.color + '">' + sk.name.charAt(0) + '</span>' +
                '<span class="death-item-name" style="color:' + sk.color + '">' + skName + '</span>' +
                '</div>');
        }

        this.showScreen('death-screen');
    },

    showBossBonusChoices: function(callback) {
        var bossItemIds = ['boss_tome', 'boss_weapon', 'boss_crown'];

        var $grid = $('#boss-bonus-choices');
        $grid.empty();

        for (var i = 0; i < bossItemIds.length; i++) {
            var item = Data.ITEMS[bossItemIds[i]];
            var $card = $('<div class="choice-card item-card item-rarity-boss" data-item="' + item.id + '">' +
                '<div class="item-icon" style="background:' + item.iconBg + '">' + item.icon + '</div>' +
                '<div class="choice-title" style="color:#ffdd00">' + item.name + '</div>' +
                '<div class="choice-desc">' + item.desc + '</div>' +
                '</div>');
            $grid.append($card);
        }

        $grid.find('.choice-card').on('click', function() {
            var itemId = $(this).data('item');
            $grid.find('.choice-card').off('click');
            callback(itemId);
        });

        this.showScreen('boss-bonus-screen');
    },

    showDebugBiomePicker: function() {
        var biomeIds = Object.keys(Data.BIOMES);
        var html = '<div class="screen active" id="debug-biome-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center">' +
            '<div style="background:#111;border:2px solid #ff00ff;border-radius:8px;padding:24px;max-width:400px;width:90%">' +
            '<h3 style="color:#ff00ff;font-family:\'Press Start 2P\';font-size:12px;margin:0 0 16px;text-align:center">DEBUG: PICK BIOME</h3>' +
            '<div style="display:flex;flex-direction:column;gap:8px">';

        for (var i = 0; i < biomeIds.length; i++) {
            var id = biomeIds[i];
            var b = Data.BIOMES[id];
            var isActive = State.debugBiomeOverride === id;
            html += '<button class="debug-biome-btn" data-biome="' + id + '" style="' +
                'background:' + (isActive ? b.color : '#222') + ';' +
                'color:' + (isActive ? '#000' : b.color) + ';' +
                'border:2px solid ' + b.color + ';' +
                'padding:10px 12px;border-radius:4px;font-family:"Press Start 2P";font-size:10px;cursor:pointer;text-align:left' +
                '">' + b.name + (isActive ? ' ✓' : '') + '</button>';
        }

        html += '<button class="debug-biome-btn" data-biome="" style="background:#222;color:#888;border:2px solid #444;padding:10px 12px;border-radius:4px;font-family:\'Press Start 2P\';font-size:10px;cursor:pointer;text-align:left">CLEAR OVERRIDE (random)</button>';
        html += '</div></div></div>';

        var $overlay = $(html);
        $('body').append($overlay);

        $overlay.find('.debug-biome-btn').on('click', function() {
            var biomeId = $(this).data('biome');
            State.debugBiomeOverride = biomeId || null;
            if (biomeId) {
                State.addLog('[DEBUG] Next biome locked to: ' + Data.BIOMES[biomeId].name, 'info');
            } else {
                State.addLog('[DEBUG] Biome override cleared', 'info');
            }
            $overlay.remove();
        });
    }
};
