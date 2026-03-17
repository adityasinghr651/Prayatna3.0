export const MAP_CONFIG = {
  center:      [22.7196, 75.8577] as [number, number],
  zoom:        13,
  minZoom:     10,
  maxZoom:     18,
  tileUrl:     "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: "© OpenStreetMap contributors © CARTO",
}

export const RISK_COLORS = {
  HIGH:   "#EF4444",
  MEDIUM: "#F97316",
  SAFE:   "#22C55E",
} as const

export const RISK_WEIGHTS = {
  HIGH:   1.0,
  MEDIUM: 0.5,
  SAFE:   0.1,
} as const