# Pontifex — constructeur de ponts

Jeu de construction de ponts 2D, fait avec **MWG** (`@datamoc/mwg` **0.39.1**, rendu PixiJS) : un seul
fichier HTML, qui s'ouvre en double-clic, hors ligne. **Tous les graphismes sont des SVG** faits pour le jeu
(aucun asset externe) : ils sont compilés dans la page, les véhicules sont recomposés depuis les groupes de
leur dessin (roues qui tournent, capot qui s'ouvre à l'écrasement), voir `assets/README.md`.

**Jouer en ligne** : https://datamoc.github.io/pontifex/

GitHub Pages publie automatiquement `dist/standalone.html` comme `index.html` à chaque push sur `main`.

**Jouer hors ligne** : ouvrir `pontifex.html` (= `dist/standalone.html`). Cliquer ou toucher le point de départ, puis le point d’arrivée pour poser une poutre ; le glisser fonctionne aussi.
Sur téléphone, écarter ou rapprocher deux doigts pour zoomer ou dézoomer, et les déplacer ensemble pour déplacer la vue ;
points d'ancrage orange fixes ; clic droit ou outil « Effacer » pour retirer ; **Tester** (ou Espace) lance la voiture.
Le curseur s'aimante au point d'accroche le plus proche, et la poutre suivante repart de la fin de la précédente (cliquer plus loin que la portée du matériau recommence ailleurs).
Raccourcis : `1`–`5` matériaux, `X` effacer, `G` grille, `Ctrl+Z` / `Ctrl+Y` annuler/rétablir, `Échap` annule le départ sélectionné ou ferme une fenêtre. Retoucher le départ annule aussi la sélection.
Étoiles : ★ traverser · ★ garder ≥ 20 % du budget · ★ contrainte max < 75 %.

## Biomes et décor vivant

Chaque scénario tire au hasard une ambiance parmi neuf biomes. Le ciel, le terrain, les objets et
les trois plans de paysage suivent ce biome. L'ambiance reste stable pendant les essais du pont.
Six passants se promènent sur les rives. Les animaux restent fixes derrière le décor ; seuls les oiseaux
dessinés en vol se déplacent dans le ciel. Les oiseaux avec des pattes visibles restent posés. Chaque passant a
20 % de chances d'être un cycliste, avec une animation de pédalage et une vitesse plus élevée.
Piétons et cyclistes utilisent les squelettes MWG (`skeleton` et `SkeletalSprite`) : les SVG sont
découpés en membres, animés en temps réel par le jeu. La marche suit la vitesse du personnage ;
les jambes du cycliste suivent ses pédales par cinématique inverse, sans images précalculées.
Les 96 anciennes images de marche et les 8 images de pédalage restent dans les sources,
mais le build les exclut de la page publiée. Le manifeste conserve leurs métadonnées historiques.

## Progression et matériaux

Les rives des niveaux intégrés sont espacées par multiples de 12 m, pour poser une chaussée plate en tronçons complets. Un nouveau niveau commence à 24 m ; les boutons Écart de l’éditeur ajoutent ou retirent 12 m.

Les matériaux arrivent progressivement (✦ = nouveau) : 1 chaussée seule, une poutre entre 2 points (6 cases) · 1bis + bois, 12 cases, la chaussée tendue casse vite · 2 + bois · 3 + acier ·
6 + **câble fin** (traction seule : haubans, suspentes) · 7 + **câble porteur** (câble épais tendu entre pylônes).
Un câble fin s'accroche **n'importe où sur un câble porteur** : le câble porteur est alors coupé en deux et un nœud est créé.
Les niveaux intégrés sont écrits en MWL dans `content/levels.mwl`, puis compilés en données TypeScript.

## Navires

Un niveau peut déclarer des événements `<event type="ship" time="1" shipType="medium">` (`small`, `medium` ou `large`, au plus 10 par niveau ;
format JSON : `events: [{ type: 'ship', time, shipType }]`). À l'heure `time`, le navire sort de la roche à gauche et traverse le canal
à la ligne d'eau (sprites `assets/common/ship_*.svg`). Son gabarit — largeur et hauteur au-dessus de l'eau, voir `SHIPS` dans `src/data.ts` —
brise toute poutre qu'il touche ; en construction, une ligne pointillée jaune montre la hauteur à laisser libre.
Le niveau 9 « Le Passage du Cargo » l'introduit ; les tests sont dans `test/ships.test.ts` et `e2e/ships.mjs`.

