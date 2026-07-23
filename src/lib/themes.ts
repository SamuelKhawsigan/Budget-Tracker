export type ThemeName = "warm-dark" | "parchment" | "midnight" | "phosphor" | "dusk" | "ink";
export type ThemePreference = ThemeName | "system";
export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  warning: string;
  danger: string;
}

export interface ThemeDefinition {
  label: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

// Every color below is individually verified >=4.5:1 (WCAG AA) for
// text/bg, text/surface, muted/bg, muted/surface, muted/surfaceAlt,
// accent/bg, accent/surface, warning/bg, warning/surface, danger/bg and
// danger/surface. Parchment's and Ink's accent/warning/muted were nudged
// darker from the first pass (which failed against their light
// backgrounds) — see history for the original untuned values.
//
// --border isn't stored here: it's derived once in App.css as
// color-mix(in srgb, var(--text-primary) 9%, transparent), so a new theme
// gets a correctly-contrasted border for free instead of needing its own
// hand-picked value.
export const THEMES: Record<ThemeName, ThemeDefinition> = {
  "warm-dark": {
    label: "Warm Dark",
    mode: "dark",
    colors: {
      bg: "#17150f",
      surface: "#201e16",
      surfaceAlt: "#262218",
      textPrimary: "#ede9dd",
      textMuted: "#9c9686",
      accent: "#9bb07a",
      warning: "#d8a657",
      danger: "#ce6a4c",
    },
  },
  parchment: {
    label: "Parchment",
    mode: "light",
    colors: {
      bg: "#f4f0e6",
      surface: "#fffdf7",
      surfaceAlt: "#e7e1d2",
      textPrimary: "#2a2720",
      textMuted: "#686353",
      accent: "#5f723f",
      warning: "#8d6318",
      danger: "#b4482a",
    },
  },
  midnight: {
    label: "Midnight",
    mode: "dark",
    colors: {
      bg: "#0f1418",
      surface: "#171f24",
      surfaceAlt: "#1f2a30",
      textPrimary: "#e3eaee",
      textMuted: "#8a9aa5",
      accent: "#6fb3a5",
      warning: "#e0a94f",
      danger: "#d4695c",
    },
  },
  phosphor: {
    label: "Phosphor",
    mode: "dark",
    colors: {
      bg: "#0a0c0a",
      surface: "#101410",
      surfaceAlt: "#182016",
      textPrimary: "#d6e8d0",
      textMuted: "#7a8c76",
      accent: "#86c06c",
      warning: "#c9b458",
      danger: "#d2664f",
    },
  },
  dusk: {
    label: "Dusk",
    mode: "dark",
    colors: {
      bg: "#16121a",
      surface: "#1f1a24",
      surfaceAlt: "#28222e",
      textPrimary: "#e9e3ef",
      textMuted: "#9b90a6",
      accent: "#93b58c",
      warning: "#d6a15e",
      danger: "#c86a7c",
    },
  },
  ink: {
    label: "Ink",
    mode: "light",
    colors: {
      bg: "#edeef0",
      surface: "#ffffff",
      surfaceAlt: "#dfe2e6",
      textPrimary: "#1c2026",
      textMuted: "#5c636d",
      accent: "#2c7667",
      warning: "#8c6212",
      danger: "#b33f32",
    },
  },
};

export const DEFAULT_DARK_THEME: ThemeName = "warm-dark";
export const DEFAULT_LIGHT_THEME: ThemeName = "parchment";

export function isThemeName(value: string | null): value is ThemeName {
  return !!value && value in THEMES;
}

// Mixing a color at P% with fully transparent (as App.css's --border does via
// color-mix) is exactly equivalent to that color's RGB channels at alpha P —
// this gives chart libraries needing a concrete color (not a CSS custom
// property) the same derived border tone instead of a second hardcoded value.
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Maps ThemeColors keys to the semantic CSS custom property names in App.css.
export const CSS_VAR_NAMES: Record<keyof ThemeColors, string> = {
  bg: "--bg",
  surface: "--surface",
  surfaceAlt: "--surface-alt",
  textPrimary: "--text-primary",
  textMuted: "--text-muted",
  accent: "--accent",
  warning: "--warning",
  danger: "--danger",
};
