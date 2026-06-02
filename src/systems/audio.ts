/**
 * Procedural audio — all SFX and music are synthesised at runtime with the Web
 * Audio API. No sample assets.
 *
 * Browsers block audio until a user gesture, so call `unlock()` from the first
 * pointer/key event. Everything degrades gracefully if audio is unavailable.
 */

type Wave = OscillatorType;

interface ToneOpts {
  type?: Wave;
  freq: number;
  freqTo?: number; // pitch sweep target
  dur: number;
  vol?: number;
  attack?: number;
  dest?: AudioNode;
  detune?: number;
}

// 16-step note patterns per level. Numbers are semitone offsets from the root;
// null = rest. Music is intentionally simple and low in the mix.
interface MusicTrack {
  bpm: number;
  root: number; // root frequency (Hz)
  bass: (number | null)[];
  arp: (number | null)[];
  bassWave: Wave;
  arpWave: Wave;
}

const MINOR = [0, 3, 5, 7, 10, 12]; // a moody, arcade-friendly scale shape

const TRACKS: MusicTrack[] = [
  {
    bpm: 132,
    root: 110, // A2
    bass: [0, null, 0, null, 5, null, 5, null, 3, null, 3, null, 7, null, 7, 10],
    arp: [12, 15, 19, 15, 17, 20, 17, 15, 12, 15, 19, 22, 19, 17, 15, 12],
    bassWave: 'triangle',
    arpWave: 'square',
  },
  {
    bpm: 144,
    root: 98, // G2
    bass: [0, 0, 7, 0, 0, 0, 8, 7, 5, 5, 3, 5, 7, 7, 10, 12],
    arp: [12, 19, 17, 24, 15, 22, 19, 17, 12, 19, 17, 15, 19, 24, 22, 19],
    bassWave: 'sawtooth',
    arpWave: 'square',
  },
  {
    bpm: 156,
    root: 87, // F2
    bass: [0, 0, 0, 10, 8, 8, 7, 7, 5, 3, 5, 7, 8, 10, 11, 12],
    arp: [12, 15, 19, 22, 24, 22, 19, 15, 17, 20, 24, 27, 24, 20, 17, 12],
    bassWave: 'sawtooth',
    arpWave: 'triangle',
  },
];

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private noiseBuf!: AudioBuffer;
  private muted = false;
  private lastShotAt = 0;

  // Music scheduler state.
  private musicTimer: number | null = null;
  private currentStep = 0;
  private nextNoteTime = 0;
  private track: MusicTrack | null = null;

  /** Lazily create the context on first user gesture. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(ctx.destination);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = 0.85;
    this.sfxGain.connect(this.master);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(this.master);

    // Pre-bake one second of white noise for explosions/hits.
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx) this.master.gain.value = m ? 0 : 0.9;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private get now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  private tone(o: ToneOpts): void {
    if (!this.ctx) return;
    const t0 = this.now;
    const osc = this.ctx.createOscillator();
    osc.type = o.type ?? 'square';
    if (o.detune) osc.detune.value = o.detune;
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.freqTo && o.freqTo > 0) {
      osc.frequency.exponentialRampToValueAtTime(o.freqTo, t0 + o.dur);
    }
    const gain = this.ctx.createGain();
    const vol = o.vol ?? 0.2;
    const atk = o.attack ?? 0.005;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + atk);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(gain).connect(o.dest ?? this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.03);
  }

  private noise(dur: number, vol: number, type: BiquadFilterType, freq: number, q = 1): void {
    if (!this.ctx) return;
    const t0 = this.now;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, t0);
    filt.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(gain).connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // ---- SFX ----------------------------------------------------------------

  playerShot(): void {
    // Auto-fire is fast; throttle + keep it soft so it never grates.
    const t = this.now;
    if (t - this.lastShotAt < 0.05) return;
    this.lastShotAt = t;
    this.tone({ type: 'square', freq: 880, freqTo: 480, dur: 0.07, vol: 0.05, attack: 0.001 });
  }

  enemyShot(): void {
    this.tone({ type: 'sawtooth', freq: 320, freqTo: 200, dur: 0.08, vol: 0.035 });
  }

  explosion(big = false): void {
    if (big) {
      this.noise(0.5, 0.5, 'lowpass', 900, 1);
      this.tone({ type: 'sawtooth', freq: 180, freqTo: 40, dur: 0.5, vol: 0.25 });
    } else {
      this.noise(0.22, 0.32, 'lowpass', 1400, 1);
      this.tone({ type: 'square', freq: 240, freqTo: 70, dur: 0.18, vol: 0.12 });
    }
  }

  hit(): void {
    this.noise(0.12, 0.25, 'bandpass', 2400, 4);
  }

  playerDeath(): void {
    this.noise(0.7, 0.5, 'lowpass', 700, 0.7);
    this.tone({ type: 'sawtooth', freq: 300, freqTo: 30, dur: 0.7, vol: 0.3 });
  }

  powerUp(): void {
    [0, 0.06, 0.12].forEach((d, i) => {
      window.setTimeout(() => this.tone({ type: 'square', freq: 520 + i * 220, dur: 0.1, vol: 0.12 }), d * 1000);
    });
  }

  bombPickup(): void {
    this.tone({ type: 'triangle', freq: 660, freqTo: 990, dur: 0.18, vol: 0.16 });
  }

  bomb(): void {
    this.noise(0.8, 0.5, 'lowpass', 1800, 0.6);
    this.tone({ type: 'sawtooth', freq: 120, freqTo: 1200, dur: 0.35, vol: 0.18 });
  }

  graze(): void {
    this.tone({ type: 'sine', freq: 1600, dur: 0.04, vol: 0.05 });
  }

  warning(): void {
    [0, 0.25, 0.5].forEach((d) => {
      window.setTimeout(() => this.tone({ type: 'square', freq: 740, dur: 0.16, vol: 0.14 }), d * 1000);
    });
  }

  uiMove(): void {
    this.tone({ type: 'square', freq: 480, dur: 0.04, vol: 0.08 });
  }

  uiConfirm(): void {
    this.tone({ type: 'square', freq: 520, freqTo: 880, dur: 0.12, vol: 0.12 });
  }

  // ---- Music --------------------------------------------------------------

  startMusic(levelIndex: number): void {
    if (!this.ctx) return;
    this.stopMusic();
    this.track = TRACKS[clamp(levelIndex, 0, TRACKS.length - 1)];
    this.currentStep = 0;
    this.nextNoteTime = this.now + 0.1;
    const tick = () => {
      this.scheduleAhead();
      this.musicTimer = window.setTimeout(tick, 25);
    };
    tick();
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.track = null;
  }

  /** Look-ahead scheduler: queue any steps that fall within the next 100ms. */
  private scheduleAhead(): void {
    if (!this.ctx || !this.track) return;
    const secPerStep = 60 / this.track.bpm / 4; // 16th notes
    while (this.nextNoteTime < this.now + 0.1) {
      this.playStep(this.currentStep, this.nextNoteTime, secPerStep);
      this.nextNoteTime += secPerStep;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  private playStep(step: number, time: number, secPerStep: number): void {
    if (!this.ctx || !this.track) return;
    const t = this.track;

    const bassOffset = t.bass[step];
    if (bassOffset !== null) {
      this.scheduledTone(t.bassWave, t.root * semis(bassOffset), time, secPerStep * 1.8, 0.22, this.musicGain);
    }
    const arpOffset = t.arp[step];
    if (arpOffset !== null) {
      this.scheduledTone(t.arpWave, t.root * 2 * semis(arpOffset), time, secPerStep * 0.9, 0.09, this.musicGain);
    }
    // A soft hi-hat tick on the off-beats for drive.
    if (step % 2 === 1) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 7000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.05, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      src.connect(filt).connect(g).connect(this.musicGain);
      src.start(time);
      src.stop(time + 0.06);
    }
  }

  private scheduledTone(
    type: Wave,
    freq: number,
    time: number,
    dur: number,
    vol: number,
    dest: AudioNode,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain).connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }
}

/** semitone offset → frequency multiplier */
function semis(n: number): number {
  // Snap arpeggio/bass offsets onto a minor scale for a consistent mood.
  const octave = Math.floor(n / 12);
  const within = ((n % 12) + 12) % 12;
  const nearest = MINOR.reduce((a, b) => (Math.abs(b - within) < Math.abs(a - within) ? b : a), MINOR[0]);
  return Math.pow(2, (octave * 12 + nearest) / 12);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Singleton — one synth shared across all scenes. */
export const audio = new AudioSynth();
