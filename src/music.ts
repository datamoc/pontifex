import { MusicPlayer, parseMidi, scheduleMidi, renderMidiToBufferAsync } from '@datamoc/mwg/audio';
import { getBinary, loadBinary } from '@datamoc/mwg/assets';

import { MUSIC_TRACKS, SOUNDFONT_FILE } from './music-catalog.ts';
export { MUSIC_TRACKS } from './music-catalog.ts';

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

/**
 * Musique de fond : MWG rend le MIDI en PCM (échantillons du SoundFont `microgm-opt`, réduit au build
 * aux seuls instruments de nos huit morceaux ; synthétiseur de MWG pour un instrument absent), puis le
 * morceau se lit avec le `MusicPlayer` de MWG (pause, position, fin de morceau). Le graphe audio (gain,
 * analyseur, compresseur, réverbération) et la suspension du contexte (pause, onglet masqué) sont propres au jeu.
 */
export class BackgroundMusic {
  selected: string = MUSIC_TRACKS[0].id;
  paused = false;
  loading = false;
  error = '';
  context: AudioContext | null = null;
  gain: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  /** Même forme que l'ancien lecteur pour le débogage (`#debug`) et l'e2e : défini quand un morceau est prêt. */
  channel: BackgroundMusic | null = null;
  /** 1 une fois le morceau rendu et lancé, 0 avant : prouve qu'un tampon joue. */
  scheduledTotal = 0;
  private enabled = true;
  private player: MusicPlayer | null = null;
  /** un morceau est rendu et chargé dans le lecteur */
  private hasTrack = false;
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
    return !!this.player && this.hasTrack && this.player.isPlaying && this.enabled && !document.hidden;
  }

  get duration(): number {
    return this.player?.duration ?? 0;
  }

  position(): number {
    return this.player?.position() ?? 0;
  }

  seek(pos: number): void {
    if (this.hasTrack) this.player?.seek(pos);
  }

  select(id: string, keepPaused = false): void {
    this.paused = keepPaused;
    this.selected = MUSIC_TRACKS.some((track) => track.id === id) ? id : '';
    this.request++;
    this.player?.stop();
    this.hasTrack = false;
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
    if (!this.context) this.createAudioGraph();
    void this.context!.resume().then(() => {
      if (this.enabled && !this.paused && this.selected && !document.hidden && !this.hasTrack && !this.loading && !this.disposed) void this.start();
    }).catch((error: unknown) => { this.error = String(error); });
  }

  private createAudioGraph(): void {
    const context = new AudioContext();
    this.context = context;
    this.gain = context.createGain();
    this.gain.gain.value = 0.45;
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    this.gain.connect(this.analyser);
    // Réverb légère pour lier les notes sans fichier supplémentaire.
    const reverb = context.createConvolver();
    reverb.buffer = reverbImpulse(context);
    const wet = context.createGain();
    wet.gain.value = 0.33;
    this.gain.connect(reverb);
    reverb.connect(wet);
    wet.connect(this.analyser);
    this.analyser.connect(compressor);
    compressor.connect(context.destination);
    this.player = new MusicPlayer(context, { destination: this.gain });
    this.player.onEnded.add(() => this.next());
  }

  /** Rend le morceau choisi (sur un worker de MWG, sans figer l'écran) puis le lance. */
  private async start(): Promise<void> {
    const context = this.context!;
    const track = MUSIC_TRACKS.find((candidate) => candidate.id === this.selected);
    if (!track) return;
    const token = ++this.request;
    this.loading = true;
    this.error = '';
    try {
      const midiFile = `music/${track.file}`;
      await loadBinary([midiFile, SOUNDFONT_FILE]);
      const midi = getBinary(midiFile);
      const notes = scheduleMidi(parseMidi(midi));
      // Certains MIDI réservent plusieurs mesures aux réglages des instruments.
      const firstNoteTime = notes.find((note) => note.velocity > 0 && note.gain > 0)?.time ?? 0;
      const rendered = await renderMidiToBufferAsync(midi, {
        soundFontBytes: getBinary(SOUNDFONT_FILE), missingProgram: 'synth', sampleRate: context.sampleRate,
      });
      if (token !== this.request || this.disposed) return;
      this.player!.load(rendered);
      this.player!.play({ pos: firstNoteTime });
      this.hasTrack = true;
      this.scheduledTotal = 1;
      this.channel = this;
    } catch (error) {
      if (token === this.request) this.error = `Musique indisponible : ${String(error)}`;
    } finally {
      if (token === this.request) this.loading = false;
    }
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
    if (!context || !this.hasTrack || this.paused || !this.enabled || document.hidden) return;
    if (context.state !== 'running') return;
    this.player?.update();
  }

  dispose(): void {
    this.disposed = true;
    this.request++;
    window.removeEventListener('pointerdown', this.gesture);
    window.removeEventListener('keydown', this.gesture);
    document.removeEventListener('visibilitychange', this.visibility);
    this.player?.stop();
    this.hasTrack = false;
    this.channel = null;
    if (this.context) void this.context.close();
  }
}
