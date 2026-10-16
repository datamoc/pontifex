# Guide des Assets SVG pour Pontifex

Ce document décrit les éléments SVG à créer pour enrichir Pontifex, en s'inspirant des jeux *Poly Bridge* et *Bridge Project*. Les assets sont organisés par catégorie et incluent des détails techniques pour leur création.

---

## 1. Véhicules
### **Types de véhicules**
| Nom du véhicule       | Description                                                                                     | Dimensions (px) | Couleurs principales               | Détails spécifiques                                                                                     |
|-----------------------|-------------------------------------------------------------------------------------------------|------------------|------------------------------------|---------------------------------------------------------------------------------------------------------|
| **Citadine**         | Voiture standard (déjà existante : `car.svg`).                                                  | 62x24            | Rouge, gris                        | 4 roues, design simple.                                                                                 |
| **Jeep**             | Véhicule tout-terrain (déjà existant : `jeep.svg`).                                             | 70x28            | Vert, noir                         | 4 roues, design robuste.                                                                                 |
| **Jeep 4x4**         | Version plus large du Jeep (déjà existant : `truck.svg`).                                       | 78x32            | Bleu, noir                         | 4 roues, design imposant.                                                                               |
| **Bus**             | Bus urbain (à créer : `bus.svg`).                                                                | 80x40            | Jaune, gris                        | 6 roues, design allongé.                                                                                 |
| **Train**            | Locomotive (à créer : `train.svg`).                                                              | 120x40           | Rouge, noir                        | 8 roues, design long et segmenté.                                                                       |
| **Vélo**            | Vélo (déjà existant : `bicycle.svg`).                                                            | 20x30            | Noir, gris                         | 2 roues, design minimaliste.                                                                            |
| **Bateau**           | Bateau (à créer : `boat.svg`).                                                                   | 60x30            | Blanc, bleu                        | Coque, mât, et détails nautiques.                                                                       |

### **Exemples de SVG à créer**
#### **Bus (`bus.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40">
  <!-- Corps du bus -->
  <rect x="5" y="15" width="70" height="20" fill="#FFD700" stroke="#333" stroke-width="1"/>
  <!-- Roues -->
  <circle cx="10" cy="35" r="4" fill="#333"/>
  <circle cx="25" cy="35" r="4" fill="#333"/>
  <circle cx="55" cy="35" r="4" fill="#333"/>
  <circle cx="70" cy="35" r="4" fill="#333"/>
  <!-- Fenêtres -->
  <rect x="15" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <rect x="25" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <rect x="35" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <rect x="45" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <rect x="55" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <!-- Phares -->
  <circle cx="75" cy="25" r="2" fill="#FFF"/>
  <circle cx="75" cy="30" r="2" fill="#FFF"/>
</svg>
```

#### **Train (`train.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <!-- Locomotive -->
  <rect x="0" y="15" width="40" height="25" fill="#D32F2F" stroke="#333" stroke-width="1"/>
  <!-- Wagon 1 -->
  <rect x="40" y="15" width="40" height="25" fill="#455A64" stroke="#333" stroke-width="1"/>
  <!-- Wagon 2 -->
  <rect x="80" y="15" width="40" height="25" fill="#455A64" stroke="#333" stroke-width="1"/>
  <!-- Roues -->
  <circle cx="10" cy="35" r="4" fill="#333"/>
  <circle cx="25" cy="35" r="4" fill="#333"/>
  <circle cx="50" cy="35" r="4" fill="#333"/>
  <circle cx="65" cy="35" r="4" fill="#333"/>
  <circle cx="90" cy="35" r="4" fill="#333"/>
  <circle cx="105" cy="35" r="4" fill="#333"/>
  <!-- Fenêtres -->
  <rect x="5" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <rect x="20" y="20" width="8" height="10" fill="#AAD4FF" stroke="#333" stroke-width="0.5"/>
  <!-- Phares -->
  <circle cx="35" cy="20" r="2" fill="#FFF"/>
  <circle cx="35" cy="30" r="2" fill="#FFF"/>
