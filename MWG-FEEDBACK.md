# Retours sur MWG (`@datamoc/mw_games` 0.36.0) — constat pendant la construction de Pontifex

Format : besoin → ce que MWG offre → contournement → suggestion.

## Suivi après mise à jour vers 0.43.0 (17 octobre 2026)

MWG 0.43.0 répond à presque tous les points 35 à 50 ci-dessous, le jour même. Pontifex l'adopte (`npm run check` : 123 tests, 9 e2e) et **supprime ses contournements** :

| Point | Demande | 0.43.0 | Dans Pontifex |
|---|---|---|---|
| 35 | documenter MIDI → SoundFont | README + `AudioBus` (chargement MIDI par défaut) | déjà couvert par `compile-resources` ; `AudioBus` pas encore essayé |
| 36 | lecteur de musique | `MusicPlayer`, `toAudioBuffer` | **adopté** : `C:\Users\miche\dev\pontifex\src\music.ts` (`MusicPlayer` l.136, `start` l.141), le lecteur maison passe de 225 à ~180 lignes |
| 37 | assets jamais chargés, budget de page | rapports de poids et assets inutilisés dans le build | pas encore branchés (`npm run assets:report` à la main) |
| 38 | XPBD | `XpbdLink.data`, `breakLink`, `linksInBox`, `snapshot`/`hash` | **adopté** : `C:\Users\miche\dev\pontifex\src\physics.ts` l.109 (`data`), l.187 (`linksInBox` + `breakLink`), l.95 (`stateHash`) ; `segmentInBox` et `Object.assign` supprimés |
| 39 | MWL | `nodesToObjects`, unions générées depuis les tables, attributs optionnels documentés | **adopté** : `C:\Users\miche\dev\pontifex\tools\build-content.ts` l.40 ; contenu généré identique ; unions générées pas encore utilisées (`data.ts` les tient à la main) |
| 40 | tests : hook, compteur de lectures | `exposeForTests` (`window.__mwg_test__`), `Sound.plays` | pas encore : mes e2e lisent `window.__pontifex` et patchent `HTMLMediaElement.prototype.play` |
| 41 | dent de scie | `sawtooth` | **adopté** : `C:\Users\miche\dev\pontifex\src\audio.ts` l.13 |
| 45 | liste déroulante qui défile | `DropdownView` : `maxVisibleRows`, `autoWidth`, `handleKey`, `handleOutsideClick`, `fitBelow` | **adopté** : `C:\Users\miche\dev\pontifex\src\scene.ts` `createLevelPicker` l.784 ; `level-picker.ts` supprimé |
| 46 | textes longs | `ScrollText`, `MarqueeLabel`, `ellipsize`, `truncateLines` | **adopté** pour la consigne : `C:\Users\miche\dev\pontifex\src\scene.ts` `createHint` l.893 ; `scroll.ts` supprimé |
| 47 | `ScrollBox` | `touch` + inertie, `handleKey`, barre déplaçable, `autoHeight` | **adopté** pour la liste de musique : `C:\Users\miche\dev\pontifex\src\dialogs.ts` (`touch: true`) |
| 48 | transitions | `tileShrink`, `shrink`, `pop`, `grow`, `slide`, `iris`, `dissolve`, `Game.transition`, `Scene2D.transitionTo`, `Window.open/close` animés, réduction de mouvement | **adopté** : `C:\Users\miche\dev\pontifex\src\scene.ts` `goToLevel` l.236 (`tileShrink`) et `showWindow` l.608 (`pop`) ; `transitions.ts` supprimé |
| 49 | infobulles tactiles | `TooltipHost` (appui long, boutons désactivés), `Button.tooltip` | **adopté** : `C:\Users\miche\dev\pontifex\src\scene.ts` `feedPointerHelpers` l.879 ; mon suivi du pointeur supprimé |
| 50 | bouton à icône | `Button.setIcon`, `iconSelected`, `tooltip` | `tooltip` adopté ; `setIcon`/`iconSelected` pas encore (je change encore la texture du sprite à la main, `setButtonIcon`) |

### Nouveaux défauts trouvés en les adoptant (0.43.0)

51. **`ScrollBox` : la molette n'atteint pas la boîte tant qu'elle n'a pas de `hitArea`.** `ScrollBox` écoute `wheel` sur lui-même (`eventMode = 'static'`), mais l'événement ne remonte pas depuis les lignes qu'il contient : testé dans Chrome sur la liste de 35 niveaux, aucun `wheel` ne parvient à la boîte (0 événement) tant qu'on ne lui donne pas une zone de contact explicite ; avec `box.hitArea = Rectangle(0, 0, largeur, viewportHeight)` la molette marche aussitôt. Le glisser, les clics et le clavier marchent sans.
    La même chose vaut pour `DropdownView.scroller` et `ScrollText.box`. → `ScrollBox` devrait définir sa `hitArea` lui-même (et la mettre à jour dans `resize`/`setContentHeight`), comme un conteneur masqué qui défile.
    **Contournement dans Pontifex** : `C:\Users\miche\dev\pontifex\src\scroll-wheel.ts` `ensureWheelArea` (l.7), appelé chaque image pour la liste des niveaux et la consigne (`C:\Users\miche\dev\pontifex\src\scene.ts` l.1008-1009) et une fois pour la liste de musique (`C:\Users\miche\dev\pontifex\src\dialogs.ts`).
52. **Largeurs figées à la construction.** `DropdownView` et `ScrollText` n'ont pas de `resize(width)` : sur mobile (390 px), la liste des niveaux (290 px, plus `autoWidth`) faisait déborder la barre du haut et la consigne gardait sa largeur d'origine. → `resize(width)` sur les deux, et un `maxWidth` pour `autoWidth`.
    **Contournements dans Pontifex** : je recrée la liste quand la largeur ou la place disponible change (`C:\Users\miche\dev\pontifex\src\scene.ts` `createLevelPicker` l.784, appelé l.959) et la consigne (`resizeHint` l.901).
53. **Transition en cours.** Un clic de navigation pendant `Game.transition` ne change pas de niveau (comportement observé, plausible, mais non documenté : demande ignorée ? mise en file ?). Mes e2e attendent la fin (`Game.transitioning`, exposé par `scene.isTransitioning` `C:\Users\miche\dev\pontifex\src\scene.ts` l.232). → Documenter, et proposer `queue: true` / `interrupt: true`.
54. **`DropdownView` : ouverture sur la ligne choisie.** La doc annonce « opening with the chosen row in view » ; avec une sélection posée par `model.setHighlight()` + `model.confirm()` avant l'ouverture, la liste s'est ouverte à `offset = 0` (à vérifier : possible effet de mon appel, hors du chemin `onChange`).