## Éditeur de niveaux

Menu des niveaux → **＋ Nouveau niveau** (ou ✎ Éditer). Outils **Ancre / Pylône / Îlot** (clic pour poser, re-clic pour retirer),
boutons pour l'écart des rives, la hauteur de la route et de l'eau, le budget, le véhicule (la masse suit la taille) et les matériaux autorisés.
**▶ Tester** lance le brouillon : traverse-le avec un pont, il devient la *solution de référence* (✔ dans la liste).
**Enregistrer** garde le niveau dans le navigateur ; **Exporter** donne un fichier `.json` (aussi copié dans le presse-papiers) ;
glisser un `.json` sur la page, ou *Importer (presse-papiers)*, l'ajoute. Un fichier importé est toujours validé (`src/level.ts`).

## Contenu MWL et échanges JSON

`content/levels.mwl` décrit les neuf niveaux avec le tag propre à Pontifex `bridge_level` et ses enfants
`anchor`, `tower`, `island`, `view`. Les noms et indices portent le marqueur de traduction `_("…")`.
`content/catalog.mwl` contient les tables typées des matériaux et véhicules ; chaque niveau référence leurs identifiants.
Les identifiants des niveaux servent aux étoiles sauvegardées : conserver leur valeur et l'ordre des niveaux.

`npm run content` compile et valide ces fichiers avec l'API publique MWL, vérifie les références et les règles de
niveau, puis produit `src/generated/content.ts` et `content/i18n.fr.json`. Ces sorties sont versionnées ; les modifier
via les sources MWL. La compilation précède automatiquement le build, les tests et le contrôle TypeScript.
Le catalogue français prépare la traduction ; le jeu affiche toujours les textes français.

MWL sert ici à l'écriture du contenu, sans imposer son runtime de scénarios à la physique du jeu.
Les niveaux créés par les joueurs restent importés et exportés en JSON, avec la validation `parseSpec` commune
aux niveaux MWL. Les sauvegardes restent également en JSON. L'import/export MWL dans l'éditeur a été évalué :
il demanderait un parseur et un sérialiseur dans le navigateur.
Pour les échanges actuels d'un seul niveau, cela n'apporte pas encore de bénéfice suffisant ; il reste une extension possible.

### Intégrer une création de joueur

Le développeur peut convertir un fichier exporté par l'éditeur en MWL :

```sh
npm run level:convert -- pontifex-mon-pont.json --id 9 --label 8 --output content/zz-mon-pont.mwl
npm run content
npm run typecheck
```

