// Entry point for generating all biome assets.
// This file orchestrates the generation of SVG assets for all biomes.
// See BIOME_ASSETS.md for conventions and usage.

import { generateCommonAssets } from "./base.ts";
import { generateEuroCityAssets, generateCyberpunkAssets } from "./cities.ts";
import {
  generateEuroCountryAssets,
  generateMountainAssets,
  generateDesertAssets,
  generateArcticAssets,
  generateTropicalAssets,
} from "./nature.ts";
import { generateHarbourAssets, generateVolcanicAssets, generateAdditionalAssets } from "./extras.ts";
import { writeManifest } from "../kit.ts";

/**
 * Generates all biome assets and writes the manifest.json file.
 * This function calls the generation functions for each biome and additional assets.
 */
export function generateBiomeAssets() {
  console.log("Generating biome assets...");

  // Common assets (vehicles, trees, effects, etc.)
  console.log("Generating common assets...");
  generateCommonAssets();

  // Euro City and Cyberpunk assets (buildings, vehicles, props, etc.)
  console.log("Generating euro_city assets...");
  generateEuroCityAssets();
  console.log("Generating cyberpunk assets...");
  generateCyberpunkAssets();

  // Euro Country, Mountain, Desert, Arctic, and Tropical assets (buildings, vegetation, fauna, etc.)
  console.log("Generating euro_country assets...");
  generateEuroCountryAssets();
  console.log("Generating mountain assets...");
  generateMountainAssets();
  console.log("Generating desert assets...");
  generateDesertAssets();
  console.log("Generating arctic assets...");
  generateArcticAssets();
  console.log("Generating tropical assets...");
  generateTropicalAssets();

  // Harbour and Volcanic assets (props, terrain, etc.)
  console.log("Generating harbour assets...");
  generateHarbourAssets();
  console.log("Generating volcanic assets...");
  generateVolcanicAssets();

  // Additional assets (walkers, wind turbines, bridge pillars, etc.)
  console.log("Generating additional assets...");
  generateAdditionalAssets();

  console.log("Biome assets generated successfully!");
}

// Generate biome assets and write the manifest.json file.
generateBiomeAssets();
writeManifest();