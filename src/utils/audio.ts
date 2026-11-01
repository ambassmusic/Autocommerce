/**
 * Clean Web Audio API sound synthesizer for WhatsApp incoming message pops
 * and order confirmation chimes without any external audio asset dependencies.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playMessagePop() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context may be restricted by autoplay policy
    }
  }

  playOrderChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (i * 0.08));

        gain.gain.setValueAtTime(0.06, now + (i * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.08) + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (i * 0.08));
        osc.stop(now + (i * 0.08) + 0.3);
      });
    } catch {
      // Ignore audio restriction
    }
  }
}

export const sounds = new SoundEffects();
