import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ShadCN utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Risk level se color
export function getRiskColor(level: "HIGH" | "MEDIUM" | "SAFE" | string): string {
  switch (level) {
    case "HIGH":   return "#EF4444"
    case "MEDIUM": return "#F97316"
    case "SAFE":   return "#22C55E"
    default:       return "#94A3B8"
  }
}

// Risk score (0-1) se percentage
export function toPercent(score: number): string {
  return `${Math.round(score * 100)}%`
}

// Timestamp format karo
export function formatTime(isoString: string): string {
  if (!isoString || isoString === "N/A") return "N/A"
  try {
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour:   "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return "N/A"
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString || isoString === "N/A") return "N/A"
  try {
    return new Date(isoString).toLocaleString("en-IN", {
      day:    "2-digit",
      month:  "short",
      hour:   "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return "N/A"
  }
}

// Congestion ratio ko readable banao
export function getCongestionLabel(ratio: number): string {
  if (ratio >= 0.8) return "Free Flow"
  if (ratio >= 0.6) return "Light Traffic"
  if (ratio >= 0.4) return "Moderate"
  if (ratio >= 0.2) return "Heavy"
  return "Standstill"
}

// Risk score se level
export function getRiskLevel(
  score: number
): "HIGH" | "MEDIUM" | "SAFE" {
  if (score >= 0.7) return "HIGH"
  if (score >= 0.4) return "MEDIUM"
  return "SAFE"
}