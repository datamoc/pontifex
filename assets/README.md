# Images (non incluses dans le dépôt)

Les images viennent de packs gratuits **CraftPix.net**. Leur licence (<https://craftpix.net/file-licenses/>, §2) autorise
à les utiliser et à distribuer des jeux qui les contiennent, mais **pas à redistribuer les fichiers d'art eux-mêmes** :
ils ne sont donc pas dans ce dépôt. Pour construire le jeu, téléchargez les packs et copiez ces fichiers ici :

| fichier ici | pack CraftPix | fichier dans le pack |
| --- | --- | --- |
| `cars/citadine_ride.png`, `cars/citadine_destroyed.png` | Free Old Cars Pixel Art Asset Pack | `Passenger car/Ride.png`, `Passenger car/Destroyed.png` |
| `cars/jeep1_ride.png`, `jeep1_idle.png`, `jeep1_destroyed.png` | idem | `Jeep_1/Ride.png`, `Idle.png`, `Destroyed.png` |
| `cars/jeep2_ride.png`, `jeep2_idle.png`, `jeep2_destroyed.png` | idem | `Jeep_2/Ride.png`, `Idle.png`, `Destroyed.png` |
| `decor/fir_tree_1.png`, `fir_tree_5.png`, `birch_1.png`, `birch_5.png`, `middle_lane_tree2.png`, `middle_lane_tree5.png` | Free Tree Pixel Art Asset Pack | `PNG/<même nom>` |
| `decor/bush1.png`, `bush4.png`, `bush8.png` | Free Bush Assets Pixel Art Pack | `PNG/Bushes1/Bush1_1.png`, `Bushes4/Bush4_1.png`, `Bushes8/Bush8_1.png` |
| `decor/rock1.png`, `rock2.png`, `rock3.png` | Free Rocks Pixel Art Asset Pack | `PNG/middle_lane_rocks1/middle_lane_rock1_1.png`, `PNG/middle_lane_rocks2/…_1.png`, `PNG/canyon_rocks/canyon_rock1.png` |
| `clouds/cloud1.png`, `cloud3.png`, `cloud5.png` | Free Clouds Pixel Art Asset Pack | `PNG/Clouds_white/Shape1`, `Shape3`, `Shape5` : `…_1.png` |

Les noms ici sont ceux attendus par `src/art.ts`. Vous pouvez aussi mettre vos propres images
(planches de voitures : 8 images de roulage ; voir la table `SHEET` de `src/art.ts` pour la taille d'image et l'empattement).
