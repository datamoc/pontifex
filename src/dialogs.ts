// Fenêtres du jeu (résultat, choix de niveau, confirmation, musique) : elles ne connaissent ni la scène
// ni la simulation, seulement les données à afficher et les actions à déclencher.
import { Button, Label, ScrollBox, Window } from '@datamoc/mwg/two-d';
import { MUSIC_TRACKS } from './music-catalog.ts';
import { enableDragScroll } from './scroll.ts';
import { STRESS_LIMIT, BUDGET_LEFT_RATIO, type Rating } from './progress.ts';

/** Fabrique de bouton de la scène (joue le clic sonore avant l'action). */
export type MakeButton = (text: string, onClick: () => void, width?: number, size?: number) => Button;

const GOLD = 0xfbbf24;

// ------------------------------------------------------------------ résultat d'un essai
export interface ResultOptions {
  won: boolean;
  /** essai depuis l'éditeur : la solution devient celle du niveau */
  testing: boolean;
  rating: Rating;
  /** coût du pont, en € */
  cost: number;
  maxRatio: number;
  nextLabel: string;
  onModify: () => void;
  onNext: () => void;
}

export function buildResultWindow(options: ResultOptions): Window {
  const { won, testing, rating, cost, maxRatio } = options;
  const title = won ? (testing ? 'Solution validée !' : 'Niveau réussi !') : 'Le pont s’est effondré';
  const win = new Window({ width: 380, height: won ? 320 : 250, title, modal: true, closable: false });
  const stars = new Label({ text: won ? '★'.repeat(rating.stars) + '☆'.repeat(3 - rating.stars) : '✖', size: 40, color: won ? GOLD : 0xf43f5e });
  stars.position.set(win.contentWidth / 2 - stars.width / 2, 4);
  const mark = (ok: boolean) => (ok ? '✔' : '✖');
  const budgetPercent = Math.round(BUDGET_LEFT_RATIO * 100);
  const stressPercent = Math.round(STRESS_LIMIT * 100);
  const info = new Label({
    text: won
      ? `${mark(true)}  Le véhicule a traversé\n${mark(rating.budgetOk)}  Au moins ${budgetPercent} % du budget restant (${rating.budgetLeft} €)\n${mark(rating.stressOk)}  Contrainte max sous ${stressPercent} % (${Math.round(maxRatio * 100)} %)${testing ? `\n\nCe pont devient la solution de référence (${cost} €).` : ''}`
      : 'Renforce les poutres qui rougissent en premier, ou ajoute des triangles : un triangle ne se déforme pas.',
    size: 13, wrapWidth: win.contentWidth - 16, color: 0xcbd5e1,
  });
  info.position.set(8, 70);
  win.content.addChild(stars, info);
  const y = win.contentHeight - 44;
  const buttonWidth = (win.contentWidth - 24) / 2;
  const modify = new Button({ width: buttonWidth, height: 36, text: 'Modifier', onClick: () => { win.close(); options.onModify(); } });
  modify.position.set(8, y);
  const next = new Button({ width: buttonWidth, height: 36, text: options.nextLabel, onClick: () => { win.close(); options.onNext(); } });
  next.position.set(16 + buttonWidth, y);
  win.content.addChild(modify, next);
  return win;
}

// ------------------------------------------------------------------ choix du niveau
export interface LevelEntry { label: string; name: string; stars: number; unlocked: boolean }
export interface CustomEntry { name: string; validated: boolean; stars: number }
export interface LevelsOptions {
  builtin: LevelEntry[];
  customs: CustomEntry[];
  onPlayBuiltin: (index: number) => void;
  onPlayCustom: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onNew: () => void;
  onImportText: (text: string) => void;
  onClipboardDenied: () => void;
}

