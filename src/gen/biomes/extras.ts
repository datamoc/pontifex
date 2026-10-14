// Generated biome assets for "harbour" and "volcanic" biomes, and additional assets.
// See BIOME_ASSETS.md for conventions and usage.

import { add, shape, circleD, symmetricD, tint, unite, turn } from "../kit.ts";

// Harbour biome assets.
export function generateHarbourAssets() {
  // Port crane
  add("harbour", "port_crane", "prop", shape({
    width: 60,
    height: 100,
  }, (svg) => {
    // Crane base
    const base = symmetricD(svg, [
      [20, 80], [40, 80], [40, 90], [20, 90]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Crane tower
    const tower = symmetricD(svg, [
      [25, 20], [35, 20], [35, 80], [25, 80]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Crane arm
    const arm = symmetricD(svg, [
      [35, 30], [60, 20], [60, 30], [35, 40]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, base, tower, arm);
  }));

  // Containers
  add("harbour", "containers", "prop", shape({
    width: 60,
    height: 40,
    tints: { paint: "#dc2626" },
  }, (svg) => {
    // Containers
    for (let i = 0; i < 3; i++) {
      const container = symmetricD(svg, [
        [10, 10 + i * 10], [50, 10 + i * 10], [50, 20 + i * 10], [10, 20 + i * 10]
      ], { fill: "#dc2626", stroke: "#1e293b" });
      unite(svg, container);
    }
  }));

  // Cargo ship
  add("harbour", "cargo_ship", "boat", shape({
    width: 120,
    height: 60,
    tints: { paint: "#374151" },
    anchor: [0.5, 0.75],
  }, (svg) => {
    // Ship body
    const body = symmetricD(svg, [
      [10, 30], [110, 30], [110, 40], [10, 40]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Ship deck
    const deck = symmetricD(svg, [
      [20, 20], [100, 20], [100, 30], [20, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, deck);
  }));

  // Factory
  add("harbour", "factory", "building", shape({
    width: 100,
    height: 80,
    tints: { wall: "#6b7280", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [90, 30], [90, 70], [10, 70]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [50, 10], [95, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Chimney
    const chimney = symmetricD(svg, [
      [70, 10], [80, 10], [80, 30], [70, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, chimney);
  }));

  // Warehouse
  add("harbour", "warehouse", "building", shape({
    width: 120,
    height: 60,
    tints: { wall: "#6b7280", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [110, 20], [110, 50], [10, 50]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [60, 5], [115, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Cooling tower
  add("harbour", "cooling_tower", "building", shape({
    width: 60,
    height: 100,
  }, (svg) => {
    // Cooling tower
    const tower = symmetricD(svg, [
      [10, 20], [50, 20], [50, 90], [10, 90]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Cooling tower top
    const top = symmetricD(svg, [
      [5, 20], [30, 5], [55, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, tower, top);
  }));

  // Silo
  add("harbour", "silo", "building", shape({
    width: 40,
    height: 80,
  }, (svg) => {
    // Silo
    const silo = symmetricD(svg, [
      [10, 20], [30, 20], [30, 80], [10, 80]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Silo top
    const top = symmetricD(svg, [
      [5, 20], [20, 10], [35, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, silo, top);
  }));

  // Pier
  add("harbour", "pier", "prop", shape({
    width: 100,
    height: 20,
    anchor: [0.5, 0],
  }, (svg) => {
    // Pier
    const pier = symmetricD(svg, [
      [10, 10], [90, 10], [90, 15], [10, 15]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, pier);
  }));

  // Boat
  add("harbour", "boat", "boat", shape({
    width: 60,
    height: 30,
    anchor: [0.5, 0.75],
  }, (svg) => {
    // Boat body
    const body = symmetricD(svg, [
      [10, 15], [50, 15], [50, 20], [10, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Boat cabin
    const cabin = symmetricD(svg, [
      [20, 10], [40, 10], [40, 15], [20, 15]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, cabin);
  }));

  // Background layers (placeholder for seamless tiling)
  add("harbour", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#9bc4dc", stroke: "none" });
    unite(svg, sky);
  }));

  add("harbour", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant cranes
    for (let i = 0; i < 4; i++) {
      const crane = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 50, 100], [i * 200 + 100, 150]
      ], { fill: "#6b7280", stroke: "#1e293b" });
      unite(svg, crane);
    }
  }));

  add("harbour", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby warehouses
    for (let i = 0; i < 2; i++) {
      const warehouse = symmetricD(svg, [
        [i * 400, 170], [i * 400 + 200, 140], [i * 400 + 400, 170]
      ], { fill: "#475569", stroke: "#1e293b" });
      unite(svg, warehouse);
    }
  }));
}

// Volcanic biome assets.
export function generateVolcanicAssets() {
  // Lava pool
  add("volcanic", "lava_pool", "terrain", shape({
    width: 80,
    height: 40,
  }, (svg) => {
    // Lava pool
    const pool = symmetricD(svg, [
      [10, 20], [70, 20], [70, 30], [10, 30]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    unite(svg, pool);
  }));

  // Vent
  add("volcanic", "vent", "terrain", shape({
    width: 40,
    height: 40,
  }, (svg) => {
    // Vent
    const vent = symmetricD(svg, [
      [10, 20], [30, 20], [30, 30], [10, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, vent);
  }));

  // Basalt columns
  add("volcanic", "basalt_columns", "terrain", shape({
    width: 60,
    height: 80,
  }, (svg) => {
    // Basalt columns
    for (let i = 0; i < 3; i++) {
      const column = symmetricD(svg, [
        [10 + i * 20, 10], [20 + i * 20, 10], [20 + i * 20, 80], [10 + i * 20, 80]
      ], { fill: "#374151", stroke: "#1e293b" });
      unite(svg, column);
    }
  }));

  // Lava rock
  add("volcanic", "lava_rock", "rock", shape({
    width: 40,
    height: 30,
  }, (svg) => {
    // Lava rock
    const rock = symmetricD(svg, [
      [10, 20], [20, 10], [30, 15], [35, 25], [20, 30], [10, 25]
    ], { fill: "#374151", stroke: "#1e293b" });
    unite(svg, rock);
  }));

  // Volcano
  add("volcanic", "volcano", "terrain", shape({
    width: 100,
    height: 80,
  }, (svg) => {
    // Volcano base
    const base = symmetricD(svg, [
      [10, 50], [90, 50], [80, 70], [20, 70]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Volcano crater
    const crater = symmetricD(svg, [
      [30, 20], [70, 20], [70, 50], [30, 50]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, base, crater);
  }));

  // Background layers (placeholder for seamless tiling)
  add("volcanic", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#5b3a3a", stroke: "none" });
    unite(svg, sky);
  }));

  add("volcanic", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant lava
    for (let i = 0; i < 4; i++) {
      const lava = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 120], [i * 200 + 200, 150]
      ], { fill: "#dc2626", stroke: "#1e293b" });
      unite(svg, lava);
    }
  }));

  add("volcanic", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby rocks
    for (let i = 0; i < 2; i++) {
      const rock = symmetricD(svg, [
        [i * 400, 170], [i * 400 + 200, 140], [i * 400 + 400, 170]
      ], { fill: "#292524", stroke: "#1e293b" });
      unite(svg, rock);
    }
  }));
}

// Additional assets (e.g., walkers, wind turbines, bridge pillars).
export function generateAdditionalAssets() {
  // Walkers (people)
  add("common", "walker_man_short_hair_trousers", "person", shape({
    width: 44,
    height: 70,
    tints: { skin: "#c28466", hair: "#374151", "cloth-top": "#dc2626", "cloth-bottom": "#374151", shoe: "#000000" },
    anchor: [0.5, 1],
  }, (svg) => {
    // Body
    const body = symmetricD(svg, [
      [12, 30], [32, 30], [32, 50], [12, 50]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Legs
    const legLeft = symmetricD(svg, [
      [12, 50], [22, 50], [22, 70], [12, 70]
    ], { fill: "#374151", stroke: "#1e293b" });
    const legRight = symmetricD(svg, [
      [22, 50], [32, 50], [32, 70], [22, 70]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Head
    const head = circleD(svg, 12, { fill: "#c28466", stroke: "#1e293b" });
    head.move(16, 18);
    
    // Hair
    const hair = symmetricD(svg, [
      [16, 18], [28, 18], [28, 25], [16, 25]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, legLeft, legRight, head, hair);
  }));

  // Wind turbine
  add("common", "wind_turbine", "prop", shape({
    width: 130,
    height: 178,
    pivots: { rotor: [65, 62] },
  }, (svg) => {
    // Tower
    const tower = symmetricD(svg, [
      [60, 100], [70, 100], [70, 178], [60, 178]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Nacelle
    const nacelle = symmetricD(svg, [
      [50, 80], [80, 80], [80, 100], [50, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Rotor
    const rotor = symmetricD(svg, [
      [65, 62], [65, 40], [65, 84]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Blades
    for (let i = 0; i < 3; i++) {
      const blade = symmetricD(svg, [
        [65, 62], [100, 50 + i * 10], [100, 74 - i * 10]
      ], { fill: "#6b7280", stroke: "#1e293b" });
      turn(blade, i * 120, [65, 62]);
      unite(svg, blade);
    }
    
    // Group all parts
    unite(svg, tower, nacelle, rotor);
  }));

  // Bridge pillars
  add("common", "pillar_stone", "pillar", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pillar
    const pillar = symmetricD(svg, [
      [10, 0], [30, 0], [30, 100], [10, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, pillar);
  }));

  add("common", "pillar_concrete", "pillar", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pillar
    const pillar = symmetricD(svg, [
      [10, 0], [30, 0], [30, 100], [10, 100]
    ], { fill: "#9ca3af", stroke: "#1e293b" });
    unite(svg, pillar);
  }));

  add("common", "pillar_steel", "pillar", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pillar
    const pillar = symmetricD(svg, [
      [10, 0], [30, 0], [30, 100], [10, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, pillar);
  }));

  add("common", "pillar_eroded", "pillar", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pillar
    const pillar = symmetricD(svg, [
      [10, 0], [30, 0], [30, 100], [10, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, pillar);
  }));

  add("common", "pillar_cable_stay", "pillar", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pillar
    const pillar = symmetricD(svg, [
      [10, 0], [30, 0], [30, 100], [10, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, pillar);
  }));

  add("common", "pillar_suspension", "pillar", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pillar
    const pillar = symmetricD(svg, [
      [10, 0], [30, 0], [30, 100], [10, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, pillar);
  }));

  // Abutment
  add("common", "abutment", "pillar", shape({
    width: 60,
    height: 40,
  }, (svg) => {
    // Abutment
    const abutment = symmetricD(svg, [
      [10, 20], [50, 20], [50, 40], [10, 40]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, abutment);
  }));

  // Tunnel
  add("common", "tunnel", "prop", shape({
    width: 80,
    height: 60,
  }, (svg) => {
    // Tunnel
    const tunnel = symmetricD(svg, [
      [10, 20], [70, 20], [70, 50], [10, 50]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, tunnel);
  }));

  // Road sign
  add("common", "road_sign", "prop", shape({
    width: 20,
    height: 40,
  }, (svg) => {
    // Sign post
    const post = symmetricD(svg, [
      [8, 20], [12, 20], [12, 40], [8, 40]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Sign
    const sign = symmetricD(svg, [
      [5, 10], [15, 10], [15, 20], [5, 20]
    ], { fill: "#fbbf24", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, post, sign);
  }));

  // Power pylon
  add("common", "power_pylon", "prop", shape({
    width: 40,
    height: 100,
  }, (svg) => {
    // Pylon base
    const base = symmetricD(svg, [
      [10, 80], [30, 80], [30, 100], [10, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Pylon tower
    const tower = symmetricD(svg, [
      [15, 20], [25, 20], [25, 80], [15, 80]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Pylon arms
    const armLeft = symmetricD(svg, [
      [0, 30], [15, 30], [15, 40], [0, 40]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    const armRight = symmetricD(svg, [
      [25, 30], [40, 30], [40, 40], [25, 40]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, base, tower, armLeft, armRight);
  }));

  // Birds
  add("common", "pigeon", "fauna", shape({
    width: 20,
    height: 20,
    anchor: [0.5, 0.5],
    pivots: { wing: [10, 10] },
  }, (svg) => {
    // Bird body
    const body = circleD(svg, 10, { fill: "#6b7280", stroke: "#1e293b" });
    body.move(5, 5);
    
    // Bird wings
    const wingLeft = symmetricD(svg, [
      [0, 10], [10, 5], [10, 15], [0, 15]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    const wingRight = symmetricD(svg, [
      [10, 5], [20, 10], [20, 15], [10, 15]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, wingLeft, wingRight);
  }));

  // Tree seasons
  add("common", "tree_summer", "vegetation", shape({
    width: 40,
    height: 80,
    tints: { foliage: "#16a34a", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 60], [25, 60], [25, 80], [15, 80]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = circleD(svg, 40, { fill: "#16a34a", stroke: "#1e293b" });
    foliage.move(0, 20);
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  add("common", "tree_autumn", "vegetation", shape({
    width: 40,
    height: 80,
    tints: { foliage: "#d97706", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 60], [25, 60], [25, 80], [15, 80]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = circleD(svg, 40, { fill: "#d97706", stroke: "#1e293b" });
    foliage.move(0, 20);
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  add("common", "tree_blossom", "vegetation", shape({
    width: 40,
    height: 80,
    tints: { foliage: "#fbbf24", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 60], [25, 60], [25, 80], [15, 80]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = circleD(svg, 40, { fill: "#fbbf24", stroke: "#1e293b" });
    foliage.move(0, 20);
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  add("common", "tree_snow", "vegetation", shape({
    width: 40,
    height: 80,
    tints: { foliage: "#e5e7eb", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 60], [25, 60], [25, 80], [15, 80]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = circleD(svg, 40, { fill: "#e5e7eb", stroke: "#1e293b" });
    foliage.move(0, 20);
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Birch
  add("common", "birch", "vegetation", shape({
    width: 20,
    height: 100,
    tints: { foliage: "#16a34a", trunk: "#f3f4f6" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [8, 70], [12, 70], [12, 100], [8, 100]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 20], [10, 0], [20, 20], [10, 70]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Cypress
  add("common", "cypress", "vegetation", shape({
    width: 20,
    height: 100,
    tints: { foliage: "#059669", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [8, 70], [12, 70], [12, 100], [8, 100]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 20], [10, 0], [20, 20], [10, 70]
    ], { fill: "#059669", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));
}