# Retours sur MWG (`@datamoc/mw_games` 0.36.0) — constat pendant la construction de Pontifex

Format : besoin → ce que MWG offre → contournement → suggestion.

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

## Assets (images CraftPix)

26. **Le pipeline d'assets est le point fort** : `assets/` → `mwgPage({ assets: 'assets' })` → `await load([...])` → `SpriteSheet.grid()` / `AnimatedSprite` → tout est dans le HTML, sans `fetch`.
    8 planches de voitures + décor + nuages = 376 Ko de PNG → `standalone.html` passe de 250 Ko à 540 Ko. Aucun problème pour appeler `load()` *avant* `game.start()`.
27. **`SpriteSheet.grid(path, w, h)` suppose des images carrées connues d'avance** : les trois voitures du même pack n'ont pas la même taille d'image (192 px / 192 px / 256 px) et ni le même empattement ni la même marge sous les roues.
    Il a fallu une table à la main (`SHEET` dans `art.ts`) et un mauvais découpage silencieux (images déformées, aucun avertissement) avant de s'en apercevoir. → `grid(path)` pourrait déduire `frameHeight` de la hauteur de la planche (cas « bande horizontale ») et avertir quand `largeur % frameWidth != 0`.
28. **Taille du bundle** : `game.js` passe de 534 Ko à 690 Ko dès qu'on importe `assets`, `SpriteSheet`, `AnimatedSprite`, `Random` en plus de `Game`/`Window`/`Button` ; `mwg-size` aurait dû dire d'où ça vient, mais je ne l'ai pas lancé. À regarder : tree-shaking du barrel `two-d` (`export *` de render + ui + stage).
29. **Licence des images** : les packs ne portent qu'un lien vers craftpix.net/file-licenses (pas de texte). MWG pourrait fournir dans `compile-resources` un fichier `CREDITS` généré à partir d'un manifeste d'assets (`assets/credits.json`) — utile pour les packs gratuits à attribution.
