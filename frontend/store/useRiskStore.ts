import { create } from "zustand"
import type { RiskAssessment, HeatmapZone, RiskHistoryItem } from "@/lib/types"

interface RiskStore {
  // State
  currentRisk:   RiskAssessment | null
  heatmapZones:  HeatmapZone[]
  riskHistory:   RiskHistoryItem[]
  loading:       boolean
  error:         string | null
  lastUpdated:   string | null

  // Actions
  setCurrentRisk:  (risk: RiskAssessment) => void
  setHeatmapZones: (zones: HeatmapZone[]) => void
  setRiskHistory:  (history: RiskHistoryItem[]) => void
  setLoading:      (loading: boolean) => void
  setError:        (error: string | null) => void
}

export const useRiskStore = create<RiskStore>((set) => ({
  // Initial state
  currentRisk:  null,
  heatmapZones: [],
  riskHistory:  [],
  loading:      false,
  error:        null,
  lastUpdated:  null,

  // Actions
  setCurrentRisk: (risk) =>
    set({ currentRisk: risk, lastUpdated: new Date().toISOString() }),

  setHeatmapZones: (zones) =>
    set({ heatmapZones: zones }),

  setRiskHistory: (history) =>
    set({ riskHistory: history }),

  setLoading: (loading) =>
    set({ loading }),

  setError: (error) =>
    set({ error }),
}))