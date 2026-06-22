var AudioMgr = {
    _ctx: null,
    _bgmVolume: 0.3,
    _sfxVolume: 0.5,
    _currentBgm: null,
    _currentBgmId: null,
    _bgmElements: {},
    _fadeInterval: null,
    _menuBgmPending: false,

    init: function() {
        this._loadSettings();
        this._menuBgmPending = true;
        var self = this;
        self._boundResume = self._resumeOnInteraction.bind(self);
        document.addEventListener('click', self._boundResume);
        document.addEventListener('keydown', self._boundResume);
    },

    _resumeOnInteraction: function() {
        var self = this;
        if (self._menuBgmPending) {
            self._menuBgmPending = false;
            self.playMenuBgm();
        }
        if (self._boundResume) {
            document.removeEventListener('click', self._boundResume);
            document.removeEventListener('keydown', self._boundResume);
            self._boundResume = null;
        }
    },

    _getCtx: function() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        return this._ctx;
    },

    _loadSettings: function() {
        try {
            var saved = localStorage.getItem('gridlost_audio');
            if (saved) {
                var data = JSON.parse(saved);
                this._bgmVolume = data.bgm !== undefined ? data.bgm : 0.3;
                this._sfxVolume = data.sfx !== undefined ? data.sfx : 0.5;
            }
        } catch(e) {}
    },

    _saveSettings: function() {
        try {
            localStorage.setItem('gridlost_audio', JSON.stringify({
                bgm: this._bgmVolume,
                sfx: this._sfxVolume
            }));
        } catch(e) {}
    },

    setBgmVolume: function(v) {
        this._bgmVolume = Math.max(0, Math.min(1, v));
        if (this._currentBgm) {
            this._currentBgm.volume = this._bgmVolume;
        }
        this._saveSettings();
    },

    setSfxVolume: function(v) {
        this._sfxVolume = Math.max(0, Math.min(1, v));
        this._saveSettings();
    },

    getBgmVolume: function() { return this._bgmVolume; },
    getSfxVolume: function() { return this._sfxVolume; },

    playBgm: function(trackId) {
        var self = this;
        if (this._currentBgmId === trackId && this._currentBgm && !this._currentBgm.paused) return;
        this._fadeBgmOut(function() {
            self.stopBgm();
            if (!self._bgmElements[trackId]) {
                self._bgmElements[trackId] = new window.Audio('audio/' + trackId + '.mp3');
                self._bgmElements[trackId].loop = true;
            }
            var track = self._bgmElements[trackId];
            track.volume = 0;
            track.currentTime = 0;
            track.play().then(function() {
                self._fadeBgmIn(track);
            }).catch(function() {});
            self._currentBgm = track;
            self._currentBgmId = trackId;
        });
    },

    _fadeBgmOut: function(callback) {
        var self = this;
        if (!this._currentBgm || this._currentBgm.paused) {
            if (callback) callback();
            return;
        }
        var track = this._currentBgm;
        var steps = 10;
        var stepDur = 30;
        var startVol = track.volume;
        var i = 0;
        if (this._fadeInterval) clearInterval(this._fadeInterval);
        this._fadeInterval = setInterval(function() {
            i++;
            track.volume = Math.max(0, startVol * (1 - i / steps));
            if (i >= steps) {
                clearInterval(self._fadeInterval);
                self._fadeInterval = null;
                track.volume = 0;
                if (callback) callback();
            }
        }, stepDur);
    },

    _fadeBgmIn: function(track) {
        var self = this;
        var steps = 15;
        var stepDur = 40;
        var targetVol = this._bgmVolume;
        var i = 0;
        if (this._fadeInterval) clearInterval(this._fadeInterval);
        this._fadeInterval = setInterval(function() {
            i++;
            track.volume = Math.min(targetVol, targetVol * (i / steps));
            if (i >= steps) {
                clearInterval(self._fadeInterval);
                self._fadeInterval = null;
                track.volume = targetVol;
            }
        }, stepDur);
    },

    stopBgm: function() {
        if (this._fadeInterval) {
            clearInterval(this._fadeInterval);
            this._fadeInterval = null;
        }
        if (this._currentBgm) {
            this._currentBgm.pause();
            this._currentBgm.currentTime = 0;
        }
        if (this._currentBgmId) {
            delete this._bgmElements[this._currentBgmId];
        }
        this._currentBgm = null;
        this._currentBgmId = null;
    },

    playBgmForBiome: function(biomeId) {
        this.playBgm('biome_' + biomeId);
    },

    playBgmForBoss: function(bossDefId) {
        var early = { overseer: 1, mud_colossus: 1, greatwood_titan: 1, bandit_gang: 1 };
        this.playBgm('boss_' + (early[bossDefId] ? '1' : '2'));
    },

    playMenuBgm: function() {
        this.playBgm('biome_limbo');
    },

    sfx: function(type) {
        if (this._sfxVolume <= 0) return;
        try {
            var ctx = this._getCtx();
            var vol = this._sfxVolume;

            switch(type) {
                case 'hit': this._sfxHit(ctx, vol); break;
                case 'crit': this._sfxCrit(ctx, vol); break;
                case 'magic': this._sfxMagic(ctx, vol); break;
                case 'ranged': this._sfxRanged(ctx, vol); break;
                case 'heal': this._sfxHeal(ctx, vol); break;
                case 'buff': this._sfxBuff(ctx, vol); break;
                case 'debuff': this._sfxDebuff(ctx, vol); break;
                case 'death': this._sfxDeath(ctx, vol); break;
                case 'death_player': this._sfxDeathPlayer(ctx, vol); break;
                case 'levelup': this._sfxLevelup(ctx, vol); break;
                case 'pickup': this._sfxPickup(ctx, vol); break;
                case 'telegraph': this._sfxTelegraph(ctx, vol); break;
                case 'boss_special': this._sfxBossSpecial(ctx, vol); break;
                case 'phase_change': this._sfxPhaseChange(ctx, vol); break;
                case 'spike': this._sfxSpike(ctx, vol); break;
                case 'lava': this._sfxLava(ctx, vol); break;
                case 'freeze': this._sfxFreeze(ctx, vol); break;
                case 'guard': this._sfxGuard(ctx, vol); break;
                case 'dodge': this._sfxDodge(ctx, vol); break;
                case 'click': this._sfxClick(ctx, vol); break;
            }
        } catch(e) {}
    },

    _makeOsc: function(ctx, type, freq, vol, dur) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur);
    },

    _makeNoise: function(ctx, vol, dur) {
        var bufferSize = ctx.sampleRate * dur;
        var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        var source = ctx.createBufferSource();
        source.buffer = buffer;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
    },

    _sfxHit: function(ctx, vol) {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
        gain.gain.setValueAtTime(vol * 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.1);
        this._makeNoise(ctx, vol * 0.8, 0.06);
    },

    _sfxCrit: function(ctx, vol) {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        gain.gain.setValueAtTime(vol * 0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.15);
        this._makeNoise(ctx, vol, 0.08);
        this._makeOsc(ctx, 'sine', 800, vol * 0.15, 0.1);
    },

    _sfxMagic: function(ctx, vol) {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
        gain.gain.setValueAtTime(vol * 0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.2);
        this._makeOsc(ctx, 'sine', 750, vol * 0.15, 0.18);
    },

    _sfxRanged: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeNoise(ctx, vol * 0.8, 0.05);
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.06);
        gain.gain.setValueAtTime(vol * 0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.07);
    },

    _sfxHeal: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 523, vol * 0.2, 0.2);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 659, vol * 0.2, 0.2);
        }, 80);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 784, vol * 0.2, 0.25);
        }, 160);
    },

    _sfxBuff: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 440, vol * 0.2, 0.15);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 660, vol * 0.2, 0.2);
        }, 100);
    },

    _sfxDebuff: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 440, vol * 0.2, 0.15);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 220, vol * 0.2, 0.2);
        }, 100);
    },

    _sfxDeath: function(ctx, vol) {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        gain.gain.setValueAtTime(vol * 0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.5);
        this._makeNoise(ctx, vol * 0.8, 0.3);
    },

    _sfxDeathPlayer: function(ctx, vol) {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.8);
        gain.gain.setValueAtTime(vol * 0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 1.0);
        this._makeNoise(ctx, vol, 0.6);
    },

    _sfxLevelup: function(ctx, vol) {
        var t = ctx.currentTime;
        var notes = [523, 659, 784, 1047];
        for (var i = 0; i < notes.length; i++) {
            (function(freq, delay) {
                setTimeout(function() {
                    AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', freq, vol * 0.2, 0.2);
                }, delay);
            })(notes[i], i * 100);
        }
    },

    _sfxPickup: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 880, vol * 0.18, 0.08);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 1320, vol * 0.18, 0.1);
        }, 60);
    },

    _sfxTelegraph: function(ctx, vol) {
        var t = ctx.currentTime;
        for (var i = 0; i < 3; i++) {
            (function(delay) {
                setTimeout(function() {
                    AudioMgr._makeOsc(AudioMgr._getCtx(), 'square', 800, vol * 0.15, 0.06);
                }, delay);
            })(i * 80);
        }
    },

    _sfxBossSpecial: function(ctx, vol) {
        var t = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.2);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.4);
        gain.gain.setValueAtTime(vol * 0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.5);
        this._makeNoise(ctx, vol * 0.8, 0.3);
    },

    _sfxPhaseChange: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 220, vol * 0.25, 0.3);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 330, vol * 0.25, 0.3);
        }, 150);
        setTimeout(function() {
            AudioMgr._makeOsc(AudioMgr._getCtx(), 'sine', 440, vol * 0.25, 0.4);
        }, 300);
        this._makeNoise(ctx, vol * 0.5, 0.4);
    },

    _sfxSpike: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeNoise(ctx, vol * 0.8, 0.04);
        this._makeOsc(ctx, 'sawtooth', 1200, vol * 0.15, 0.05);
    },

    _sfxLava: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeNoise(ctx, vol * 0.6, 0.15);
        this._makeOsc(ctx, 'sawtooth', 120, vol * 0.12, 0.2);
    },

    _sfxFreeze: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 2000, vol * 0.15, 0.15);
        this._makeOsc(ctx, 'sine', 1500, vol * 0.12, 0.12);
        this._makeNoise(ctx, vol * 0.3, 0.08);
    },

    _sfxGuard: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'triangle', 300, vol * 0.2, 0.15);
        this._makeOsc(ctx, 'triangle', 200, vol * 0.15, 0.2);
    },

    _sfxDodge: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 1200, vol * 0.15, 0.06);
    },

    _sfxClick: function(ctx, vol) {
        var t = ctx.currentTime;
        this._makeOsc(ctx, 'sine', 600, vol * 0.12, 0.04);
    }
};
