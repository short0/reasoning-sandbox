import * as React from "react";

type Theme = "light" | "dark";
const KEY = "rl:theme";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeCtx = React.createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Theme | null;
      if (saved === "light" || saved === "dark") setThemeState(saved);
    } catch {}
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
  }, [theme]);

  const value = React.useMemo<Ctx>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggle: () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    }),
    [theme],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
