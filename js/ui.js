var UI = {
    updateAll: function() {
        this.updateStats();
        this.updateSkillBar();
        this.updateEnemyList();
        this.updateSynergies();
        this.updateItems();
        this.updateTopBar();
        this.updateCombatLog();
        Grid.render();
    },

    updateStats: function() {
        var p = State.player;
        var hpPct = (p.hp / p.maxHp) * 100;
        var nrjPct = (p.energy / p.maxEnergy) * 100;

        var cls = Data.CLASSES[p.classId];
        if (cls) {
            $('#player-class-name').text(cls.name);
            $('#player-passive').text(cls.passiveName).attr('data-tooltip', cls.passive);
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
                var basicName = basicSkill ? basicSkill.name : 'Slash';
                var basicDmg = basicSkill ? basicSkill.damage : 60;
                var basicRange = basicSkill ? basicSkill.range : 1;
                $slot.find('.skill-name').text(basicName);
                $slot.find('.skill-cost').text('1⚡');
                $slot.attr('data-tooltip', basicName + '\nDamage: ' + basicDmg + '\nCost: 1 energy\nRange: ' + basicRange);
            } else if (i === 5) {
                $slot.find('.skill-name').text('Guard');
                $slot.find('.skill-cost').text('All⚡');
                var guardPct = p.energy * 5;
                $slot.attr('data-tooltip', 'Guard: spend all remaining energy\nMitigate ' + guardPct + '% damage this turn\n(' + p.energy + ' energy × 5%)');
            } else if (skill) {
                $slot.find('.skill-name').text(skill.name);
                $slot.find('.skill-cost').text(skill.energyCost + '⚡');
                var iconClass = skill.id.replace('_', '-') + '-icon';
                var $icon = $slot.find('.skill-icon');
                $icon.removeClass().addClass('skill-icon ' + iconClass);
                $icon.css('background', skill.color);

                var tooltipText = skill.name + '\n';
                tooltipText += 'Damage: ' + skill.damage + '\n';
                tooltipText += 'Cost: ' + skill.energyCost + ' energy\n';
                tooltipText += 'Shape: ' + this.getShapeName(skill.shape) + '\n';
                if (skill.effects.length > 0) {
                    tooltipText += 'Effects: ' + skill.effects.join(', ');
                }
                var synergies = this.getSkillSynergies(skill.id);
                if (synergies.length > 0) {
                    tooltipText += '\n\nSYNERGIES:';
                    for (var s = 0; s < synergies.length; s++) {
                        var synKey = null;
                        for (var key in Data.SYNERGIES) {
                            if (Data.SYNERGIES[key].name === synergies[s]) {
                                synKey = key;
                                break;
                            }
                        }
                        if (synKey) {
                            var syn = Data.SYNERGIES[synKey];
                            var active = State.hasSynergy(synKey);
                            tooltipText += '\n[' + (active ? 'ACTIVE' : 'INACTIVE') + '] ' + syn.name + ': ' + syn.desc;
                        }
                    }
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

    getSkillSynergies: function(skillId) {
        var synergies = [];
        for (var key in Data.SYNERGIES) {
            var syn = Data.SYNERGIES[key];
            if (syn.requires.indexOf(skillId) !== -1) {
                synergies.push(syn.name);
            }
        }
        return synergies;
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

    updateSynergies: function() {
        var $list = $('#synergies-list');
        $list.empty();

        var activeSets = State.getActiveItemSets();
        var hasAny = State.activeSynergies.length > 0 || activeSets.length > 0;

        if (!hasAny) {
            $list.append('<p class="empty-text">No synergies active</p>');
            return;
        }

        for (var i = 0; i < State.activeSynergies.length; i++) {
            var syn = Data.SYNERGIES[State.activeSynergies[i]];
            var triggerText = this.getSynergyTriggers(syn);
            var $item = $('<div class="synergy-item" data-tooltip="' + syn.name + '\n' + syn.desc + '\n\nRequires: ' + triggerText + '">' + syn.name + '</div>');
            $list.append($item);
        }

        for (var j = 0; j < activeSets.length; j++) {
            var set = Data.ITEM_SETS[activeSets[j]];
            var setTriggerText = this.getItemSetTriggers(set);
            var $setItem = $('<div class="synergy-item" data-tooltip="' + set.name + '\n' + set.desc + '\n\nRequires: ' + setTriggerText + '" style="color:#44ff44">' + set.name + '</div>');
            $list.append($setItem);
        }
    },

    getSynergyTriggers: function(syn) {
        var names = [];
        for (var i = 0; i < syn.requires.length; i++) {
            var id = syn.requires[i];
            var skill = Data.SKILLS[id];
            if (skill) {
                names.push(skill.name);
            } else {
                var item = Data.ITEMS[id];
                if (item) names.push(item.name);
            }
        }
        return names.join(' + ');
    },

    getItemSetTriggers: function(set) {
        var names = [];
        for (var i = 0; i < set.requires.length; i++) {
            var item = Data.ITEMS[set.requires[i]];
            if (item) names.push(item.name);
        }
        return names.join(' + ');
    },

    updateItems: function() {
        var $list = $('#items-list');
        $list.empty();

        var items = State.player.items;
        var hasItems = false;
        var order = ['common', 'uncommon', 'rare'];

        for (var r = 0; r < order.length; r++) {
            var rarity = order[r];
            var color = Data.ITEM_RARITY[rarity].color;

            for (var id in items) {
                if (items[id] <= 0) continue;
                var item = Data.ITEMS[id];
                if (!item || item.rarity !== rarity) continue;

                hasItems = true;
                var stackText = items[id] > 1 ? ' x' + items[id] : '';
                var iconChar = item.icon || '\u25CF';
                var iconBg = item.iconBg || color;
                var $entry = $('<div class="item-entry" data-tooltip="' + item.name + ': ' + item.desc + '">' +
                    '<div class="item-icon" style="background:' + iconBg + ';color:#fff;text-align:center;line-height:12px;font-size:8px;">' + iconChar + '</div>' +
                    '<span class="item-name">' + item.name + '</span>' +
                    '<span class="item-stack">' + stackText + '</span>' +
                    '</div>');
                $list.append($entry);
            }
        }

        if (!hasItems) {
            $list.append('<p class="empty-text">No items yet</p>');
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
            var owned = [];
            for (var i = 1; i < State.player.skills.length; i++) {
                if (State.player.skills[i]) owned.push(State.player.skills[i].id);
            }

            var available = pool.filter(function(id) {
                return owned.indexOf(id) === -1;
            });

            var shuffled = available.sort(function() { return Math.random() - 0.5; });
            var choices = shuffled.slice(0, 3);

            var $grid = $('#skill-choices');
            $grid.empty();

            for (var i = 0; i < choices.length; i++) {
                var skill = Data.SKILLS[choices[i]];
                var $card = $('<div class="choice-card" data-skill="' + skill.id + '">' +
                    '<div class="choice-title" style="color:' + skill.color + '">' + skill.name + '</div>' +
                    '<div class="choice-desc">' + skill.desc + '</div>' +
                    '<div class="choice-stat">Cost: ' + skill.energyCost + '⚡ | Damage: ' + skill.damage + '</div>' +
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
        $('#stat-maxhp').text(State.player.maxHp);
        $('#stat-power').text('+' + State.player.power);
        $('#stat-crit').text(State.player.critChance + Combat.calculateItemStatBonus('critChance') + '%');

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

        this.showScreen('death-screen');
    },

    showBossBonusChoices: function(callback) {
        var bossItemIds = ['boss_heart', 'boss_weapon', 'boss_crown'];

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
    }
};
