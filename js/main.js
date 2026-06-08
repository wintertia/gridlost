var Main = {
    init: function() {
        Grid.init();
        Input.init();
        this.bindEvents();
        this.startRenderLoop();
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
                UI.showStatChoices(function(statChoice) {
                    Main.applyStatUpgrade(statChoice);

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
            UI.showStatChoices(function(statChoice) {
                Main.applyStatUpgrade(statChoice);

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
            State.player.maxHp += 25;
            State.player.hp += 25;
        } else if (bonusId === 'damage') {
            State.player.power = Math.floor(State.player.power * 1.25);
        }
    },

    applyStatUpgrade: function(stat) {
        var upgrade = Data.STAT_UPGRADES[stat];
        if (!upgrade) return;

        if (upgrade.healAmount) {
            State.player.hp = Math.min(State.player.hp + upgrade.healAmount, State.player.maxHp);
        }
        if (upgrade.powerBonus) {
            State.player.power += upgrade.powerBonus;
        }
        if (upgrade.critBonus) {
            State.player.critChance += upgrade.critBonus;
        }
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
        Stages.generate();
        State.updateSynergies();
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
        setTimeout(function() {
            UI.showDeathScreen();
        }, 500);
    },

    startRenderLoop: function() {
        function loop() {
            if (State.screen === 'game') {
                State.updateFloatingTexts();
                Grid.render();
            }
            requestAnimationFrame(loop);
        }
        loop();
    }
};

$(document).ready(function() {
    Main.init();
});
