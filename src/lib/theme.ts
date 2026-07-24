import type { ThemeName } from "./themes";

// The canonical (Warm Dark) slot set. Every category.color ever stored is one
// of these six literal hexes — ColorSwatchPicker only offers these swatches,
// never a free color field — so any stored value can always be resolved back
// to a stable slot index.
export const categoryPalette = [
  "#9BB07A", // sage
  "#CE6A4C", // terracotta
  "#D8A657", // amber
  "#7A9BB0", // muted slate-blue
  "#B08A9B", // muted mauve
  "#8A9C6E", // deeper sage
] as const;

// Per-theme substitutes for each slot, harmonious with that theme's own
// accent/warning/danger (slots 0-2 mirror them — kept as separate literals
// rather than referencing THEMES directly, so retuning a theme's danger for
// contrast doesn't also silently reinterpret categoryPalette's own canonical
// slot-1 value, which existing stored category colors depend on matching
// exactly) and with slots 3-5 derived by applying the same HSL hue/sat/light
// deltas the canonical slate-blue/mauve/deep-sage have relative to canonical
// sage, then nudged for >=4.5:1 contrast against that theme's own bg/surface.
export const CATEGORY_PALETTES: Record<ThemeName, readonly string[]> = {
  "warm-dark": ["#9BB07A", "#D07053", "#D8A657", "#7A9BB0", "#B08A9B", "#8A9C6E"],
  parchment: ["#58693a", "#a84327", "#815b16", "#3f5f72", "#764b5f", "#4c5938"],
  midnight: ["#6fb3a5", "#d87569", "#e0a94f", "#a874b6", "#b2b080", "#62a093"],
  phosphor: ["#86c06c", "#d26750", "#c9b458", "#6c86c0", "#bf7d87", "#76ae5d"],
  dusk: ["#93b58c", "#cb7283", "#d6a15e", "#8c93b5", "#b69b9b", "#85a180"],
  ink: ["#296e60", "#ae3d31", "#835b11", "#672c76", "#706d31", "#285a50"],
};

// Groups never get an explicit color (createCategoryGroup doesn't take one)
// and categories seeded by the Phase 0 migration never got one either — both
// would otherwise render a flat grey dot. This gives every category a real,
// stable palette color (id-derived, so it never changes render to render),
// and maps any explicitly-chosen color through the current theme's own
// palette rather than rendering the raw stored hex, so category colors never
// clash against a light theme's background.
export function getCategoryColor(
  themeName: ThemeName,
  category: { id: number; color: string | null },
): string {
  const palette = CATEGORY_PALETTES[themeName];
  if (category.color) {
    const slot = categoryPalette.indexOf(category.color as (typeof categoryPalette)[number]);
    return slot === -1 ? category.color : palette[slot];
  }
  return palette[category.id % palette.length];
}
