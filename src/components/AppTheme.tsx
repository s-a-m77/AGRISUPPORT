import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Leaf, Sun } from 'lucide-react';

export type AppTheme = 'olive' | 'white';
const STORAGE_KEY = 'agrisense-theme';
const ThemeContext = createContext<{ theme: AppTheme; setTheme: (theme: AppTheme) => void } | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('olive');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'white' || saved === 'olive') setTheme(saved);
    } catch { /* Appearance still works when storage is unavailable. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Optional device preference. */ }
  }, [theme, ready]);
  return <ThemeContext.Provider value={{ theme, setTheme }}><div data-theme={theme} className="app-theme min-h-screen bg-app-bg text-app-ink">{children}</div></ThemeContext.Provider>;
}

export function ThemeSelector() {
  const context = useContext(ThemeContext);
  if (!context) return null;
  const Icon = context.theme === 'white' ? Sun : Leaf;
  return (
    <label className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-app-line bg-app-surface px-2 py-1.5 text-app-ink">
      <Icon className="size-4 shrink-0 text-app-success" aria-hidden="true" />
      <select aria-label="Color theme" value={context.theme} onChange={event => {
        const value = event.target.value;
        if (value === 'olive' || value === 'white') context.setTheme(value);
      }} className="min-w-0 bg-app-surface text-xs font-semibold text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-success">
        <option value="olive">Olive</option>
        <option value="white">White</option>
      </select>
    </label>
  );
}