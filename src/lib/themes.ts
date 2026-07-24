export type ThemeName = "warm-dark" | "parchment" | "midnight" | "phosphor" | "dusk" | "ink";
export type ThemePreference = ThemeName | "system";
export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
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
// text/bg, text/surface/surfaceAlt, muted/bg/surface/surfaceAlt, and
// accent/warning/danger against bg, surface, AND surfaceAlt (the last of
// these needed a second, small tuning pass — the first pass only checked
// bg/surface and missed a few sub-4.5 pairs against surfaceAlt specifically,
// where colored text can land via hover states).
//
// --border is a literal per-theme value, not a single derived formula: a
// flat color-mix(text-primary, 9%, transparent) measured under 1.3:1 against
// surface in every theme — WCAG's 3:1 non-text-contrast minimum for an
// interactive control's boundary (every input/select/button uses --border)
// needs roughly 40% for dark themes and 53-55% for light ones, a large
// enough gap that one shared percentage can't serve both without either
// under- or over-shooting. A new theme should compute its own value the same
// way: mix textPrimary over surface (and surfaceAlt) at increasing alpha
// until contrast(mixed, surface) >= ~3.2 for margin.
export const THEMES: Record<ThemeName, ThemeDefinition> = {
  "warm-dark": {
    label: "Warm Dark",
    mode: "dark",
    colors: {
      bg: "#17150f",
      surface: "#201e16",
      surfaceAlt: "#262218",
      border: "rgba(237, 233, 221, 0.4)",
      textPrimary: "#ede9dd",
      textMuted: "#9c9686",
      accent: "#9bb07a",
      warning: "#d8a657",
      danger: "#d07053",
    },
  },
  parchment: {
    label: "Parchment",
    mode: "light",
    colors: {
      bg: "#f4f0e6",
      surface: "#fffdf7",
      surfaceAlt: "#e7e1d2",
      border: "rgba(42, 39, 32, 0.55)",
      textPrimary: "#2a2720",
      textMuted: "#686353",
      accent: "#58693a",
      warning: "#815b16",
      danger: "#a84327",
    },
  },
  midnight: {
    label: "Midnight",
    mode: "dark",
    colors: {
      bg: "#0f1418",
      surface: "#171f24",
      surfaceAlt: "#1f2a30",
      border: "rgba(227, 234, 238, 0.42)",
      textPrimary: "#e3eaee",
      textMuted: "#8a9aa5",
      accent: "#6fb3a5",
      warning: "#e0a94f",
      danger: "#d87569",
    },
  },
  phosphor: {
    label: "Phosphor",
    mode: "dark",
    colors: {
      bg: "#0a0c0a",
      surface: "#101410",
      surfaceAlt: "#182016",
      border: "rgba(214, 232, 208, 0.4)",
      textPrimary: "#d6e8d0",
      textMuted: "#7a8c76",
      accent: "#86c06c",
      warning: "#c9b458",
      danger: "#d26750",
    },
  },
  dusk: {
    label: "Dusk",
    mode: "dark",
    colors: {
      bg: "#16121a",
      surface: "#1f1a24",
      surfaceAlt: "#28222e",
      border: "rgba(233, 227, 239, 0.42)",
      textPrimary: "#e9e3ef",
      textMuted: "#9b90a6",
      accent: "#93b58c",
      warning: "#d6a15e",
      danger: "#cb7283",
    },
  },
  ink: {
    label: "Ink",
    mode: "light",
    colors: {
      bg: "#edeef0",
      surface: "#ffffff",
      surfaceAlt: "#dfe2e6",
      border: "rgba(28, 32, 38, 0.53)",
      textPrimary: "#1c2026",
      textMuted: "#5c636d",
      accent: "#296e60",
      warning: "#835b11",
      danger: "#ae3d31",
    },
  },
};

export const DEFAULT_DARK_THEME: ThemeName = "warm-dark";
export const DEFAULT_LIGHT_THEME: ThemeName = "parchment";

export function isThemeName(value: string | null): value is ThemeName {
  return !!value && value in THEMES;
}

// Mixing a color at P% with fully transparent (as the border values above
// were derived) is exactly equivalent to that color's RGB channels at alpha
// P — this gives chart libraries needing a concrete color (not a CSS custom
// property) the same kind of derived tone instead of a second hardcoded value.
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
  border: "--border",
  textPrimary: "--text-primary",
  textMuted: "--text-muted",
  accent: "--accent",
  warning: "--warning",
  danger: "--danger",
};
