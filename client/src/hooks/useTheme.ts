import { useCallback, useEffect, useState } from 'react';
import { defaultThemeConfig, STORAGE_KEYS } from '../theme';
import type { ThemeMode, ThemePalette } from '../theme';

// Runtime theme management — mirrors the CSS doc's runtime token injection.
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.mode);
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
  }, [mode]);

  const palette: ThemePalette = defaultThemeConfig[mode];
  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);

  // The runtime style object injected onto the app shell (CSS doc §2).
  const paletteStyle = {
    '--app-bg': palette.appBg,
    '--header-bg': palette.headerBg,
    '--menu-bg': palette.menuBg,
    '--card-bg': palette.cardBg,
    '--panel-bg': palette.panelBg,
    '--input-bg': palette.inputBg,
    '--button-bg': palette.buttonBg,
    '--accent': palette.accent,
    '--text': palette.text,
    '--text-muted': palette.textMuted,
    '--border': palette.border,
    '--button-text': palette.buttonText,
  } as React.CSSProperties;

  return { mode, setMode, toggle, palette, paletteStyle };
}
