# Assets : des SVG faits pour le jeu

Tout l'art du jeu est vectoriel et original : voitures, camion, arbres, buissons, rochers,
nuages, flamme et explosion sont des fichiers SVG d'ici, **committés dans le dépôt** — aucune
image tierce, rien à télécharger avant de construire.

```
assets/
  car.svg jeep.svg truck.svg      véhicules, découpés en groupes nommés (voir plus bas)
  tree_round.svg tree_fir.svg     décor des rives
  bush.svg rock1.svg rock2.svg rock3.svg
  cloud1.svg cloud2.svg           nuages dérivés
  flame.svg explosion.svg         effets du véhicule détruit
  svg/sprites.svg                 planche d'origine (démo/demo.html)
  manifest.json                   géométrie de chaque dessin : source unique pour art.ts
```

L'aperçu rendu de tous ces dessins est dans `preview/sheet.png` (hors `assets/`, pour ne pas
être embarqué dans le HTML).

## Comment le jeu les consomme

`mwgPage({ assets: 'assets' })` compile chaque fichier en `data:` URI dans la page : le jeu
fonctionne en double-clic, hors ligne, sans `fetch`. `src/art.ts` fait ensuite deux choses
différentes selon le fichier :

- **décor et effets** : `load([...], { resolution: 2 })` — la texture entière, rasterisée à
  2× pour rester nette quand la caméra cadre un niveau ;
- **véhicules** : `loadBinary` lit le *texte* du SVG, qui passe par `sanitizeSvg` (refuse par
  nom tout ce qui n'est pas prouvé inerte) puis `splitSvgGroups` : chaque `<g id="…">` devient
  une texture à part, recomposée ensuite dans `Vehicle`. C'est ce qui permet de faire tourner
  les roues autour de leur moyeu et d'ouvrir le capot à l'écrasement, sans planche de sprites.

## Écrire un véhicule

Un véhicule est **un SVG, un seul dessin**, découpé en groupes de premier niveau :

| groupe | rôle |
| --- | --- |
| `wheel-…` | une roue, dessinée **autour de son moyeu** : la position du moyeu (`at` dans le manifeste) est aussi le point de pivot |
| `body` | la carrosserie |
| `engine` | le moteur, visible quand le capot est ouvert |
| `hood` | le capot, avec `data-pivot="x y"` (redondant avec `hood.pivot` du manifeste) |

L'ordre des groupes dans le fichier est l'ordre d'empilement (roues derrière la carrosserie).
Le `viewBox` est le cadre du dessin : toutes les parties gardent le même, elles se superposent
donc exactement comme elles ont été dessinées.

`manifest.json` décrit ensuite la géométrie que la physique et la scène ont besoin de connaître :

```jsonc
"car": {
  "file": "car.svg", "width": 100, "height": 48, "anchor": [0.5, 0.98],
  "wheelbase": 56,              // distance entre les roues, en px du dessin
  "pivot": [54, 38],            // point d'attelage : milieu de l'empattement, ligne des essieux
  "wheelRadius": 9,             // rayon du dessin, pour le roulement sans glissement
  "wheels": [{ "group": "wheel-rear", "at": [26, 38] }, { "group": "wheel-front", "at": [82, 38] }],
  "hood": { "pivot": [78, 20], "openAngle": -40 }
}
```

L'échelle du dessin est calculée, pas choisie : `k = (0.6 × largeur du véhicule) / wheelbase`,
l'empattement du dessin devenant l'empattement de la physique (`src/physics.ts`).
