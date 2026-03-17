import { create } from "zustand"
import type { Alert, AlertStats, WsNewAlert } from "@/lib/types"

interface AlertStore {
  // State
  alerts:      Alert[]
  alertStats:  AlertStats | null
  unreadCount: number
  loading:     boolean
  error:       string | null

  // Actions
  setAlerts:      (alerts: Alert[]) => void
  setAlertStats:  (stats: AlertStats) => void
  addNewAlert:    (alert: WsNewAlert) => void
  acknowledgeAlert: (alertId: string) => void
  resolveAlert:   (alertId: string) => void
  clearUnread:    () => void
  setLoading:     (loading: boolean) => void
  setError:       (error: string | null) => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  // Initial state
  alerts:      [],
  alertStats:  null,
  unreadCount: 0,
  loading:     false,
  error:       null,

  // Actions
  setAlerts: (alerts) =>
    set({ alerts }),

  setAlertStats: (stats) =>
    set({ alertStats: stats }),

  // WebSocket se naya alert aaya
  addNewAlert: (wsAlert) =>
    set((state) => ({
      alerts: [
        {
          alert_id:     wsAlert.alert_id,
          city:         "Indore",
          zone_id:      wsAlert.zone_id,
          lat:          wsAlert.lat,
          lon:          wsAlert.lon,
          alert_type:   "RISK_THRESHOLD",
          severity:     wsAlert.severity,
          title:        wsAlert.title,
          description:  wsAlert.description,
          risk_score:   wsAlert.risk_score,
          risk_factors: {},
          is_active:    true,
          acknowledged: false,
          created_at:   wsAlert.created_at,
          resolved_at:  null,
        },
        ...state.alerts,
      ],
      unreadCount: state.unreadCount + 1,
    })),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alert_id === alertId
          ? { ...a, acknowledged: true }
          : a
      ),
    })),

  resolveAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.alert_id !== alertId),
    })),

  clearUnread: () =>
    set({ unreadCount: 0 }),

  setLoading: (loading) =>
    set({ loading }),

  setError: (error) =>
    set({ error }),
}))