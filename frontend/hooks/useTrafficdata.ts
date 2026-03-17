"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchTraffic } from "@/lib/api"
import type { TrafficReading } from "@/lib/types"

export function useTrafficData(
  limit           = 1,
  refreshInterval = 90000
) {
  const [traffic, setTraffic] = useState<TrafficReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const res = await fetchTraffic(limit)
      setTraffic(res.traffic || [])
    } catch (e: any) {
      setError(e.message || "Traffic fetch failed")
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
    const interval = setInterval(load, refreshInterval)
    return () => clearInterval(interval)
  }, [load, refreshInterval])

  return { traffic, loading, error, refresh: load }
}