export type FontPresetName = "classic" | "literary" | "technical";

export interface FontPreset {
  label: string;
  description: string;
  display: string;
  mono: string;
  body: string;
}

// Curated pairings only — no free-text font field. Each keeps the
// display/mono/body role structure, and every mono choice is a genuine
// monospace face so numbers stay tabular.
export const FONT_PRESETS: Record<FontPresetName, FontPreset> = {
  classic: {
    label: "Classic",
    description: "Space Grotesk, JetBrains Mono, Inter — the original warm-terminal pairing.",
    display: '"Space Grotesk", sans-serif',
    mono: '"JetBrains Mono", monospace',
    body: '"Inter", sans-serif',
  },
  literary: {
    label: "Literary",
    description: "Fraunces, JetBrains Mono, Source Serif 4 — a warmer, editorial feel.",
    display: '"Fraunces", serif',
    mono: '"JetBrains Mono", monospace',
    body: '"Source Serif 4", serif',
  },
  technical: {
    label: "Technical",
    description: "IBM Plex Sans, IBM Plex Mono — a cohesive, technical family.",
    display: '"IBM Plex Sans", sans-serif',
    mono: '"IBM Plex Mono", monospace',
    body: '"IBM Plex Sans", sans-serif',
  },
};

export const FONT_CSS_VAR_NAMES: Record<"display" | "mono" | "body", string> = {
  display: "--font-display",
  mono: "--font-mono",
  body: "--font-body",
};
