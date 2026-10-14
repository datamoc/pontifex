// Generated biome assets for "euro_city" and "cyberpunk" biomes.
// See BIOME_ASSETS.md for conventions and usage.

import { add, shape, circleD, symmetricD, tint, unite, turn, glow } from "../kit.ts";

// Euro City biome assets.
export function generateEuroCityAssets() {
  // Haussmann building
  add("euro_city", "haussmann", "building", shape({
    width: 80,
    height: 100,
    tints: { wall: "#f3f4f6", roof: "#374151", door: "#92400e" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [70, 20], [70, 80], [10, 80]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [40, 5], [75, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Door
    const door = symmetricD(svg, [
      [35, 80], [45, 80], [45, 95], [35, 95]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Windows
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const window = symmetricD(svg, [
          [15 + i * 20, 30 + j * 20], [25 + i * 20, 30 + j * 20], [25 + i * 20, 40 + j * 20], [15 + i * 20, 40 + j * 20]
        ], { fill: "#a7c5bd", stroke: "#1e293b" });
        unite(svg, window);
      }
    }
    
    // Group all parts
    unite(svg, walls, roof, door);
  }));

  // Half-timbered house
  add("euro_city", "half_timbered_house", "building", shape({
    width: 60,
    height: 80,
    tints: { wall: "#fef3c7", roof: "#92400e", door: "#92400e" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [50, 20], [50, 60], [10, 60]
    ], { fill: "#fef3c7", stroke: "#1e293b" });
    
    // Timber framing
    for (let i = 0; i < 4; i++) {
      const timber = symmetricD(svg, [
        [10 + i * 10, 20], [20 + i * 10, 20], [20 + i * 10, 60], [10 + i * 10, 60]
      ], { fill: "#92400e", stroke: "#1e293b" });
      unite(svg, timber);
    }
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [30, 5], [55, 20]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Door
    const door = symmetricD(svg, [
      [25, 60], [35, 60], [35, 75], [25, 75]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, door);
  }));

  // Canal house
  add("euro_city", "canal_house", "building", shape({
    width: 60,
    height: 100,
    tints: { wall: "#d1d5db", roof: "#374151", door: "#92400e" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 20], [50, 20], [50, 80], [10, 80]
    ], { fill: "#d1d5db", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 20], [30, 5], [55, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Door
    const door = symmetricD(svg, [
      [25, 80], [35, 80], [35, 95], [25, 95]
    ], { fill: "#92400e", stroke: "#1e293b" });
    
    // Windows
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        const window = symmetricD(svg, [
          [15 + i * 20, 30 + j * 20], [25 + i * 20, 30 + j * 20], [25 + i * 20, 40 + j * 20], [15 + i * 20, 40 + j * 20]
        ], { fill: "#a7c5bd", stroke: "#1e293b" });
        unite(svg, window);
      }
    }
    
    // Group all parts
    unite(svg, walls, roof, door);
  }));

  // Cathedral
  add("euro_city", "cathedral", "building", shape({
    width: 100,
    height: 120,
    tints: { wall: "#e5e7eb", roof: "#374151" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 30], [90, 30], [90, 90], [10, 90]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 30], [50, 5], [95, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Towers
    const towerLeft = symmetricD(svg, [
      [10, 30], [20, 30], [20, 10], [10, 10]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    const towerRight = symmetricD(svg, [
      [80, 30], [90, 30], [90, 10], [80, 10]
    ], { fill: "#e5e7eb", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof, towerLeft, towerRight);
  }));

  // Tram
  add("euro_city", "tram", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#dc2626" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [100, 50] },
  }, (svg) => {
    // Tram body
    const body = symmetricD(svg, [
      [10, 40], [20, 30], [100, 30], [110, 40], [110, 50], [10, 50]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 16, { fill: "#374151" });
    wheelRear.move(12, 42);
    const wheelFront = circleD(svg, 16, { fill: "#374151" });
    wheelFront.move(92, 42);
    
    // Group all parts
    unite(svg, body, wheelRear, wheelFront);
  }));

  // Double-decker bus
  add("euro_city", "double_decker", "vehicle", shape({
    width: 120,
    height: 80,
    tints: { paint: "#dc2626" },
    pivots: { "wheel-rear": [20, 70], "wheel-front": [100, 70] },
  }, (svg) => {
    // Bus body
    const body = symmetricD(svg, [
      [10, 40], [20, 30], [100, 30], [110, 40], [110, 70], [10, 70]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Upper deck
    const upperDeck = symmetricD(svg, [
      [15, 20], [105, 20], [105, 30], [15, 30]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 16, { fill: "#374151" });
    wheelRear.move(12, 62);
    const wheelFront = circleD(svg, 16, { fill: "#374151" });
    wheelFront.move(92, 62);
    
    // Group all parts
    unite(svg, body, upperDeck, wheelRear, wheelFront);
  }));

  // Vintage car
  add("euro_city", "vintage_car", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#f59e0b" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [100, 50] },
  }, (svg) => {
    // Car body
    const body = symmetricD(svg, [
      [10, 40], [20, 30], [100, 30], [110, 40], [110, 50], [10, 50]
    ], { fill: "#f59e0b", stroke: "#1e293b" });
    
    // Wheels
    const wheelRear = circleD(svg, 16, { fill: "#374151" });
    wheelRear.move(12, 42);
    const wheelFront = circleD(svg, 16, { fill: "#374151" });
    wheelFront.move(92, 42);
    
    // Group all parts
    unite(svg, body, wheelRear, wheelFront);
  }));

  // Barge
  add("euro_city", "barge", "boat", shape({
    width: 100,
    height: 40,
    tints: { paint: "#374151" },
    anchor: [0.5, 0.75],
  }, (svg) => {
    // Barge body
    const body = symmetricD(svg, [
      [10, 20], [90, 20], [90, 30], [10, 30]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body);
  }));

  // Lamp
  add("euro_city", "lamp", "prop", shape({
    width: 20,
    height: 60,
  }, (svg) => {
    // Lamp post
    const post = symmetricD(svg, [
      [8, 10], [12, 10], [12, 50], [8, 50]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Lamp head
    const head = circleD(svg, 12, { fill: "#fbbf24", stroke: "#1e293b" });
    head.move(4, 0);
    
    // Group all parts
    unite(svg, post, head);
  }));

  // Fountain
  add("euro_city", "fountain", "prop", shape({
    width: 40,
    height: 40,
  }, (svg) => {
    // Fountain base
    const base = circleD(svg, 30, { fill: "#a7c5bd", stroke: "#1e293b" });
    base.move(5, 10);
    
    // Fountain water
    const water = circleD(svg, 10, { fill: "#3b82f6", stroke: "#1e293b" });
    water.move(15, 20);
    
    // Group all parts
    unite(svg, base, water);
  }));

  // Kiosk
  add("euro_city", "kiosk", "prop", shape({
    width: 40,
    height: 50,
  }, (svg) => {
    // Kiosk roof
    const roof = symmetricD(svg, [
      [5, 10], [20, 5], [35, 10]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Kiosk body
    const body = symmetricD(svg, [
      [10, 10], [30, 10], [30, 40], [10, 40]
    ], { fill: "#f3f4f6", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, roof, body);
  }));

  // Background layers (placeholder for seamless tiling)
  add("euro_city", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#a9cdea", stroke: "none" });
    unite(svg, sky);
  }));

  add("euro_city", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant buildings
    for (let i = 0; i < 8; i++) {
      const building = symmetricD(svg, [
        [i * 100, 100], [i * 100 + 50, 50], [i * 100 + 100, 100]
      ], { fill: "#6b7280", stroke: "#1e293b" });
      unite(svg, building);
    }
  }));

  add("euro_city", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby buildings
    for (let i = 0; i < 4; i++) {
      const building = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 100], [i * 200 + 200, 150]
      ], { fill: "#4b5563", stroke: "#1e293b" });
      unite(svg, building);
    }
  }));
}

