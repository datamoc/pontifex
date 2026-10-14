// Generated biome assets for "euro_country", "mountain", "desert", "arctic", and "tropical" biomes.
// See BIOME_ASSETS.md for conventions and usage.

import { add, shape, circleD, symmetricD, tint, unite, turn } from "../kit.ts";

// Euro Country biome assets.
export function generateEuroCountryAssets() {
  // Farm
  add("euro_country", "farm", "building", shape({
    width: 80,
    height: 60,
    tints: { wall: "#fef3c7", roof: "#92400e" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [70, 20], [70, 50], [10, 50]
    ], { fill: "#fef3c7", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [40, 5], [75, 20]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Door
    const door = symmetricD(svg, [
      [35, 50], [45, 50], [45, 55], [35, 55]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, door);
  }));

  // Cottage
  add("euro_country", "cottage", "building", shape({
    width: 60,
    height: 80,
    tints: { wall: "#f3f4f6", roof: "#92400e" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [50, 30], [50, 60], [10, 60]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [30, 10], [55, 30]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Door
    const door = symmetricD(svg, [
      [25, 60], [35, 60], [35, 75], [25, 75]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, door);
  }));

  // Church
  add("euro_country", "church", "building", shape({
    width: 80,
    height: 100,
    tints: { wall: "#e5e7eb", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [70, 30], [70, 80], [10, 80]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [40, 10], [75, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Tower
    const tower = symmetricD(svg, [
      [35, 10], [45, 10], [45, 30], [35, 30]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, tower);
  }));

  // Barn
  add("euro_country", "barn", "building", shape({
    width: 100,
    height: 80,
    tints: { wall: "#dc2626", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [90, 30], [90, 70], [10, 70]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [50, 10], [95, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Windmill
  add("euro_country", "windmill", "building", shape({
    width: 60,
    height: 80,
    tints: { wall: "#f3f4f6", roof: "#374151" },
    pivots: { sails: [30, 30] },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [20, 40], [40, 40], [40, 70], [20, 70]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [10, 40], [30, 20], [50, 40]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Sails
    const sails = svg.group();
    for (let i = 0; i < 4; i++) {
      const sail = symmetricD(svg, [
        [30, 30], [50, 30], [50, 35], [30, 35]
      ], { fill: "#f3f4f6", stroke: "#1e293b" });
      turn(sail, i * 90, [30, 30]);
      sails.add(sail);
    }
    
    // Group all parts
    unite(svg, walls, roof, sails);
  }));

  // Castle
  add("euro_country", "castle", "building", shape({
    width: 120,
    height: 100,
    tints: { wall: "#9ca3af", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 40], [110, 40], [110, 80], [10, 80]
    ], { fill: "#9ca3af", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 40], [60, 10], [115, 40]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Towers
    const towerLeft = symmetricD(svg, [
      [10, 40], [20, 40], [20, 20], [10, 20]
    ], { fill: "#9ca3af", stroke: "#1e293b" });
    const towerRight = symmetricD(svg, [
      [100, 40], [110, 40], [110, 20], [100, 20]
    ], { fill: "#9ca3af", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, towerLeft, towerRight);
  }));

  // Oak tree
  add("euro_country", "oak", "vegetation", shape({
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

  // Poplar tree
  add("euro_country", "poplar", "vegetation", shape({
    width: 20,
    height: 100,
    tints: { foliage: "#16a34a", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [8, 70], [12, 70], [12, 100], [8, 100]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 20], [10, 0], [20, 20], [10, 70]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Hedge
  add("euro_country", "hedge", "vegetation", shape({
    width: 60,
    height: 30,
    tints: { foliage: "#16a34a" },
  }, (svg) => {
    const hedge = symmetricD(svg, [
      [10, 10], [50, 10], [50, 20], [10, 20]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    unite(svg, hedge);
  }));

  // Vines
  add("euro_country", "vines", "vegetation", shape({
    width: 20,
    height: 60,
    tints: { foliage: "#16a34a" },
  }, (svg) => {
    const vines = symmetricD(svg, [
      [5, 10], [15, 10], [15, 50], [5, 50]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    unite(svg, vines);
  }));

  // Lavender
  add("euro_country", "lavender", "vegetation", shape({
    width: 30,
    height: 20,
    tints: { foliage: "#8b5cf6" },
  }, (svg) => {
    const lavender = symmetricD(svg, [
      [5, 10], [25, 10], [25, 15], [5, 15]
    ], { fill: "#8b5cf6", stroke: "#1e293b" });
    unite(svg, lavender);
  }));

  // Wheat
  add("euro_country", "wheat", "vegetation", shape({
    width: 40,
    height: 30,
    tints: { foliage: "#d97706" },
  }, (svg) => {
    const wheat = symmetricD(svg, [
      [10, 10], [30, 10], [30, 20], [10, 20]
    ], { fill: "#d97706", stroke: "#1e293b" });
    unite(svg, wheat);
  }));

  // Tractor
  add("euro_country", "tractor", "vehicle", shape({
    width: 100,
    height: 60,
    tints: { paint: "#dc2626" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [80, 50] },
  }, (svg) => {
    // Tractor body
    const body = symmetricD(svg, [
      [10, 40], [30, 30], [80, 30], [90, 40], [90, 50], [10, 50]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 20, { fill: "#374151" });
    wheelRear.move(10, 40);
    const wheelFront = circleD(svg, 20, { fill: "#374151" });
    wheelFront.move(70, 40);
    
    // Group all parts
    unite(svg, body, wheelRear, wheelFront);
  }));

  // Sheep
  add("euro_country", "sheep", "fauna", shape({
    width: 40,
    height: 30,
  }, (svg) => {
    // Sheep body
    const body = circleD(svg, 20, { fill: "#ffffff", stroke: "#1e293b" });
    body.move(10, 10);
    
    // Sheep head
    const head = circleD(svg, 10, { fill: "#ffffff", stroke: "#1e293b" });
    head.move(30, 15);
    
    // Group all parts
    unite(svg, body, head);
  }));

  // Cow
  add("euro_country", "cow", "fauna", shape({
    width: 50,
    height: 30,
  }, (svg) => {
    // Cow body
    const body = symmetricD(svg, [
      [10, 15], [40, 15], [40, 25], [10, 25]
    ], { fill: "#ffffff", stroke: "#1e293b" });
    
    // Cow head
    const head = symmetricD(svg, [
      [40, 18], [50, 18], [50, 22], [40, 22]
    ], { fill: "#ffffff", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, head);
  }));

  // Stork
  add("euro_country", "stork", "fauna", shape({
    width: 30,
    height: 60,
  }, (svg) => {
    // Stork body
    const body = symmetricD(svg, [
      [10, 30], [20, 30], [20, 50], [10, 50]
    ], { fill: "#ffffff", stroke: "#1e293b" });
    
    // Stork neck
    const neck = symmetricD(svg, [
      [15, 20], [20, 20], [20, 30], [15, 30]
    ], { fill: "#ffffff", stroke: "#1e293b" });
    
    // Stork head
    const head = circleD(svg, 8, { fill: "#ffffff", stroke: "#1e293b" });
    head.move(12, 12);
    
    // Stork legs
    const legLeft = symmetricD(svg, [
      [12, 50], [14, 50], [14, 60], [12, 60]
    ], { fill: "#f97316", stroke: "#1e293b" });
    const legRight = symmetricD(svg, [
      [18, 50], [20, 50], [20, 60], [18, 60]
    ], { fill: "#f97316", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, neck, head, legLeft, legRight);
  }));

  // Background layers (placeholder for seamless tiling)
  add("euro_country", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#8cc8ec", stroke: "none" });
    unite(svg, sky);
  }));

  add("euro_country", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant trees
    for (let i = 0; i < 8; i++) {
      const tree = symmetricD(svg, [
        [i * 100, 150], [i * 100 + 20, 100], [i * 100 + 40, 150]
      ], { fill: "#4d7c0f", stroke: "#1e293b" });
      unite(svg, tree);
    }
  }));

  add("euro_country", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby trees
    for (let i = 0; i < 4; i++) {
      const tree = symmetricD(svg, [
        [i * 200, 170], [i * 200 + 30, 120], [i * 200 + 60, 170]
      ], { fill: "#16a34a", stroke: "#1e293b" });
      unite(svg, tree);
    }
  }));
}

// Mountain biome assets.
export function generateMountainAssets() {
  // Chalet
  add("mountain", "chalet", "building", shape({
    width: 80,
    height: 80,
    tints: { wall: "#f3f4f6", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [70, 30], [70, 60], [10, 60]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [40, 10], [75, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Hut
  add("mountain", "hut", "building", shape({
    width: 60,
    height: 60,
    tints: { wall: "#92400e", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [50, 20], [50, 50], [10, 50]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [30, 5], [55, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Cable-car station
  add("mountain", "cable_car_station", "building", shape({
    width: 80,
    height: 60,
    tints: { wall: "#f3f4f6", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [70, 20], [70, 50], [10, 50]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [40, 5], [75, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Ski-lift pylon
  add("mountain", "ski_lift_pylon", "prop", shape({
    width: 20,
    height: 100,
  }, (svg) => {
    // Pylon
    const pylon = symmetricD(svg, [
      [8, 0], [12, 0], [12, 100], [8, 100]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    unite(svg, pylon);
  }));

  // Spruce tree
  add("mountain", "spruce", "vegetation", shape({
    width: 40,
    height: 80,
    tints: { foliage: "#059669", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 60], [25, 60], [25, 80], [15, 80]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 40], [20, 10], [40, 40], [20, 60]
    ], { fill: "#059669", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Larch tree
  add("mountain", "larch", "vegetation", shape({
    width: 30,
    height: 80,
    tints: { foliage: "#d97706", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [12, 60], [18, 60], [18, 80], [12, 80]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 30], [15, 10], [30, 30], [15, 60]
    ], { fill: "#d97706", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Boulder
  add("mountain", "boulder", "rock", shape({
    width: 40,
    height: 30,
  }, (svg) => {
    const boulder = symmetricD(svg, [
      [10, 20], [20, 10], [30, 15], [35, 25], [20, 30], [10, 25]
    ], { fill: "#64748b", stroke: "#1e293b" });
    unite(svg, boulder);
  }));

  // Scree
  add("mountain", "scree", "terrain", shape({
    width: 60,
    height: 20,
  }, (svg) => {
    const scree = symmetricD(svg, [
      [10, 10], [50, 10], [50, 15], [10, 15]
    ], { fill: "#64748b", stroke: "#1e293b" });
    unite(svg, scree);
  }));

  // Glacier
  add("mountain", "glacier", "terrain", shape({
    width: 80,
    height: 40,
  }, (svg) => {
    const glacier = symmetricD(svg, [
      [10, 20], [70, 20], [70, 30], [10, 30]
    ], { fill: "#e0f2fe", stroke: "#1e293b" });
    unite(svg, glacier);
  }));

  // Waterfall
  add("mountain", "waterfall", "terrain", shape({
    width: 40,
    height: 80,
  }, (svg) => {
    const waterfall = symmetricD(svg, [
      [10, 0], [30, 0], [30, 80], [10, 80]
    ], { fill: "#3b82f6", stroke: "#1e293b" });
    unite(svg, waterfall);
  }));

  // Cable car
  add("mountain", "cable_car", "vehicle", shape({
    width: 60,
    height: 40,
    anchor: [0.5, 0],
  }, (svg) => {
    // Cable car body
    const body = symmetricD(svg, [
      [10, 20], [50, 20], [50, 30], [10, 30]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Cable
    const cable = symmetricD(svg, [
      [0, 10], [60, 10]
    ], { fill: "none", stroke: "#6b7280" });
    
    // Group all parts
    unite(svg, body, cable);
  }));

  // Snowplow
  add("mountain", "snowplow", "vehicle", shape({
    width: 100,
    height: 60,
    tints: { paint: "#dc2626" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [80, 50] },
  }, (svg) => {
    // Snowplow body
    const body = symmetricD(svg, [
      [10, 40], [30, 30], [80, 30], [90, 40], [90, 50], [10, 50]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Plow
    const plow = symmetricD(svg, [
      [10, 40], [0, 30], [10, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 16, { fill: "#374151" });
    wheelRear.move(12, 42);
    const wheelFront = circleD(svg, 16, { fill: "#374151" });
    wheelFront.move(72, 42);
    
    // Group all parts
    unite(svg, body, plow, wheelRear, wheelFront);
  }));

  // Rack train
  add("mountain", "rack_train", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#374151" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [100, 50] },
  }, (svg) => {
    // Train body
    const body = symmetricD(svg, [
      [10, 40], [20, 30], [100, 30], [110, 40], [110, 50], [10, 50]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 16, { fill: "#6b7280" });
    wheelRear.move(12, 42);
    const wheelFront = circleD(svg, 16, { fill: "#6b7280" });
    wheelFront.move(92, 42);
    
    // Group all parts
    unite(svg, body, wheelRear, wheelFront);
  }));

  // Ibex
  add("mountain", "ibex", "fauna", shape({
    width: 50,
    height: 40,
  }, (svg) => {
    // Ibex body
    const body = symmetricD(svg, [
      [10, 20], [40, 20], [40, 30], [10, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Ibex head
    const head = symmetricD(svg, [
      [40, 22], [50, 22], [50, 28], [40, 28]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Ibex horns
    const hornLeft = symmetricD(svg, [
      [45, 20], [47, 15], [49, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    const hornRight = symmetricD(svg, [
      [45, 28], [47, 33], [49, 28]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, head, hornLeft, hornRight);
  }));

  // Eagle
  add("mountain", "eagle", "fauna", shape({
    width: 40,
    height: 30,
    anchor: [0.5, 0.5],
    pivots: { wing: [20, 15] },
  }, (svg) => {
    // Eagle body
    const body = symmetricD(svg, [
      [15, 10], [25, 10], [25, 20], [15, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Eagle wings
    const wingLeft = symmetricD(svg, [
      [0, 15], [20, 10], [20, 20], [0, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    const wingRight = symmetricD(svg, [
      [20, 10], [40, 15], [40, 20], [20, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, wingLeft, wingRight);
  }));

  // Marmot
  add("mountain", "marmot", "fauna", shape({
    width: 30,
    height: 20,
  }, (svg) => {
    // Marmot body
    const body = symmetricD(svg, [
      [5, 10], [25, 10], [25, 15], [5, 15]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Marmot head
    const head = circleD(svg, 8, { fill: "#6b7280", stroke: "#1e293b" });
    head.move(20, 6);
    
    // Group all parts
    unite(svg, body, head);
  }));

  // Background layers (placeholder for seamless tiling)
  add("mountain", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#9cc3e6", stroke: "none" });
    unite(svg, sky);
  }));

  add("mountain", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant mountains
    for (let i = 0; i < 4; i++) {
      const mountain = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 50], [i * 200 + 200, 150]
      ], { fill: "#64748b", stroke: "#1e293b" });
      unite(svg, mountain);
    }
  }));

  add("mountain", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby mountains
    for (let i = 0; i < 2; i++) {
      const mountain = symmetricD(svg, [
        [i * 400, 170], [i * 400 + 200, 100], [i * 400 + 400, 170]
      ], { fill: "#475569", stroke: "#1e293b" });
      unite(svg, mountain);
    }
  }));
}

// Desert biome assets.
export function generateDesertAssets() {
  // Adobe building
  add("desert", "adobe", "building", shape({
    width: 80,
    height: 60,
    tints: { wall: "#d4a574" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [70, 20], [70, 50], [10, 50]
    ], { fill: "#d4a574", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [40, 5], [75, 20]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Mosque
  add("desert", "mosque", "building", shape({
    width: 80,
    height: 100,
    tints: { wall: "#f3f4f6", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [70, 30], [70, 80], [10, 80]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [40, 10], [75, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Dome
    const dome = circleD(svg, 20, { fill: "#374151", stroke: "#1e293b" });
    dome.move(30, 10);
    
    // Group all parts
    unite(svg, walls, roof, dome);
  }));

  // Derrick
  add("desert", "derrick", "prop", shape({
    width: 40,
    height: 80,
  }, (svg) => {
    // Derrick base
    const base = symmetricD(svg, [
      [10, 60], [30, 60], [30, 70], [10, 70]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Derrick tower
    const tower = symmetricD(svg, [
      [15, 10], [25, 10], [25, 60], [15, 60]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Derrick arm
    const arm = symmetricD(svg, [
      [25, 20], [40, 10], [40, 20], [25, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, base, tower, arm);
  }));

  // Caravanserai
  add("desert", "caravanserai", "building", shape({
    width: 100,
    height: 60,
    tints: { wall: "#d4a574" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [90, 20], [90, 50], [10, 50]
    ], { fill: "#d4a574", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [50, 5], [95, 20]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Temple ruin
  add("desert", "temple_ruin", "building", shape({
    width: 100,
    height: 60,
    tints: { wall: "#92400e" },
  }, (svg) => {
    // Ruin walls
    const walls = symmetricD(svg, [
      [10, 30], [90, 30], [90, 50], [10, 50]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Ruin columns
    for (let i = 0; i < 4; i++) {
      const column = symmetricD(svg, [
        [20 + i * 20, 20], [25 + i * 20, 20], [25 + i * 20, 30], [20 + i * 20, 30]
      ], { fill: "#92400e", stroke: "#1e293b" });
      unite(svg, column);
    }
    
    // Group all parts
    unite(svg, walls);
  }));

  // Radar
  add("desert", "radar", "prop", shape({
    width: 60,
    height: 60,
  }, (svg) => {
    // Radar base
    const base = circleD(svg, 20, { fill: "#6b7280", stroke: "#1e293b" });
    base.move(20, 40);
    
    // Radar dish
    const dish = symmetricD(svg, [
      [20, 20], [40, 20], [40, 30], [20, 30]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, base, dish);
  }));

  // Saguaro
  add("desert", "saguaro", "vegetation", shape({
    width: 20,
    height: 80,
    tints: { foliage: "#16a34a" },
  }, (svg) => {
    // Saguaro trunk
    const trunk = symmetricD(svg, [
      [8, 20], [12, 20], [12, 80], [8, 80]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    
    // Saguaro arms
    const armLeft = symmetricD(svg, [
      [0, 30], [8, 30], [8, 40], [0, 40]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    const armRight = symmetricD(svg, [
      [12, 30], [20, 30], [20, 40], [12, 40]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, armLeft, armRight);
  }));

  // Prickly pear
  add("desert", "prickly_pear", "vegetation", shape({
    width: 30,
    height: 20,
    tints: { foliage: "#16a34a" },
  }, (svg) => {
    // Prickly pear pads
    const pad1 = circleD(svg, 15, { fill: "#16a34a", stroke: "#1e293b" });
    pad1.move(0, 5);
    const pad2 = circleD(svg, 15, { fill: "#16a34a", stroke: "#1e293b" });
    pad2.move(15, 0);
    
    // Group all parts
    unite(svg, pad1, pad2);
  }));

  // Date palm
  add("desert", "date_palm", "vegetation", shape({
    width: 40,
    height: 100,
    tints: { foliage: "#16a34a", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 70], [25, 70], [25, 100], [15, 100]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 20], [20, 0], [40, 20], [20, 70]
    ], { fill: "#16a34a", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Agave
  add("desert", "agave", "vegetation", shape({
    width: 40,
    height: 40,
    tints: { foliage: "#059669" },
  }, (svg) => {
    // Agave leaves
    for (let i = 0; i < 6; i++) {
      const leaf = symmetricD(svg, [
        [20, 20], [30, 10 + i * 5], [30, 20 + i * 5], [20, 30]
      ], { fill: "#059669", stroke: "#1e293b" });
      turn(leaf, i * 60, [20, 20]);
      unite(svg, leaf);
    }
  }));

  // Mesa
  add("desert", "mesa", "terrain", shape({
    width: 100,
    height: 60,
  }, (svg) => {
    const mesa = symmetricD(svg, [
      [10, 30], [90, 30], [80, 50], [20, 50]
    ], { fill: "#d97706", stroke: "#1e293b" });
    unite(svg, mesa);
  }));

  // Rock arch
  add("desert", "rock_arch", "terrain", shape({
    width: 60,
    height: 60,
  }, (svg) => {
    // Arch base
    const baseLeft = symmetricD(svg, [
      [10, 40], [20, 40], [20, 60], [10, 60]
    ], { fill: "#d97706", stroke: "#1e293b" });
    const baseRight = symmetricD(svg, [
      [40, 40], [50, 40], [50, 60], [40, 60]
    ], { fill: "#d97706", stroke: "#1e293b" });
    
    // Arch top
    const arch = symmetricD(svg, [
      [20, 20], [40, 20], [40, 40], [20, 40]
    ], { fill: "#d97706", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, baseLeft, baseRight, arch);
  }));

  // Dune
  add("desert", "dune", "terrain", shape({
    width: 100,
    height: 40,
  }, (svg) => {
    const dune = symmetricD(svg, [
      [10, 30], [90, 30], [70, 40], [30, 40]
    ], { fill: "#d97706", stroke: "#1e293b" });
    unite(svg, dune);
  }));

  // Camel and caravan
  add("desert", "camel_caravan", "vehicle", shape({
    width: 120,
    height: 60,
  }, (svg) => {
    // Camel body
    const body = symmetricD(svg, [
      [20, 30], [40, 20], [80, 20], [100, 30], [100, 40], [20, 40]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Camel hump
    const hump = symmetricD(svg, [
      [50, 10], [70, 10], [70, 20], [50, 20]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Camel legs
    const legFrontLeft = symmetricD(svg, [
      [30, 40], [35, 40], [35, 50], [30, 50]
    ], { fill: "#92400e", stroke: "#1e293b" });
    const legFrontRight = symmetricD(svg, [
      [45, 40], [50, 40], [50, 50], [45, 50]
    ], { fill: "#92400e", stroke: "#1e293b" });
    const legBackLeft = symmetricD(svg, [
      [70, 40], [75, 40], [75, 50], [70, 50]
    ], { fill: "#92400e", stroke: "#1e293b" });
    const legBackRight = symmetricD(svg, [
      [85, 40], [90, 40], [90, 50], [85, 50]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, hump, legFrontLeft, legFrontRight, legBackLeft, legBackRight);
  }));

  // Pickup
  add("desert", "pickup", "vehicle", shape({
    width: 100,
    height: 60,
    tints: { paint: "#f59e0b" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [80, 50] },
  }, (svg) => {
    // Pickup body
    const body = symmetricD(svg, [
      [10, 40], [30, 30], [80, 30], [90, 40], [90, 50], [10, 50]
    ], { fill: "#f59e0b", stroke: "#1e293b" });
    
    // Pickup cargo
    const cargo = symmetricD(svg, [
      [60, 20], [80, 20], [80, 30], [60, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 16, { fill: "#374151" });
    wheelRear.move(12, 42);
    const wheelFront = circleD(svg, 16, { fill: "#374151" });
    wheelFront.move(72, 42);
    
    // Group all parts
    unite(svg, body, cargo, wheelRear, wheelFront);
  }));

  // Vulture
  add("desert", "vulture", "fauna", shape({
    width: 40,
    height: 30,
    anchor: [0.5, 0.5],
    pivots: { wing: [20, 15] },
  }, (svg) => {
    // Vulture body
    const body = symmetricD(svg, [
      [15, 10], [25, 10], [25, 20], [15, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Vulture wings
    const wingLeft = symmetricD(svg, [
      [0, 15], [20, 10], [20, 20], [0, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    const wingRight = symmetricD(svg, [
      [20, 10], [40, 15], [40, 20], [20, 20]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, wingLeft, wingRight);
  }));

  // Lizard
  add("desert", "lizard", "fauna", shape({
    width: 30,
    height: 20,
  }, (svg) => {
    // Lizard body
    const body = symmetricD(svg, [
      [5, 10], [25, 10], [25, 15], [5, 15]
    ], { fill: "#059669", stroke: "#1e293b" });
    
    // Lizard head
    const head = symmetricD(svg, [
      [25, 12], [30, 12], [30, 14], [25, 14]
    ], { fill: "#059669", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, head);
  }));

  // Scorpion
  add("desert", "scorpion", "fauna", shape({
    width: 40,
    height: 20,
  }, (svg) => {
    // Scorpion body
    const body = symmetricD(svg, [
      [10, 10], [30, 10], [30, 15], [10, 15]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Scorpion tail
    const tail = symmetricD(svg, [
      [30, 12], [40, 8], [40, 12]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, tail);
  }));

  // Background layers (placeholder for seamless tiling)
  add("desert", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#9fd3ef", stroke: "none" });
    unite(svg, sky);
  }));

  add("desert", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant mesas
    for (let i = 0; i < 4; i++) {
      const mesa = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 100], [i * 200 + 200, 150]
      ], { fill: "#d97706", stroke: "#1e293b" });
      unite(svg, mesa);
    }
  }));

  add("desert", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby dunes
    for (let i = 0; i < 2; i++) {
      const dune = symmetricD(svg, [
        [i * 400, 170], [i * 400 + 200, 140], [i * 400 + 400, 170]
      ], { fill: "#b45309", stroke: "#1e293b" });
      unite(svg, dune);
    }
  }));
}

// Arctic biome assets.
export function generateArcticAssets() {
  // Igloo
  add("arctic", "igloo", "building", shape({
    width: 60,
    height: 40,
  }, (svg) => {
    // Igloo base
    const base = symmetricD(svg, [
      [10, 20], [50, 20], [50, 30], [10, 30]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    
    // Igloo dome
    const dome = symmetricD(svg, [
      [10, 20], [30, 10], [50, 20]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, base, dome);
  }));

  // Ice blocks
  add("arctic", "ice_blocks", "prop", shape({
    width: 40,
    height: 40,
  }, (svg) => {
    // Ice block
    const block = symmetricD(svg, [
      [10, 10], [30, 10], [30, 30], [10, 30]
    ], { fill: "#e0f2fe", stroke: "#1e293b" });
    unite(svg, block);
  }));

  // Iceberg
  add("arctic", "iceberg", "terrain", shape({
    width: 80,
    height: 60,
  }, (svg) => {
    // Iceberg
    const iceberg = symmetricD(svg, [
      [10, 30], [70, 30], [60, 50], [20, 50]
    ], { fill: "#e0f2fe", stroke: "#1e293b" });
    unite(svg, iceberg);
  }));

  // Penguin
  add("arctic", "penguin", "fauna", shape({
    width: 30,
    height: 40,
  }, (svg) => {
    // Penguin body
    const body = symmetricD(svg, [
      [10, 15], [20, 15], [20, 35], [10, 35]
    ], { fill: "#000000", stroke: "#1e293b" });
    
    // Penguin belly
    const belly = symmetricD(svg, [
      [12, 20], [18, 20], [18, 30], [12, 30]
    ], { fill: "#ffffff", stroke: "#1e293b" });
    
    // Penguin head
    const head = circleD(svg, 10, { fill: "#000000", stroke: "#1e293b" });
    head.move(10, 5);
    
    // Group all parts
    unite(svg, body, belly, head);
  }));

  // Icebreaker
  add("arctic", "icebreaker", "boat", shape({
    width: 100,
    height: 40,
    anchor: [0.5, 0.75],
  }, (svg) => {
    // Icebreaker body
    const body = symmetricD(svg, [
      [10, 20], [90, 20], [90, 30], [10, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Icebreaker bow
    const bow = symmetricD(svg, [
      [10, 20], [0, 15], [10, 15]
    ], { fill: "#6b7280", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, bow);
  }));

  // Aurora overlay (placeholder for seamless tiling)
  add("arctic", "aurora", "overlay", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Aurora effect (semi-transparent overlay)
    const aurora = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#3b82f6", opacity: 0.2, stroke: "none" });
    unite(svg, aurora);
  }));

  // Background layers (placeholder for seamless tiling)
  add("arctic", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#b8d8ee", stroke: "none" });
    unite(svg, sky);
  }));

  add("arctic", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant ice
    for (let i = 0; i < 4; i++) {
      const ice = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 120], [i * 200 + 200, 150]
      ], { fill: "#e7f0f8", stroke: "#1e293b" });
      unite(svg, ice);
    }
  }));

  add("arctic", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby ice
    for (let i = 0; i < 2; i++) {
      const ice = symmetricD(svg, [
        [i * 400, 170], [i * 400 + 200, 140], [i * 400 + 400, 170]
      ], { fill: "#cbd5e1", stroke: "#1e293b" });
      unite(svg, ice);
    }
  }));
}

// Tropical biome assets.
export function generateTropicalAssets() {
  // Palm hut
  add("tropical", "palm_hut", "building", shape({
    width: 60,
    height: 80,
    tints: { wall: "#92400e", roof: "#059669" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 40], [50, 40], [50, 70], [10, 70]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 40], [30, 20], [55, 40]
    ], { fill: "#059669", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Fern
  add("tropical", "fern", "vegetation", shape({
    width: 40,
    height: 30,
    tints: { foliage: "#059669" },
  }, (svg) => {
    // Fern leaves
    for (let i = 0; i < 3; i++) {
      const leaf = symmetricD(svg, [
        [20, 10 + i * 10], [30, 5 + i * 10], [30, 15 + i * 10], [20, 20 + i * 10]
      ], { fill: "#059669", stroke: "#1e293b" });
      unite(svg, leaf);
    }
  }));

  // Liana
  add("tropical", "liana", "vegetation", shape({
    width: 20,
    height: 100,
    anchor: [0.5, 0],
  }, (svg) => {
    // Liana vine
    const vine = symmetricD(svg, [
      [8, 0], [12, 0], [12, 100], [8, 100]
    ], { fill: "#059669", stroke: "#1e293b" });
    unite(svg, vine);
  }));

  // Bamboo
  add("tropical", "bamboo", "vegetation", shape({
    width: 20,
    height: 100,
    tints: { foliage: "#059669" },
  }, (svg) => {
    // Bamboo segments
    for (let i = 0; i < 5; i++) {
      const segment = symmetricD(svg, [
        [5, i * 20], [15, i * 20], [15, i * 20 + 15], [5, i * 20 + 15]
      ], { fill: "#059669", stroke: "#1e293b" });
      unite(svg, segment);
    }
  }));

  // Bamboo bridge
  add("tropical", "bamboo_bridge", "prop", shape({
    width: 80,
    height: 20,
  }, (svg) => {
    // Bridge base
    const base = symmetricD(svg, [
      [10, 10], [70, 10], [70, 15], [10, 15]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Bridge ropes
    const ropeLeft = symmetricD(svg, [
      [10, 5], [10, 10]
    ], { fill: "none", stroke: "#6b7280" });
    const ropeRight = symmetricD(svg, [
      [70, 5], [70, 10]
    ], { fill: "none", stroke: "#6b7280" });
    
    // Group all parts
    unite(svg, base, ropeLeft, ropeRight);
  }));

  // Coconut palm
  add("tropical", "coconut_palm", "vegetation", shape({
    width: 40,
    height: 100,
    tints: { foliage: "#059669", trunk: "#92400e" },
  }, (svg) => {
    // Trunk
    const trunk = symmetricD(svg, [
      [15, 70], [25, 70], [25, 100], [15, 100]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Foliage
    const foliage = symmetricD(svg, [
      [0, 20], [20, 0], [40, 20], [20, 70]
    ], { fill: "#059669", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, trunk, foliage);
  }));

  // Toucan
  add("tropical", "toucan", "fauna", shape({
    width: 40,
    height: 30,
  }, (svg) => {
    // Toucan body
    const body = symmetricD(svg, [
      [10, 15], [30, 15], [30, 25], [10, 25]
    ], { fill: "#000000", stroke: "#1e293b" });
    
    // Toucan beak
    const beak = symmetricD(svg, [
      [30, 18], [40, 15], [40, 22], [30, 22]
    ], { fill: "#fbbf24", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body, beak);
  }));

  // Background layers (placeholder for seamless tiling)
  add("tropical", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#8fd0e8", stroke: "none" });
    unite(svg, sky);
  }));

  add("tropical", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant trees
    for (let i = 0; i < 4; i++) {
      const tree = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 100], [i * 200 + 200, 150]
      ], { fill: "#15803d", stroke: "#1e293b" });
      unite(svg, tree);
    }
  }));

  add("tropical", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby trees
    for (let i = 0; i < 2; i++) {
      const tree = symmetricD(svg, [
        [i * 400, 170], [i * 400 + 200, 120], [i * 400 + 400, 170]
      ], { fill: "#059669", stroke: "#1e293b" });
      unite(svg, tree);
    }
  }));
}