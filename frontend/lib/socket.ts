import { io, Socket } from "socket.io-client"
import type { WsNewAlert } from "./types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000"

let socket: Socket | null = null

// ── Get or create socket connection ──────────────
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports:          ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
      autoConnect:          true,
    })

    // Connection events
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket?.id)
    })

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason)
    })

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message)
    })

    socket.on("welcome", (data) => {
      console.log("[Socket] Welcome:", data.message)
    })
  }

  return socket
}

// ── Disconnect socket ─────────────────────────────
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log("[Socket] Manually disconnected")
  }
}

// ── Listen for new alerts ─────────────────────────
export function onNewAlert(
  callback: (alert: WsNewAlert) => void
): () => void {
  const s = getSocket()
  s.on("new_alert", callback)

  // Return cleanup function
  return () => {
    s.off("new_alert", callback)
  }
}

// ── Check connection status ───────────────────────
export function isConnected(): boolean {
  return socket?.connected ?? false
}