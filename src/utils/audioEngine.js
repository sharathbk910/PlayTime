// Procedural Web Audio API sound synthesizer for authentic temple & endless runner acoustics
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.droneGain = null;
    this.droneOscillators = [];
    this.isDronePlaying = false;
    this.beatInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.droneGain) {
      this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.018, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  // Resonant Temple Bell Chime
  playTempleBell(frequency = 528) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const harmonics = [
      { f: frequency, gain: 0.4, decay: 2.4 },
      { f: frequency * 2.01, gain: 0.28, decay: 1.9 },
      { f: frequency * 3.02, gain: 0.16, decay: 1.3 },
      { f: frequency * 4.18, gain: 0.09, decay: 0.8 },
      { f: frequency * 5.43, gain: 0.05, decay: 0.5 }
    ];

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.f, now);

      gain.gain.setValueAtTime(h.gain * 0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + h.decay + 0.1);
    });
  }

  // Sparkling celestial Modak pickup chime
  playModakPickup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  }

  // Runner: Swift jump whoosh (smooth sine sweep, no sub-bass thump)
  playJumpSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);

    gain.gain.setValueAtTime(0.10, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  // Runner: Quick slide swoop (light acoustic swoop, filtered above 220Hz)
  playSlideSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.20);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Runner: Obstacle collision (tuned resonant temple drum tap, zero sub-bass rattling)
  playCollisionSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.16);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(1.8, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.20);
  }

  // Runner: Divine Gate Extra Life / Revive Fanfare
  playReviveFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = [330, 440, 554, 660, 880]; // E, A, C#, E, A

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 1.2);
    });
  }

  // Sacred Conch Shell (Shankha) victory blast - tuned for midrange majesty without sub rumble
  playShankhaBlast() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(370, now + 0.4);
    osc.frequency.setValueAtTime(370, now + 1.1);
    osc.frequency.exponentialRampToValueAtTime(260, now + 1.8);

    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(220, now);

    const lpFilter = this.ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(700, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.3);
    gain.gain.setValueAtTime(0.14, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    osc.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.0);
  }

  // Celestial Gate / Puzzle Solve Success
  playDivineWisdomChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [440, 554.37, 659.25, 830.61]; // A, C#, E, G#

    chords.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.7);
    });
  }

  // Smooth Ambient Background Tanpura Drone (Tuned: High-pass filtered, zero heavy bass/vibrations)
  startAmbientDrone() {
    if (this.isDronePlaying || this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Master drone gain node (gentle, non-intrusive 0.018 level)
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.linearRampToValueAtTime(0.018, now + 1.5);
      this.droneGain.connect(this.ctx.destination);

      // High-pass filter at 200 Hz: Cuts out physical speaker vibration and sub-bass beating
      const hpFilter = this.ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.setValueAtTime(200, now);
      hpFilter.Q.setValueAtTime(0.7, now);

      // Gentle Low-pass filter at 1400 Hz: Softens harsh high-end digital sizzle
      const lpFilter = this.ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(1400, now);

      hpFilter.connect(lpFilter);
      lpFilter.connect(this.droneGain);

      // Authentic Tanpura harmonic voicing in mid-high register: Sa (277.18), Pa (415.30), Sa' (554.37), Pa' (830.61)
      const droneHarmonics = [
        { freq: 277.18, gainScale: 0.35 }, // C#4 (Sa)
        { freq: 415.30, gainScale: 0.28 }, // G#4 (Pa)
        { freq: 554.37, gainScale: 0.22 }, // C#5 (Sa')
        { freq: 830.61, gainScale: 0.12 }  // G#5 (Pa')
      ];

      this.droneOscillators = droneHarmonics.map(({ freq, gainScale }) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        oscGain.gain.setValueAtTime(gainScale, now);

        osc.connect(oscGain);
        oscGain.connect(hpFilter);

        osc.start(now);
        return osc;
      });

      this.isDronePlaying = true;
    } catch (e) {
      console.warn('Drone init note:', e);
    }
  }

  stopAmbientDrone() {
    if (!this.isDronePlaying) return;
    this.droneOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.droneOscillators = [];
    this.isDronePlaying = false;
  }
}

export const audioEngine = new AudioEngine();
