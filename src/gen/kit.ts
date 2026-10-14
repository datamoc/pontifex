// Helper functions for generating biome assets.
// This file provides utilities for creating SVG assets and managing the biome manifest.
// See BIOME_ASSETS.md for conventions and usage.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Manifest data for all biome assets.
 * This object maps each asset to its metadata (e.g., file path, dimensions, tints).
 */
const manifest: Record<string, any> = {};

/**
 * Output directory for generated SVG assets.
 * Assets are organized by biome (e.g., `assets/biomes/common/car.svg`).
 */
const outputDir = "assets/biomes";

/**
 * Generates a minimal SVG string for an asset.
 * @param width The width of the SVG.
 * @param height The height of the SVG.
 * @param elements The SVG elements to include.
 */
function generateSVG(width: number, height: number, elements: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f9fafb" />
  ${elements}
</svg>`;
}

/**
 * Adds an asset to the biome manifest and generates its SVG.
 * @param biome The biome name (e.g., "common", "euro_city").
 * @param name The asset name (e.g., "car", "tree").
 * @param category The asset category (e.g., "vehicle", "vegetation").
 * @param asset The generated asset.
 */
export function add(biome: string, name: string, category: string, asset: {
  width?: number;
  height?: number;
  anchor?: [number, number];
  pivots?: Record<string, [number, number]>;
  tints?: Record<string, string>;
  elements?: string;
}) {
  const key = `${biome}/${name}`;
  manifest[key] = {
    file: `${biome}/${name}.svg`,
    biome,
    category,
    width: asset.width || 100,
    height: asset.height || 100,
    anchor: asset.anchor || [0.5, 1],
    pivots: asset.pivots || {},
    tints: asset.tints || {},
  };
  
  // Generate a minimal SVG for the asset.
  const svg = generateSVG(
    asset.width || 100,
    asset.height || 100,
    asset.elements || ""
  );
  
  // Save the SVG to the output directory.
  const biomeDir = join(outputDir, biome);
  mkdirSync(biomeDir, { recursive: true });
  writeFileSync(join(biomeDir, `${name}.svg`), svg);
  
  console.log(`Added asset: ${key} (${category})`);
}

/**
 * Defines a shape for an asset.
 * @param options Shape options (e.g., tints, dimensions, anchor, pivots).
 * @param elements SVG elements as a string.
 */
export function shape(options: {
  tints?: Record<string, string>;
  width?: number;
  height?: number;
  anchor?: [number, number];
  pivots?: Record<string, [number, number]>;
  elements?: string;
}) {
  return {
    ...options,
    width: options.width || 100,
    height: options.height || 100,
    elements: options.elements || "",
  };
}

/**
 * Defines a tintable part of an asset.
 * @param role The tint role (e.g., "paint", "foliage").
 * @param defaultColor The default color.
 */
export function tint(role: string, defaultColor: string) {
  return {
    role,
    defaultColor,
  };
}

/**
 * Writes the manifest.json file to the output directory.
 */
export function writeManifest() {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Manifest written to assets/biomes/manifest.json");
}

/**
 * Placeholder for combining shapes.
 */
export function unite(...shapes: any[]) {
  return {};
}

/**
 * Placeholder for subtracting shapes.
 */
export function subtract(shapeA: any, shapeB: any) {
  return {};
}

/**
 * Placeholder for creating a circle.
 */
export function circleD(diameter: number) {
  return {};
}

/**
 * Placeholder for creating a symmetric shape.
 */
export function symmetricD(points: [number, number][]) {
  return {};
}

/**
 * Placeholder for rotating a shape.
 */
export function turn(shape: any, degrees: number) {
  return {};
}

/**
 * Placeholder for adding a glow effect.
 */
export function glow() {}