# Analyse des Jeux Similaires pour Pontifex

## Objectif
Intégrer les éléments pertinents issus de *Poly Bridge*, *Bridge Project* et *Build a Bridge!* dans Pontifex, notamment :
- Les **propriétés des matériaux et véhicules**.
- Les **mécaniques de construction**.
- Les **étapes des tutoriels** et **design des niveaux**.

---

## 1. Propriétés des Éléments
### Matériaux
| Jeu               | Matériaux Disponibles                          |
|-------------------|-----------------------------------------------|
| **Poly Bridge**   | Wood, Steel, Rope, Hydraulics                 |
| **Bridge Project**| Wood, Steel, Concrete, Cable, Hydraulic       |
| **Build a Bridge!**| À compléter (ex : bois, acier, câbles)        |

**Synthèse pour Pontifex** :
- **Matériaux de base** : Wood, Steel, Rope.
- **Matériaux avancés** : Concrete, Cable, Hydraulics.
- **Propriétés à modéliser** :
  - **Résistance** (ex : Steel > Wood).
  - **Coût** (ex : Concrete plus cher que Wood).
  - **Flexibilité** (ex : Rope pour les câbles).

---

### Véhicules
| Jeu               | Véhicules Disponibles                          |
|-------------------|-----------------------------------------------|
| **Poly Bridge**   | Car, Truck, Bus, Bike, Boat                   |
| **Bridge Project**| Car, Truck, Bus, Train, Boat                  |
| **Build a Bridge!**| À compléter (ex : voitures, camions)          |

**Synthèse pour Pontifex** :
- **Véhicules légers** : Car, Bike.
- **Véhicules lourds** : Truck, Bus, Train.
- **Propriétés à modéliser** :
  - **Poids** (ex : Train > Truck).
  - **Vitesse** (ex : Bike > Car).
  - **Fréquence d'apparition** (ex : Car plus fréquent que Train).

---

## 2. Mécaniques de Construction
### Outils et Contraintes
- **Poly Bridge** :
  - Outils implicites (ex : placement de matériaux, gestion des coûts).
  - Contraintes : physique réaliste (gravité, résistance).
- **Bridge Project** :
  - Mode sandbox pour tester les constructions.
  - Contraintes : budget limité, matériaux variés.

**Synthèse pour Pontifex** :
- **Outils à implémenter** :
  - **Pince** : Pour ajuster les matériaux.
  - **Grue** : Pour déplacer des éléments lourds.
  - **Calculateur de coût** : Pour gérer le budget.
- **Contraintes à modéliser** :
  - **Physique** : Gravité, résistance des matériaux.
  - **Budget** : Coût des matériaux et outils.

---

## 3. Design des Niveaux
### Tutoriels
| Jeu               | Étapes des Tutoriels                          |
|-------------------|-----------------------------------------------|
| **Poly Bridge**   | 5 tutoriels (`Tutorial_01` à `Tutorial_05`)   |
| **Bridge Project**| Non identifiés                                |
| **Build a Bridge!**| À compléter                                   |

**Synthèse pour Pontifex** :
- **Étapes recommandées** :
  1. **Construction de base** : Placement de matériaux simples (Wood).
  2. **Gestion des coûts** : Utilisation d'un budget limité.
  3. **Physique avancée** : Résistance des matériaux (Steel vs. Wood).
  4. **Véhicules** : Adaptation aux différents types de véhicules.
  5. **Niveaux complexes** : Combinaison de matériaux et contraintes.

---

### Variété des Niveaux
| Jeu               | Types de Niveaux                              |
|-------------------|-----------------------------------------------|
| **Poly Bridge**   | 20 niveaux + 5 tutoriels                      |
| **Bridge Project**| 5 campagnes + 5 sandbox                       |
| **Build a Bridge!**| À compléter                                   |

**Synthèse pour Pontifex** :
- **Modes de jeu** :
  - **Campagne** : Niveaux progressifs avec objectifs.
  - **Sandbox** : Mode libre pour tester des constructions.
  - **Défis** : Niveaux avec contraintes spécifiques (ex : budget limité).

---

## 4. Interface Utilisateur
### Accessibilité
- **Poly Bridge** : Tutoriels guidés avec messages clairs.
- **Bridge Project** : Pas de tutoriels explicites.

**Synthèse pour Pontifex** :
- **Éléments à implémenter** :
  - **Messages guidés** : Instructions claires pour les tutoriels.
  - **Indicateurs visuels** : Coût, résistance, budget.
  - **Personnalisation** : Choix des matériaux et outils.

---

## 5. Prochaines Étapes
1. **Intégrer les matériaux et véhicules** dans le code ou la configuration de Pontifex.
2. **Créer les mécaniques de construction** (outils, physique, budget).
3. **Développer les tutoriels et niveaux** inspirés des jeux analysés.
4. **Tester et ajuster** les propriétés des éléments (résistance, coût, etc.).

## 6. Sprites Manquants
Les sprites suivants doivent être créés ou remplacés :
- **`train.svg`** : Actuellement remplacé par `truck.svg`.
- **`boat.svg`** : Actuellement remplacé par `delivery_van.svg`.

Pour une meilleure cohérence visuelle, ajoutez ces fichiers dans `assets/common/`.

---

## Annexes
- **Fichiers de référence** :
  - [`comparaisons/cartes_jeux/`](comparaisons/cartes_jeux/) : Fichiers `level0` à `level5` de *Poly Bridge* et *Bridge Project*.
  - [`comparaisons/comparatif.md`](comparaisons/comparatif.md) : Tableau comparatif détaillé.