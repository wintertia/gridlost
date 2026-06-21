var Main = {
    init: function() {
        Grid.init();
        Input.init();
        this.bindEvents();
    },

    bindEvents: function() {
        $('#btn-start').on('click', function() {
            UI.showClassSelect();
        });

        $('#btn-retry').on('click', function() {
            UI.showClassSelect();
        });

        $(window).on('resize', function() {
            if (State.screen === 'game') {
                Grid.resize();
            }
        });
    },

    startGame: function(classId) {
        State.selectedClass = classId || 'knight';
        State.reset();
        Stages.generate();
        State.phase = 'player';
        State.clearFloatingTexts();
        UI.showScreen('game-screen');
        var self = this;
        setTimeout(function() {
            Grid.resize();
            UI.updateAll();
            if (State.isBossStage && State.currentBossDef) {
                UI.showBossWarning(State.currentBossDef.name, function() {
                    UI.updateAll();
                });
            }
        }, 50);
    },

    stageClear: function() {
        State.phase = 'idle';
        if (State.isBossStage) {
            UI.showBossBonusChoices(function(bonusId) {
                Main.applyBossBonus(bonusId);
                UI.updateAll();
                UI.showItemChoices(function(itemId) {
                    Main.applyItemReward(itemId);

                    UI.showSkillChoices(function(skillId) {
                        if (skillId) {
                            Main.handleSkillAcquisition(skillId);
                        } else {
                            Main.proceedToNextStage();
                        }
                    });
                });
            });
        } else {
            UI.showItemChoices(function(itemId) {
                Main.applyItemReward(itemId);

                Main.grantEliteItemDrops(function() {
                    UI.showSkillChoices(function(skillId) {
                        if (skillId) {
                            Main.handleSkillAcquisition(skillId);
                        } else {
                            Main.proceedToNextStage();
                        }
                    });
                });
            });
        }
    },

    grantEliteItemDrops: function(callback) {
        if (State.extraItemDrops <= 0) { callback(); return; }

        var remaining = State.extraItemDrops;
        State.extraItemDrops = 0;

        function grantOne() {
            UI.showItemChoices(function(itemId) {
                Main.applyItemReward(itemId);
                remaining--;
                if (remaining > 0) {
                    grantOne();
                } else {
                    callback();
                }
            });
        }
        grantOne();
    },

    applyBossBonus: function(bonusId) {
        State.addItem(bonusId);
        var item = Data.ITEMS[bonusId];
        var name = item ? item.name : bonusId;
        State.addLog('Obtained boss item: ' + name, 'boss');

        if (bonusId === 'boss_tome') {
            var basicSkill = State.player.skills[1];
            if (basicSkill) {
                var curStacks = State.player.skillStacks[basicSkill.id] || 0;
                State.player.skillStacks[basicSkill.id] = curStacks + 1;
                var newLv = curStacks + 2;
                State.addFloatingText(State.player.x, State.player.y, basicSkill.name + ' Lv.' + newLv + '!', '#ffaa00');
            }
        }
    },

    applyStatUpgrade: function(stat) {
        var upgrade = Data.STAT_UPGRADES[stat];
        if (!upgrade) return;

        if (upgrade.healPercent) {
            var healAmount = Math.floor(State.player.maxHp * upgrade.healPercent / 100);
            State.player.hp = Math.min(State.player.hp + healAmount, State.player.maxHp);
            State.addFloatingText(State.player.x, State.player.y, '+' + healAmount + ' HP', '#44ff44');
        }
        if (upgrade.powerBonusPercent) {
            State.player.power += upgrade.powerBonusPercent;
            State.addFloatingText(State.player.x, State.player.y, '+' + upgrade.powerBonusPercent + '% DMG', '#ffaa00');
        }
        if (upgrade.critBonus) {
            State.player.critStacks++;
            var bonus = Math.floor(upgrade.critBonus * Math.log2(State.player.critStacks + 1));
            State.player.critChance += bonus;
            State.addFloatingText(State.player.x, State.player.y, '+' + bonus + '% CRIT', '#ff4444');
        }
    },

    applyItemReward: function(itemId) {
        var item = Data.ITEMS[itemId];
        if (!item) return;

        State.addItem(itemId);
        var stacks = State.getItemStacks(itemId);
        var rarityColor = Data.ITEM_RARITY[item.rarity].color;

        State.addFloatingText(State.player.x, State.player.y, '+' + item.name, rarityColor);
        State.addLog('Obtained ' + item.name + (stacks > 1 ? ' (x' + stacks + ')' : ''), 'item');

        if (item.effect.type === 'passive' && item.effect.stat === 'maxHp') {
            var hpBonus = item.effect.value;
            State.player.maxHp += hpBonus;
            State.player.hp += hpBonus;
        }

        if (item.effect.penalty && item.effect.penalty.stat === 'maxHpPercent') {
            var penalty = Math.floor(State.player.maxHp * Math.abs(item.effect.penalty.value) / 100);
            State.player.maxHp -= penalty;
            State.player.hp = Math.min(State.player.hp, State.player.maxHp);
        }

        UI.updateAll();
    },

    handleSkillAcquisition: function(skillId) {
        var newSkill = Data.SKILLS[skillId];
        if (!newSkill) {
            this.proceedToNextStage();
            return;
        }

        var existingSlot = -1;
        for (var i = 2; i < State.player.skills.length; i++) {
            if (State.player.skills[i] && State.player.skills[i].id === skillId) {
                existingSlot = i;
                break;
            }
        }

        if (existingSlot !== -1) {
            if (!State.player.skillStacks[skillId]) {
                State.player.skillStacks[skillId] = 1;
            } else {
                State.player.skillStacks[skillId]++;
            }
            State.addFloatingText(State.player.x, State.player.y, 'STACK +' + State.player.skillStacks[skillId] + '!', '#ffaa00');
            State.addLog(newSkill.name + ' stacked to ' + State.player.skillStacks[skillId], 'info');
            this.proceedToNextStage();
            return;
        }

        var emptySlot = -1;
        for (var i = 2; i < State.player.skills.length; i++) {
            if (!State.player.skills[i]) {
                emptySlot = i;
                break;
            }
        }

        if (emptySlot !== -1) {
            State.player.skills[emptySlot] = newSkill;
            State.player.skillStacks[skillId] = 0;
            this.proceedToNextStage();
        } else {
            UI.showReplaceChoices(skillId, function(slot) {
                if (slot >= 2) {
                    State.player.skills[slot] = newSkill;
                }
                Main.proceedToNextStage();
            });
        }
    },

    proceedToNextStage: function() {
        State.stage++;
        State.updateBiome();
        State.player.energy = State.player.maxEnergy;
        State.player.tempPower = 0;
        State.player.shield = 0;
        State.burnTiles = [];
        State.poisonTiles = [];
        State.spikeTurns = 0;
        State.clearFloatingTexts();
        Stages.generate();
        UI.updateAll();
        State.phase = 'player';
        State.turn = 1;
        UI.hideScreen('complete-screen');
        UI.hideScreen('skill-screen');
        UI.hideScreen('replace-screen');
        UI.showScreen('game-screen');
        var self = this;
        setTimeout(function() {
            Grid.resize();
            UI.updateAll();
            if (State.isBossStage && State.currentBossDef) {
                UI.showBossWarning(State.currentBossDef.name, function() {
                    UI.updateAll();
                });
            }
        }, 50);
    },

    gameOver: function() {
        State.phase = 'idle';
        State.clearFloatingTexts();
        setTimeout(function() {
            UI.showDeathScreen();
        }, 500);
    }
};

$(document).ready(function() {
    Main.init();
});
