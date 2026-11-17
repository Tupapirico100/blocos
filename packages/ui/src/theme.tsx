import * as React from "react";
import { cn } from "./cn.js";

export type ThemeName = "aurora" | "daylight" | "graphite";
export type Density = "comfortable" | "compact";

export interface ThemeContextValue {
  theme: ThemeName;
  density: Density;
  setTheme: (theme: ThemeName) => void;
  setDensity: (density: Density) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  theme: initialTheme = "aurora",
  density: initialDensity = "comfortable",
  onThemeChange,
  onDensityChange,
}: {
  children: React.ReactNode;
  theme?: ThemeName;
  density?: Density;
  onThemeChange?: (theme: ThemeName) => void;
  onDensityChange?: (density: Density) => void;
}) {
  const [theme, setThemeState] = React.useState<ThemeName>(initialTheme);
  const [density, setDensityState] = React.useState<Density>(initialDensity);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      density,
      setTheme: (t) => {
        setThemeState(t);
        onThemeChange?.(t);
      },
      setDensity: (d) => {
        setDensityState(d);
        onDensityChange?.(d);
      },
    }),
    [theme, density, onThemeChange, onDensityChange],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={theme}
        data-density={density}
        className={cn(
          "bloco-aurora-bg min-h-full text-fg",
          `bloco-theme-${theme}`,
          density === "compact" ? "bloco-density-compact" : "bloco-density-comfortable",
        )}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "aurora",
      density: "comfortable",
      setTheme: () => {},
      setDensity: () => {},
    };
  }
  return ctx;
}

export const THEMES: Array<{ value: ThemeName; label: string; hint: string }> = [
  { value: "aurora", label: "Aurora", hint: "Escuro, vidro com luz, alto impacto" },
  { value: "daylight", label: "Daylight", hint: "Claro, editorial, preciso e calmo" },
  { value: "graphite", label: "Graphite", hint: "Escuro neutro, denso, para operacao" },
];

export const DENSITIES: Array<{ value: Density; label: string; hint: string }> = [
  { value: "comfortable", label: "Confortavel", hint: "Mais respiro, para leitura longa" },
  { value: "compact", label: "Compacto", hint: "Mais informacao por tela" },
];
