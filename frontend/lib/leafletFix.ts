export function fixLeafletIcons() {
  if (typeof window === "undefined") return
  try {
    const L = require("leaflet")
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl:       "/leaflet/marker-icon.png",
      shadowUrl:     "/leaflet/marker-shadow.png",
    })
  } catch (e) {
    console.warn("Leaflet icon fix failed:", e)
  }
}

export function createColoredMarker(color: string) {
  if (typeof window === "undefined") return null
  try {
    const L = require("leaflet")
    return L.divIcon({
      className: "",
      html: `<div style="
        width:14px;height:14px;
        background:${color};
        border:2px solid white;
        border-radius:50%;
        box-shadow:0 0 6px ${color};
      "></div>`,
      iconSize:   [14, 14],
      iconAnchor: [7, 7],
    })
  } catch {
    return null
  }
}

export function getRiskMarkerColor(level: string): string {
  switch (level) {
    case "HIGH":   return "#EF4444"
    case "MEDIUM": return "#F97316"
    case "SAFE":   return "#22C55E"
    default:       return "#3B82F6"
  }
}

export function createCameraMarker() {
  if (typeof window === "undefined") return null
  try {
    const L = require("leaflet")
    return L.divIcon({
      className: "",
      html: `<div style="
        width:12px;height:12px;
        background:#3B82F6;
        border:2px solid white;
        border-radius:3px;
        box-shadow:0 0 8px #3B82F6;
      "></div>`,
      iconSize:   [12, 12],
      iconAnchor: [6, 6],
    })
  } catch {
    return null
  }
}