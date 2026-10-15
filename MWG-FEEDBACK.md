# Retours sur MWG (`@datamoc/mw_games` 0.36.0) — constat pendant la construction de Pontifex

Format : besoin → ce que MWG offre → contournement → suggestion.

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
