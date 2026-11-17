export const designSystem = {
  name: "Aurora",
  version: "0.1.0-beta",
  description:
    "Design system inspirado no livro de Walter Isaacson sobre Steve Jobs: restricao, hierarquia tipografica, vidro com profundidade e movimento que explica.",
  themes: ["aurora", "daylight", "graphite"] as const,
  densities: ["comfortable", "compact"] as const,
  motion: {
    easings: ["apple", "out", "in-out", "spring"],
    durations: [120, 180, 260, 420, 700],
  },
  radii: ["xs", "sm", "md", "lg", "xl", "2xl", "pill"],
  blurs: ["sm", "md", "lg", "xl"],
  spacingBase: 4,
} as const;

export type ThemeName = (typeof designSystem.themes)[number];
export type Density = (typeof designSystem.densities)[number];
