var Input = {
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

    handleHover: function(e) {
        if (State.phase !== 'player') return;
        var tile = Grid.pixelToTile(e.clientX, e.clientY);
        State.hoveredTile = tile;
        this.updatePreview(tile);
        Grid.render();
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

        var enemyAtTile = State.getEnemyAt(tile.x, tile.y);

        if (skill.shape === 'dash') {
            Combat.executeDash(tile.x, tile.y);
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

        if (enemyAtTile && dist <= skill.range && State.player.energy >= skill.energyCost) {
            if (skill.shape === 'single' || skill.isBasic) {
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
        if (key >= '1' && key <= '5') {
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
