import { create } from "zustand"
import type { Camera } from "@/lib/types"

interface CameraStore {
  cameras:  Camera[]
  loading:  boolean
  error:    string | null

  setCameras: (cameras: Camera[]) => void
  updateCamera: (cameraId: string, data: Partial<Camera>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCameraStore = create<CameraStore>((set) => ({
  cameras: [],
  loading: false,
  error:   null,

  setCameras: (cameras) =>
    set({ cameras }),

  updateCamera: (cameraId, data) =>
    set((state) => ({
      cameras: state.cameras.map((c) =>
        c.camera_id === cameraId
          ? { ...c, ...data }
          : c
      ),
    })),

  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),
}))