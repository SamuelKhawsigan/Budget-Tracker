import { Check, Monitor } from "lucide-react";
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, THEMES, type ThemeDefinition } from "../lib/themes";

interface ThemeSwatchCardProps {
  label: string;
  colors: ThemeDefinition["colors"];
  selected: boolean;
  onSelect: () => void;
}

// A self-contained preview of a theme (or the system split-preview below) —
// renders its own bg/surface/accent via inline styles rather than the live
// CSS variables, since most of these cards are previewing a theme that isn't
// the one currently applied to the page.
export function ThemeSwatchCard({ label, colors, selected, onSelect }: ThemeSwatchCardProps) {
  return (
    <button
      type="button"
      className={"theme-swatch-card" + (selected ? " selected" : "")}
      style={{ backgroundColor: colors.bg }}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {selected && (
        <Check
          size={14}
          className="theme-swatch-check"
          style={{ color: colors.accent, backgroundColor: colors.surface }}
        />
      )}
      <div className="theme-swatch-preview" style={{ backgroundColor: colors.surface }}>
        <div className="theme-swatch-topbar" style={{ backgroundColor: colors.surfaceAlt }} />
        <div className="theme-swatch-figure" style={{ color: colors.textPrimary }}>
          $1,284.30
        </div>
        <div className="theme-swatch-meter" style={{ backgroundColor: colors.surfaceAlt }}>
          <div className="theme-swatch-meter-fill" style={{ backgroundColor: colors.accent, width: "62%" }} />
        </div>
        <div className="theme-swatch-muted" style={{ color: colors.textMuted }}>
          Groceries
        </div>
      </div>
      <span className="theme-swatch-label" style={{ color: colors.textPrimary }}>
        {label}
      </span>
    </button>
  );
}

interface SystemSwatchCardProps {
  selected: boolean;
  onSelect: () => void;
}

// "Match system" has no single palette to preview, so it shows a split of
// the default dark/light themes instead of one theme's colors.
export function SystemSwatchCard({ selected, onSelect }: SystemSwatchCardProps) {
  const dark = THEMES[DEFAULT_DARK_THEME].colors;
  const light = THEMES[DEFAULT_LIGHT_THEME].colors;

  return (
    <button
      type="button"
      className={"theme-swatch-card theme-swatch-system" + (selected ? " selected" : "")}
      style={{ background: `linear-gradient(135deg, ${dark.bg} 50%, ${light.bg} 50%)` }}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {selected && <Check size={14} className="theme-swatch-check" />}
      <div className="theme-swatch-preview theme-swatch-system-preview">
        <Monitor size={28} color={dark.textMuted} />
      </div>
      <span className="theme-swatch-label">Match system</span>
    </button>
  );
}
