// SELAMY - INTERAKTIVNI ZVUKOVI (WEB AUDIO API)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      switch (type) {
        case 'like': {
          // Warm high-frequency double pop/heartbeat tone
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(520, now);
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

          gain1.gain.setValueAtTime(0.18, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.12);
          break;
        }

        case 'click':
        case 'pop': {
          // Crisp subtle click-clack sound
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'comment': {
          // Tactile double click-clack
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(400, now);
          osc1.frequency.exponentialRampToValueAtTime(600, now + 0.03);

          gain1.gain.setValueAtTime(0.15, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.04);

          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(750, now + 0.04);
          osc2.frequency.exponentialRampToValueAtTime(950, now + 0.07);

          gain2.gain.setValueAtTime(0.12, now + 0.04);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.start(now + 0.04);
          osc2.stop(now + 0.08);
          break;
        }

        case 'message_send': {
          // Ascending swoosh/pop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'message_receive': {
          // Soft dual chime
          const freqList = [587.33, 880]; // D5 and A5
          freqList.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const startTime = now + idx * 0.07;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.18);
          });
          break;
        }

        case 'notification': {
          // Gentle bell double chime
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now); // E5
          osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.09); // B5

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'post': {
          // Satisfying chime for new post/story/reel publication
          const freqs = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
          freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const t = now + i * 0.05;
            osc.frequency.setValueAtTime(f, t);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.2);
          });
          break;
        }
      }
    } catch (err) {
      console.warn('Audio playback info:', err);
    }
  }
}

export const sound = new SoundEngine();
export function playSound(type) {
  sound.play(type);
}