</svg>
```

#### **Bateau (`boat.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30">
  <!-- Coque -->
  <path d="M5 20 Q30 5 55 20 L55 25 Q30 10 5 25 Z" fill="#FFF" stroke="#333" stroke-width="1"/>
  <!-- Mât -->
  <rect x="28" y="5" width="4" height="15" fill="#8B4513"/>
  <!-- Voile -->
  <polygon points="30,5 50,15 30,25" fill="#FFF" stroke="#333" stroke-width="0.5"/>
  <!-- Détails -->
  <rect x="10" y="22" width="40" height="3" fill="#455A64"/>
</svg>
```

---

## 2. Navires
### **Types de navires**
| Nom du navire       | Description                                                                                     | Dimensions (px) | Couleurs principales               | Détails spécifiques                                                                                     |
|----------------------|-------------------------------------------------------------------------------------------------|------------------|------------------------------------|---------------------------------------------------------------------------------------------------------|
| **Petit navire**    | Bateau de plaisance (à créer : `ship_small.svg`).                                               | 40x20            | Blanc, bleu                        | Coque simple, mât optionnel.                                                                            |
| **Navire moyen**    | Cargo ou ferry (à créer : `ship_medium.svg`).                                                   | 60x25            | Rouge, blanc                       | Coque segmentée, cheminée.                                                                              |
| **Grand navire**    | Paquebot ou navire de croisière (à créer : `ship_large.svg`).                                   | 80x30            | Blanc, bleu                        | Plusieurs ponts, cheminées, détails complexes.                                                          |

### **Exemples de SVG à créer**
#### **Petit navire (`ship_small.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20">
  <!-- Coque -->
  <path d="M5 15 Q20 5 35 15 L35 18 Q20 8 5 18 Z" fill="#FFF" stroke="#333" stroke-width="1"/>
  <!-- Cabine -->
  <rect x="15" y="10" width="10" height="5" fill="#455A64" stroke="#333" stroke-width="0.5"/>
  <!-- Mât -->
  <rect x="20" y="2" width="2" height="8" fill="#8B4513"/>
</svg>
```

#### **Navire moyen (`ship_medium.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 25">
  <!-- Coque -->
  <path d="M5 18 Q30 5 55 18 L55 22 Q30 10 5 22 Z" fill="#D32F2F" stroke="#333" stroke-width="1"/>
  <!-- Pont -->
  <rect x="10" y="12" width="40" height="3" fill="#455A64"/>
  <!-- Cheminée -->
  <rect x="45" y="8" width="4" height="6" fill="#333"/>
  <!-- Fenêtres -->
  <rect x="15" y="15" width="3" height="2" fill="#AAD4FF"/>
  <rect x="20" y="15" width="3" height="2" fill="#AAD4FF"/>
  <rect x="25" y="15" width="3" height="2" fill="#AAD4FF"/>
</svg>
```

#### **Grand navire (`ship_large.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30">
  <!-- Coque -->
  <path d="M5 22 Q40 5 75 22 L75 27 Q40 10 5 27 Z" fill="#FFF" stroke="#333" stroke-width="1"/>
  <!-- Ponts -->
  <rect x="10" y="18" width="60" height="2" fill="#455A64"/>
  <rect x="10" y="14" width="60" height="2" fill="#455A64"/>
  <!-- Cheminées -->
  <rect x="50" y="8" width="4" height="8" fill="#333"/>
  <rect x="58" y="8" width="4" height="8" fill="#333"/>
  <!-- Fenêtres -->
  <rect x="15" y="20" width="2" height="2" fill="#AAD4FF"/>
  <rect x="20" y="20" width="2" height="2" fill="#AAD4FF"/>
  <rect x="25" y="20" width="2" height="2" fill="#AAD4FF"/>
  <rect x="30" y="20" width="2" height="2" fill="#AAD4FF"/>
  <rect x="35" y="20" width="2" height="2" fill="#AAD4FF"/>
