// Generated biome assets for the "common" biome.
// See BIOME_ASSETS.md for conventions and usage.

import { add, shape, tint } from "../kit.ts";

// Base set of assets (car, jeep, truck, clouds, tree, bush, rocks, explosion, flame).
export function generateCommonAssets() {
  // Car
  add("common", "car", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#f59e0b" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [100, 50], hood: [80, 20] },
    elements: `
      <rect x="10" y="40" width="80" height="10" fill="#f59e0b" stroke="#1e293b" />
      <rect x="70" y="20" width="20" height="20" fill="#f59e0b" stroke="#1e293b" />
      <circle cx="20" cy="50" r="8" fill="#374151" />
      <circle cx="100" cy="50" r="8" fill="#374151" />
    `,
  }));

  // Jeep
  add("common", "jeep", "vehicle", shape({
    width: 120,
    height: 60,
    tints: { paint: "#f59e0b" },
    pivots: { "wheel-rear": [20, 50], "wheel-front": [100, 50], hood: [80, 20] },
    elements: `
      <rect x="10" y="40" width="80" height="10" fill="#f59e0b" stroke="#1e293b" />
      <rect x="70" y="20" width="20" height="20" fill="#f59e0b" stroke="#1e293b" />
      <circle cx="20" cy="50" r="8" fill="#374151" />
      <circle cx="100" cy="50" r="8" fill="#374151" />
    `,
  }));

  // Truck
  add("common", "truck", "vehicle", shape({
    width: 150,
    height: 80,
    tints: { paint: "#f59e0b", cargo: "#374151" },
    pivots: { "wheel-rear": [30, 70], "wheel-front": [120, 70] },
    elements: `
      <rect x="10" y="50" width="80" height="20" fill="#f59e0b" stroke="#1e293b" />
      <rect x="80" y="30" width="60" height="40" fill="#374151" stroke="#1e293b" />
      <circle cx="30" cy="70" r="10" fill="#374151" />
      <circle cx="120" cy="70" r="10" fill="#374151" />
    `,
  }));

  // Cloud
  add("common", "cloud", "cloud", shape({
    width: 100,
    height: 60,
    anchor: [0, 0],
    elements: `
      <path d="M10,30 Q20,20 40,20 T50,30 T60,20 T80,20 T90,30 L90,40 Q80,40 60,40 T40,40 T20,40 T10,30 Z" fill="#ffffff" stroke="#1e293b" />
    `,
  }));

  // Tree
  add("common", "tree", "vegetation", shape({
    width: 40,
    height: 80,
    tints: { foliage: "#16a34a", trunk: "#92400e" },
    elements: `
      <rect x="15" y="60" width="10" height="20" fill="#92400e" stroke="#1e293b" />
      <circle cx="20" cy="40" r="20" fill="#16a34a" stroke="#1e293b" />
    `,
  }));

  // Bush
  add("common", "bush", "vegetation", shape({
    width: 60,
    height: 40,
    tints: { foliage: "#16a34a" },
    elements: `
      <path d="M10,20 Q20,10 40,10 T50,20 T40,30 T20,30 T10,20 Z" fill="#16a34a" stroke="#1e293b" />
    `,
  }));

  // Rock
  add("common", "rock", "rock", shape({
    width: 40,
    height: 30,
    elements: `
      <path d="M10,20 Q20,10 30,15 Q35,25 20,30 Q10,25 10,20 Z" fill="#6b7280" stroke="#1e293b" />
    `,
  }));

  // Explosion
  add("common", "explosion", "effect", shape({
    width: 60,
    height: 60,
    anchor: [0.5, 0.5],
    elements: `
      <path d="M30,10 Q40,20 50,20 Q55,30 50,40 Q40,40 30,50 Q20,40 10,40 Q5,30 10,20 Q20,20 30,10 Z" fill="#dc2626" stroke="#1e293b" />
    `,
  }));

  // Flame
  add("common", "flame", "effect", shape({
    width: 30,
    height: 50,
    anchor: [0.5, 1],
    elements: `
      <path d="M15,0 Q20,10 25,20 Q20,30 15,40 Q10,30 5,20 Q10,10 15,0 Z" fill="#f59e0b" stroke="#1e293b" />
    `,
  }));
}