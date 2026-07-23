// Mirrors the CSS custom properties in App.css. Recharts (and any other
// JS-driven rendering, like custom tooltips) can't read CSS variables for
// SVG fill/stroke props reliably, so the palette lives here too — one source
// of hex values, referenced by both CSS and JS.
export const theme = {
  bg: "#17150F",
  surface: "#201E16",
  border: "rgba(237, 233, 221, 0.08)",
  text: "#EDE9DD",
  textMuted: "#9C9686",
  sage: "#9BB07A",
  terracotta: "#CE6A4C",
  amber: "#D8A657",
} as const;

// A small muted, harmonious set derived from the palette for categories that
// don't have their own color set — never saturated "rainbow" defaults.
export const categoryPalette = [
  theme.sage,
  theme.terracotta,
  theme.amber,
  "#7A9BB0", // muted slate-blue, same tone/chroma family as sage
  "#B08A9B", // muted mauve
  "#8A9C6E", // deeper sage variant
] as const;

// Groups never get an explicit color (createCategoryGroup doesn't take one)
// and categories seeded by the Phase 0 migration never got one either — both
// would otherwise render a flat grey dot. This gives every category a real,
// stable palette color (id-derived, so it never changes render to render)
// instead, used everywhere a category's color needs to be shown.
export function getCategoryColor(category: { id: number; color: string | null }): string {
  return category.color ?? categoryPalette[category.id % categoryPalette.length];
}
