/** Ambiances visuelles : aucune incidence sur la physique du scénario. */
export interface Biome {
  id: string;
  name: string;
  scenery: readonly string[];
  animals: readonly string[];
  sky: [string, string, string];
  rock: number;
  ground: number;
}

export const BIOMES: readonly Biome[] = [
  {
    id: 'euro_country', name: 'Campagne',
    scenery: ['oak', 'poplar', 'hedge', 'farmhouse', 'haystack'],
    animals: ['euro_country/sheep', 'euro_country/cow'],
    sky: ['#2f7fc4', '#8cc8ec', '#d6eef8'], rock: 0x6b5a48, ground: 0x4d7c0f,
  },
  {
    id: 'euro_city', name: 'Ville',
    scenery: ['haussmann', 'half_timbered', 'canal_house', 'gas_lamp', 'bench', 'kiosk'],
    animals: ['euro_city/pigeon', 'euro_city/gull'],
    sky: ['#647da1', '#b2c9de', '#e5edf4'], rock: 0x78716c, ground: 0x94a3b8,
  },
  {
    id: 'mountain', name: 'Montagne',
    scenery: ['spruce_tall', 'spruce_snow', 'chalet', 'boulder', 'meadow_tuft'],
    animals: ['mountain/ibex', 'mountain/marmot'],
    sky: ['#3776b6', '#aed8f0', '#f0f9ff'], rock: 0x64748b, ground: 0xcbd5e1,
  },
  {
    id: 'desert', name: 'Désert',
    scenery: ['saguaro', 'date_palm', 'adobe_house', 'agave', 'dry_shrub', 'prickly_pear'],
    animals: ['desert/camel', 'desert/lizard'],
    sky: ['#498fbd', '#edcc9b', '#fff1cf'], rock: 0xb77945, ground: 0xe9c46a,
  },
  {
    id: 'arctic', name: 'Arctique',
    scenery: ['igloo', 'ice_blocks'],
    animals: ['arctic/penguin'],
    sky: ['#497da0', '#b3deef', '#effaff'], rock: 0x94b8cb, ground: 0xf0f9ff,
  },
  {
    id: 'tropical', name: 'Tropical',
    scenery: ['palm_coconut', 'bamboo', 'giant_fern', 'palm_hut'],
    animals: ['tropical/toucan'],
    sky: ['#168aad', '#76d7dc', '#d9f7dc'], rock: 0x647348, ground: 0x15803d,
  },
  {
    id: 'harbour', name: 'Port',
    scenery: ['port_crane', 'container_pile', 'warehouse', 'silo', 'radio_mast'],
    animals: ['common/bird_seagull_perched'],
    sky: ['#58758b', '#a9bfcc', '#e1e8ed'], rock: 0x6b7280, ground: 0x9ca3af,
  },
  {
    id: 'volcanic', name: 'Volcanique',
    scenery: ['basalt_columns', 'lava_rock', 'smoking_vent'],
    animals: ['common/bird_crow'],
    sky: ['#392e48', '#98665d', '#edb590'], rock: 0x44403c, ground: 0x78716c,
  },
  {
    id: 'cyberpunk', name: 'Cyberpunk',
    scenery: ['neon_tower', 'pagoda_tech', 'street_lamp', 'vending_machine', 'container_stack'],
    animals: ['cyberpunk/robo_bird'],
    sky: ['#171331', '#3c285b', '#835273'], rock: 0x334155, ground: 0x64748b,
  },
];

export function randomBiome(): Biome {
  return BIOMES[Math.floor(Math.random() * BIOMES.length)];
}

export const BIOME_FILES = [...new Set(BIOMES.flatMap((biome) => [
  ...biome.scenery.map((name) => `${biome.id}/${name}.svg`),
  ...['bg_far', 'bg_mid', 'bg_near'].map((name) => `${biome.id}/${name}.svg`),
  ...biome.animals.map((name) => `${name}.svg`),
]))];
