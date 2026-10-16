import { noteToFrequency, parseMidi, scheduleMidi } from '@datamoc/mwg/audio';

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
  private request = 0;
  private disposed = false;
  private activated = false;

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
    if (!this.context || !this.notes.length) return;
    this.killVoices();
    this.offsetBase = Math.min(Math.max(0, pos), Math.max(0, this.trackDuration - 0.001));
    this.startCtxTime = this.context.currentTime;
    this.nextIdx = this.notes.findIndex((note) => note.time + note.duration > this.offsetBase);
    if (this.nextIdx < 0) this.nextIdx = this.notes.length;
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
      const raw = MUSIC_MIDI[id];
      if (!raw) throw new Error(`MIDI introuvable : ${id}`);
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const notes = scheduleMidi(parseMidi(bytes.buffer));
      if (token !== this.request || this.disposed) return;
      notes.sort((a, b) => a.time - b.time);
      this.notes = notes;
      this.trackDuration = Math.max(0, ...notes.map((note) => note.time + note.duration));
      this.offsetBase = 0;
      this.startCtxTime = context.currentTime;
      this.nextIdx = 0;
      this.scheduledTotal = 0;
      this.channel = this;
    } catch (error) {
      if (token === this.request) this.error = `Musique indisponible : ${String(error)}`;
    } finally {
      if (token === this.request) this.loading = false;
    }
  }

  private noiseBuffer(): AudioBuffer {
    const context = this.context!;
    if (!this.noise) {
      this.noise = context.createBuffer(1, context.sampleRate / 4, context.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  /** Batterie (canal 9) : grosse caisse sinusoïdale, bruit filtré pour caisse claire et charleston. */
  private drum(note: Note, when: number, peak: number): void {
    const context = this.context!;
    const out = context.createGain();
    out.connect(this.gain!);
    if (note.note === 35 || note.note === 36) {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, when);
      osc.frequency.exponentialRampToValueAtTime(42, when + 0.12);
      out.gain.setValueAtTime(peak * 1.4, when);
      out.gain.exponentialRampToValueAtTime(0.001, when + 0.24);
      osc.connect(out);
      osc.start(when);
      osc.stop(when + 0.26);
      this.voices.add(osc);
      osc.onended = () => { this.voices.delete(osc); out.disconnect(); };
      return;
    }
    const hat = note.note === 42 || note.note === 44 || note.note === 46;
    const burst = context.createBufferSource();
    burst.buffer = this.noiseBuffer();
    const filter = context.createBiquadFilter();
    filter.type = hat ? 'highpass' : 'bandpass';
    filter.frequency.value = hat ? 7000 : 1800;
    const length = hat ? (note.note === 46 ? 0.28 : 0.05) : 0.14;
    out.gain.setValueAtTime(peak * (hat ? 0.5 : 0.9), when);
    out.gain.exponentialRampToValueAtTime(0.001, when + length);
    burst.connect(filter);
    filter.connect(out);
    burst.start(when);
    burst.stop(when + length + 0.02);
    this.voices.add(burst);
    burst.onended = () => { this.voices.delete(burst); out.disconnect(); };
  }

  /** Une note : oscillateur principal + halo légèrement désaccordé, filtre passe-bas, vibrato sur les tenues. */
  private strike(note: Note, when: number): void {
    const context = this.context!;
    const peak = 0.2 * (note.velocity / 127) * (note.gain ?? 1);
    if (peak <= 0.001) return;
    if (note.channel === 9) { this.drum(note, when, peak); return; }
    const program = note.program ?? 0;
    const family = program >> 3;
    const f0 = noteToFrequency(note.note);
    const length = Math.max(0.03, note.duration);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(9500, Math.max(900, f0 * 5 + (note.velocity / 127) * 2200));
    filter.Q.value = 0.4;
    const out = context.createGain();
    filter.connect(out);
    if (note.pan) {
      const panner = context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, note.pan));
      out.connect(panner);
      panner.connect(this.gain!);
    } else {
      out.connect(this.gain!);
    }
    const main = context.createOscillator();
    main.type = waveformFor(program);
    main.frequency.value = f0;
    const halo = context.createOscillator();
    halo.type = 'sine';
    halo.frequency.value = f0;
    halo.detune.value = 5;
    const haloGain = context.createGain();
    haloGain.gain.value = 0.45;
    main.connect(filter);
    halo.connect(haloGain);
    haloGain.connect(filter);
    let lfo: OscillatorNode | null = null;
    if (length > 0.35 && (family === 5 || family === 6 || family === 7 || family === 8 || family === 9)) {
      lfo = context.createOscillator();
      lfo.frequency.value = 5.2;
      const depth = context.createGain();
      depth.gain.value = 4;
      lfo.connect(depth);
      depth.connect(main.detune);
      depth.connect(halo.detune);
      lfo.start(when + 0.12);
      lfo.stop(when + length + 0.08);
    }
    const attack = family === 5 || family === 6 ? 0.07 : 0.008;
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(peak, when + attack);
    out.gain.exponentialRampToValueAtTime(0.001, when + length);
    main.start(when);
    main.stop(when + length + 0.08);
    halo.start(when);
    halo.stop(when + length + 0.08);
    this.voices.add(main);
    this.voices.add(halo);
    if (lfo) this.voices.add(lfo);
    main.onended = () => {
      this.voices.delete(main);
      this.voices.delete(halo);
      if (lfo) this.voices.delete(lfo);
      filter.disconnect();
      out.disconnect();
    };
  }

  private killVoices(): void {
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* déjà arrêtée */ }
      voice.disconnect();
    }
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
    if (!context || !this.notes.length || this.paused || !this.enabled || document.hidden) return;
    if (context.state !== 'running') return;
    if (this.position() >= this.trackDuration) { this.next(); return; }
    const horizon = this.position() + LOOKAHEAD;
    while (this.nextIdx < this.notes.length && this.notes[this.nextIdx].time < horizon) {
      const note = this.notes[this.nextIdx++];
      const when = Math.max(this.startCtxTime + (note.time - this.offsetBase), context.currentTime);
      this.strike(note, when);
      this.scheduledTotal++;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.request++;
    window.removeEventListener('pointerdown', this.gesture);
    window.removeEventListener('keydown', this.gesture);
    document.removeEventListener('visibilitychange', this.visibility);
    this.killVoices();
    this.notes = [];
    this.channel = null;
    if (this.context) void this.context.close();
  }
}
