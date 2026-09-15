/**
 * Realistic Steampunk Web Audio API Synthesizer
 * Procedural generation for mechanical sounds, deep submarine hull drone,
 * water spray leaks, oxygen regulator breathing, acoustic steam exhausts,
 * metallic footsteps, and sonar radar pings.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.waterLeakGain = null;
        this.lastFootstepTime = 0;
        this.ambientPlaying = false;
        this.waterLeakPlaying = false;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.55;
        this.masterGain.connect(this.ctx.destination);

        this.startRealisticSubmarineDrone();
        this.startWaterLeakAmbience();
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.ambientPlaying) {
            this.startRealisticSubmarineDrone();
        }
        if (!this.waterLeakPlaying) {
            this.startWaterLeakAmbience();
        }
    }

    // Continuous deep submarine station rumble
    startRealisticSubmarineDrone() {
        if (!this.ctx || this.ambientPlaying) return;
        this.ambientPlaying = true;
        const now = this.ctx.currentTime;

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.08, now);
        this.ambientGain.connect(this.masterGain);

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(52, now);

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(36, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.ambientGain);

        osc1.start(now);
        osc2.start(now);
    }

    // Continuous pressurized water leak / spraying pipe ambiance
    startWaterLeakAmbience() {
        if (!this.ctx || this.waterLeakPlaying) return;
        this.waterLeakPlaying = true;

        // Create 2-second looped noise buffer for water rushing
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 2.0;

        this.waterLeakGain = this.ctx.createGain();
        this.waterLeakGain.gain.value = 0.09;

        noise.connect(filter);
        filter.connect(this.waterLeakGain);
        this.waterLeakGain.connect(this.masterGain);

        noise.start();
    }

    // Oxygen Regulator Inhale / Replenish Sound
    playOxygenInhale() {
        this.ensureContext();
        const now = this.ctx.currentTime;

        // Scuba hiss / air regulator sound
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.8);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
    }

    // Low Oxygen Warning Pulse
    playOxygenLowAlarm() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    // Timer Tick
    playTimerTick() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.02);
    }

    // Deep Submarine Sonar Radar Ping with acoustic reverb
    playSonarPing() {
        this.ensureContext();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.22);
        osc.frequency.exponentialRampToValueAtTime(230, now + 1.8);

        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 2.2);
    }

    // Pressurized Steam Hiss / Pipe Venting
    playSteamHiss(duration = 0.65, intensity = 0.28) {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1300, now);
        filter.Q.setValueAtTime(1.8, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(intensity, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
    }

    // Heavy Brass Diver Footstep
    playFootstep(mode = 'walk') {
        this.ensureContext();
        const now = this.ctx.currentTime;
        if (now - this.lastFootstepTime < (mode === 'sprint' ? 0.22 : mode === 'sneak' ? 0.5 : 0.35)) return;
        this.lastFootstepTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        const baseFreq = mode === 'sneak' ? 75 : mode === 'sprint' ? 150 : 115;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.14);

        filter.type = 'lowpass';
        filter.frequency.value = mode === 'sneak' ? 180 : 850;

        const vol = mode === 'sneak' ? 0.07 : mode === 'sprint' ? 0.38 : 0.22;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.14);

        if (mode === 'sprint') {
            this.playSteamHiss(0.12, 0.09);
        }
    }

    playGearClick() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(950 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playValveTurn() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(490, now + 0.16);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.19);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.19);
    }

    playGaugeSuccess() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.16, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.45);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.45);
        });
    }

    playAlarmKlaxon() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.36);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.36);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    playOctopusRoar() {
        this.ensureContext();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(115, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.85);

        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.95);

        this.playSteamHiss(0.85, 0.45);
    }

    playPickup() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(460, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.16);

        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playDamage() {
        this.ensureContext();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.28);
    }

    playHatchRelease() {
        this.ensureContext();
        const now = this.ctx.currentTime;

        const clunk = this.ctx.createOscillator();
        const clunkGain = this.ctx.createGain();
        clunk.type = 'square';
        clunk.frequency.setValueAtTime(95, now);
        clunk.frequency.exponentialRampToValueAtTime(18, now + 0.55);
        clunkGain.gain.setValueAtTime(0.45, now);
        clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        clunk.connect(clunkGain);
        clunkGain.connect(this.masterGain);
        clunk.start(now);
        clunk.stop(now + 0.65);

        this.playSteamHiss(2.0, 0.55);

        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.18, now + 0.6 + idx * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, now + 1.8 + idx * 0.1);
            o.connect(g);
            g.connect(this.masterGain);
            o.start(now + 0.6 + idx * 0.12);
            o.stop(now + 2.5);
        });
    }
}

const sounds = new SoundEngine();
