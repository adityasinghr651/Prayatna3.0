"use client"

import { useEffect, useCallback } from "react"
import { useCameraStore } from "@/store/useCameraStore"
import { fetchCameraList } from "@/lib/api"

export function useCameras(refreshInterval = 5000) {
  const { setCameras, setLoading, setError } = useCameraStore()

  const loadCameras = useCallback(async () => {
    try {
      const res = await fetchCameraList()
      setCameras(res.cameras)
    } catch (err: any) {
      setError(err.message || "Failed to fetch cameras")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCameras()
    const interval = setInterval(loadCameras, refreshInterval)
    return () => clearInterval(interval)
  }, [loadCameras, refreshInterval])

  return { refresh: loadCameras }
}