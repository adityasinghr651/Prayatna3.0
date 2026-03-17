"use client"

import { useEffect, useCallback } from "react"
import { useAlertStore } from "@/store/useAlertStore"
import { fetchActiveAlerts, fetchAlertStats } from "@/lib/api"
import { onNewAlert } from "@/lib/socket"

export function useAlerts(refreshInterval = 30000) {
  const {
    setAlerts,
    setAlertStats,
    addNewAlert,
    setLoading,
    setError,
  } = useAlertStore()

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const [alertsRes, statsRes] = await Promise.all([
        fetchActiveAlerts(),
        fetchAlertStats(),
      ])
      setAlerts(alertsRes.alerts)
      setAlertStats(statsRes)
    } catch (err: any) {
      setError(err.message || "Failed to fetch alerts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    loadAlerts()

    // Auto refresh
    const interval = setInterval(loadAlerts, refreshInterval)

    // WebSocket — real time alerts
    const cleanup = onNewAlert((alert) => {
      addNewAlert(alert)
    })

    return () => {
      clearInterval(interval)
      cleanup()
    }
  }, [loadAlerts, refreshInterval])

  return { refresh: loadAlerts }
}