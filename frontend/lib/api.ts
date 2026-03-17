import axios from "axios"
import type {
  RiskAssessment,
  RiskHistoryItem,
  HeatmapZone,
  WeatherResponse,
  TrafficResponse,
  AlertsResponse,
  AlertStats,
  CameraListResponse,
  Camera,
  EventsResponse,
  SocialResponse,
  AnalyticsResponse,
} from "./types"

// ── Base URL from environment variable ───────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ── Axios instance ────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// ── Request interceptor (logging) ─────────────────
api.interceptors.request.use((config) => {
  return config
})

// ── Response interceptor (error handling) ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "[API Error]",
      error.config?.url,
      error.response?.status,
      error.message
    )
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════

export async function fetchHealth() {
  const res = await api.get("/api/health")
  return res.data
}

// ═══════════════════════════════════════════════
// RISK APIs
// ═══════════════════════════════════════════════

export async function fetchCurrentRisk(
  zoneId = "indore-center",
  force  = false
): Promise<RiskAssessment> {
  const res = await api.get("/api/risk/current", {
    params: { zone_id: zoneId, force },
  })
  return res.data
}

export async function fetchLatestRisk(): Promise<RiskAssessment> {
  const res = await api.get("/api/risk/latest")
  return res.data
}

export async function fetchRiskHistory(
  hours = 24
): Promise<{ history: RiskHistoryItem[] }> {
  const res = await api.get("/api/risk/history", {
    params: { hours },
  })
  return res.data
}

export async function fetchHeatmapData(): Promise<{
  zones: HeatmapZone[]
}> {
  const res = await api.get("/api/risk/heatmap")
  return res.data
}

export async function fetchRiskExplanation(
  zoneId = "indore-center"
): Promise<RiskAssessment> {
  const res = await api.get(`/api/risk/explain/${zoneId}`)
  return res.data
}

export async function fetchRiskScores() {
  const res = await api.get("/api/risk/scores")
  return res.data
}

// ═══════════════════════════════════════════════
// WEATHER APIs
// ═══════════════════════════════════════════════

export async function fetchWeather(
  limit = 1
): Promise<WeatherResponse> {
  const res = await api.get("/api/data/weather", {
    params: { limit },
  })
  return res.data
}

// ═══════════════════════════════════════════════
// TRAFFIC APIs
// ═══════════════════════════════════════════════

export async function fetchTraffic(
  limit = 1
): Promise<TrafficResponse> {
  const res = await api.get("/api/data/traffic", {
    params: { limit },
  })
  return res.data
}

// ═══════════════════════════════════════════════
// EVENTS APIs
// ═══════════════════════════════════════════════

export async function fetchEvents(): Promise<EventsResponse> {
  const res = await api.get("/api/data/events")
  return res.data
}

// ═══════════════════════════════════════════════
// SOCIAL APIs
// ═══════════════════════════════════════════════

export async function fetchSocial(): Promise<SocialResponse> {
  const res = await api.get("/api/data/social")
  return res.data
}

// ═══════════════════════════════════════════════
// ANALYTICS APIs
// ═══════════════════════════════════════════════

export async function fetchAnalytics(
  hours = 24
): Promise<AnalyticsResponse> {
  const res = await api.get("/api/data/analytics/traffic-weather", {
    params: { hours },
  })
  return res.data
}

// ═══════════════════════════════════════════════
// CAMERA APIs
// ═══════════════════════════════════════════════

export async function fetchCameraList(): Promise<CameraListResponse> {
  const res = await api.get("/api/camera/list")
  return res.data
}

export async function fetchCameraStats(
  cameraId: string
): Promise<Camera> {
  const res = await api.get(`/api/camera/stats/${cameraId}`)
  return res.data
}

export function getCameraStreamUrl(cameraId: string): string {
  return `${BASE_URL}/api/camera/stream/${cameraId}`
}

export function getCameraSnapshotUrl(cameraId: string): string {
  return `${BASE_URL}/api/camera/snapshot/${cameraId}`
}

// ═══════════════════════════════════════════════
// ALERT APIs
// ═══════════════════════════════════════════════

export async function fetchActiveAlerts(
  severity?: "HIGH" | "MEDIUM",
  limit = 20
): Promise<AlertsResponse> {
  const res = await api.get("/api/alerts/active", {
    params: { severity, limit },
  })
  return res.data
}

export async function fetchAlertHistory(
  hours = 24,
  limit = 50
): Promise<AlertsResponse> {
  const res = await api.get("/api/alerts/history", {
    params: { hours, limit },
  })
  return res.data
}

export async function fetchAlertStats(): Promise<AlertStats> {
  const res = await api.get("/api/alerts/stats")
  return res.data
}

export async function acknowledgeAlert(
  alertId: string
): Promise<{ message: string }> {
  const res = await api.patch(`/api/alerts/acknowledge/${alertId}`)
  return res.data
}

export async function resolveAlert(
  alertId: string
): Promise<{ message: string }> {
  const res = await api.patch(`/api/alerts/resolve/${alertId}`)
  return res.data
}