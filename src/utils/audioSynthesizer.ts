import { Viseme } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  constructor() {
    // Initialized on first user interaction to comply with browser autoplay policy
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.3, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Two-tone bright notification chime
  public playChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, t + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, t + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, t + 0.28); // D6

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t + 0.08);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  // Futuristic Laser / Chip Zap
  public playLaser() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.14);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Soft squish / bass pulse when mascot is poked
  public playPulse() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Subtle digital click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Start Mic FFT Lip-Sync
  public async startMicViseme(onViseme: (v: Viseme, intensity: number) => void): Promise<boolean> {
    try {
      this.initCtx();
      if (!this.ctx) return false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      this.micSource = this.ctx.createMediaStreamSource(stream);

      const micAnalyser = this.ctx.createAnalyser();
      micAnalyser.fftSize = 512;
      this.micSource.connect(micAnalyser);

      const buffer = new Uint8Array(micAnalyser.frequencyBinCount);

      const check = () => {
        if (!this.micStream) return;
        micAnalyser.getByteFrequencyData(buffer);

        // Calculate RMS / Formants
        let sum = 0;
        let lowEnergy = 0; // 0-1000Hz (Vowels A, O, U)
        let midEnergy = 0; // 1000-2500Hz (Vowels I, E)
        let highEnergy = 0; // 2500-8000Hz (S, T, Overdrive)

        const binCount = buffer.length;
        for (let i = 0; i < binCount; i++) {
          const val = buffer[i];
          sum += val;
          if (i < 15) lowEnergy += val;
          else if (i < 40) midEnergy += val;
          else highEnergy += val;
        }

        const avg = sum / binCount;
        const intensity = Math.min(1, avg / 80);

        if (avg < 12) {
          onViseme('SILENCE', 0);
        } else if (avg > 70) {
          onViseme('OVERDRIVE', intensity);
        } else if (lowEnergy > midEnergy * 1.5) {
          onViseme(lowEnergy > 200 ? 'O_U' : 'M_B_P', intensity);
        } else if (midEnergy > lowEnergy) {
          onViseme(midEnergy > 200 ? 'I' : 'A_E', intensity);
        } else {
          onViseme('A_E', intensity);
        }

        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
      return true;
    } catch (e) {
      console.warn('Microphone permission not granted for FFT visemes', e);
      return false;
    }
  }

  public stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }
}

export const soundEngine = new SoundEngine();

export function triggerHaptic(type: 'tap' | 'heavy' | 'double' = 'tap', enabled: boolean = true) {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'tap') navigator.vibrate(15);
    else if (type === 'heavy') navigator.vibrate([30, 20, 30]);
    else if (type === 'double') navigator.vibrate([20, 40, 20]);
  } catch {
    // Ignore haptic errors on unsupported hardware
  }
}
