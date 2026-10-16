import { noteToFrequency, parseMidi, scheduleMidi, renderMidiToBuffer, loadSoundFont } from '@datamoc/mwg/audio';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { MUSIC_TRACKS } from './music-catalog.ts';
export { MUSIC_TRACKS } from './music-catalog.ts';
import { MUSIC_MIDI } from './generated/music.ts';

type Note = ReturnType<typeof scheduleMidi>[number];

/** Regard de planification : les notes sont créées à l'avance sur l'horloge audio. */
const LOOKAHEAD = 0.4;

/** Timbre par famille General MIDI : un oscillateur léger, sans échantillon embarqué. */
function waveformFor(program: number): OscillatorType {
  switch (program >> 3) {
    case 2: case 6: case 7: case 8: case 10: return 'square';
    case 3: case 5: return 'sawtooth';
    default: return program >> 3 === 4 || (program >> 3) >= 9 ? 'sine' : 'triangle';
  }
}

/** Tirage au sort : un morceau au hasard, jamais celui qui joue déjà. */
export function drawTrackId(except = '', rng: () => number = Math.random): string {
  const candidates = MUSIC_TRACKS.map((track) => track.id).filter((id) => id !== except);
  if (!candidates.length) return except;
  const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(rng() * candidates.length)));
  return candidates[index];
}

/** Réverbération synthétisée : bruit décroissant, aucun fichier impulsionnel à embarquer. */
function reverbImpulse(context: AudioContext): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.floor(rate * 1.6);
  const impulse = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.8;
  }
  return impulse;
}

/** Lecture directe des MIDI embarqués : huit morceaux pour ~250 Ko au lieu de ~25 Mo d'Ogg. */
export class BackgroundMusic {
  selected: string = MUSIC_TRACKS[0].id;
  paused = false;
  loading = false;
  error = '';
  context: AudioContext | null = null;
  gain: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  /** Même forme que l'ancien lecteur à buffers pour le débogage (`#debug`) et l'e2e. */
  channel: BackgroundMusic | null = null;
  /** Notes planifiées depuis le début du morceau : prouve que l'ordonnanceur avance. */
  scheduledTotal = 0;
  private enabled = true;
  private notes: Note[] = [];
  private trackDuration = 0;
  private startCtxTime = 0;
  private offsetBase = 0;
  private nextIdx = 0;
  private voices = new Set<AudioScheduledSourceNode>();
  private noise: AudioBuffer | null = null;
  private soundFont: any = null;
  private request = 0;
  private disposed = false;
  private activated = false;

  /** Charge le SoundFont `microgm-opt` depuis MWG pour améliorer la qualité de la musique. */
  private async loadSoundFont(): Promise<void> {
    if (this.soundFont) return;
    try {
      const soundFontPath = join(dirname(fileURLToPath(import.meta.url)), '../../node_modules/@datamoc/mw_games/data/microgm-opt.sf2');
      const soundFontData = readFileSync(soundFontPath);
      this.soundFont = await loadSoundFont(soundFontData.buffer);
    } catch (error) {
      console.error('Failed to load microgm-opt SoundFont:', error);
      this.soundFont = null;
    }
  }
  private visibility = () => {
    if (!this.context) return;
    if (document.hidden) void this.context.suspend();
    else if (this.enabled) this.unlock();
  };
  private gesture = () => { this.activated = true; this.unlock(); };

  constructor() {
    window.addEventListener('pointerdown', this.gesture);
    window.addEventListener('keydown', this.gesture);
    document.addEventListener('visibilitychange', this.visibility);
  }

  get isPlaying(): boolean {
    return !!this.context && !!this.notes.length && !this.paused && this.enabled
      && !document.hidden && this.position() < this.trackDuration;
  }

  get duration(): number {
    return this.trackDuration;
  }

  position(): number {
    if (!this.context || !this.notes.length) return this.offsetBase;
    return Math.min(this.trackDuration, Math.max(0, this.offsetBase + this.context.currentTime - this.startCtxTime));
  }

  seek(pos: number): void {
    if (!this.context) return;
    this.offsetBase = Math.min(Math.max(0, pos), Math.max(0, this.trackDuration - 0.001));
    this.startCtxTime = this.context.currentTime;
  }