Choisir un identifiant positif inutilisé et le conserver ensuite : il sert aux étoiles sauvegardées.
`--label` est facultatif (par défaut, l'identifiant). `--output` est facultatif : sans lui, le script écrit le
MWL sur la sortie standard (pour une redirection directe, utiliser `npx tsx tools/convert-level.ts …`).
Le convertisseur refuse d'écraser un fichier existant et valide le niveau avant d'écrire.
Le préfixe `zz-` place le fichier après les niveaux actuels dans l'ordre alphabétique de compilation.
Les noms et consignes deviennent traduisibles ; le cadrage et la solution de référence, si présents,
sont conservés. Les solutions utilisent les tags `bridge_solution`, `bridge_node`, `bridge_beam`.
Cette conversion valide les données ; elle ne certifie pas que le pont réussit la simulation.
Pour agrandir la campagne, ajouter aussi un pont de référence et les tests de faisabilité correspondants dans `test/`.

## Développer

```
npm install
npm run content     # MWL → données TypeScript + catalogue de traduction
npm run dev         # compile le contenu puis lance Vite (relancer content après une modification MWL)
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
| `content/*.mwl`, `tools/build-content.ts` | niveaux intégrés, tables de matériaux et véhicules, validation et génération |
| `src/data.ts`, `src/generated/content.ts` | types et données compilées (la masse suit la taille du véhicule) |
| `src/level.ts`, `src/levels.ts` | format de niveau (`LevelSpec`), validation des imports, niveaux du jeu |
| `src/editor.ts`, `src/editor-ui.ts` | éditeur de niveaux : opérations pures testées, puis interface |
| `src/scene.ts` | scène MWG : éditeur, simulation, interface (`Button`, `Bar`, `Window`, `Label`…) |
| `src/render.ts`, `src/art.ts` | dessin vectoriel (`Shape2D`) ; décor et véhicules en SVG (`loadBinary` + `sanitizeSvg` + `splitSvgGroups`, textures rasterisées à 2×) |
| `src/audio.ts` | effets sonores synthétisés (aucun fichier audio) |
| `test/` | tests du moteur + ponts de référence de chaque niveau (faisabilité des 3 étoiles incluse) |
| `MWG-FEEDBACK.md` | **manques et pistes d'amélioration constatés sur MWG** |

## Crédits

Graphismes : **SVG dessinés pour le jeu**, dans `assets/` (licences et découpage : `assets/README.md`).
Musique : **huit morceaux**, avec enchaînement automatique et commandes **Pause / Reprendre** et **Suivant**. Le menu **Musique** affiche les auteurs et licences ; sa liste défile avec la molette ou les boutons ↑/↓. **Sans musique** arrête la lecture et **Son OFF** suspend aussi l'accompagnement. Le choix, la pause et la visibilité de l'onglet sont indépendants de la vitesse de simulation.

- Gymnopédie n° 1 — Satie, Mutopia (domaine public), morceau par défaut.
- Méditation de Thaïs — Massenet, fichier MIDI (d’après Massenet), CC BY-SA 4.0.
- Marche turque, K. 331 — Mozart, Mutopia (domaine public).
- Les Sauvages — Rameau, version clavier des Nouvelles Suites (domaine public), dont le thème est repris dans Les Indes galantes ; ce fichier n'est pas l'opéra complet.
- Symphonie n° 7, II. Allegretto et Symphonie n° 5, I — Beethoven, mouvements complets orchestraux, Mutopia (domaine public).
- Ancient Mysteries — Sperry Lion, LLC (2024), CC0 ; Theme Song [8-bit] — nene, CC0.

Les sources, auteurs des saisies et licences sont conservés dans `assets/credits.json` et `dist/assets/CREDITS.txt`. Les compositions du domaine public restent sous leur licence de saisie ; la Méditation conserve sa licence CC BY-SA 4.0, jouée en MIDI par synthèse.

Les huit MIDI (~230 Ko) sont dans `assets/music/`, avec le SoundFont GM `assets/soundfonts/microgm-opt.sf2` fourni par MWG. Au build, `compile-resources` de MWG ne garde du SoundFont que les instruments réellement demandés par ces MIDI ; au lancement d'un morceau, `renderMidiToBufferAsync` le rend en PCM sur un worker (instruments échantillonnés, synthétiseur de MWG pour un programme absent) et le morceau se lit comme un tampon audio. Les symphonies sont jouées jusqu'au bout. Tout est embarqué et fonctionne hors ligne.

Pour ajouter un morceau : poser le `.mid` dans `assets/music/` et l'ajouter à `src/music-catalog.ts` ; le test `musique` vérifie que le SoundFont couvre ses instruments, et le build réduit le SoundFont en conséquence.

Simulation : départ arrêté, plafond de **50 km/h**, pente prise en compte, gravité de 9,81 m/s² pour le véhicule. Le moteur injecte une **puissance constante**, déduite du temps de 0 à 100 km/h de chaque véhicule (`zeroTo100` dans `content/catalog.mwl` : 10 s, 13 s, 17 s) : a(v) = 5000 / (t100 · v) en km/h/s, plafonnée à 20 km/h/s par l'adhérence à basse vitesse — on accélère donc fort au démarrage, puis de moins en moins en approchant du plafond. Sans appui, aucune motricité : élan horizontal conservé et chute sous gravité. **Temps réel** et **Ralenti ×½** partagent les mêmes pas de physique ; le ralenti prend deux fois plus de temps à les lire. Les roues tournent selon la distance réellement parcourue.



### MWG et poids des assets

Le jeu utilise `@datamoc/mwg` 0.39.1. Le build sélectionne les fichiers avec `assetFiles` :
les brouillons de `assets/garbage/` et les anciens cycles de marche/vélo ne sont pas embarqués.
Après `npm run build`, lancer `npm run assets:report` pour produire
`e2e/out/assets-report.json` (poids brut/gzip/brotli et doublons des assets sélectionnés).

Vérification audio locale après compilation : `npm run e2e:music` (lecture des huit morceaux, pause, enchaînement, sourdine et visibilité).
