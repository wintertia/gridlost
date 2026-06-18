var Main = {
    init: function() {
        Grid.init();
        Input.init();
        this.bindEvents();
    },

    bindEvents: function() {
        $('#btn-start').on('click', function() {
            Main.startGame();
        });

        $('#btn-retry').on('click', function() {
            Main.startGame();
        });

        $(window).on('resize', function() {
            if (State.screen === 'game') {
                Grid.resize();
            }
        });
    },

    startGame: function() {
        State.reset();
        Stages.generate();
        State.updateSynergies();
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

                UI.showSkillChoices(function(skillId) {
                    if (skillId) {
                        Main.handleSkillAcquisition(skillId);
                    } else {
                        Main.proceedToNextStage();
                    }
                });
            });
        }
    },

    applyBossBonus: function(bonusId) {
        if (bonusId === 'maxhp') {
            var hpBonus = Math.floor(State.player.maxHp * 0.25);
            State.player.maxHp += hpBonus;
            State.player.hp += hpBonus;
        } else if (bonusId === 'damage') {
            State.player.power = Math.floor(State.player.power * 1.25);
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

        var emptySlot = -1;
        for (var i = 2; i < State.player.skills.length; i++) {
            if (!State.player.skills[i]) {
                emptySlot = i;
                break;
            }
        }

        if (emptySlot !== -1) {
            State.player.skills[emptySlot] = newSkill;
            State.updateSynergies();
            this.proceedToNextStage();
        } else {
            UI.showReplaceChoices(skillId, function(slot) {
                if (slot >= 2) {
                    State.player.skills[slot] = newSkill;
                }
                State.updateSynergies();
                Main.proceedToNextStage();
            });
        }
    },

    proceedToNextStage: function() {
        State.stage++;
        State.player.energy = State.player.maxEnergy;
        State.player.tempPower = 0;
        State.clearFloatingTexts();
        Stages.generate();
        State.updateSynergies();
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
