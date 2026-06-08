var Grid = {
    canvas: null,
    ctx: null,
    tileSize: 0,
    offsetX: 0,
    offsetY: 0,
    animFrame: 0,

    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
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
        this.animFrame++;

        ctx.fillStyle = Data.COLORS.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawTiles(ctx, ts);
        this.drawObstacles(ctx, ts);
        this.drawBurnTiles(ctx, ts);
        this.drawMoveIndicators(ctx, ts);
        this.drawAttackPreview(ctx, ts);
        this.drawEnemies(ctx, ts);
        this.drawPlayer(ctx, ts);
        this.drawFloatingTexts(ctx, ts);
    },

    drawTiles: function(ctx, ts) {
        for (var y = 0; y < Data.GRID_SIZE; y++) {
            for (var x = 0; x < Data.GRID_SIZE; x++) {
                ctx.fillStyle = Data.COLORS.tileBase;
                ctx.fillRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
                ctx.strokeStyle = Data.COLORS.tileBorder;
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
                ctx.fillStyle = '#886644';
                ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
                ctx.fillStyle = '#775533';
                ctx.fillRect(px + 4, py + 4, ts - 8, ts/3);
                var hpPct = o.hp / 15;
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

        ctx.fillStyle = Data.COLORS.playerBody;
        ctx.fillRect(px + ts * 0.2, py + ts * 0.3 + bounce, ts * 0.6, ts * 0.6);

        ctx.fillStyle = Data.COLORS.playerHead;
        ctx.fillRect(px + ts * 0.25, py + ts * 0.1 + bounce, ts * 0.5, ts * 0.3);

        ctx.fillStyle = Data.COLORS.playerEyes;
        ctx.fillRect(px + ts * 0.32, py + ts * 0.18 + bounce, ts * 0.08, ts * 0.08);
        ctx.fillRect(px + ts * 0.55, py + ts * 0.18 + bounce, ts * 0.08, ts * 0.08);

        ctx.fillStyle = '#3366cc';
        ctx.fillRect(px + ts * 0.15, py + ts * 0.4 + bounce, ts * 0.15, ts * 0.4);
        ctx.fillRect(px + ts * 0.7, py + ts * 0.4 + bounce, ts * 0.15, ts * 0.4);

        this.drawHealthBar(ctx, px, py - 6, ts, State.player.hp, State.player.maxHp, '#ff3344');
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
                this.drawHealthBar(ctx, px, py - 8, ts * size, e.hp, e.maxHp, '#ff3344');
            } else {
                this.drawEnemy(ctx, px, py, ts, e, bounce);
                this.drawHealthBar(ctx, px, py - 6, ts, e.hp, e.maxHp, '#ff3344');
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

        if (e.name) {
            ctx.fillStyle = '#ff4466';
            ctx.font = Math.floor(ts * 0.2) + 'px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(e.name, px + bossW / 2, py - 10);
        }

        if (e.telegraph) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(px + 2, py + 2, bossW - 4, bossH - 4);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, bossW - 4, bossH - 4);
        }
    },

    drawHealthBar: function(ctx, x, y, ts, current, max, color) {
        var barW = ts;
        var barH = 5;
        var pct = Math.max(0, current / max);

        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(x, y, barW, barH);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barW * pct, barH);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barW, barH);
    },

    drawFloatingTexts: function(ctx, ts) {
        for (var i = 0; i < State.floatingTexts.length; i++) {
            var ft = State.floatingTexts[i];
            var alpha = ft.life / ft.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = Math.floor(ts * 0.25) + 'px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x * ts + ts / 2, ft.y * ts + ts / 2);
            ctx.globalAlpha = 1;
        }
    },

    lightenColor: function(hex, percent) {
        var num = parseInt(hex.slice(1), 16);
        var r = Math.min(255, (num >> 16) + percent);
        var g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
        var b = Math.min(255, (num & 0x0000FF) + percent);
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