</svg>
```

---

## 3. Matériaux et Outils
### **Icônes des matériaux**
| Matériau       | Description                                                                                     | Dimensions (px) | Couleur principale                 | Détails spécifiques                                                                                     |
|----------------|-------------------------------------------------------------------------------------------------|------------------|------------------------------------|---------------------------------------------------------------------------------------------------------|
| **Bois**       | Icône pour le matériau bois (à créer : `icon_wood.svg`).                                        | 24x24            | Marron                             | Texture de bois, grain visible.                                                                         |
| **Acier**      | Icône pour le matériau acier (à créer : `icon_steel.svg`).                                      | 24x24            | Gris                               | Texture métallique, reflet.                                                                             |
| **Béton**      | Icône pour le matériau béton (à créer : `icon_concrete.svg`).                                    | 24x24            | Gris clair                         | Texture granuleuse.                                                                                      |
| **Câble**      | Icône pour le câble fin (à créer : `icon_cable.svg`).                                            | 24x24            | Noir                               | Ligne fine et tendue.                                                                                   |
| **Câble porteur** | Icône pour le câble porteur (à créer : `icon_rope.svg`).                                        | 24x24            | Noir                               | Ligne épaisse et légèrement courbée.                                                                    |
| **Hydraulique** | Icône pour l'hydraulique (à créer : `icon_hydraulics.svg`).                                      | 24x24            | Bleu                               | Cylindre avec piston.                                                                                   |

### **Exemples de SVG à créer**
#### **Icône Bois (`icon_wood.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Texture de bois -->
  <rect x="0" y="0" width="24" height="24" fill="#8B4513"/>
  <!-- Grain -->
  <path d="M2 2 L22 22 M22 2 L2 22" stroke="#A0522D" stroke-width="1" stroke-linecap="round"/>
  <path d="M6 2 L18 22 M18 2 L6 22" stroke="#A0522D" stroke-width="1" stroke-linecap="round"/>
  <path d="M12 2 L12 22" stroke="#A0522D" stroke-width="1" stroke-linecap="round"/>
</svg>
```

#### **Icône Acier (`icon_steel.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Texture métallique -->
  <rect x="0" y="0" width="24" height="24" fill="#787878"/>
  <!-- Reflet -->
  <ellipse cx="12" cy="12" rx="8" ry="4" fill="#A0A0A0" opacity="0.5"/>
  <!-- Bordure -->
  <rect x="0" y="0" width="24" height="24" fill="none" stroke="#333" stroke-width="1"/>
</svg>
```

#### **Icône Béton (`icon_concrete.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Texture granuleuse -->
  <rect x="0" y="0" width="24" height="24" fill="#B0B0B0"/>
  <!-- Granules -->
  <circle cx="6" cy="6" r="1" fill="#808080"/>
  <circle cx="12" cy="12" r="1" fill="#808080"/>
  <circle cx="18" cy="18" r="1" fill="#808080"/>
  <circle cx="8" cy="16" r="1" fill="#808080"/>
  <circle cx="16" cy="8" r="1" fill="#808080"/>
</svg>
```

#### **Icône Hydraulique (`icon_hydraulics.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Cylindre -->
  <rect x="8" y="4" width="8" height="16" fill="#455A64" stroke="#333" stroke-width="1"/>
  <!-- Piston -->
  <rect x="6" y="8" width="12" height="4" fill="#2196F3" stroke="#333" stroke-width="1"/>
  <!-- Tuyaux -->
  <path d="M6 10 L4 10 L4 14 L6 14" stroke="#333" stroke-width="1" fill="none"/>
  <path d="M18 10 L20 10 L20 14 L18 14" stroke="#333" stroke-width="1" fill="none"/>
