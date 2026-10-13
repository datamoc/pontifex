# Pontifex — constructeur de ponts

Jeu de construction de ponts 2D, fait avec **MWG** (`@datamoc/mw_games` **0.37.0**, rendu PixiJS) : un seul
fichier HTML, qui s'ouvre en double-clic, hors ligne. **Tous les graphismes sont des SVG** faits pour le jeu
(aucun asset externe) : ils sont compilés dans la page, les véhicules sont recomposés depuis les groupes de
leur dessin (roues qui tournent, capot qui s'ouvre à l'écrasement), voir `assets/README.md`.

**Jouer en ligne** : https://datamoc.github.io/pontifex/

GitHub Pages publie automatiquement `dist/standalone.html` comme `index.html` à chaque push sur `main`.

**Jouer hors ligne** : ouvrir `pontifex.html` (= `dist/standalone.html`). Glisser d'un point à un autre pour poser une poutre ;
points d'ancrage orange fixes ; clic droit ou outil « Effacer » pour retirer ; **Tester** (ou Espace) lance la voiture.
Raccourcis : `1`–`5` matériaux, `X` effacer, `G` grille, `Ctrl+Z` / `Ctrl+Y` annuler/rétablir, `Échap` ferme une fenêtre.
Étoiles : ★ traverser · ★ garder ≥ 20 % du budget · ★ contrainte max < 75 %.

## Progression et matériaux

Les matériaux arrivent progressivement (✦ = nouveau) : 1 chaussée seule, une poutre entre 2 points (6 cases) · 1bis + bois, 10 cases, la chaussée tendue casse vite · 2 + bois · 3 + acier ·
6 + **câble fin** (traction seule : haubans, suspentes) · 7 + **câble porteur** (câble épais tendu entre pylônes).
Un câble fin s'accroche **n'importe où sur un câble porteur** : le câble porteur est alors coupé en deux et un nœud est créé.
Les niveaux sont de simples données (`src/data.ts`), prêts pour un futur éditeur de scénarios.

## Éditeur de niveaux

Menu des niveaux → **＋ Nouveau niveau** (ou ✎ Éditer). Outils **Ancre / Pylône / Îlot** (clic pour poser, re-clic pour retirer),
boutons pour l'écart des rives, la hauteur de la route et de l'eau, le budget, le véhicule (la masse suit la taille) et les matériaux autorisés.
**▶ Tester** lance le brouillon : traverse-le avec un pont, il devient la *solution de référence* (✔ dans la liste).
**Enregistrer** garde le niveau dans le navigateur ; **Exporter** donne un fichier `.json` (aussi copié dans le presse-papiers) ;
glisser un `.json` sur la page, ou *Importer (presse-papiers)*, l'ajoute. Un fichier importé est toujours validé (`src/level.ts`).

## Développer

```
npm install
npm run build       # vite build → dist/standalone.html (+ dist/index.html, game.js, assets/ : version multi-fichiers)
npm test            # moteur physique, sans navigateur (node --test via tsx)
npm run e2e         # Chrome réel depuis file:// : construction à la souris, 4 niveaux, échec, aucune requête réseau
npm run check       # typecheck + test + build + e2e
node e2e/visual-check.mjs   # après build : roues qui tournent + effets de crash, en captures
```
`#debug` à la fin de l'URL expose la scène en `window.__pontifex` (utilisé par `e2e/`).
Test Windows : `e2e/win-smoke.mjs` (Node + Chrome Windows).

## Organisation

| fichier | rôle |
| --- | --- |
| `src/physics.ts` | simulation de pont utilisant `XpbdWorld` de MWG, à pas fixe, déterministe, sans rendu (efforts en force, rupture, câbles en traction seule) |
| `src/data.ts` | matériaux, voitures (la masse suit la taille du véhicule) |
| `src/level.ts`, `src/levels.ts` | format de niveau (`LevelSpec`), validation des imports, niveaux du jeu |
| `src/editor.ts`, `src/editor-ui.ts` | éditeur de niveaux : opérations pures testées, puis interface |
| `src/scene.ts` | scène MWG : éditeur, simulation, interface (`Button`, `Bar`, `Window`, `Label`…) |
| `src/render.ts`, `src/art.ts` | dessin vectoriel (`Shape2D`) ; décor et véhicules en SVG (`loadBinary` + `sanitizeSvg` + `splitSvgGroups`, textures rasterisées à 2×) |
| `src/audio.ts` | effets sonores synthétisés (aucun fichier audio) |
| `test/` | tests du moteur + ponts de référence de chaque niveau (faisabilité des 3 étoiles incluse) |
| `MWG-FEEDBACK.md` | **manques et pistes d'amélioration constatés sur MWG** |

## Crédits

Graphismes : **SVG dessinés pour le jeu**, dans `assets/` (licences et découpage : `assets/README.md`).
Rien n'est emprunté à un pack tiers ; le jeu et ses assets sont donc entièrement redistribuables.
