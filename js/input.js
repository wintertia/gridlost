var Input = {
    activeTooltip: null,
    activeTooltipTarget: null,

    init: function() {
        var self = this;
        var canvas = document.getElementById('game-canvas');

        canvas.addEventListener('click', function(e) {
            self.handleClick(e);
        });

        canvas.addEventListener('mousemove', function(e) {
            self.handleHover(e);
        });

        canvas.addEventListener('mouseleave', function() {
            State.hoveredTile = null;
            State.attackPreview = [];
            $('#obstacle-tooltip').hide();
            Grid.render();
        });

        canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            State.player.selectedSlot = 0;
            UI.updateSkillBar();
        });

        document.addEventListener('keydown', function(e) {
            self.handleKey(e);
        });

        this.setupTooltips();

        $('.skill-slot').on('click', function() {
            var slot = parseInt($(this).data('slot'));
            State.player.selectedSlot = slot;
            UI.updateSkillBar();
            Input.updatePreview(State.hoveredTile);
        });

        $('#btn-end-turn').on('click', function() {
            if (State.phase === 'player') {
                Combat.endPlayerTurn();
            }
        });
    },

    setupTooltips: function() {
        var self = this;
        var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        function showTooltip($el, forTouch) {
            var text = $el.attr('data-tooltip');
            if (!text) return;

            self.hideTooltip();

            var $tip = $('<div class="js-tooltip"></div>').text(text);
            $('body').append($tip);

            if (forTouch) {
                $tip.on('touchend', function(e) {
                    e.stopPropagation();
                });
            }

            var rect = $el[0].getBoundingClientRect();
            var tipW = $tip.outerWidth();
            var tipH = $tip.outerHeight();
            var winW = $(window).width();
            var winH = $(window).height();

            var left = rect.left + rect.width / 2 - tipW / 2;
            var top = rect.top - tipH - 8;

            if (left < 8) left = 8;
            if (left + tipW > winW - 8) left = winW - tipW - 8;
            if (top < 8) {
                top = rect.bottom + 8;
            }

            $tip.css({ left: left + 'px', top: top + 'px' });
            self.activeTooltip = $tip;
        }

        function hideTooltipIfOutside($target) {
            if (!self.activeTooltip) return;
            if ($target.closest('.js-tooltip, .skill-slot, .synergy-item, .item-entry, .stat-label').length === 0) {
                self.hideTooltip();
            }
        }

        if (isTouch) {
            $(document).on('touchstart', '.skill-slot, .synergy-item, .item-entry, .stat-label', function(e) {
                var $el = $(this);
                if (self.activeTooltip && self.activeTooltipTarget && self.activeTooltipTarget[0] === $el[0]) {
                    self.hideTooltip();
                } else {
                    self.activeTooltipTarget = $el;
                    showTooltip($el, true);
                }
            });

            $(document).on('touchstart', function(e) {
                if (!$(e.target).closest('.skill-slot, .synergy-item, .item-entry, .stat-label, .js-tooltip').length) {
                    self.hideTooltip();
                }
            });
        } else {
            $(document).on('mouseenter', '.skill-slot, .synergy-item, .item-entry, .stat-label', function() {
                showTooltip($(this), false);
            });

            $(document).on('mouseleave', '.skill-slot, .synergy-item, .item-entry, .stat-label', function() {
                self.hideTooltip();
            });
        }
    },

    hideTooltip: function() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
            this.activeTooltipTarget = null;
        }
    },

    handleHover: function(e) {
        if (State.phase !== 'player') {
            $('#obstacle-tooltip').hide();
            return;
        }
        var tile = Grid.pixelToTile(e.clientX, e.clientY);
        State.hoveredTile = tile;
        this.updatePreview(tile);
        this.updateObstacleTooltip(e, tile);
        Grid.render();
    },

    updateObstacleTooltip: function(e, tile) {
        var $tooltip = $('#obstacle-tooltip');
        if (!tile) {
            $tooltip.hide();
            return;
        }

        var obstacle = null;
        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            if (o.x === tile.x && o.y === tile.y) {
                obstacle = o;
                break;
            }
        }

        if (obstacle) {
            var def = Data.OBSTACLES[obstacle.id];
            var name = def ? def.name : 'Obstacle';
            var desc = def ? def.desc : '';
            var hpText = obstacle.destructible ? ' (HP: ' + obstacle.hp + ')' : '';
            $tooltip.text(name + hpText + (desc ? ' - ' + desc : ''));
            $tooltip.css({
                left: (e.clientX + 12) + 'px',
                top: (e.clientY - 10) + 'px'
            }).show();
        } else {
            $tooltip.hide();
        }
    },

    updatePreview: function(tile) {
        State.attackPreview = [];
        if (!tile || State.phase !== 'player') return;
        var skill = State.getSelectedSkill();
        if (!skill) return;

        var tiles = Combat.getAffectedTiles(State.player.x, State.player.y, tile.x, tile.y, skill);
        State.attackPreview = tiles;
    },

    handleClick: function(e) {
        if (State.phase !== 'player') return;
        var tile = Grid.pixelToTile(e.clientX, e.clientY);
        if (!tile) return;

        var dist = Math.abs(tile.x - State.player.x) + Math.abs(tile.y - State.player.y);

        if (State.isMoveMode()) {
            if (dist === 1) {
                this.tryMove(tile.x, tile.y);
            }
            return;
        }

        var skill = State.getSelectedSkill();
        if (!skill) return;

        if (skill.shape === 'guard') {
            Combat.executeGuard();
            return;
        }

        if (skill.shape === 'self') {
            Combat.executeSelfSkill(skill);
            return;
        }

        var enemyAtTile = State.getEnemyAt(tile.x, tile.y);

        if (skill.shape === 'dash') {
            Combat.executeDash(tile.x, tile.y);
            return;
        }

        if (skill.shape === 'blink') {
            if (State.player.energy >= skill.energyCost) {
                Combat.executeBlinkStrike(tile.x, tile.y, skill);
            }
            return;
        }

        if (skill.shape === 'ring') {
            if (State.player.energy >= skill.energyCost) {
                Combat.executeRingSkill(skill);
            }
            return;
        }

        if (skill.shape === 'aoe') {
            if (State.player.energy >= skill.energyCost) {
                Combat.executeAoE(tile.x, tile.y, skill);
            }
            return;
        }

        if (skill.shape === 'single' || skill.isBasic) {
            if (dist <= skill.range && State.player.energy >= skill.energyCost) {
                Combat.executeSingleAttack(tile.x, tile.y, skill);
                return;
            }
        }

        if (skill.shape === 'line' || skill.shape === 'cone' || skill.shape === 'cross') {
            if (dist <= skill.range && State.player.energy >= skill.energyCost) {
                Combat.executeDirectionalSkill(tile.x, tile.y, skill);
                return;
            }
        }
    },

    tryMove: function(x, y) {
        if (State.player.energy < 1) return;
        if (State.isBlocked(x, y)) return;
        if (State.getEnemyAt(x, y)) return;
        if (x === State.player.x && y === State.player.y) return;

        var dist = Math.abs(x - State.player.x) + Math.abs(y - State.player.y);
        if (dist !== 1) return;

        var cost = 1;
        for (var i = 0; i < State.obstacles.length; i++) {
            if (State.obstacles[i].x === x && State.obstacles[i].y === y && State.obstacles[i].id === 'water') {
                cost = 2;
                break;
            }
        }

        if (State.player.energy >= cost) {
            State.player.energy -= cost;
            State.player.x = x;
            State.player.y = y;
            this.checkTileEffects(x, y);
            UI.updateAll();
        }
    },

    checkTileEffects: function(x, y) {
        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            if (o.x === x && o.y === y && o.id === 'lava') {
                State.player.hp -= 2;
                State.addFloatingText(x, y, '-2', '#ff4400');
            }
            if (o.x === x && o.y === y && o.id === 'portal') {
                for (var j = 0; j < State.obstacles.length; j++) {
                    if (j !== i && State.obstacles[j].id === 'portal') {
                        State.player.x = State.obstacles[j].x;
                        State.player.y = State.obstacles[j].y;
                        break;
                    }
                }
            }
        }
    },

    handleKey: function(e) {
        if (State.phase !== 'player') return;
        var key = e.key;
        if (key >= '1' && key <= '6') {
            var slot = parseInt(key) - 1;
            State.player.selectedSlot = slot;
            UI.updateSkillBar();
            this.updatePreview(State.hoveredTile);
        }
        if (key === 'Escape') {
            State.player.selectedSlot = 0;
            UI.updateSkillBar();
        }
        if (key === 'e' || key === 'E' || key === ' ') {
            e.preventDefault();
            Combat.endPlayerTurn();
        }
    }
};