</svg>
```

---

## 4. Éléments de Décor
### **Types de décor**
| Élément               | Description                                                                                     | Dimensions (px) | Couleurs principales               | Détails spécifiques                                                                                     |
|-----------------------|-------------------------------------------------------------------------------------------------|------------------|------------------------------------|---------------------------------------------------------------------------------------------------------|
| **Arbres**           | Arbres de différentes formes (déjà existants : `tree_round.svg`, `tree_fir.svg`).              | 40x60            | Vert, marron                       | Variété de formes et couleurs.                                                                          |
| **Rochers**          | Rochers de différentes tailles (déjà existants : `rock1.svg`, `rock2.svg`, `rock3.svg`).       | 30x30            | Gris, marron                       | Textures réalistes.                                                                                     |
| **Nuages**           | Nuages pour l'arrière-plan (déjà existants : `cloud1.svg`, `cloud2.svg`).                      | 60x30            | Blanc                              | Formes organiques.                                                                                      |
| **Eau**             | Animation ou texture pour l'eau (à créer : `water.svg`).                                        | 100x50           | Bleu                               | Ondulations ou vagues.                                                                                  |
| **Pont basculant**   | Élément de pont qui s'ouvre (à créer : `bridge_open.svg`).                                      | 100x50           | Gris                               | Mécanisme visible.                                                                                       |

### **Exemples de SVG à créer**
#### **Eau (`water.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
  <!-- Fond -->
  <rect x="0" y="0" width="100" height="50" fill="#1E88E5"/>
  <!-- Vagues -->
  <path d="M0 20 Q25 10 50 20 T100 20" stroke="#42A5F5" stroke-width="2" fill="none"/>
  <path d="M0 30 Q25 20 50 30 T100 30" stroke="#42A5F5" stroke-width="2" fill="none"/>
  <path d="M0 40 Q25 30 50 40 T100 40" stroke="#42A5F5" stroke-width="2" fill="none"/>
</svg>
```

#### **Pont basculant (`bridge_open.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
  <!-- Partie fixe -->
  <rect x="0" y="40" width="40" height="10" fill="#787878" stroke="#333" stroke-width="1"/>
  <rect x="60" y="40" width="40" height="10" fill="#787878" stroke="#333" stroke-width="1"/>
  <!-- Partie mobile -->
  <rect x="40" y="20" width="20" height="30" fill="#A0A0A0" stroke="#333" stroke-width="1" transform="rotate(30 50 35)"/>
  <!-- Mécanisme -->
  <circle cx="50" cy="45" r="3" fill="#333"/>
</svg>
```

---

## 5. Icônes d'Interface
### **Types d'icônes**
| Icône                | Description                                                                                     | Dimensions (px) | Couleurs principales               | Détails spécifiques                                                                                     |
|-----------------------|-------------------------------------------------------------------------------------------------|------------------|------------------------------------|---------------------------------------------------------------------------------------------------------|
| **Play**             | Icône pour démarrer un niveau (à créer : `icon_play.svg`).                                      | 24x24            | Vert                               | Triangle pointant vers la droite.                                                                       |
| **Pause**            | Icône pour mettre en pause (à créer : `icon_pause.svg`).                                        | 24x24            | Jaune                              | Deux barres verticales.                                                                                 |
| **Réinitialiser**    | Icône pour réinitialiser un niveau (à créer : `icon_reset.svg`).                                | 24x24            | Rouge                              | Flèche circulaire.                                                                                      |
| **Succès**           | Icône pour indiquer un niveau réussi (à créer : `icon_success.svg`).                            | 24x24            | Vert                               | Coche.                                                                                                  |
| **Échec**            | Icône pour indiquer un niveau échoué (à créer : `icon_failure.svg`).                            | 24x24            | Rouge                              | Croix.                                                                                                  |
| **Événement navire** | Icône pour indiquer un passage de navire (à créer : `icon_ship_event.svg`).                     | 24x24            | Bleu                               | Silhouette de navire.                                                                                   |

### **Exemples de SVG à créer**
#### **Icône Play (`icon_play.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Triangle -->
  <path d="M8 5 L8 19 L18 12 Z" fill="#4CAF50"/>
