# Bilan du projet Pontifex — 16 octobre 2026

État mesuré à `1f885d1` (MWG 0.42.0, dernière version publiée). `npm run check` passe : typecheck, 107 tests,
build, e2e desktop et mobile, musique, bruitages, navires. Site publié : https://datamoc.github.io/pontifex/
(déploiement du commit `d185ef6` ; le refactor `1f885d1` n'est pas encore poussé).

## Ce qui fonctionne

- **Jeu** : 9 niveaux (dont « Le Passage du Cargo » avec navires), 7 matériaux, éditeur de niveaux, import/export JSON validé,
  étoiles et progression sauvegardées, mobile, plein écran.
- **Moteur de pont** (`src/physics.ts`, XPBD de MWG) : déterministe, testé sans rendu (pas fixe, ralenti, pentes, sauts, navires).
- **Contenu en MWL** (`content/*.mwl` → `src/generated/content.ts`) : niveaux, matériaux, véhicules, i18n.
- **Musique** : 8 morceaux MIDI embarqués en base64, synthétiseur à oscillateurs, pause/suivant/sourdine/reprise.
- **Bruitages** : 7 effets synthétisés (MWG `synthesizeSound`), vérifiés par e2e.
- **Chaîne** : CI GitHub Pages qui bloque le déploiement si typecheck/tests/build échouent (elle a protégé le site pendant la panne).

## Incident de la journée

Le commit `657b408` a remplacé `physics.ts` par un squelette ; `61222b9` l'a « corrigé » en gardant le squelette. Trois jours de moteur
(vitesse, pentes, sauts) n'avaient jamais été committés. Récupération : cache `tsx` (`%TEMP%\tsx-miche`), qui garde le JS compilé.
Même cause pour `music.ts` (SoundFont via `fs` dans le navigateur), les niveaux 301-310 inventés, 500 SVG re-minifiés et le manifeste
d'assets amputé. Leçon : committer le travail fonctionnel avant toute refonte ; ne jamais committer sans `npm run check`.

## Problèmes ouverts (par impact)

1. ~~**Poids de la page : 4,0 Mo**~~ **Réglé** : 3,5 Mo de SoundFont étaient embarqués sans être lus. Les MIDI et le SoundFont passent maintenant par le
   mécanisme de MWG (`compile-resources` réduit le `.sf2` aux programmes des MIDI ; `renderMidiToBufferAsync` rend le morceau) : page **1,4 Mo**, SoundFont 0,8 Mo,
   `src/music.ts` allégé de ~200 lignes. Reste à regarder les 600 Ko de SVG et les 40 icônes d'interface non utilisées.
2. **Sauvegarde du progrès** : la clé `progress2` est indexée sur l'identifiant de niveau. Les ids ont changé pendant l'incident
   (1001, 301...) puis sont revenus ; vérifier qu'aucune étoile de joueur n'a été perdue.
3. **`scene.ts` : 1 050 lignes, aucun test unitaire** (HUD, entrées, éditeur, fenêtres, caméra, simulation dans une seule classe).
   Couverte uniquement par les e2e. Découpage naturel : HUD / fenêtres, entrées de construction, boucle de simulation.
4. **Icônes SVG des boutons** : migration annulée (`fetch('/art/ui/...')` ne marche pas dans un fichier autonome). 40 SVG d'interface
   sont dans `assets/ui/` sans être utilisés par le jeu.
5. **Niveaux écartés** (`content/wip/`, 301-310) : supposent montée des eaux, train, béton, hydraulique. Béton et hydraulique existent dans le
   catalogue mais aucun niveau ne les utilise ; train, vélo, bus et bateau sont des véhicules déclarés sans niveau.
6. **Dépôt** : `.opencode/` et `.coord-session` suivis par git (46 fichiers de verrous), `docs/` (copie inutile du site), `comparaisons/` ignoré
   mais présent, `GAME_ANALYSIS.md` et `ASSETS_GUIDE.md` qui décrivent des assets « à créer » alors qu'ils existent, 7 `.bak` dans `assets/`.
7. **Duplication des assets** : `assets/` a trois arborescences (`biomes/`, `common/`, dossiers par biome à la racine) avec des SVG dupliqués.
8. **Dette de tests** : les ponts de référence des niveaux 3 à 6 sont codés en dur dans `test/refs.ts` (cohérents avec le contenu actuel, mais fragiles si
   un niveau change) ; `content-before-mwl.json` (422 lignes) fige un état historique.
9. **Documentation** : README à jour pour les navires ; MWG-FEEDBACK contenait des points « CLOS » faux (corrigés ci-dessous) ; `docs/` et
   `GAME_ANALYSIS.md` à nettoyer.
10. **Navires** : un seul niveau, un seul type testé en jeu ; pas de réglage dans l'éditeur (JSON/MWL seulement) ; sirène synthétique non écoutée à l'oreille.

## Qualité du code

- Source : environ 8 700 lignes (dont 2 700 de générateurs de biomes `src/gen/`). Fichiers au-delà de 400 lignes : `scene.ts` (1 050),
  `src/gen/biomes/*` (générateurs, acceptables), `music.ts` (345, limite).
- `physics.ts` refactoré aujourd'hui (fonctions courtes, constantes nommées). Reste : `strike()` de `music.ts` (55 lignes), `scene.ts`.
- Typage : strict, 0 erreur. `any` : une occurrence résiduelle dans `music.ts` avant retrait ; aucune restante dans le code relu.
- Dépendances : à jour (puppeteer-core 25.14 disponible).

## Recommandations, dans l'ordre

1. Pousser `1f885d1`, puis retirer les SoundFonts de la page (gain ~3 Mo).
2. Nettoyer le dépôt (`.opencode`, `docs/`, `.bak`, docs périmées) et ajouter `.opencode/` et `.coord-session` au `.gitignore`.
3. Ajouter un garde-fou : hook de pré-commit qui lance `typecheck` + `npm test` (l'incident aurait été évité).
4. Découper `scene.ts`, avec un test de chaque morceau extrait.
5. Décider du sort des niveaux 301-310 (béton, hydraulique, train, montée des eaux) ou les supprimer du catalogue.
6. Ajouter les navires à l'éditeur de niveaux (liste d'événements) pour que les joueurs puissent en créer.
