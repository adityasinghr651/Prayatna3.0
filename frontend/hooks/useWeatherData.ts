"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchWeather } from "@/lib/api"
import type { WeatherReading } from "@/lib/types"

export function useWeatherData(refreshInterval = 120000) {
  const [weather, setWeather] = useState<WeatherReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const res = await fetchWeather(1)
      if (res.weather && res.weather.length > 0) {
        setWeather(res.weather[0])
      }
    } catch (e: any) {
      setError(e.message || "Weather fetch failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, refreshInterval)
    return () => clearInterval(interval)
  }, [load, refreshInterval])

  return { weather, loading, error, refresh: load }
}