  select(id: string, keepPaused = false): void {
    this.paused = keepPaused;
    this.selected = MUSIC_TRACKS.some((track) => track.id === id) ? id : '';
    this.request++;
    this.killVoices();
    this.notes = [];
    this.trackDuration = 0;
    this.offsetBase = 0;
    this.nextIdx = 0;
    this.channel = null;
    this.loading = false;
    this.error = '';
    this.scheduledTotal = 0;
    this.unlock();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.context && this.gain) {
      this.gain.gain.setTargetAtTime(enabled ? 0.45 : 0, this.context.currentTime, 0.06);
    }
    if (enabled) this.unlock();
    else if (this.context) void this.context.suspend();
  }

  private unlock(): void {
    if (this.disposed || !this.activated || !this.enabled || this.paused || !this.selected || document.hidden) return;
    // Création et reprise dans un geste utilisateur : respecte l'autoplay du navigateur.
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = 0.45;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      this.gain.connect(this.analyser);
      // Réverb légère pour lier les notes sans échantillon ni fichier supplémentaire.
      const reverb = this.context.createConvolver();
      reverb.buffer = reverbImpulse(this.context);
      const wet = this.context.createGain();
      wet.gain.value = 0.33;
      this.gain.connect(reverb);
      reverb.connect(wet);
      wet.connect(this.analyser);
      this.analyser.connect(compressor);
      compressor.connect(this.context.destination);
    }
    void this.context.resume().then(() => {
      if (this.enabled && !this.paused && this.selected && !document.hidden && !this.notes.length && !this.loading && !this.disposed) void this.start();
    }).catch((error: unknown) => { this.error = String(error); });
  }

  private async start(): Promise<void> {
    const context = this.context!;
    const id = this.selected;
    const token = ++this.request;
    this.loading = true;
    this.error = '';
    try {
      await this.loadSoundFont();
      const raw = MUSIC_MIDI[id];
      if (!raw) throw new Error(`MIDI introuvable : ${id}`);
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const midi = parseMidi(bytes.buffer);
      
      if (token !== this.request || this.disposed) return;
      
      if (this.soundFont) {
        // Utiliser le SoundFont pour améliorer la qualité
        const buffer = await renderMidiToBuffer(midi, this.soundFont);
        const source = context.createBufferSource();
        source.buffer = buffer;
        
        // Créer un GainNode pour contrôler le volume
        const gainNode = context.createGain();
        gainNode.gain.value = 0.8; // Volume à 80%
        
        // Appliquer un pitch aléatoire pour varier légèrement le son
        source.playbackRate.value = 1.0 + (Math.random() * 0.02 - 0.01); // ±1% de variation
        
        // Connecter la source au GainNode, puis au gain principal
        source.connect(gainNode);
        gainNode.connect(this.gain!);
        
        source.start(0);
        this.channel = this;
        this.trackDuration = buffer.duration;
        this.offsetBase = 0;
        this.startCtxTime = context.currentTime;
        this.scheduledTotal = 1;
      } else {
        // Fallback sur le synthétiseur actuel
        const notes = scheduleMidi(midi);
        notes.sort((a, b) => a.time - b.time);
        this.notes = notes;
        this.trackDuration = Math.max(0, ...notes.map((note) => note.time + note.duration));
        this.offsetBase = 0;
        this.startCtxTime = context.currentTime;
        this.nextIdx = 0;
        this.scheduledTotal = 0;
        this.channel = this;
      }
    } catch (error) {
      if (token === this.request) this.error = `Musique indisponible : ${String(error)}`;
    } finally {
      if (token === this.request) this.loading = false;
    }
  }

  private killVoices(): void {
    // Plus nécessaire avec le SoundFont, mais conservé pour la compatibilité
    this.voices.clear();
  }

  togglePause(): void {
    if (!this.selected) { this.select(drawTrackId()); return; }
    this.paused = !this.paused;
    // Suspendre fige AudioContext.currentTime : la position est conservée.
    if (this.paused) { if (this.context) void this.context.suspend(); }
    else this.unlock();
  }

  /** Suivant = tirage au sort : jamais deux fois le même morceau à la suite. */
  next(): void {
    this.select(drawTrackId(this.selected), this.paused);
  }

  update(): void {
    const context = this.context;
    if (!context || this.paused || !this.enabled || document.hidden) return;
    if (context.state !== 'running') return;
    if (this.position() >= this.trackDuration) { this.next(); return; }
  }

  dispose(): void {
    this.disposed = true;
    this.request++;
    window.removeEventListener('pointerdown', this.gesture);
    window.removeEventListener('keydown', this.gesture);
    document.removeEventListener('visibilitychange', this.visibility);
    this.notes = [];
    this.channel = null;
    if (this.context) void this.context.close();
  }
}
