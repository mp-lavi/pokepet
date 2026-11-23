// Lightweight retro Web Audio synthesizer (no external assets required)
class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('pokepet_muted') === '1';
    } catch {
      this.muted = false;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('pokepet_muted', this.muted ? '1' : '0');
    } catch {
      // ignore
    }
    if (!this.muted) this.playTap();
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainVal = 0.05,
    delay = 0,
    slideToFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playTap() {
    this.tone(520, 0.06, 'triangle', 0.05, 0, 680);
  }

  public playPet() {
    this.tone(587, 0.08, 'sine', 0.05, 0, 784);
    this.tone(784, 0.1, 'sine', 0.04, 0.07, 988);
  }

  public playEat() {
    this.tone(330, 0.07, 'triangle', 0.06, 0, 440);
    this.tone(440, 0.08, 'triangle', 0.06, 0.09, 587);
  }

  public playHit(superEffective = false) {
    if (superEffective) {
      this.tone(240, 0.12, 'sawtooth', 0.08, 0, 90);
      this.tone(780, 0.12, 'square', 0.05, 0.04, 1120);
    } else {
      this.tone(190, 0.11, 'sawtooth', 0.06, 0, 80);
    }
  }

  public playVictory() {
    this.tone(523, 0.1, 'square', 0.05, 0);
    this.tone(659, 0.1, 'square', 0.05, 0.1);
    this.tone(784, 0.1, 'square', 0.05, 0.2);
    this.tone(1046, 0.25, 'square', 0.06, 0.3);
  }

  public playEvolve() {
    const notes = [440, 494, 554, 659, 740, 880, 1175];
    notes.forEach((n, idx) => {
      this.tone(n, 0.11, 'triangle', 0.06, idx * 0.08);
    });
  }

  public playQuestClaim() {
    this.tone(659, 0.09, 'triangle', 0.06, 0);
    this.tone(988, 0.18, 'triangle', 0.06, 0.09);
  }

  public playMinigameCatch() {
    this.tone(740, 0.07, 'sine', 0.06, 0, 1046);
  }
}

export const sound = new SoundEngine();
