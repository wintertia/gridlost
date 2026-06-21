var Grid = {
    canvas: null,
    ctx: null,
    tileSize: 0,
    offsetX: 0,
    offsetY: 0,
    animFrame: 0,
    animLoop: null,
    lastTimestamp: 0,
    animAccumulator: 0,
    TICK_MS: 1000 / 60,

    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.startAnimLoop();
    },

    startAnimLoop: function() {
        var self = this;
        self.lastTimestamp = 0;
        self.animAccumulator = 0;
        function loop(timestamp) {
            self.animLoop = requestAnimationFrame(loop);
            if (State.screen !== 'game') return;
            if (self.lastTimestamp === 0) { self.lastTimestamp = timestamp; return; }
            var dt = timestamp - self.lastTimestamp;
            self.lastTimestamp = timestamp;
            self.animAccumulator += dt;
            while (self.animAccumulator >= self.TICK_MS) {
                self.animFrame++;
                State.updateFloatingTexts();
                State.updateAnimations();
                self.animAccumulator -= self.TICK_MS;
            }
            self.render();
        }
        loop(0);
    },

    stopAnimLoop: function() {
        if (this.animLoop) {
            cancelAnimationFrame(this.animLoop);
            this.animLoop = null;
        }
    },

    resize: function() {
        var container = document.getElementById('canvas-container');
        var maxW = container.clientWidth - 32;
        var maxH = container.clientHeight - 32;
        var size = Math.min(maxW, maxH, 560);
        this.tileSize = Math.floor(size / Data.GRID_SIZE);
        var canvasSize = this.tileSize * Data.GRID_SIZE;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
        this.render();
    },

    tileToPixel: function(tx, ty) {
        return {
            x: tx * this.tileSize,
            y: ty * this.tileSize
        };
    },

    pixelToTile: function(px, py) {
        var rect = this.canvas.getBoundingClientRect();
        var x = Math.floor((px - rect.left) / this.tileSize);
        var y = Math.floor((py - rect.top) / this.tileSize);
        if (x < 0 || x >= Data.GRID_SIZE || y < 0 || y >= Data.GRID_SIZE) return null;
        return { x: x, y: y };
    },

    render: function() {
        var ctx = this.ctx;
        var ts = this.tileSize;

        var bgColor = Data.COLORS.bg;
        if (State.currentBiome && Data.BIOMES[State.currentBiome]) {
            bgColor = Data.BIOMES[State.currentBiome].bg;
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawTiles(ctx, ts);
        this.drawObstacles(ctx, ts);
        this.drawAnimations(ctx, ts);
        this.drawBurnTiles(ctx, ts);
        this.drawPoisonTiles(ctx, ts);
        this.drawRangeIndicator(ctx, ts);
        this.drawMoveIndicators(ctx, ts);
        this.drawAttackPreview(ctx, ts);
        this.drawEnemies(ctx, ts);
        this.drawPlayer(ctx, ts);
        this.drawFloatingTexts(ctx, ts);
        this.drawHealthBars(ctx, ts);
        this.drawNames(ctx, ts);
    },

    drawTiles: function(ctx, ts) {
        var tileBaseColor = Data.COLORS.tileBase;
        var tileBorderColor = Data.COLORS.tileBorder;
        if (State.currentBiome && Data.BIOMES[State.currentBiome]) {
            tileBaseColor = Data.BIOMES[State.currentBiome].tileBase;
            tileBorderColor = Data.BIOMES[State.currentBiome].tileBorder;
        }
        for (var y = 0; y < Data.GRID_SIZE; y++) {
            for (var x = 0; x < Data.GRID_SIZE; x++) {
                ctx.fillStyle = tileBaseColor;
                ctx.fillRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
                ctx.strokeStyle = tileBorderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
            }
        }

        if (State.hoveredTile) {
            ctx.fillStyle = Data.COLORS.tileHover;
            ctx.fillRect(State.hoveredTile.x * ts, State.hoveredTile.y * ts, ts, ts);
        }
    },

    drawObstacles: function(ctx, ts) {
        if (ts <= 0) return;
        for (var i = 0; i < State.obstacles.length; i++) {
            var o = State.obstacles[i];
            var px = o.x * ts;
            var py = o.y * ts;

            if (o.id === 'stone') {
                ctx.fillStyle = '#555566';
                ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
                ctx.fillStyle = '#444455';
                ctx.fillRect(px + 4, py + ts/2, ts - 8, ts/2 - 4);
            } else if (o.id === 'wall') {
                var wallC = o.color || '#886644';
                ctx.fillStyle = wallC;
                ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
                var wallDark = this.lightenColor(wallC, -30);
                ctx.fillStyle = wallDark;
                ctx.fillRect(px + 4, py + 4, ts - 8, ts/3);
                var maxHp = o.maxHp || 150;
                var hpPct = o.hp / maxHp;
                if (hpPct < 1) {
                    ctx.strokeStyle = '#442200';
                    ctx.lineWidth = 1;
                    var crack = (1 - hpPct) * 3;
                    for (var c = 0; c < crack; c++) {
                        ctx.beginPath();
                        ctx.moveTo(px + ts * 0.3 + c * 5, py + 4);
                        ctx.lineTo(px + ts * 0.5 + c * 3, py + ts - 4);
                        ctx.stroke();
                    }
                }
            } else if (o.id === 'lava') {
                var lavaC = (Math.floor(this.animFrame / 30) % 2 === 0) ? '#ff4400' : '#ff8800';
                ctx.fillStyle = lavaC;
                ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(px + ts * 0.3, py + ts * 0.4, ts * 0.2, ts * 0.2);
            } else if (o.id === 'water') {
                var waterC = (Math.floor(this.animFrame / 40) % 2 === 0) ? '#2266cc' : '#4488ee';
                ctx.fillStyle = waterC;
                ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                ctx.fillStyle = '#66aaee';
                var waveOffset = Math.sin(this.animFrame * 0.05 + o.x) * 3;
                ctx.fillRect(px + 4, py + ts * 0.4 + waveOffset, ts - 8, 2);
            } else if (o.id === 'portal') {
                ctx.fillStyle = '#1a0a2e';
                ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                var glow = 0.5 + Math.sin(this.animFrame * 0.08) * 0.3;
                ctx.fillStyle = 'rgba(204, 68, 255, ' + glow + ')';
                ctx.beginPath();
                ctx.arc(px + ts/2, py + ts/2, ts * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#aa44ff';
                ctx.beginPath();
                ctx.arc(px + ts/2, py + ts/2, ts * 0.15, 0, Math.PI * 2);
                ctx.fill();
            } else if (o.id === 'spike_trap') {
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                ctx.fillStyle = '#888899';
                var spikeSize = ts * 0.12;
                for (var si = 0; si < 3; si++) {
                    for (var sj = 0; sj < 3; sj++) {
                        var sx = px + ts * 0.2 + si * ts * 0.25;
                        var sy = py + ts * 0.2 + sj * ts * 0.25;
                        ctx.beginPath();
                        ctx.moveTo(sx, sy + spikeSize);
                        ctx.lineTo(sx + spikeSize * 0.5, sy);
                        ctx.lineTo(sx + spikeSize, sy + spikeSize);
                        ctx.fill();
                    }
                }
            } else if (o.id === 'chill_water') {
                var chillC = (Math.floor(this.animFrame / 35) % 2 === 0) ? '#4488cc' : '#66aaee';
                ctx.fillStyle = chillC;
                ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                ctx.fillStyle = 'rgba(136, 221, 255, 0.4)';
                var cwave = Math.sin(this.animFrame * 0.07 + o.x) * 2;
                ctx.fillRect(px + 4, py + ts * 0.4 + cwave, ts - 8, 2);
                ctx.fillStyle = '#aaddff';
                ctx.fillRect(px + ts * 0.3, py + ts * 0.6, ts * 0.15, ts * 0.1);
                ctx.fillRect(px + ts * 0.55, py + ts * 0.3, ts * 0.12, ts * 0.08);
            } else if (o.id === 'swamp_pool') {
                ctx.fillStyle = '#223311';
                ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                var swampC = (Math.floor(this.animFrame / 50) % 2 === 0) ? '#335522' : '#446633';
                ctx.fillStyle = swampC;
                ctx.fillRect(px + 3, py + 3, ts - 6, ts - 6);
                ctx.fillStyle = 'rgba(100, 180, 60, 0.3)';
                var bubX = px + ts * 0.3 + Math.sin(this.animFrame * 0.04 + o.y) * ts * 0.15;
                var bubY = py + ts * 0.5 + Math.cos(this.animFrame * 0.06 + o.x) * ts * 0.1;
                ctx.beginPath();
                ctx.arc(bubX, bubY, ts * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    drawAnimations: function(ctx, ts) {
        for (var i = 0; i < State.animations.length; i++) {
            var a = State.animations[i];
            var progress = 1 - (a.life / a.maxLife);

            if (a.type === 'flash') {
                var alpha = 0.7 * (1 - progress);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = a.color;
                for (var j = 0; j < a.tiles.length; j++) {
                    var t = a.tiles[j];
                    ctx.fillRect(t.x * ts + 2, t.y * ts + 2, ts - 4, ts - 4);
                }
                ctx.globalAlpha = 1;
            }

            if (a.type === 'slash') {
                var sx = a.fromX * ts + ts / 2;
                var sy = a.fromY * ts + ts / 2;
                var ex = a.toX * ts + ts / 2;
                var ey = a.toY * ts + ts / 2;
                var midX = (sx + ex) / 2 + (ey - sy) * 0.3;
                var midY = (sy + ey) / 2 - (ex - sx) * 0.3;
                var alpha = 0.9 * (1 - progress);
                var spread = progress * ts * 0.4;

                ctx.globalAlpha = alpha;
                ctx.strokeStyle = a.color;
                ctx.lineWidth = Math.max(2, ts * 0.08);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(midX, midY, ex, ey);
                ctx.stroke();

                var headX = sx + (ex - sx) * Math.min(1, progress * 1.5);
                var headY = sy + (ey - sy) * Math.min(1, progress * 1.5);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(headX, headY, ts * 0.12, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            if (a.type === 'projectile') {
                var sx = a.fromX * ts + ts / 2;
                var sy = a.fromY * ts + ts / 2;
                var ex = a.toX * ts + ts / 2;
                var ey = a.toY * ts + ts / 2;
                var px = sx + (ex - sx) * progress;
                var py = sy + (ey - sy) * progress;

                ctx.globalAlpha = 0.4;
                ctx.strokeStyle = a.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.globalAlpha = 1;
                ctx.fillStyle = a.color;
                ctx.beginPath();
                ctx.arc(px, py, ts * 0.18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, py, ts * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }

            if (a.type === 'beam') {
                var sx = a.fromX * ts + ts / 2;
                var sy = a.fromY * ts + ts / 2;
                var ex = a.toX * ts + ts / 2;
                var ey = a.toY * ts + ts / 2;
                var alpha = 0.8 * (1 - progress);

                ctx.globalAlpha = alpha * 0.3;
                ctx.strokeStyle = a.color;
                ctx.lineWidth = ts * 0.4;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();

                ctx.globalAlpha = alpha;
                ctx.lineWidth = Math.max(2, ts * 0.06);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    },

    drawBurnTiles: function(ctx, ts) {
        for (var i = 0; i < State.burnTiles.length; i++) {
            var b = State.burnTiles[i];
            var px = b.x * ts;
            var py = b.y * ts;
            var flicker = 0.3 + Math.sin(this.animFrame * 0.15 + i) * 0.15;
            ctx.fillStyle = 'rgba(255, 100, 0, ' + flicker + ')';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        }
    },

    drawPoisonTiles: function(ctx, ts) {
        for (var i = 0; i < State.poisonTiles.length; i++) {
            var p = State.poisonTiles[i];
            var px = p.x * ts;
            var py = p.y * ts;
            var flicker = 0.25 + Math.sin(this.animFrame * 0.12 + i * 1.5) * 0.15;
            ctx.fillStyle = 'rgba(68, 204, 68, ' + flicker + ')';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
        }
    },

    drawRangeIndicator: function(ctx, ts) {
        if (State.phase !== 'player' || State.isMoveMode()) return;
        var skill = State.getSelectedSkill();
        if (!skill || skill.range <= 0) return;

        var range = skill.range;
        var px = State.player.x;
        var py = State.player.y;
        var pulse = 0.06 + Math.sin(this.animFrame * 0.06) * 0.02;

        for (var dy = -range; dy <= range; dy++) {
            for (var dx = -range; dx <= range; dx++) {
                if (Math.abs(dx) + Math.abs(dy) === 0) continue;
                if (Math.abs(dx) + Math.abs(dy) > range) continue;
                var tx = px + dx;
                var ty = py + dy;
                if (tx < 0 || tx >= Data.GRID_SIZE || ty < 0 || ty >= Data.GRID_SIZE) continue;
                ctx.fillStyle = 'rgba(255, 255, 150, ' + pulse + ')';
                ctx.fillRect(tx * ts + 2, ty * ts + 2, ts - 4, ts - 4);
            }
        }
    },

    drawMoveIndicators: function(ctx, ts) {
        if (State.phase !== 'player') return;
        var dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        var pulse = 0.4 + Math.sin(this.animFrame * 0.08) * 0.15;

        for (var i = 0; i < dirs.length; i++) {
            var nx = State.player.x + dirs[i].x;
            var ny = State.player.y + dirs[i].y;

            if (nx < 0 || nx >= Data.GRID_SIZE || ny < 0 || ny >= Data.GRID_SIZE) continue;
            if (State.isBlocked(nx, ny)) continue;
            if (State.getEnemyAt(nx, ny)) continue;

            var px = nx * ts;
            var py = ny * ts;
            var cx = px + ts / 2;
            var cy = py + ts / 2;
            var arrowSize = ts * 0.18;

            ctx.fillStyle = 'rgba(100, 200, 255, ' + pulse + ')';
            ctx.beginPath();
            if (dirs[i].x === 1) {
                ctx.moveTo(cx + arrowSize, cy);
                ctx.lineTo(cx - arrowSize * 0.5, cy - arrowSize);
                ctx.lineTo(cx - arrowSize * 0.5, cy + arrowSize);
            } else if (dirs[i].x === -1) {
                ctx.moveTo(cx - arrowSize, cy);
                ctx.lineTo(cx + arrowSize * 0.5, cy - arrowSize);
                ctx.lineTo(cx + arrowSize * 0.5, cy + arrowSize);
            } else if (dirs[i].y === 1) {
                ctx.moveTo(cx, cy + arrowSize);
                ctx.lineTo(cx - arrowSize, cy - arrowSize * 0.5);
                ctx.lineTo(cx + arrowSize, cy - arrowSize * 0.5);
            } else if (dirs[i].y === -1) {
                ctx.moveTo(cx, cy - arrowSize);
                ctx.lineTo(cx - arrowSize, cy + arrowSize * 0.5);
                ctx.lineTo(cx + arrowSize, cy + arrowSize * 0.5);
            }
            ctx.fill();
        }
    },

    drawAttackPreview: function(ctx, ts) {
        for (var i = 0; i < State.attackPreview.length; i++) {
            var t = State.attackPreview[i];
            ctx.fillStyle = Data.COLORS.tileAttack;
            ctx.fillRect(t.x * ts + 2, t.y * ts + 2, ts - 4, ts - 4);
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(t.x * ts + 2, t.y * ts + 2, ts - 4, ts - 4);
        }
    },

    drawPlayer: function(ctx, ts) {
        var px = State.player.x * ts;
        var py = State.player.y * ts;
        var bounce = Math.sin(this.animFrame * 0.06) * 2;
        var cls = Data.CLASSES[State.player.classId];
        var bodyColor = cls ? cls.spriteBody : Data.COLORS.playerBody;
        var headColor = cls ? cls.spriteHead : Data.COLORS.playerHead;
        var armColor = cls ? cls.spriteArms : '#3366cc';

        ctx.fillStyle = bodyColor;
        ctx.fillRect(px + ts * 0.2, py + ts * 0.3 + bounce, ts * 0.6, ts * 0.6);

        ctx.fillStyle = headColor;
        ctx.fillRect(px + ts * 0.25, py + ts * 0.1 + bounce, ts * 0.5, ts * 0.3);

        ctx.fillStyle = Data.COLORS.playerEyes;
        ctx.fillRect(px + ts * 0.32, py + ts * 0.18 + bounce, ts * 0.08, ts * 0.08);
        ctx.fillRect(px + ts * 0.55, py + ts * 0.18 + bounce, ts * 0.08, ts * 0.08);

        ctx.fillStyle = armColor;
        ctx.fillRect(px + ts * 0.15, py + ts * 0.4 + bounce, ts * 0.15, ts * 0.4);
        ctx.fillRect(px + ts * 0.7, py + ts * 0.4 + bounce, ts * 0.15, ts * 0.4);

        if (State.player.chilled > 0) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.35)';
            ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
        }
    },

    drawEnemies: function(ctx, ts) {
        for (var i = 0; i < State.enemies.length; i++) {
            var e = State.enemies[i];
            if (e.hp <= 0) continue;
            var px = e.x * ts;
            var py = e.y * ts;
            var bounce = Math.sin(this.animFrame * 0.05 + i * 2) * 1.5;
            var size = e.size || 1;

            if (e.isBoss) {
                this.drawBoss(ctx, px, py, ts, e, bounce);
            } else {
                this.drawEnemy(ctx, px, py, ts, e, bounce);
            }
        }
    },

    drawEnemy: function(ctx, px, py, ts, e, bounce) {
        var def = Data.ENEMIES[e.defId];
        if (!def) return;
        var color = def.color;

        ctx.fillStyle = color;
        ctx.fillRect(px + ts * 0.2, py + ts * 0.3 + bounce, ts * 0.6, ts * 0.6);

        ctx.fillStyle = this.lightenColor(color, 30);
        ctx.fillRect(px + ts * 0.25, py + ts * 0.15 + bounce, ts * 0.5, ts * 0.25);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(px + ts * 0.33, py + ts * 0.22 + bounce, ts * 0.08, ts * 0.06);
        ctx.fillRect(px + ts * 0.55, py + ts * 0.22 + bounce, ts * 0.08, ts * 0.06);

        if (e.frozen > 0) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
            ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
        }

        if (e.isElite) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 4, py + 4, ts - 8, ts - 8);
        }

        if (e.isElite && e.eliteTelegraphing) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
            var eliteTeleText = 'NEXT: ' + e.eliteTelegraphName;
            ctx.fillStyle = '#ff4444';
            ctx.font = Math.max(6, Math.floor(ts * 0.18)) + 'px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(eliteTeleText, px + ts / 2, py - ts * 0.5);

            if (e.eliteTelegraphTiles && e.eliteTelegraphTiles.length > 0) {
                for (var t = 0; t < e.eliteTelegraphTiles.length; t++) {
                    var tile = e.eliteTelegraphTiles[t];
                    var tilePx = tile.x * ts;
                    var tilePy = tile.y * ts;
                    ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
                    ctx.fillRect(tilePx + 2, tilePy + 2, ts - 4, ts - 4);
                    ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tilePx + 2, tilePy + 2, ts - 4, ts - 4);
                }
            }
        }

        if (State.player.diseased && e.defId === 'plaguebearer') {
            ctx.strokeStyle = '#aacc22';
            ctx.lineWidth = 2;
            var range3x3 = ts * 3;
            var offsetX3 = px - ts;
            var offsetY3 = py - ts;
            ctx.strokeRect(offsetX3 + 2, offsetY3 + 2, range3x3 - 4, range3x3 - 4);
            ctx.fillStyle = 'rgba(170, 204, 34, 0.08)';
            ctx.fillRect(offsetX3 + 2, offsetY3 + 2, range3x3 - 4, range3x3 - 4);
        }
        if (State.player.cursed && e.defId === 'mummy') {
            ctx.strokeStyle = '#cc44ff';
            ctx.lineWidth = 2;
            var range3x3m = ts * 3;
            var offsetX3m = px - ts;
            var offsetY3m = py - ts;
            ctx.strokeRect(offsetX3m + 2, offsetY3m + 2, range3x3m - 4, range3x3m - 4);
            ctx.fillStyle = 'rgba(204, 68, 255, 0.08)';
            ctx.fillRect(offsetX3m + 2, offsetY3m + 2, range3x3m - 4, range3x3m - 4);
        }
    },

    drawBoss: function(ctx, px, py, ts, e, bounce) {
        var color = e.color;
        var size = e.size || 2;
        var bossW = ts * size;
        var bossH = ts * size;
        var scale = 1.1 + Math.sin(this.animFrame * 0.03) * 0.05;
        var w = bossW * scale;
        var h = bossH * scale;
        var ox = (bossW - w) / 2;
        var oy = (bossH - h) / 2;

        ctx.fillStyle = color;
        ctx.fillRect(px + ox + 2, py + oy + bounce, w - 4, h - 4);

        ctx.fillStyle = this.lightenColor(color, 40);
        ctx.fillRect(px + ox + 4, py + oy + 2 + bounce, w - 8, h * 0.3);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(px + ox + w * 0.25, py + oy + h * 0.15 + bounce, w * 0.12, h * 0.1);
        ctx.fillRect(px + ox + w * 0.6, py + oy + h * 0.15 + bounce, w * 0.12, h * 0.1);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + ox + w * 0.28, py + oy + h * 0.17 + bounce, w * 0.06, h * 0.06);
        ctx.fillRect(px + ox + w * 0.63, py + oy + h * 0.17 + bounce, w * 0.06, h * 0.06);

        if (e.telegraph) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(px + 2, py + 2, bossW - 4, bossH - 4);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, bossW - 4, bossH - 4);

            var teleText = 'NEXT: ' + e.telegraph.name;
            ctx.fillStyle = '#ffff00';
            ctx.font = Math.floor(ts * 0.18) + 'px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(teleText, px + bossW / 2, py - 40);
        }

        if (e.telegraphTiles && e.telegraphTiles.length > 0) {
            for (var t = 0; t < e.telegraphTiles.length; t++) {
                var tile = e.telegraphTiles[t];
                var tilePx = tile.x * ts;
                var tilePy = tile.y * ts;
                ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
                ctx.fillRect(tilePx + 2, tilePy + 2, ts - 4, ts - 4);
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(tilePx + 2, tilePy + 2, ts - 4, ts - 4);
            }
        }
    },

    drawHealthBar: function(ctx, x, y, ts, current, max, color) {
        var barW = ts;
        var barH = 5;
        var pct = Math.max(0, current / max);
        var barY = Math.max(0, y);

        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(x, barY, barW, barH);

        ctx.fillStyle = color;
        ctx.fillRect(x, barY, barW * pct, barH);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, barY, barW, barH);
    },

    drawHealthBars: function(ctx, ts) {
        this.drawHealthBar(ctx, State.player.x * ts, State.player.y * ts - 6, ts, State.player.hp, State.player.maxHp, '#ff3344');
        for (var i = 0; i < State.enemies.length; i++) {
            var e = State.enemies[i];
            if (e.hp <= 0) continue;
            var size = e.size || 1;
            var barOffset = e.isBoss ? 14 : 6;
            this.drawHealthBar(ctx, e.x * ts, e.y * ts - barOffset, ts * size, e.hp, e.maxHp, '#ff3344');
        }
    },

    drawNames: function(ctx, ts) {
        var fontSize = Math.max(6, Math.floor(ts * 0.18));
        ctx.font = fontSize + 'px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        var nameY = Math.max(fontSize + 2, State.player.y * ts - 8);
        var cls = Data.CLASSES[State.player.classId];
        ctx.fillStyle = cls ? cls.color : '#ffffff';
        ctx.fillText(cls ? cls.name : 'PLAYER', State.player.x * ts + ts / 2, nameY);

        for (var i = 0; i < State.enemies.length; i++) {
            var e = State.enemies[i];
            if (e.hp <= 0) continue;
            var def = e.isBoss ? null : Data.ENEMIES[e.defId];
            var name = e.isBoss ? e.name : (def ? def.name : '');
            if (e.isElite) name = 'Elite ' + name;
            if (!name) continue;

            var barOffset = e.isBoss ? 16 : 8;
            var eNameY = Math.max(fontSize + 2, e.y * ts - barOffset);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(name, e.x * ts + ts / 2, eNameY);
        }
    },

    drawFloatingTexts: function(ctx, ts) {
        var canvasW = this.canvas.width;
        var canvasH = this.canvas.height;
        for (var i = 0; i < State.floatingTexts.length; i++) {
            var ft = State.floatingTexts[i];
            var lifeRatio = ft.life / ft.maxLife;
            var alpha = lifeRatio * lifeRatio;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold ' + Math.floor(ts * 0.28) + 'px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var drawX = Math.max(ts * 0.5, Math.min(canvasW - ts * 0.5, ft.x * ts + ts / 2));
            var drawY = Math.max(ts * 0.3, Math.min(canvasH - ts * 0.3, ft.y * ts + ts / 2));
            ctx.fillText(ft.text, drawX, drawY);
            ctx.globalAlpha = 1;
        }
    },

    lightenColor: function(hex, percent) {
        var num = parseInt(hex.slice(1), 16);
        var r = Math.max(0, Math.min(255, (num >> 16) + percent));
        var g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + percent));
        var b = Math.max(0, Math.min(255, (num & 0x0000FF) + percent));
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    },

    getDirection: function(fromX, fromY, toX, toY) {
        var dx = toX - fromX;
        var dy = toY - fromY;
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        }
        return dy > 0 ? 'down' : 'up';
    }
};
