import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type Database from "@tauri-apps/plugin-sql";
import { getSetting, setSetting } from "../db/settings";
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  THEME_CACHE_KEY,
  THEMES,
  applyThemeVars,
  isThemeName,
  type ThemeColors,
  type ThemeName,
  type ThemePreference,
} from "./themes";
import { FONT_CSS_VAR_NAMES, FONT_PRESETS, type FontPreset, type FontPresetName } from "./fontPresets";

const THEME_SETTING_KEY = "theme";
const FONT_SETTING_KEY = "font_preset";
const DEFAULT_FONT_PRESET: FontPresetName = "classic";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || isThemeName(value);
}

function isFontPresetName(value: string | null): value is FontPresetName {
  return value === "classic" || value === "literary" || value === "technical";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyFontPreset(preset: FontPreset) {
  const root = document.documentElement.style;
  root.setProperty(FONT_CSS_VAR_NAMES.display, preset.display);
  root.setProperty(FONT_CSS_VAR_NAMES.mono, preset.mono);
  root.setProperty(FONT_CSS_VAR_NAMES.body, preset.body);
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ThemeName;
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => void;
  fontPresetName: FontPresetName;
  setFontPresetName: (name: FontPresetName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ db, children }: { db: Database; children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_DARK_THEME);
  const [systemIsDark, setSystemIsDark] = useState(() => systemPrefersDark());
  const [fontPresetName, setFontPresetNameState] = useState<FontPresetName>(DEFAULT_FONT_PRESET);

  useEffect(() => {
    void getSetting(db, THEME_SETTING_KEY).then((value) => {
      if (isThemePreference(value)) setPreferenceState(value);
    });
    void getSetting(db, FONT_SETTING_KEY).then((value) => {
      if (isFontPresetName(value)) setFontPresetNameState(value);
    });
  }, [db]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange(e: MediaQueryListEvent) {
      setSystemIsDark(e.matches);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ThemeName =
    preference === "system" ? (systemIsDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME) : preference;
  const colors = THEMES[resolvedTheme].colors;
  const fontPreset = FONT_PRESETS[fontPresetName];

  useEffect(() => {
    applyThemeVars(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    applyFontPreset(fontPreset);
  }, [fontPreset]);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    localStorage.setItem(THEME_CACHE_KEY, next);
    void setSetting(db, THEME_SETTING_KEY, next);
  }

  function setFontPresetName(next: FontPresetName) {
    setFontPresetNameState(next);
    void setSetting(db, FONT_SETTING_KEY, next);
  }

  const value = useMemo(
    () => ({ preference, resolvedTheme, colors, setPreference, fontPresetName, setFontPresetName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preference, resolvedTheme, colors, fontPresetName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