## Bilan du 16 octobre au soir (MWG 0.42.0) — ce qui aiderait un jeu comme Pontifex

Constat de départ : en une journée, Pontifex a perdu son moteur de jeu et sa musique (voir BILAN.md), et sa page autonome pesait **4,0 Mo** dont
**3,5 Mo de SoundFont jamais lus**. Le correctif a consisté à utiliser MWG comme prévu : `compile-resources` réduit le `.sf2` aux seuls programmes des
`.mid` livrés, et `renderMidiToBufferAsync` rend le morceau sur un worker (page : 4,0 Mo → **1,4 Mo**, SoundFont 3,5 Mo → 0,8 Mo ; `src/music.ts` perd ~200 lignes
d'oscillateurs écrits à la main). Ce mécanisme existe et marche très bien, mais je ne l'ai trouvé que tard : le README du paquet n'en parle pas.

### À ajouter
35. **Documenter la chaîne MIDI → SoundFont** là où on la cherche (README, « Audio ») : `data/microgm-opt.sf2` est fourni, le build le réduit tout seul
    si un `.mid` est dans `assets/`, `missingProgram: 'synth'` comble les instruments absents. Je n'ai découvert tout cela que dans `data/microgm-opt.PROVENANCE.md`
    et `compile-resources.d.mts`, et j'ai écrit dans le point 34 (ci-dessus) que MWG ne fournissait aucun échantillon : c'était faux.
    **Contournement dans Pontifex** : aucun code à retirer, mais la configuration est répartie entre
    `C:\Users\miche\dev\pontifex\tools\runtime-assets.ts` l.6-14 (liste des fichiers livrés, `music/` et `soundfonts/` inclus pour que MWG réduise le `.sf2`),
    `C:\Users\miche\dev\pontifex\src\music-catalog.ts` l.1-2 (`SOUNDFONT_FILE`) et `C:\Users\miche\dev\pontifex\vite.config.mts` l.1-10 (`mwgPage`, réduction du SoundFont par défaut).


36. **Un lecteur de musique prêt à l'emploi** : `MidiPlayer` / `MusicPlayer` (charger, jouer, pause, reprise, position, `seek`, fin de morceau, enchaînement, volume).
    J'ai dû écrire ces 200 lignes autour de `renderMidiToBufferAsync` (la doc dit « prêt pour un `Channel` » mais aucun exemple ne montre le chemin complet).
    Et `RenderedMidi → AudioBuffer` : `toAudioBuffer(context, rendered)` (les `Float32Array<ArrayBufferLike>` rendus ne passent pas dans `copyToChannel` sans copie sous TS strict).
    **Contournement dans Pontifex** (à remplacer par le lecteur de MWG) : tout `C:\Users\miche\dev\pontifex\src\music.ts` (225 lignes), dont
    `BackgroundMusic` l.32 (état, pause, reprise), `position()` l.76 et `seek()` (relancer la source à un décalage), `createAudioGraph()` l.119
    (gain, analyseur, compresseur, réverbération), `start()` l.145 (chargement + rendu + copie), `playFrom()` l.174, `togglePause()` l.194, `update()` l.207
    (fin de morceau → suivant), et la conversion `RenderedMidi → AudioBuffer` avec copie forcée aux l.162-163 (`copyToChannel(new Float32Array(...))`).
    Le tirage au sort du morceau suivant (`drawTrackId`, l.7) est propre au jeu et reste.


37. **Détection des assets embarqués mais jamais chargés** : `compile-resources` embarque tout fichier à extension connue (point 32), donc 2,6 Mo de `.sf2` et 40 icônes SVG
    sont restés dans la page sans que rien ne le signale. Un rapport « jamais passé à `load()`/`loadBinary()` » (analyse statique ou `--check` avec la liste des chemins du code),
    et un budget `mwgPage({ maxPageBytes })` qui fait échouer le build, auraient attrapé les 4 Mo dès le premier jour.
    **Contournement dans Pontifex** : aucun ; le problème est passé inaperçu. Le seul filtre existant est
    `C:\Users\miche\dev\pontifex\tools\runtime-assets.ts` l.10-11 (exclusion de `garbage/` et des anciens cycles de marche). Le rapport de poids se lance à la main avec
    `npm run assets:report` (`C:\Users\miche\dev\pontifex\tools\report-assets.ts`) et ne signale pas les assets jamais chargés. À remplacer par la détection et le budget de MWG.


38. **XPBD** : (a) `XpbdWorld.breakLink(index)` public : pour un navire qui brise une poutre au contact, j'ai dû mettre `link.broken = true` et appeler
    `world.onBreak.dispatch` à la main ; (b) un type générique `XpbdLink<T>` (ou `userData`) : j'attache le matériau et l'index source avec `Object.assign` ;
    (c) requêtes géométriques de base (`linksInBox`, `linksNear`) ; (d) `snapshot()`/`hash()` pour les tests de déterminisme (je compare tous les nœuds à la main) ;
    (e) un exemple de « charge mobile » (véhicule qui roule sur des poutres via `applyForce`), c'est le cas d'usage central d'un jeu de pont.
    **Anciens contournements (supprimés en 0.43.0, sauf (e))** :
    (a) rupture forcée au contact d'un navire : `C:\Users\miche\dev\pontifex\src\physics.ts` l.216-217 (`link.broken = true` puis `world.onBreak.dispatch(...)`), dans `sailShips()` l.201-221 ;
    (b) données attachées aux poutres : `C:\Users\miche\dev\pontifex\src\physics.ts` l.19 (type `Link = XpbdLink & { mat; src }`) et l.134 (`Object.assign(this.world.links[index], { mat, src })`) ;
    (c) requête géométrique segment/rectangle : `C:\Users\miche\dev\pontifex\src\physics.ts` l.31-51 (`segmentInBox`, Liang-Barsky) ;
    (d) comparaison d'état pour le déterminisme, nœud par nœud : `C:\Users\miche\dev\pontifex\test\physics.test.ts` l.36 et `C:\Users\miche\dev\pontifex\test\ships.test.ts` l.71 ;
    (e) charge mobile du véhicule sur les poutres (`applyForce` par roue) : `C:\Users\miche\dev\pontifex\src\physics.ts`, méthode `settleOnRoad()` (fin de la classe).


39. **MWL** : (a) l'attribut optionnel (`'number?'`) est refusé par le schéma sans que la doc dise comment le déclarer ; (b) `build-content.ts` recopie à la main, tag par tag,
    les attributs d'un nœud compilé vers un objet JSON typé (`events`, `anchors`...) : un `nodesToObjects(roots, schema)` générique supprimerait ces 80 lignes et les erreurs
    de conversion ; (c) générer les types TypeScript d'une table (`MaterialId`, `VehicleDef['sprite']`) : les unions de `data.ts` ont divergé du catalogue (béton, train...) et cassé le typecheck.
    **Contournements dans Pontifex** :
    (a) « optionnel » : `C:\Users\miche\dev\pontifex\tools\mwl-schema.ts` l.13 — attributs déclarés obligatoires faute de syntaxe documentée (`'number?'` est refusé) ;
    (b) conversion nœud compilé → objet, à la main : `C:\Users\miche\dev\pontifex\tools\build-content.ts` l.39-42 (`numericAttributes`), l.43 (niveaux), l.55 (`events`), l.56 (assemblage du `spec`) ;
    et sa réciproque `C:\Users\miche\dev\pontifex\tools\convert-level.ts` l.24 et l.30 ;
    (c) unions TypeScript tenues à la main et qui ont divergé du catalogue : `C:\Users\miche\dev\pontifex\src\data.ts` l.3 (`MaterialId`), l.28 (`MATERIAL_ORDER`), l.39 (`VehicleDef['sprite']`),
    revalidées par `C:\Users\miche\dev\pontifex\tools\build-content.ts` l.22.


40. **Tests de rendu et d'audio** : un hook standard `exposeForTests(name, object)` (au lieu de mon `#debug → window.__pontifex`) ; `Sound` repose sur `HTMLAudioElement`, donc rien
    d'observable côté Web Audio : exposer un compteur de lectures (`Sound.stats`) pour vérifier un bruitage sans micro (mon e2e patche `HTMLMediaElement.prototype.play`).
    Trouver Chrome (`CHROME` ou chemin par défaut selon l'OS) pourrait être dans `BrowserDriver`, comme dans mes trois scripts `e2e/`.
    **Contournements dans Pontifex** :
    (a) hook de test `#debug → window.__pontifex` : `C:\Users\miche\dev\pontifex\src\scene.ts` l.186 ;
    (b) comptage des lectures audio par surcharge de `HTMLMediaElement.prototype.play` : `C:\Users\miche\dev\pontifex\e2e\sfx.mjs` l.14-20 et `C:\Users\miche\dev\pontifex\e2e\ships.mjs` l.22-26 ;
    (c) recherche du chemin de Chrome, recopiée dans chaque script : `C:\Users\miche\dev\pontifex\e2e\run.mjs` l.16, `C:\Users\miche\dev\pontifex\e2e\music.mjs` l.6, `C:\Users\miche\dev\pontifex\e2e\mobile.mjs` l.7, `C:\Users\miche\dev\pontifex\e2e\sfx.mjs` l.5, `C:\Users\miche\dev\pontifex\e2e\ships.mjs` l.9.


41. **`synthesizeSound`** : seules `square`, `triangle`, `sine`, `noise` existent ; une `sawtooth` donnerait des sirènes et moteurs plus crédibles (j'ai dû utiliser `square` pour la sirène des navires).
    **Contournement dans Pontifex** : `C:\Users\miche\dev\pontifex\src\audio.ts` l.13 (sirène des navires en `square` grave, `onShip()` l.24) et l.4 (`make`, fabrique de sons à pool).


### Ajouts du 17 octobre : défilement et transitions (demandés pendant la navigation entre niveaux)

45. **Défilement des listes déroulantes** : `DropdownView` déroule toutes ses lignes sans limite de hauteur (`rowHeight × options.length`) et sans défilement.
    Avec 9 niveaux, la liste occupe 340 px ; avec des niveaux de joueur, elle sort de l'écran. À ajouter : `maxVisibleRows` (ou hauteur maximale déduite du viewport),
    défilement molette / glisser tactile / flèches et Page↑/↓, `scrollIntoView` de la ligne sélectionnée à l'ouverture, et lignes qui restent cliquables pendant le défilement.
    Aussi dans `DropdownView` : fond opaque (les lignes translucides laissent voir le décor), fermeture au clic extérieur et sur Échap, largeur automatique selon le plus long libellé
    (le texte de « 3. Le Fleuve profond  (verrouillé) » était rogné à 210 px), et un état « ligne désactivée » plus lisible.
    **Ancien contournement (supprimé en 0.43.0, voir le suivi ci-dessus)** : `C:\Users\miche\dev\pontifex\src\level-picker.ts` (`LevelPicker`, l.14) remplace `DropdownView` :
    tête + liste dans un `ScrollBox` plafonnée à la place disponible (molette, glisser, Page↑/↓, flèches, Début/Fin, Entrée, Échap), ligne sélectionnée ramenée dans la vue, fond opaque ;
    branchement dans `C:\Users\miche\dev\pontifex\src\scene.ts` : `buildLevelNav` l.769, `refreshLevelNav` l.798, hauteur maximale l.931 (`levelPicker.setMaxHeight`). Reste manquant côté MWG : la fermeture au clic extérieur
    (je l'appelle depuis `onDown` de la scène) et la largeur automatique (`PICKER_WIDTH` fixé à la main).
46. **Défilement des textes longs** : `Label` ne défile pas et ne se tronque pas ; un texte plus long que son conteneur déborde simplement. Pontifex en a trois cas :
    la consigne du niveau, les crédits des morceaux et le message de résultat.
    **Ancien contournement (supprimé en 0.43.0)** : `C:\Users\miche\dev\pontifex\src\scroll.ts` `ScrollText` (l.61), un `Label` dans un `ScrollBox` plafonné à `maxHeight`, utilisé pour la consigne du niveau
    (`C:\Users\miche\dev\pontifex\src\scene.ts` l.117, `lblHint`, plafonnée à 58 px). Il mesure lui-même la hauteur du texte et recale le défilement à chaque `setText`/`setWrapWidth`. Pas encore appliqué aux crédits et au message de résultat
    (`C:\Users\miche\dev\pontifex\src\dialogs.ts` l.39 et l.161, fenêtres à hauteur fixe). À ajouter côté MWG : `ScrollText`, la troncature (`ellipsis`, `maxLines`) et le texte déroulant (marquee).
47. **`ScrollBox`** : (a) la molette est gérée (`handleWheel`) mais pas le **glisser** ni l'inertie : `C:\Users\miche\dev\pontifex\src\scroll.ts` `enableDragScroll` (l.14) l'ajoute (seuil de 6 px pour ne pas confondre avec un clic,
    clics des lignes suspendus pendant le glisser), appliqué à la liste de musique (`C:\Users\miche\dev\pontifex\src\dialogs.ts` l.154) et à la liste des niveaux ; les boutons ↑/↓ de la liste de musique restent (`dialogs.ts` l.172-173) ; (b) pas de défilement au clavier (Page↑/↓, Début/Fin, flèches) ni de `focus` ; (c) pas de défilement automatique vers un élément
    (`scrollIntoView` existe mais n'est jamais relié à la sélection) ; (d) l'indicateur (`track`/`thumb`) n'est pas cliquable ni déplaçable ; (e) un `ScrollBox` imbriqué dans une `Window`
    demande de calculer à la main `width = contentWidth - 48` pour laisser la place aux boutons (`dialogs.ts` l.152). → `ScrollBox` avec `touch: true`, `keyboard: true`, barre déplaçable et `autoHeight` (se cale sur son contenu jusqu'à un maximum).
48. **Transitions entre écrans** : `ScreenEffects` ne propose que `fadeOut`, `fadeIn`, `flash` et `hold` (un voile de couleur), et `Game.switchScene` change de scène instantanément.
    À ajouter : un `SceneTransition` qui photographie la scène sortante (`renderer.generateTexture`), installe la nouvelle dessous, puis anime la photographie :
    - **tuiles qui rétrécissent** (`tileShrink({ columns, rows, stagger, order: 'diagonal' | 'random' | 'spiral' })`) : la capture est découpée en tuiles qui réduisent (échelle 1 → 0, éventuellement avec rotation)
      en laissant apparaître la nouvelle scène qui était dessous ;
    - **jaillissement** (`burst`/`pop`) : la nouvelle scène (ou fenêtre) apparaît depuis un point, avec dépassement élastique (échelle 0 → 1,08 → 1) ;
    - **agrandissement** (`grow`/`zoomIn`) : la nouvelle scène grandit depuis un point d'origine (un bouton, le curseur) ; inverse `shrink` pour la fermeture ;
    et aussi `slide` (glissement), `iris`/`circleWipe` (cercle qui s'ouvre sur un point) et `dissolve`.
    API proposée : `Game.switchScene(Next, { transition: tileShrink({ columns: 8, rows: 5 }), duration: 0.6, easing: 'easeInOut' })`, `scene.transitionTo(swap, transition)` pour changer le contenu d'une même scène
    (c'est le cas de Pontifex : `loadLevel` remplace décor, véhicule et structure d'un coup), `Window.open({ animation: 'pop' | 'grow' | 'slide', from: Point })` et `Window.close` symétrique,
    `reducedMotion` respecté (voir point 6 du suivi 0.41), un signal `onDone`, la possibilité d'ignorer les entrées pendant la transition, et une pause de la simulation.
    **Ancien contournement (supprimé en 0.43.0)** : `C:\Users\miche\dev\pontifex\src\transitions.ts` — `TileShrink` (l.56) photographie l'écran de jeu (`renderer.generateTexture`) et le découpe en 8 × 5 tuiles
    qui rétrécissent en tournant, en diagonale depuis le coin haut gauche, par-dessus le niveau suivant (calcul pur `tileProgress` l.23, testé) ; `PopIn` (l.113) fait jaillir une fenêtre depuis son centre
    (`popPose` l.36 : 70 % → dépassement → 100 %) ; `prefersReducedMotion` (l.41) les désactive. Branchement : `C:\Users\miche\dev\pontifex\src\scene.ts` `captureForTransition` l.231 et `startTransition` l.239 (appelés par `loadLevel`),
    `showWindow` l.616 (toutes les fenêtres). Limites : pas d'`easing` nommé ni d'ordre configurable (diagonale seulement), pas de transition entre scènes (`switchScene` reste instantané), le pas de temps plafonné
    de MWG rallonge l'animation sur une machine lente, et un clic pendant les 0,3 s du jaillissement vise la fenêtre en mouvement (mes e2e attendent la fin : `scene.pops` vide).
    Pas encore faits : jaillissement depuis un point (le bouton cliqué), agrandissement/rétrécissement à la fermeture des fenêtres.
49. **Infobulles tactiles** (suite du point 40) : `Tooltip` s'appuie sur le survol, donc rien sur mobile. À ajouter : déclenchement par appui long avec le même `delay` et fermeture au relâchement, et un
    `TooltipHost` qui gère les cibles (zones rectangulaires, y compris **désactivées**) : j'ai dû tester les bornes des boutons à la main parce qu'un `Button` désactivé passe en `eventMode = 'none'` et ne reçoit plus
    `pointerover` (`C:\Users\miche\dev\pontifex\src\scene.ts` l.853-875, `trackScreenPointer` et `updateTooltip`, avec les écouteurs du canevas). Un bouton grisé est justement celui qu'on veut expliquer.
50. **Bouton à icône** : `Button` accepte `icon` et `text`, mais ni infobulle intégrée (`tooltip: string | () => string`), ni changement d'icône à l'exécution (`setIcon(texture)`), ni état « bascule » avec deux icônes.
    Pontifex tient pour cela une table `buttonIcons`/`tips` (`C:\Users\miche\dev\pontifex\src\scene.ts` l.119-125 et `iconButton`, `setButtonIcon` l.668-690).

### À enlever ou simplifier
42. **Deux noms de paquet** (`@datamoc/mwg`, alias, et `@datamoc/mw_games`, réel) : les chemins, erreurs et docs citent `mw_games` alors que le code importe `mwg`.
    Les fichiers de données (`@datamoc/mw_games/data/...`) ne sont atteignables que par le vrai nom. Un seul nom, ou aucune référence à l'autre dans les messages.
    **Contournement dans Pontifex** : aucun code ; c'est une règle à retenir (importer `@datamoc/mwg/...`, chercher les fichiers sous `node_modules\@datamoc\mw_games\...`,
    ex. `node_modules\@datamoc\mw_games\data\microgm-opt.sf2`).


43. **Trois chemins audio qui se recoupent** : `Sound` (éléments `<audio>`), `Channel` (tampons Web Audio) et le rendu MIDI. Un seul point d'entrée « jouer un son / un morceau »
    avec les mêmes options (gain, hauteur, pan, boucle) éviterait de choisir selon des détails d'implémentation.
44. **Garde-fou contre la perte de travail** (hors MWG mais vécu aujourd'hui) : `mwg-init` pourrait générer un hook `pre-commit` lançant typecheck + tests, et un `.gitignore`
    qui exclut les dossiers d'outils d'agents (`.opencode/`, `.coord-session`) : 46 fichiers de verrous traînent dans le dépôt de Pontifex.
    **Contournement dans Pontifex** : aucun hook ; `.opencode/` et `.coord-session` sont suivis par git (voir `C:\Users\miche\dev\pontifex\BILAN.md`, problème 6).


## Suivi après mise à jour vers 0.41.0 (16 octobre 2026)

### **Optimisations réalisées dans Pontifex (CLOS)**
- **SoundFont `microgm-opt`** : ~~points marqués « CLOS » le 16 octobre~~ — **faux, corrigé le soir même**. Le fichier n'avait pas été réduit
  (2,6 Mo embarqués tels quels), et le `src/music.ts` d'alors lisait le SoundFont avec `fs`/`path` de Node, donc ne marchait pas dans le navigateur
  (silence). Fait réellement depuis : voir « Bilan du 16 octobre au soir » ci-dessous.

- **Assets** :
  - ✅ **CLOS** : Génération d'un rapport d'assets avec `asset-report.mjs` pour identifier les optimisations possibles.
  - ✅ **CLOS** : Conversion des spritesheets en WebP (réduction de 65-70% de la taille).
  - ✅ **CLOS** : Optimisation des fichiers SVG avec SVGO (réduction de 20-50% de la taille).

### **Critiques constructives et demandes d'évolutions pour MWG 0.41.0**

#### **1. SoundFonts**
- **Problème** : `microgm-opt` est lourd (2,6 Mo) pour un jeu léger comme Pontifex.
- **Demande** :
  - Documenter `subsetSoundFont` avec un exemple pour réduire un SoundFont.
  - Fournir un SoundFont ultra-léger (< 500 Ko) avec uniquement les instruments essentiels.
  - Permettre un fallback pour les instruments manquants (ex: synthétiseur basique).

#### **2. Physique (XPBD)**
- **Problème** : Pas de documentation claire sur l'utilisation de `XpbdWorld` pour des simulations complexes comme les ponts.
- **Demande** :
  - Ajouter un exemple pour créer un monde XPBD avec des contraintes personnalisées (ex: câbles, poutres).
  - Fournir un exemple complet pour simuler un pont.

#### **3. Assets**
- **Problème** : Pas d'outil intégré pour convertir les images en WebP.
- **Demande** :
  - Intégrer `webp-convert` dans `compile-resources` pour convertir automatiquement les images en WebP.
  - Ajouter une option pour optimiser les SVG avec SVGO.

#### **4. Interface utilisateur (UI)**
- **Problème** : Pas d'exemple pour utiliser les thèmes de MWG dans une interface complexe.
- **Demande** :
  - Documenter les thèmes avec un exemple pour créer et utiliser un thème personnalisé.
  - Fournir un exemple complet pour décrire une interface (ex: HUD, fenêtres) en MWL.

#### **5. Performances**
- **Problème** : Pas de documentation sur l'utilisation de `SpriteGroup` pour optimiser le rendu.
- **Demande** :
  - Documenter `SpriteGroup` avec un exemple pour animer uniquement les sprites visibles à l'écran.
  - Documenter `ColorTransformBatcher` avec un exemple pour utiliser `TintedSprite`.

#### **6. Accessibilité**
- **Problème** : Pas d'exemple pour utiliser `reducedMotion` dans les animations.
- **Demande** :
  - Ajouter un exemple pour adapter les animations en fonction de `prefers-reduced-motion`.

#### **7. Sauvegardes**
- **Problème** : Pas d'exemple pour utiliser `SaveSystem` avec des données personnalisées.
- **Demande** :
  - Documenter `SaveSystem` avec un exemple pour sauvegarder et restaurer l'état du jeu.
  - Documenter `StateRegistry` avec un exemple pour gérer l'état du jeu.

#### **8. Dialogues et scripts**
- **Problème** : Pas d'exemple pour utiliser `parseDialogueLines` ou `parseTwee`.
- **Demande** :
  - Ajouter un exemple pour parser et afficher des dialogues avec `parseDialogueLines`.
  - Fournir un exemple pour importer un script Twee dans une scène.

#### **9. Tests**
- **Problème** : Pas d'exemple pour utiliser `Recorder` et `Player` pour les tests de replay.
- **Demande** :
  - Documenter `Recorder` et `Player` avec un exemple pour enregistrer et rejouer des actions du joueur.

#### **10. Documentation**
- **Problème** : Documentation dispersée et manque de tutoriels complets.
- **Demande** :
  - Centraliser la documentation avec des exemples pour chaque module.
  - Ajouter un tutoriel pour créer un jeu de pont comme Pontifex.

## Suivi après mise à jour vers 0.39.1 (15 octobre 2026)

- **Nom court adopté** : dépendance directe et imports migrés vers `@datamoc/mwg` 0.39.1.
  L’ancien paquet n’est plus une dépendance directe ; l’alias le charge en version 0.39.1.
- **Pièces SVG (30)** : les trois véhicules utilisent `loadSvgParts`, avec cache à résolution 2×
  et ordre des groupes conservé. Le code d’enregistrement Pixi correspondant a été supprimé.
- **Personnages** : `loadSvgSkeleton` remplace l’isolation, le recentrage et la normalisation
  des membres des piétons et du cycliste. Les adaptations des dessins (cuisse dégroupée,
  corps fixe du vélo) et les pivots du manifeste restent propres au jeu. Les textures sont
  partagées entre instances ; les sprites temporaires de chargement sont détruits.
- **Articulations** : les pieds du cycliste suivent les pédales via `solveTwoBoneIK` ;
  les tests existants vérifient toujours un tour complet.
- **Ailes** : `DeformableSprite.dragVertices` remplace les écritures dans les buffers Pixi.
  Les positions cibles sont réutilisées et chaque aile effectue un seul envoi GPU par mise à jour.
  L’amplitude de 20 unités, les attaches fixes et les UV sont conservés.
- **Filtrage des assets (32)** : `assetFiles` exclut `garbage/` et les anciens cycles
  de marche/vélo directement depuis `assets/`, sans copie intermédiaire. Le manifeste source
  reste intact, y compris ses métadonnées historiques inutilisées.
- **Poids et doublons (28)** : `npm run assets:report` après le build produit
  `e2e/out/assets-report.json` avec les poids brut/gzip/brotli et les doublons des seuls
  assets sélectionnés. Le rapport reste hors du répertoire distribué.

Les effets de tissu, ressort, brume et néon sont disponibles mais ne remplacent aucun
besoin actuel du jeu. La composition MWL de l’interface proposée au point 33 reste à migrer ;
ce changement concerne les API d’assets, d’animation et de build de la version 0.39.

## Suivi après mise à jour vers 0.37.0 (14 octobre 2026)

Les constats ci-dessous restent l'historique de la version 0.36.0. La version 0.37.0 répond à plusieurs demandes :

- **Adopté dans Pontifex** : `synthesizeSound` (6), `FixedStepper` (7), `XpbdWorld` sans dépendance Matter.js (8), `Button.setSelected` (10), fermeture visible des fenêtres (12), `Label.setWrapWidth` (13), `Camera.fit` (15), `ParticleEmitter.burst` avec position et teinte par matériau (19), `Shape2D.dashedLine` (20).
- **Corrigé ou ajouté dans MWG** : suppression du top-level await des outils (2), suppression du bruit `EMPTY_IMPORT_META` (3), générateur `mwg-init` (4), version du README (5), `DropdownView` (9), `flowLayout` (11), `Input.attachPointer` (16), exports `StoredValue` et `defaultStorage` (17), glisser dans `BrowserDriver` (25), avertissement de découpage et `SpriteSheet.strip` (27), génération des crédits depuis `assets/credits.json` (29).
- **Conservé dans Pontifex** : les interactions Pixi, les sauvegardes existantes via `Settings`, la disposition de la barre d'outils et le pilote Puppeteer. Ces mécanismes fonctionnent avec 0.37.0 ; leur remplacement demanderait une migration supplémentaire.
- **Nom court (1)** : l'alias `@datamoc/mwg` est préparé dans MWG, mais sa publication reste indiquée comme une étape séparée dans le changelog. Pontifex utilise toujours `@datamoc/mw_games`.

La simulation conserve les paramètres d'origine (masse des nœuds, densité des poutres, rigidité, résistances, amortissement et délai avant rupture). Le véhicule, les niveaux et les conditions de victoire restent gérés par Pontifex.

## Installation / outillage

1. **Nom du paquet** — la demande parlait de `@datamoc/mwg`, introuvable sur npm ; le vrai nom est `@datamoc/mw_games`
   (le README, lui, titre « mwg »). → Suggestion : réserver/rediriger `@datamoc/mwg` (paquet vide qui pointe vers le bon), ou aligner les noms.
2. **`vite.config.ts` ne charge pas** dans un projet sans `"type": "module"` : `tools/vite.mjs` contient un top-level await,
   Vite charge la config en CJS → `ERR_REQUIRE_ASYNC_MODULE`. Contournement : `vite.config.mts`. → Suggestion : le dire dans le README de `mwgPage`, ou retirer le TLA.
3. **Avertissements `EMPTY_IMPORT_META`** à chaque build (format iife + `import.meta` du preload-helper de Vite) : bruit de 2 écrans. → `mwgPage()` pourrait injecter `define: {'import.meta': '{}'}` / `onwarn`.
4. **Pas d'exemples dans le tarball npm** alors que « Best Practices » dit « copiez l'exemple le plus proche ». Il n'y a que `dist/` + `tools/`. → Publier `examples/` (ou un `npm create` / `mwg-init`).
5. Le README annonce « pre-alpha (v0.31.0) » alors que le paquet est en 0.36.0.

## Audio

6. **`new Sound(synthesizeTone(...))` plante** : `synthesizeTone` renvoie un `data:audio/wav;base64,…`, mais `Sound(path)` passe par le registre d'assets
   (`asset "data:audio/wav…" is not in this build - check it is under the folder passed to compile-resources`). Les deux fonctions du même module ne se composent donc pas.
   L'erreur est une *promesse rejetée* levée dans `Game.start` → **écran noir total** (le jeu entier ne démarre pas parce qu'un effet sonore échoue).
   Contournement : `new Sound(uri, { create: (u) => new Audio(u) })`.
   → Suggestions : (a) `Sound` accepte les URI `data:`/`blob:` telles quelles ; (b) `synthesizeSound(opts): Sound` prêt à l'emploi avec pool ;
   (c) un son manquant ne devrait jamais empêcher le démarrage (avertissement + silence), au moins en production.

## Boucle de jeu et physique

7. **`Scene.update(dt)` est à pas variable** (`Game.elapsed = min(delta, maxDelta) * timeScale`), alors que le README parle de « fixed-step game loop ».
   Un jeu de simulation (ici : XPBD pour un pont) doit refaire son accumulateur à pas fixe pour rester déterministe et indépendant du taux de rafraîchissement.
   → Suggestion : `Scene2D.fixedUpdate(step)` avec accumulateur + `maxSubsteps`, ou un petit `FixedStepper` dans `core` (même rôle que `Tweener` : 10 lignes, utile partout).
8. **Pas de physique continue.** `mwg/simulation` ne fait que des commandes/tours ; rien pour un solveur de contraintes (Verlet/XPBD), des corps rigides ou des ressorts.
   Les jeux de construction/puzzle physique sont pourtant un très bon fit pour « un jeu = un fichier HTML ». → Suggestion : module optionnel `mwg/physics` (XPBD en pas fixe, déterministe,
   sérialisable, testable sans rendu) ; j'ai écrit le mien dans `src/physics.ts` (≈250 lignes, 16 tests) et il pourrait servir de base.

## Interface (`two-d/ui`)

9. **`Dropdown` n'a pas de rendu** : c'est un modèle (options, index, highlight), pas un widget. Il n'existe donc pas de liste déroulante prête à l'emploi ;
   j'ai construit le sélecteur de niveau avec `Window` + `Button`. → Soit un `DropdownView`, soit le dire dans la doc du modèle.
10. **`Button` n'a pas d'état « sélectionné/actif »** (toggle) : l'outil courant est signalé en préfixant « ● » au texte. `RadioGroup`/`Checkbox` existent mais je n'ai pas trouvé comment leur donner l'apparence d'un `Button`.
    → `Button.setSelected(bool)` avec une teinte de thème (`color.selection` existe déjà).
11. **Pas de disposition « flux avec retour à la ligne »** : `Layout` offre ancrages et `Grid`, mais une barre d'outils qui passe sur 2 lignes sur mobile demande un calcul à la main (`layoutHud`).
    → `flowLayout(items, width, {gap, align})` renvoyant la hauteur.
12. **`Window({closable: true})` n'a pas d'affordance visible de fermeture** : pas de ✕, titre minuscule aligné à gauche. Elle se ferme par l'action `cancel` (Échap, une fois `Input.onAction` relié à `WindowStack.handleAction`) ou par un clic à l'extérieur (`handleOutsideClick`) — deux comportements corrects mais invisibles pour un joueur tactile. J'ai ajouté un bouton « Fermer ». → un ✕ optionnel dans le titre.
13. **`Label` n'expose pas le retour à la ligne après coup** : `wrapWidth` n'est lu qu'à la construction ; pour l'adapter à la largeur de l'écran j'ai modifié `label.style.wordWrapWidth` (API Pixi, hors façade).
    → `Label.setWrapWidth(px)`.
14. *(non confirmé)* En capture headless sous Linux, l'emoji 🔒 d'un `Label` s'affichait comme un glyphe cassé ; probablement un manque de police emoji de cette machine, pas de MWG. Retiré du jeu, non vérifié ailleurs.

## Rendu, entrées, état

15. **Pas de résolution virtuelle / letterbox** : `Game` adapte le renderer à la fenêtre, mais un monde de taille fixe (800×550) doit être cadré à la main.
    `Camera.setViewport(w, h, screenX, screenY)` + `zoom` + `snapTo` le fait très bien (c'est ce que j'utilise, et `camera.shake` gratuit) — mais ce n'est écrit nulle part comme « recette ». → Un exemple/une doc « fixed-size world » ou `Camera.fit(worldW, worldH)`.
16. **Pas d'abstraction pointeur/glisser** dans `core/Input` (seulement `attachSwipe`) : j'utilise directement les événements fédérés de Pixi (`pointerdown/move/up` sur un conteneur avec `hitArea`), ce qui marche pour souris + tactile,
    mais sort de la façade MWG. → `Input.pointer` (down/move/up/drag, coordonnées monde via une `Camera`).
17. **`StoredValue` et `defaultStorage` ne sont pas exportés** par `@datamoc/mw_games/core` (confirmé par typecheck : TS2305 ; ils existent dans `Save.d.ts`/`StoredValue.d.ts`). `Settings.custom` n'accepte que `string|number|boolean` :
    j'ai stocké la progression en JSON dans une chaîne. → Exporter `StoredValue`, ou laisser `Settings.custom` porter du JSON.
18. **`onAction` n'est exporté que via l'espace de noms `Input`** (`export * as Input from './Input.ts'`) : `import { onAction } from '@datamoc/mw_games/core'` est une erreur TS, il faut `Input.onAction`. Facile à rater en lisant `Input.d.ts` ; à mentionner dans le README.
19. **`ParticleEmitter.burst(count)`** émet à la position de l'émetteur avec la teinte globale : pour des éclats de couleurs différentes selon la poutre cassée il faut déplacer l'émetteur ou en créer un par matériau.
    → `burst(count, {x, y, tint})`.
20. **`Shape2D` (Graphics)** : suffisant pour un jeu vectoriel (polygones, traits, dégradés via `Gradient`) — vraiment agréable. Manque : trait pointillé (`dash`) ; je l'ai refait segment par segment.
21. **`Sound.play(gain, pitch)`** permet une variation de hauteur aléatoire à chaque coup (utile pour des effets répétés) : je ne l'ai trouvé que dans le `.d.ts`. À mettre en avant dans le README.

## Outillage / build

22. **Chaîne `mwgPage()` → `emitPage` → `buildSingleFile` : très bonne surprise.** Un `vite build` produit directement `standalone.html` (≈250 Ko avec gzip+base64 pour Pixi + MWG + le jeu), CSP incluse, qui s'ouvre en double-clic.
    Vérifié par capture depuis `file://`.
23. `mwgPage({ singleFile: { compress: true } })` : `singleFile` est typé `boolean | Omit<SingleFileOptions,'dist'>` — OK, mais le README ne mentionne pas `singleFile`/`standalone.html` du tout (grep) ; je l'ai trouvée dans `emit-page.d.mts`.
24. Ici `node` 22.22.1 était compilé **sans support TypeScript** (`ERR_NO_TYPESCRIPT`) : « Plain `.ts` sources under Node's built-in test runner » demande donc un Node avec type-stripping ; sinon `tsx`. À préciser dans Best Practices.
25. `mwg-smoke` / `browser-driver` offrent `tap(x, y)` et `screenshot()` mais pas de **glisser** (down → move → up) : j'ai écrit mon propre pilote avec `puppeteer-core`. → `drag(from, to)` dans `BrowserDriver`.

## Assets (images CraftPix, puis SVG)

26. **Le pipeline d'assets est le point fort** : `assets/` → `mwgPage({ assets: 'assets' })` → `await load([...])` → `SpriteSheet.grid()` / `AnimatedSprite` → tout est dans le HTML, sans `fetch`.
    8 planches de voitures + décor + nuages = 376 Ko de PNG → `standalone.html` passe de 250 Ko à 540 Ko. Aucun problème pour appeler `load()` *avant* `game.start()`.
27. **`SpriteSheet.grid(path, w, h)` suppose des images carrées connues d'avance** : les trois voitures du même pack n'ont pas la même taille d'image (192 px / 192 px / 256 px) et ni le même empattement ni la même marge sous les roues.
    Il a fallu une table à la main (`SHEET` dans `art.ts`) et un mauvais découpage silencieux (images déformées, aucun avertissement) avant de s'en apercevoir. → `grid(path)` pourrait déduire `frameHeight` de la hauteur de la planche (cas « bande horizontale ») et avertir quand `largeur % frameWidth != 0`.
28. **Taille du bundle** : `game.js` passe de 534 Ko à 690 Ko dès qu'on importe `assets`, `SpriteSheet`, `AnimatedSprite`, `Random` en plus de `Game`/`Window`/`Button` ; `mwg-size` aurait dû dire d'où ça vient, mais je ne l'ai pas lancé. À regarder : tree-shaking du barrel `two-d` (`export *` de render + ui + stage).
29. **Licence des images** : les packs ne portent qu'un lien vers craftpix.net/file-licenses (pas de texte). MWG pourrait fournir dans `compile-resources` un fichier `CREDITS` généré à partir d'un manifeste d'assets (`assets/credits.json`) — utile pour les packs gratuits à attribution.
30. **Passage au 100 % SVG (0.36.1)** : `loadBinary` (le texte du fichier) → `sanitizeSvg` → `splitSvgGroups` → `svgDataUri` + `Assets.add({ alias, src, format: 'svg', data: { resolution } })` fait un véhicule recomposable (roues au moyeu, capot sur son pivot) sans planche de sprites. Les trois quarts de la chaîne sont dans la façade, le dernier pas se fait à la main chez Pixi. → `loadSvgParts(path, { resolution })` qui enchaîne les quatre et renvoie `Record<groupe, Texture>` ; `splitSvgGroups` est parfait en l'état (viewBox conservé, **ordre des groupes conservé** — c'est l'ordre d'empilement du dessin, précieux et non documenté).
31. `load(paths, { resolution })` est exactement ce qu'il faut pour du vectoriel (2× pour rester net sous une caméra qui cadre), mais l'option n'est écrite que dans `loader.d.ts`, pas dans le README — comme `Sound.play(gain, pitch)` (item 21). Une ligne dans « Loading assets » suffirait.
32. **Aucune surprise sur 14 dessins** : `sanitizeSvg` n'a rien refusé, les textures SVG sont nettes à 2×, et le coût est négligeable (21 Ko de source → `standalone.html` de 298 Ko au total). En revanche `compile-resources` embarque **tout** fichier à extension connue, sans exclusion possible : un simple apercu PNG de 175 Ko rangé dans le dossier d'assets a fait gonfler la page à 517 Ko jusqu'à ce qu'on le déplace hors du dossier. → une option `include`/`exclude` dans `mwgPage({ assets })`, ou au moins un log des fichiers embarqués.

## Proposition : scènes, interface et biomes décrits en MWL

33. **Étendre l'écriture déclarative au-delà des niveaux** (14 octobre 2026).
    Pontifex compile maintenant les niveaux, matériaux et véhicules depuis MWL. En revanche,
    `PontifexScene.buildHud`, `layoutHud`, les fenêtres de résultats/sélection/confirmation et
    `LevelEditor` construisent encore l'interface en TypeScript ; `render.ts` fixe les couleurs du décor.
    L'ajout de biomes multiplierait ces choix de présentation dans le code.

    **Existant vérifié dans MWG 0.37.0** : schémas MWL extensibles, compilation et extraction i18n ;
    widgets `Button`, `Label`, `Bar`, `Window` ; `setTheme`, `themeChanged` et restylage des widgets ;
    ancrages et helpers de layout. La fonctionnalité demandée est leur composition depuis MWL,
    avec validation à la compilation, et non un second moteur de widgets ou de simulation.

    **Fonctionnalités proposées à MWG** :

    - Un vocabulaire optionnel pour les scènes et arbres d'interface : couches du monde,
      caméra, interface à l'écran, fenêtres, conteneurs, boutons, libellés, barres et composants réutilisables.
      Les définitions compilées instancient les widgets existants et exposent leurs identifiants typés.
    - Des layouts déclaratifs utilisant les helpers actuels : ancrages, lignes avec retour,
      colonnes et grilles. Les collections dynamiques (matériaux, niveaux personnalisés) doivent
      utiliser des modèles répétés avec une clé stable, et garder le focus lors des mises à jour.
    - Des références à des actions et valeurs déclarées par le jeu : texte, valeur/max d'une barre,
      sélection, visibilité et désactivation. Le compilateur vérifie ces noms contre un manifeste
      TypeScript ; aucun corps JavaScript arbitraire dans le contenu. Le contrôleur produit l'état
      d'interface formaté et implémente les actions, les dialogues de saisie et la simulation.
    - Des thèmes MWL avec des tokens sémantiques (`panel`, `text`, `accent`, `success`, `warning`,
      `danger`) et des variantes de composants. Les couleurs explicites actuelles de Pontifex
      doivent devenir des références à ces tokens pour suivre un changement de biome.
    - Des variantes de scène et d'interface sélectionnables par contexte. Pontifex décrit ses biomes
      dans son propre schéma : palette du ciel/roche/eau, références de décor, thème UI et variantes
      de composants. MWG fournit la résolution générique des thèmes et variantes, sans imposer
      une notion de biome à tous les jeux. Ordre explicite : base, biome, variante de composant,
      état du composant ; les indicateurs de danger et sélection restent identifiables.
    - Un cycle de vie commun : montage, mise à jour, redimensionnement et destruction qui détache
      événements et abonnements. Une variante de biome ne doit ni réinitialiser le pont ni dupliquer
      les callbacks. Le registre de composants accepte des adaptateurs propres au jeu pour le rendu
      procédural, les SVG recomposés et les effets.
    - Une compilation intégrée au build : diagnostics fichier/ligne, références d'assets/thèmes/
      composants/actions, catalogue i18n et sortie déterministe. Le HTML autonome consomme les
      définitions compilées sans parseur MWL ni requête réseau au démarrage.

    **Exemple de forme envisagée — proposition, pas une API disponible** :

    ```json5
    [
      { tag: 'biome', id: 'alpine', theme: 'alpine-ui', scene_variant: 'alpine-world' },
      { tag: 'ui_component', id: 'play-controls', children: [
        { tag: 'ui_row', wrap: true, gap: 8, children: [
          { tag: 'ui_button', id: 'test', text: _("▶ Tester"), action: 'toggleSimulation',
            disabled_binding: 'cannotTest', style: 'primary' },
          { tag: 'ui_bar', id: 'budget', value_binding: 'bridgeCost', max_binding: 'budget',
            color_binding: 'budgetStatusColor' },
        ] },
      ] },
      { tag: 'scene_definition', id: 'bridge-game', controller: 'pontifex', children: [
        { tag: 'scene_layer', id: 'world', space: 'world', adapter: 'bridgeWorld' },
        { tag: 'ui_mount', id: 'hud', component: 'play-controls', anchor: 'bottom' },
      ] },
    ]
    ```

    **Ordre d'adoption proposé dans Pontifex** : d'abord les tokens et le biome par défaut
    (valeurs visuelles actuelles), puis le HUD et la barre de l'éditeur, ensuite les fenêtres et
    enfin la composition des couches de scène. Le rendu animé/procédural et les règles du pont
    restent des adaptateurs TypeScript référencés par la description. Chaque niveau porte un
    identifiant de biome ; les anciens niveaux JSON sans ce champ prennent le biome par défaut.
    Import/export, édition et sauvegarde doivent conserver cet identifiant et refuser les références inconnues.

    **Critères d'acceptation** : HUD et éditeur utilisables en fenêtre étroite ; textes et listes
    dynamiques mis à jour ; clavier/focus et comportement modal conservés ; changement de biome
    pendant l'édition sans perte de structure ; palette, décor et variantes UI appliqués ensemble ;
    destruction sans abonnement résiduel ; erreurs de référence détectées au build ; tests physiques
    inchangés et parcours navigateur existant conservé. MWL reste une option du framework.

    Ce point prépare une demande à MWG. Il ne constitue ni une implémentation de ces tags dans
    Pontifex, ni une demande publiée auprès des mainteneurs.

## Musique : échantillons d'instruments (16 octobre 2026) — **obsolète : voir le point 35**

34. **Aucun échantillon d'instrument fourni** : MWG sait lire et tailler des SoundFont
    (`parseSoundFont`, `subsetSoundFont`, `collectSoundFontUsage`, `renderMidiToBuffer`),
    mais le paquet ne contient aucune `.sf2` et le README n'en parle pas. Pontifex joue donc
    ses huit MIDI avec un synthétiseur à oscillateurs écrit pour le jeu (timbre par famille GM,
    filtre, réverb synthétisée), faute d'échantillons embarquables.
    Mesuré avec FluidR3 GM (148 Mo) : `subsetSoundFont` pour les 21 presets réellement
    utilisés par les huit morceaux donne encore **54 Mo**, et le piano seul **7,5 Mo**
    (stéréo 44,1 kHz, toutes les couches de vélocité conservées) — incompatible avec une
    page autonome sous le Mo. → Suggestions : (a) fournir un micro-SoundFont GM optionnel
    et léger (mono, 22 kHz, une couche de vélocité, quelques splits par instrument : piano,
    cordes, vents, cuivres, guitare, percussions) pensé pour `parseSoundFont` ; (b) donner à
    `subsetSoundFont` des options de réduction (fréquence cible, mono, couches de vélocité,
    durée maximale des échantillons) pour produire des sous-ensembles de quelques centaines
    de Ko. Quelques échantillons bien choisis amélioreraient plus la musique qu'un synthétiseur.
