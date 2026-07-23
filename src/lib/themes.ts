export type ThemeName = "dark" | "light";
export type ThemePreference = ThemeName | "system";

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  warning: string;
  danger: string;
}

// Both palettes share the same sage/terracotta/amber accent family per
// DESIGN.md — light is a cream/parchment counterpart, not a cold
// white-and-blue theme. Every value here is verified >=4.5:1 (WCAG AA)
// against both bg and surface.
export const THEMES: Record<ThemeName, ThemeColors> = {
  dark: {
    bg: "#17150f",
    surface: "#201e16",
    border: "rgba(237, 233, 221, 0.08)",
    textPrimary: "#ede9dd",
    textMuted: "#9c9686",
    accent: "#9bb07a",
    warning: "#d8a657",
    danger: "#ce6a4c",
  },
  light: {
    bg: "#f5f1e7",
    surface: "#fffdf8",
    border: "rgba(23, 21, 15, 0.1)",
    textPrimary: "#211f17",
    textMuted: "#6b6558",
    accent: "#3f6b2a",
    warning: "#8a5a0a",
    danger: "#9c3b22",
  },
};

// Maps ThemeColors keys to the semantic CSS custom property names in App.css.
export const CSS_VAR_NAMES: Record<keyof ThemeColors, string> = {
  bg: "--bg",
  surface: "--surface",
  border: "--border",
  textPrimary: "--text-primary",
  textMuted: "--text-muted",
  accent: "--accent",
  warning: "--warning",
  danger: "--danger",
};
