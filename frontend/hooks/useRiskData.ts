"use client"

import { useEffect, useCallback } from "react"
import { useRiskStore } from "@/store/useRiskStore"
import {
  fetchCurrentRisk,
  fetchHeatmapData,
  fetchRiskHistory,
} from "@/lib/api"

export function useRiskData(refreshInterval = 60000) {
  const {
    setCurrentRisk,
    setHeatmapZones,
    setRiskHistory,
    setLoading,
    setError,
  } = useRiskStore()

  const loadRisk = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [risk, heatmap, history] = await Promise.all([
        fetchCurrentRisk(),
        fetchHeatmapData(),
        fetchRiskHistory(24),
      ])

      setCurrentRisk(risk)
      setHeatmapZones(heatmap.zones)
      setRiskHistory(history.history)
    } catch (err: any) {
      setError(err.message || "Failed to fetch risk data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    loadRisk()

    // Auto refresh
    const interval = setInterval(loadRisk, refreshInterval)
    return () => clearInterval(interval)
  }, [loadRisk, refreshInterval])

  return { refresh: loadRisk }
}