</svg>
```

#### **Icône Pause (`icon_pause.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Barres -->
  <rect x="6" y="5" width="4" height="14" fill="#FFC107"/>
  <rect x="14" y="5" width="4" height="14" fill="#FFC107"/>
</svg>
```

#### **Icône Réinitialiser (`icon_reset.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Flèche circulaire -->
  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#F44336"/>
</svg>
```

#### **Icône Événement navire (`icon_ship_event.svg`)**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Navire -->
  <path d="M4 16 L8 12 L20 12 L20 16 L4 16 Z" fill="#2196F3"/>
  <!-- Mât -->
  <rect x="12" y="4" width="2" height="8" fill="#8B4513"/>
</svg>
```

---

## 6. Recommandations Techniques
### **Bonnes pratiques pour les SVG**
1. **Dimensions** : Utiliser des dimensions cohérentes (ex : 24x24 pour les icônes, 60x40 pour les véhicules).
2. **Couleurs** : Utiliser des couleurs adaptées au thème de Pontifex (ex : tons de bleu, gris, et vert).
3. **Simplicité** : Privilégier des designs simples et lisibles, surtout pour les icônes.
4. **Optimisation** : Minimiser le nombre de nœuds et utiliser des formes géométriques simples.
5. **Accessibilité** : Ajouter des attributs `aria-label` pour les icônes interactives.

### **Outils recommandés**
- **Inkscape** : Outil open-source pour créer et éditer des SVG.
- **Figma** : Outil de design collaboratif avec export SVG.
- **Adobe Illustrator** : Outil professionnel pour les assets vectoriels.

### **Intégration dans Pontifex**
1. **Placement** : Les fichiers SVG doivent être placés dans `assets/common/`.
2. **Nommage** : Utiliser des noms clairs et cohérents (ex : `ship_small.svg`, `icon_wood.svg`).
3. **Manifest** : Mettre à jour `assets/manifest.json` pour inclure les nouveaux assets.

---

## 7. Liste Complète des Assets à Créer
| Catégorie          | Nom du fichier               | Description                                                                                     |
|--------------------|------------------------------|-------------------------------------------------------------------------------------------------|
| **Véhicules**     | `bus.svg`                    | Bus urbain.                                                                                     |
|                    | `train.svg`                  | Locomotive.                                                                                     |
|                    | `boat.svg`                   | Bateau.                                                                                         |
| **Navires**       | `ship_small.svg`             | Petit navire.                                                                                   |
|                    | `ship_medium.svg`            | Navire moyen.                                                                                   |
|                    | `ship_large.svg`             | Grand navire.                                                                                   |
| **Matériaux**     | `icon_concrete.svg`          | Icône pour le béton.                                                                            |
|                    | `icon_hydraulics.svg`        | Icône pour l'hydraulique.                                                                      |
| **Décor**         | `water.svg`                  | Texture ou animation pour l'eau.                                                               |
|                    | `bridge_open.svg`            | Pont basculant ouvert.                                                                          |
| **Icônes**        | `icon_play.svg`              | Icône pour démarrer un niveau.                                                                 |
|                    | `icon_pause.svg`             | Icône pour mettre en pause.                                                                     |
|                    | `icon_reset.svg`             | Icône pour réinitialiser un niveau.                                                             |
|                    | `icon_success.svg`           | Icône pour indiquer un succès.                                                                  |
|                    | `icon_failure.svg`           | Icône pour indiquer un échec.                                                                   |
|                    | `icon_ship_event.svg`        | Icône pour indiquer un passage de navire.                                                      |