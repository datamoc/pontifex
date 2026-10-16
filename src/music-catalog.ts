/** SoundFont des instruments : MWG ne l'embarque que réduit aux programmes de nos MIDI (voir vite.config.mts). */
export const SOUNDFONT_FILE = 'soundfonts/microgm-opt.sf2';

export const MUSIC_TRACKS = [
  { id: 'gymnopedie-1', file: 'gymnopedie-1.mid', title: 'Gymnopédie n° 1', composer: 'Erik Satie', author: 'Saisie Evin Robertson', license: 'Domaine public', url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37' },
  { id: 'meditation-thais', file: 'Meditation.mid', title: 'Méditation de Thaïs', composer: 'Jules Massenet', author: 'MIDI fourni : THAIS.MID ; séquenceur non identifié', license: 'Licence du MIDI non renseignée', url: '' },
  { id: 'marche-turque', file: 'marche-turque.mid', title: 'Marche turque · K. 331', composer: 'W. A. Mozart', author: 'Saisie Rune Zedeler et Chris Sawer', license: 'Domaine public', url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=108' },
  { id: 'les-sauvages', file: 'les-sauvages.mid', title: 'Les Sauvages · version clavier', composer: 'Jean-Philippe Rameau', author: 'Saisie Ludovic Sardain', license: 'Domaine public', url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=407' },
  { id: 'beethoven-7-2', file: 'beethoven-7-2.mid', title: 'Symphonie n° 7 · II. Allegretto', composer: 'L. van Beethoven', author: 'Saisie Stelios Samelis · orchestre', license: 'Domaine public', url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=595' },
  { id: 'beethoven-5-1', file: 'beethoven-5-1.mid', title: 'Symphonie n° 5 · I. Allegro', composer: 'L. van Beethoven', author: 'Saisie Stelios Samelis et Johannes Heinecke', license: 'Domaine public', url: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=941' },
  { id: 'ancient-mysteries', file: 'ancient-mysteries.mid', title: 'Ancient Mysteries', composer: 'Sperry Lion, LLC', author: '2024', license: 'CC0', url: 'https://opengameart.org/content/ancient-mysteries' },
  { id: 'theme-song', file: 'theme-song.mid', title: 'Theme Song [8-bit]', composer: 'nene', author: 'Synthèse rétro', license: 'CC0', url: 'https://opengameart.org/node/84462' },
] as const;
