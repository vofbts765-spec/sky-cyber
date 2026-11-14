import { GameSettings } from './types';

export type SoundEffectType =
  | 'laser'
  | 'plasma'
  | 'spread'
  | 'missile'
  | 'explosion'
  | 'bossExplosion'
  | 'hit'
  | 'crit'
  | 'powerup'
  | 'shieldHit'
  | 'bossWarning'
  | 'bossAttack'
  | 'menuClick'
  | 'upgrade'
  | 'achievement'
  | 'victory'
  | 'gameover';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private musicVolume = 0.45;
  private sfxVolume = 0.65;
  private muted = false;

  private musicTimer: number | null = null;
  private isMusicPlaying = false;
  private musicIntensity: 'menu' | 'combat' | 'boss' = 'menu';
  private stepIndex = 0;

  // Bass & Arp patterns in D Minor / Phrygian synthwave
  private readonly bassNotes = [73.42, 73.42, 87.31, 73.42, 65.41, 65.41, 82.41, 69.3];
  private readonly arpNotes = [
    293.66, 349.23, 440.0, 523.25,
    440.0, 349.23, 293.66, 261.63,
    293.66, 349.23, 440.0, 587.33,
    523.25, 440.0, 349.23, 329.63,
  ];
  private readonly bossArpNotes = [
    220.0, 233.08, 293.66, 349.23,
    220.0, 233.08, 329.63, 440.0,
    196.0, 220.0, 293.66, 349.23,
    329.63, 293.66, 233.08, 220.0,
  ];

  public init(): void {
    try {
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.applyVolumes();
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio unavailable - fail silently without crashing
    }
  }

  public updateSettings(settings: Pick<GameSettings, 'musicVolume' | 'sfxVolume' | 'muted'>): void {
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;
    this.muted = settings.muted;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.02);
      this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.28, now, 0.04);
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.65, now, 0.02);
    } catch {
      // ignore
    }
  }

  public setMusicIntensity(mode: 'menu' | 'combat' | 'boss'): void {
    this.musicIntensity = mode;
  }

  public startMusic(): void {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.stepIndex = 0;

    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
    }

    this.musicTimer = window.setInterval(() => {
      this.scheduleMusicStep();
    }, 150);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleMusicStep(): void {
    if (!this.ctx || !this.musicGain || this.ctx.state !== 'running' || this.muted || this.musicVolume <= 0.01) {
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const step = this.stepIndex % 16;

      // Bass pulse on 8th notes
      if (step % 2 === 0) {
        const bassFreq = this.bassNotes[Math.floor(step / 2) % this.bassNotes.length];
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(
          this.musicIntensity === 'boss' ? bassFreq * 0.9438 : bassFreq,
          now
        );

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.musicIntensity === 'menu' ? 260 : 520, now);
        filter.frequency.exponentialRampToValueAtTime(140, now + 0.22);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(this.musicIntensity === 'menu' ? 0.24 : 0.36, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.28);
      }

      // Arpeggiator synth lead during combat & boss (subtle in menu)
      if (this.musicIntensity !== 'menu' || step % 4 === 0) {
        const arpBank = this.musicIntensity === 'boss' ? this.bossArpNotes : this.arpNotes;
        const note = arpBank[step % arpBank.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.musicIntensity === 'boss' ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(note, now);

        const peak = this.musicIntensity === 'menu' ? 0.09 : this.musicIntensity === 'boss' ? 0.16 : 0.13;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.14);
      }

      // Kick/snare percussive pulse during combat & boss
      if (this.musicIntensity !== 'menu' && step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(125, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.11);
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.13);
      }

      this.stepIndex++;
    } catch {
      // ignore transient audio errors
    }
  }

  public play(type: SoundEffectType): void {
    this.init();
    if (!this.ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.01) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      switch (type) {
        case 'laser':
          this.tone(860, 180, 0.09, 'sawtooth', 0.12, now);
          break;
        case 'plasma':
          this.tone(420, 95, 0.16, 'triangle', 0.18, now);
          this.tone(640, 140, 0.12, 'sine', 0.1, now);
          break;
        case 'spread':
          this.tone(980, 310, 0.08, 'square', 0.08, now);
          break;
        case 'missile':
          this.tone(240, 540, 0.18, 'sawtooth', 0.11, now);
          break;
        case 'hit':
          this.tone(300, 110, 0.06, 'triangle', 0.09, now);
          break;
        case 'crit':
          this.tone(1100, 1650, 0.09, 'sine', 0.14, now);
          this.tone(720, 1240, 0.1, 'triangle', 0.1, now + 0.03);
          break;
        case 'explosion':
          this.noiseBurst(0.28, 380, 0.25, now);
          this.tone(130, 26, 0.28, 'sawtooth', 0.2, now);
          break;
        case 'bossExplosion':
          this.noiseBurst(0.85, 500, 0.35, now);
          this.tone(160, 24, 0.75, 'sawtooth', 0.28, now);
          this.tone(95, 22, 0.9, 'square', 0.2, now + 0.12);
          break;
        case 'powerup':
          this.tone(440, 880, 0.12, 'sine', 0.16, now);
          this.tone(660, 1320, 0.16, 'triangle', 0.14, now + 0.07);
          break;
        case 'shieldHit':
          this.tone(620, 240, 0.18, 'sine', 0.18, now);
          break;
        case 'bossWarning':
          for (let i = 0; i < 3; i++) {
            const t = now + i * 0.28;
            this.tone(520, 280, 0.22, 'sawtooth', 0.18, t);
          }
          break;
        case 'bossAttack':
          this.tone(260, 75, 0.22, 'square', 0.16, now);
          break;
        case 'menuClick':
          this.tone(720, 960, 0.055, 'sine', 0.1, now);
          break;
        case 'upgrade':
          this.tone(523.25, 659.25, 0.09, 'triangle', 0.15, now);
          this.tone(659.25, 1046.5, 0.15, 'sine', 0.16, now + 0.07);
          break;
        case 'achievement':
          this.tone(587.33, 587.33, 0.09, 'triangle', 0.14, now);
          this.tone(880, 880, 0.1, 'triangle', 0.14, now + 0.09);
          this.tone(1174.66, 1174.66, 0.22, 'sine', 0.16, now + 0.18);
          break;
        case 'victory':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            this.tone(freq, freq * 1.02, 0.24, 'triangle', 0.16, now + idx * 0.11);
          });
          break;
        case 'gameover':
          [392.0, 349.23, 293.66, 220.0].forEach((freq, idx) => {
            this.tone(freq, freq * 0.92, 0.24, 'sawtooth', 0.14, now + idx * 0.14);
          });
          break;
      }
    } catch {
      // ignore
    }
  }

  private tone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    startTime: number
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private noiseBurst(duration: number, filterFreq: number, volume: number, startTime: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.frequency.exponentialRampToValueAtTime(60, startTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(startTime);
  }
}

export const soundEngine = new SoundEngine();
