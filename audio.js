'use strict';

const WINNING_SCORE = 6;
const PEER_PREFIX = 'goodorbad-';
const PLAYER_COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#20c997','#ff6b9d'];

// ===================== AUDIO ENGINE =====================
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicGain = null;
        this.musicPlaying = false;
        this.musicTimer = null;
        this.musicBeat = 0;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 1;
        return this.muted;
    }

    playTone(freq, type, duration, volume, delay) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + (delay || 0);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume || 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    playSweep(startFreq, endFreq, duration, type, volume) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
        gain.gain.setValueAtTime(volume || 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    playNoise(duration, volume) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume || 0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }

    sfxCountdown() { this.playTone(600, 'sine', 0.08, 0.2); }

    sfxReveal() {
        this.playSweep(200, 1200, 0.4, 'sine', 0.2);
        this.playSweep(300, 1500, 0.4, 'sine', 0.08);
    }

    sfxGrab() { this.playNoise(0.08, 0.25); }

    sfxGood() {
        this.playTone(523, 'sine', 0.2, 0.2, 0);
        this.playTone(659, 'sine', 0.2, 0.2, 0.12);
        this.playTone(784, 'sine', 0.3, 0.2, 0.24);
    }

    sfxBad() {
        this.playTone(100, 'sawtooth', 0.4, 0.15);
        this.playTone(113, 'sawtooth', 0.4, 0.12);
    }

    sfxWin() {
        this.playTone(262, 'triangle', 0.2, 0.2, 0);
        this.playTone(330, 'triangle', 0.2, 0.2, 0.15);
        this.playTone(392, 'triangle', 0.2, 0.2, 0.3);
        this.playTone(523, 'triangle', 0.5, 0.25, 0.45);
    }

    sfxJoin() {
        this.playTone(523, 'sine', 0.1, 0.15, 0);
        this.playTone(659, 'sine', 0.15, 0.15, 0.1);
    }

    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.12;
        this.musicGain.connect(this.masterGain);
        this.musicBeat = 0;
        const bpm = 110;
        const beatTime = 60 / bpm;
        let nextTime = this.ctx.currentTime + 0.1;
        const bassNotes = [130.81, 196.00, 220.00, 174.61];
        const melodyNotes = [0, 523, 0, 659, 0, 587, 0, 0, 0, 392, 0, 440, 0, 523, 0, 0];
        const schedule = () => {
            if (!this.musicPlaying) return;
            while (nextTime < this.ctx.currentTime + 0.2) {
                const bar = Math.floor(this.musicBeat / 8) % 4;
                const pos = this.musicBeat % 8;
                // bass on beat 0 and 4
                if (pos === 0 || pos === 4) {
                    const osc = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = bassNotes[bar];
                    g.gain.setValueAtTime(0.3, nextTime);
                    g.gain.exponentialRampToValueAtTime(0.001, nextTime + beatTime * 1.8);
                    osc.connect(g); g.connect(this.musicGain);
                    osc.start(nextTime); osc.stop(nextTime + beatTime * 2);
                }
                // hihat on every beat
                const bufLen = Math.floor(this.ctx.sampleRate * 0.03);
                const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
                const ns = this.ctx.createBufferSource();
                ns.buffer = buf;
                const ng = this.ctx.createGain();
                const vol = (pos % 2 === 0) ? 0.15 : 0.07;
                ng.gain.setValueAtTime(vol, nextTime);
                ng.gain.exponentialRampToValueAtTime(0.001, nextTime + 0.03);
                const filt = this.ctx.createBiquadFilter();
                filt.type = 'highpass'; filt.frequency.value = 8000;
                ns.connect(filt); filt.connect(ng); ng.connect(this.musicGain);
                ns.start(nextTime);
                // melody
                const mIdx = this.musicBeat % 16;
                if (melodyNotes[mIdx] > 0) {
                    const mo = this.ctx.createOscillator();
                    const mg = this.ctx.createGain();
                    mo.type = 'triangle';
                    mo.frequency.value = melodyNotes[mIdx];
                    mg.gain.setValueAtTime(0.08, nextTime);
                    mg.gain.exponentialRampToValueAtTime(0.001, nextTime + beatTime * 1.5);
                    mo.connect(mg); mg.connect(this.musicGain);
                    mo.start(nextTime); mo.stop(nextTime + beatTime * 2);
                }
                nextTime += beatTime / 2;
                this.musicBeat++;
            }
            this.musicTimer = setTimeout(schedule, 50);
        };
        schedule();
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
    }
}
