var Main = {
    init: function() {
        Grid.init();
        Input.init();
        AudioMgr.init();
        this.bindEvents();
        this.bindSettings();
        AudioMgr.playMenuBgm();
    },

    bindEvents: function() {
        $('#btn-start').on('click', function() {
            AudioMgr.sfx('click');
            UI.showClassSelect();
        });

        $('#btn-retry').on('click', function() {
            AudioMgr.sfx('click');
            AudioMgr.playMenuBgm();
            UI.showClassSelect();
        });

        $('#btn-settings-menu').on('click', function() {
            AudioMgr.sfx('click');
            Main.showSettings('menu');
        });

        $('#btn-settings-ingame').on('click', function() {
            AudioMgr.sfx('click');
            Main.showSettings('game');
        });

        $('#btn-settings-close').on('click', function() {
            AudioMgr.sfx('click');
            UI.hideScreen('settings-screen');
            if (Main._settingsReturn === 'menu') {
                UI.showScreen('title-screen');
            } else {
                UI.showScreen('game-screen');
                $('#btn-settings-ingame').show();
            }
        });

        $(window).on('resize', function() {
            if (State.screen === 'game') {
                Grid.resize();
            }
        });
    },

    _settingsReturn: 'menu',

    showSettings: function(from) {
        this._settingsReturn = from;
        $('#settings-bgm').val(Math.round(AudioMgr.getBgmVolume() * 100));
        $('#settings-sfx').val(Math.round(AudioMgr.getSfxVolume() * 100));
        if (from === 'menu') {
            UI.showScreen('settings-screen');
        } else {
            UI.showOverlay('settings-screen');
        }
    },

    bindSettings: function() {
        $('#settings-bgm').on('input', function() {
            var v = parseInt(this.value) / 100;
            AudioMgr.setBgmVolume(v);
        });
        $('#settings-sfx').on('input', function() {
            var v = parseInt(this.value) / 100;
            AudioMgr.setSfxVolume(v);
            AudioMgr.sfx('click');
        });
    },

    startGame: function(classId) {
        State.selectedClass = classId || 'knight';
        State.reset();
        Stages.generate();
        State.phase = 'player';
        State.clearFloatingTexts();
        UI.showScreen('game-screen');
        $('#btn-settings-ingame').show();
        if (State.isBossStage && State.currentBossDef) {
            AudioMgr.playBgmForBoss(State.currentBossDef.id);
        } else {
            AudioMgr.playBgmForBiome(State.currentBiome);
        }
        var self = this;
        setTimeout(function() {
            Grid.resize();
            UI.updateAll();
            State.saveTurnStartState();
            UI.updateAll();
            if (State.isBossStage && State.currentBossDef) {
                UI.showBossWarning(State.currentBossDef.name, function() {
                    if (State.currentBossDef.startDialogue) {
                        State.addDialogue(State.currentBossDef.name, State.currentBossDef.startDialogue, State.currentBossDef.color);
                        State.processDialogueQueue(function() {
                            if (State.currentBossDef.startEffect) {
                                State.currentBossDef.startEffect();
                            }
                            UI.updateAll();
                        });
                    } else {
                        if (State.currentBossDef.startEffect) {
                            State.currentBossDef.startEffect();
                        }
                        UI.updateAll();
                    }
                });
            }
        }, 50);
    },

    stageClear: function() {
        State.phase = 'idle';
        if (State.isBossStage) {
            var bossName = State.currentBossDef ? State.currentBossDef.name : 'Boss';
            var bossColor = State.currentBossDef ? State.currentBossDef.color : '#ffffff';
            var deathDialogue = State.currentBossDef ? State.currentBossDef.deathDialogue : null;
            if (deathDialogue) {
                State.addDialogue(bossName, deathDialogue, bossColor);
            }
            State.processDialogueQueue(function() {
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
        AudioMgr.sfx('levelup');

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
        AudioMgr.sfx('pickup');

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
            AudioMgr.sfx('buff');
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
        State.spikeLastX = -1;
        State.spikeLastY = -1;
        State.clearFloatingTexts();
        Stages.generate();
        UI.updateAll();
        State.phase = 'player';
        State.turn = 1;
        UI.hideScreen('complete-screen');
        UI.hideScreen('skill-screen');
        UI.hideScreen('replace-screen');
        UI.showScreen('game-screen');
        if (State.isBossStage && State.currentBossDef) {
            AudioMgr.playBgmForBoss(State.currentBossDef.id);
        } else {
            AudioMgr.playBgmForBiome(State.currentBiome);
        }
        var self = this;
        setTimeout(function() {
            Grid.resize();
            UI.updateAll();
            State.saveTurnStartState();
            UI.updateAll();
            if (State.isBossStage && State.currentBossDef) {
                UI.showBossWarning(State.currentBossDef.name, function() {
                    if (State.currentBossDef.startDialogue) {
                        State.addDialogue(State.currentBossDef.name, State.currentBossDef.startDialogue, State.currentBossDef.color);
                        State.processDialogueQueue(function() {
                            if (State.currentBossDef.startEffect) {
                                State.currentBossDef.startEffect();
                            }
                            UI.updateAll();
                        });
                    } else {
                        if (State.currentBossDef.startEffect) {
                            State.currentBossDef.startEffect();
                        }
                        UI.updateAll();
                    }
                });
            }
        }, 50);
    },

    gameOver: function() {
        State.phase = 'idle';
        State.clearFloatingTexts();
        AudioMgr.stopBgm();
        AudioMgr.sfx('death_player');
        var self = this;
        setTimeout(function() {
            UI.showDeathScreen();
            $('#btn-settings-ingame').hide();
        }, 500);
    }
};

$(document).ready(function() {
    Main.init();
});