export function buildLevelsWindow(options: LevelsOptions): Window {
  const columns = 4, buttonWidth = 172, buttonHeight = 56, gap = 8;
  const rows = Math.ceil(options.builtin.length / columns);
  const height = rows * (buttonHeight + gap) + gap + 96 + (options.customs.length + 1) * 42 + 30;
  const win = new Window({ width: columns * (buttonWidth + gap) + gap + 16, height, title: 'Choisir un niveau', modal: true, closable: true, closeButton: true });
  options.builtin.forEach((entry, i) => {
    const stars = entry.unlocked ? '★'.repeat(entry.stars) + '☆'.repeat(3 - entry.stars) : '— verrouillé —';
    const button = new Button({
      width: buttonWidth, height: buttonHeight, disabled: !entry.unlocked,
      text: `${entry.label}. ${entry.name}\n${stars}`, label: { size: 12 },
      onClick: () => { win.close(); options.onPlayBuiltin(i); },
    });
    button.position.set(gap + (i % columns) * (buttonWidth + gap), gap + Math.floor(i / columns) * (buttonHeight + gap));
    win.content.addChild(button);
  });

  let y = rows * (buttonHeight + gap) + gap + 6;
  const title = new Label({ text: 'Mes niveaux', size: 13, bold: true, color: GOLD });
  title.position.set(gap, y);
  win.content.addChild(title);
  y += 24;
  options.customs.forEach((entry, k) => {
    const status = entry.validated ? '✔ validé' : '✖ non validé';
    const play = new Button({ width: 330, height: 34, label: { size: 12 }, text: `${entry.name}   ${status}   ${'★'.repeat(entry.stars)}`, onClick: () => { win.close(); options.onPlayCustom(k); } });
    const edit = new Button({ width: 80, height: 34, label: { size: 12 }, text: '✎ Éditer', onClick: () => { win.close(); options.onEdit(k); } });
    const remove = new Button({ width: 90, height: 34, label: { size: 12 }, text: '✖ Suppr.', onClick: () => options.onDelete(k) });
    play.position.set(gap, y); edit.position.set(gap + 338, y); remove.position.set(gap + 426, y);
    win.content.addChild(play, edit, remove);
    y += 42;
  });
  const create = new Button({ width: 200, height: 34, label: { size: 12 }, text: '＋ Nouveau niveau', onClick: () => { win.close(); options.onNew(); } });
  const paste = new Button({
    width: 220, height: 34, label: { size: 12 }, text: 'Importer (presse-papiers)',
    onClick: () => {
      void navigator.clipboard.readText().then((text) => { win.close(); options.onImportText(text); }).catch(options.onClipboardDenied);
    },
  });
  create.position.set(gap, y); paste.position.set(gap + 208, y);
  win.content.addChild(create, paste);
  const hint = new Label({ text: 'Astuce : dépose un fichier .json de niveau sur la page pour l’importer.', size: 11, color: 0x94a3b8 });
  hint.position.set(gap, y + 40);
  win.content.addChild(hint);
  const close = new Button({ width: 120, height: 32, text: 'Fermer', onClick: () => win.close() });
  close.position.set(win.contentWidth - 128, win.contentHeight - 40);
  win.content.addChild(close);
  return win;
}

// ------------------------------------------------------------------ confirmation
export function buildConfirmWindow(message: string, onYes: () => void): Window {
  const win = new Window({ width: 340, height: 170, title: 'Confirmer', modal: true, closable: true, closeButton: true });
  const text = new Label({ text: message, size: 13, wrapWidth: win.contentWidth - 16 });
  text.position.set(8, 10);
  const yes = new Button({ width: 140, height: 34, text: 'Oui', onClick: () => { win.close(); onYes(); } });
  const no = new Button({ width: 140, height: 34, text: 'Non', onClick: () => win.close() });
  yes.position.set(8, win.contentHeight - 44);
  no.position.set(win.contentWidth - 148, win.contentHeight - 44);
  win.content.addChild(text, yes, no);
  return win;
}

// ------------------------------------------------------------------ musique
export interface MusicOptions {
  viewportWidth: number;
  viewportHeight: number;
  /** morceau en cours, ou '' si la musique est coupée */
  selected: string;
  makeButton: MakeButton;
  onChoose: (trackId: string) => void;
}

const TRACK_ROW_HEIGHT = 96;

export function buildMusicWindow(options: MusicOptions): Window {
  const { selected, makeButton } = options;
  const win = new Window({
    width: Math.min(520, options.viewportWidth - 16), height: Math.min(600, options.viewportHeight - 20),
    title: 'Musique', modal: true, closable: true, closeButton: true, blocker: true,
  });
  const current = MUSIC_TRACKS.find((track) => track.id === selected);
  const now = new Label({ text: current ? `En écoute : ${current.composer}\n${current.title}` : 'Musique arrêtée', size: 12, wrapWidth: win.contentWidth - 20 });
  now.position.set(8, 4);
  win.content.addChild(now);
  const listHeight = win.contentHeight - 96;
  const list = new ScrollBox({ width: win.contentWidth - 48, height: listHeight, contentHeight: MUSIC_TRACKS.length * TRACK_ROW_HEIGHT });
  enableDragScroll(list, win.contentWidth - 48);
  list.position.set(4, 44);
  win.content.addChild(list);
  const choose = (id: string) => { options.onChoose(id); win.close(); };
  MUSIC_TRACKS.forEach((track, i) => {
    const y = i * TRACK_ROW_HEIGHT;
    const button = makeButton(track.title, () => choose(track.id), win.contentWidth - 66);
    button.setSelected(selected === track.id);
    button.position.set(8, y);
    const credit = new Label({ text: `${track.composer} · ${track.license}${track.url ? ' ↗' : ''}\n${track.author}`, size: 11, color: 0xcbd5e1, wrapWidth: win.contentWidth - 66 });
    credit.position.set(10, y + 37);
    if (track.url) {
      credit.eventMode = 'static';
      credit.cursor = 'pointer';
      credit.on('pointertap', () => window.open(track.url, '_blank', 'noopener,noreferrer'));
    }
    list.content.addChild(button, credit);
  });
  const up = makeButton('↑', () => list.scrollBy(-160), 32);
  const down = makeButton('↓', () => list.scrollBy(160), 32);
  up.position.set(win.contentWidth - 36, 44);
  down.position.set(win.contentWidth - 36, 44 + listHeight - 34);
  const off = makeButton('Sans musique', () => choose(''), win.contentWidth - 16);
  off.position.set(8, win.contentHeight - 40);
  off.setSelected(!selected);
  win.content.addChild(off, up, down);
  return win;
}