// Cyberpunk biome assets.
export function generateCyberpunkAssets() {
  // Neon tower
  add("cyberpunk", "neon_tower", "building", shape({
    width: 60,
    height: 120,
    tints: { wall: "#1f2937" },
  }, (svg) => {
    // Tower walls
    const walls = symmetricD(svg, [
      [10, 20], [50, 20], [50, 100], [10, 100]
    ], { fill: "#1f2937", stroke: "#1e293b" });
    
    // Neon lights
    for (let i = 0; i < 4; i++) {
      const neon = symmetricD(svg, [
        [15, 30 + i * 20], [45, 30 + i * 20], [45, 40 + i * 20], [15, 40 + i * 20]
      ], { fill: "#dc2626", stroke: "none" });
      glow(svg, neon);
      unite(svg, neon);
    }
    
    // Group all parts
    unite(svg, walls);
  }));

  // Megacorp tower
  add("cyberpunk", "megacorp_tower", "building", shape({
    width: 80,
    height: 140,
    tints: { wall: "#111827" },
  }, (svg) => {
    // Tower walls
    const walls = symmetricD(svg, [
      [10, 20], [70, 20], [70, 120], [10, 120]
    ], { fill: "#111827", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls);
  }));

  // Container stack
  add("cyberpunk", "container_stack", "prop", shape({
    width: 60,
    height: 40,
    tints: { paint: "#374151" },
  }, (svg) => {
    // Containers
    for (let i = 0; i < 3; i++) {
      const container = symmetricD(svg, [
        [10, 10 + i * 10], [50, 10 + i * 10], [50, 20 + i * 10], [10, 20 + i * 10]
      ], { fill: "#374151", stroke: "#1e293b" });
      unite(svg, container);
    }
  }));

  // Tech pagoda
  add("cyberpunk", "tech_pagoda", "building", shape({
    width: 60,
    height: 80,
    tints: { wall: "#1f2937", roof: "#dc2626" },
  }, (svg) => {
    // Building walls
    const walls = symmetricD(svg, [
      [10, 40], [50, 40], [50, 60], [10, 60]
    ], { fill: "#1f2937", stroke: "#1e293b" });
    
    // Roof
    const roof = symmetricD(svg, [
      [5, 40], [30, 20], [55, 40]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, walls, roof);
  }));

  // Billboard
  add("cyberpunk", "billboard", "prop", shape({
    width: 80,
    height: 60,
  }, (svg) => {
    // Billboard post
    const post = symmetricD(svg, [
      [38, 40], [42, 40], [42, 60], [38, 60]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Billboard screen
    const screen = symmetricD(svg, [
      [10, 10], [70, 10], [70, 40], [10, 40]
    ], { fill: "#1f2937", stroke: "#1e293b" });
    
    // Neon text (placeholder)
    const text = symmetricD(svg, [
      [20, 20], [60, 20], [60, 30], [20, 30]
    ], { fill: "#dc2626", stroke: "none" });
    glow(svg, text);
    
    // Group all parts
    unite(svg, post, screen, text);
  }));

  // Hover-car
  add("cyberpunk", "hover_car", "vehicle", shape({
    width: 100,
    height: 40,
    tints: { paint: "#dc2626" },
  }, (svg) => {
    // Car body
    const body = symmetricD(svg, [
      [10, 20], [20, 10], [80, 10], [90, 20], [80, 30], [20, 30]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body);
  }));

  // Maglev
  add("cyberpunk", "maglev", "vehicle", shape({
    width: 120,
    height: 30,
    tints: { paint: "#374151" },
  }, (svg) => {
    // Maglev body
    const body = symmetricD(svg, [
      [10, 10], [110, 10], [110, 20], [10, 20]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body);
  }));

  // Drone
  add("cyberpunk", "drone", "vehicle", shape({
    width: 40,
    height: 40,
    tints: { paint: "#374151" },
  }, (svg) => {
    // Drone body
    const body = circleD(svg, 20, { fill: "#374151", stroke: "#1e293b" });
    body.move(10, 10);
    
    // Rotors
    for (let i = 0; i < 4; i++) {
      const rotor = circleD(svg, 8, { fill: "#6b7280", stroke: "#1e293b" });
      rotor.move(5 + (i % 2) * 20, 5 + Math.floor(i / 2) * 20);
      unite(svg, rotor);
    }
    
    // Group all parts
    unite(svg, body);
  }));

  // Armored truck
  add("cyberpunk", "armored_truck", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#374151" },
  }, (svg) => {
    // Truck body
    const body = symmetricD(svg, [
      [10, 30], [20, 20], [100, 20], [110, 30], [110, 50], [10, 50]
    ], { fill: "#374151", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body);
  }));

  // Bus
  add("cyberpunk", "bus", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#dc2626" },
  }, (svg) => {
    // Bus body
    const body = symmetricD(svg, [
      [10, 30], [20, 20], [100, 20], [110, 30], [110, 50], [10, 50]
    ], { fill: "#dc2626", stroke: "#1e293b" });
    
    // Group all parts
    unite(svg, body);
  }));

  // Rain overlay (placeholder for seamless tiling)
  add("cyberpunk", "rain", "overlay", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Rain effect (semi-transparent overlay)
    const rain = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#3b82f6", opacity: 0.1, stroke: "none" });
    unite(svg, rain);
  }));

  // Background layers (placeholder for seamless tiling)
  add("cyberpunk", "bg_far", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Sky
    const sky = symmetricD(svg, [
      [0, 0], [800, 0], [800, 200], [0, 200]
    ], { fill: "#2a1b5c", stroke: "none" });
    unite(svg, sky);
  }));

  add("cyberpunk", "bg_mid", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Distant towers
    for (let i = 0; i < 8; i++) {
      const tower = symmetricD(svg, [
        [i * 100, 100], [i * 100 + 30, 50], [i * 100 + 60, 100]
      ], { fill: "#1e1b4b", stroke: "#1e293b" });
      unite(svg, tower);
    }
  }));

  add("cyberpunk", "bg_near", "background", shape({
    width: 800,
    height: 200,
    tile: true,
  }, (svg) => {
    // Nearby towers
    for (let i = 0; i < 4; i++) {
      const tower = symmetricD(svg, [
        [i * 200, 150], [i * 200 + 100, 100], [i * 200 + 200, 150]
      ], { fill: "#111827", stroke: "#1e293b" });
      unite(svg, tower);
    }
  }));
}