import { Sound, synthesizeSound, type ToneOptions } from '@datamoc/mwg/audio';

/** Petits effets synthétisés : aucun fichier audio à embarquer. */
const make = (o: ToneOptions, pool = 4) => synthesizeSound(o, { poolSize: pool });

export class Sfx {
  enabled = true;
  private build = make({ waveform: 'triangle', frequency: 520, duration: 0.09, volume: 0.5, decay: 6 });
  private del = make({ waveform: 'square', frequency: 200, duration: 0.1, volume: 0.35, decay: 5 });
  private snap = make({ waveform: 'noise', frequency: 300, duration: 0.25, volume: 0.7, decay: 5 });
  private splash = make({ waveform: 'noise', frequency: 150, duration: 0.5, volume: 0.6, decay: 3 });
  private ding = make({ waveform: 'sine', frequency: 880, duration: 0.25, volume: 0.5, decay: 4 }, 6);
  private tick = make({ waveform: 'sine', frequency: 660, duration: 0.04, volume: 0.3, decay: 8 });

  private play(s: Sound, gain = 1, pitch = 1): void {
    if (this.enabled) s.play(gain, pitch);
  }
  onBuild(): void { this.play(this.build, 1, 0.9 + Math.random() * 0.2); }
  onDelete(): void { this.play(this.del); }
  onBreak(): void { this.play(this.snap, 1, 0.8 + Math.random() * 0.4); }
  onSplash(): void { this.play(this.splash); }
  onClick(): void { this.play(this.tick); }
  onWin(): void { [1, 1.25, 1.5, 2].forEach((p, i) => setTimeout(() => this.play(this.ding, 1, p), i * 110)); }
}
