# Pontifex — constructeur de ponts

Jeu de construction de ponts 2D, fait avec **MWG** (`@datamoc/mw_games`, rendu PixiJS) : un seul fichier HTML,
qui s'ouvre en double-clic, hors ligne.

**Jouer** : ouvrir `pontifex.html` (= `dist/standalone.html`). Glisser d'un point à un autre pour poser une poutre ;
points d'ancrage orange fixes ; clic droit ou outil « Effacer » pour retirer ; **Tester** (ou Espace) lance la voiture.
Raccourcis : `1`–`5` matériaux, `X` effacer, `G` grille, `Ctrl+Z` / `Ctrl+Y` annuler/rétablir, `Échap` ferme une fenêtre.
Étoiles : ★ traverser · ★ garder ≥ 20 % du budget · ★ contrainte max < 75 %.

## Progression et matériaux

Les matériaux arrivent progressivement (✦ = nouveau) : 1 chaussée seule, une poutre entre 2 points (6 cases) · 1bis + bois, 10 cases, la chaussée tendue casse vite · 2 + bois · 3 + acier ·
6 + **câble fin** (traction seule : haubans, suspentes) · 7 + **câble porteur** (câble épais tendu entre pylônes).
Un câble fin s'accroche **n'importe où sur un câble porteur** : le câble porteur est alors coupé en deux et un nœud est créé.
Les niveaux sont de simples données (`src/data.ts`), prêts pour un futur éditeur de scénarios.

## Développer

```
# d'abord : récupérer les images, voir assets/README.md
npm install
npm run build       # vite build → dist/standalone.html (+ dist/index.html, game.js, assets/ : version multi-fichiers)
npm test            # moteur physique, sans navigateur (node --test via tsx)
npm run e2e         # Chrome réel depuis file:// : construction à la souris, 4 niveaux, échec, aucune requête réseau
npm run check       # typecheck + test + build + e2e
```
`#debug` à la fin de l'URL expose la scène en `window.__pontifex` (utilisé par `e2e/`).
Test Windows : `e2e/win-smoke.mjs` (Node + Chrome Windows).

## Organisation

| fichier | rôle |
| --- | --- |
| `src/physics.ts` | moteur XPBD à pas fixe, déterministe, sans rendu (efforts en force, rupture, câbles en traction seule) |
| `src/data.ts` | matériaux, voitures (la masse suit la taille du véhicule), niveaux |
| `src/scene.ts` | scène MWG : éditeur, simulation, interface (`Button`, `Bar`, `Window`, `Label`…) |
| `src/render.ts`, `src/art.ts` | dessin vectoriel (`Shape2D`), décor et véhicules animés (`SpriteSheet`, `AnimatedSprite`) |
| `src/audio.ts` | effets sonores synthétisés (aucun fichier audio) |
| `test/` | tests du moteur + ponts de référence de chaque niveau (faisabilité des 3 étoiles incluse) |
| `MWG-FEEDBACK.md` | **manques et pistes d'amélioration constatés sur MWG** |

## Crédits

Graphismes (voitures, arbres, rochers, buissons, nuages) : packs gratuits **CraftPix.net**
(<https://craftpix.net/file-licenses/>), embarqués dans le HTML compilé (usage dans un jeu autorisé) ; les fichiers d'art ne sont volontairement pas dans le dépôt (§2.2.1 : pas de redistribution de l'art), voir `assets/README.md`.
