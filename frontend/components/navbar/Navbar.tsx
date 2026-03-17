"use client"

import { motion } from "framer-motion"
import { Bell, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { useRiskStore } from "@/store/useRiskStore"
import { useAlertStore } from "@/store/useAlertStore"
import { isConnected } from "@/lib/socket"
import { useState, useEffect } from "react"

export function Navbar() {
  const { currentRisk, lastUpdated }  = useRiskStore()
  const { unreadCount, clearUnread }  = useAlertStore()
  const [wsConnected, setWsConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState("SYNCING...")

  // Check WebSocket status every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWsConnected(isConnected())
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Live clock
  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour:   "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      )
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 h-24", // Slightly taller for physical weight
      "left-[256px]",  // matches sidebar width
      "bg-gradient-to-b from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF]",
      "border-b border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)]",
      "flex items-center justify-between px-8",
      "transition-all duration-300"
    )}>
      {/* Glossy top edge reflection */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

      {/* ── Left — System Title (Engraved Metal Look) ── */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#1a1a1a] font-black text-2xl tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,1)] uppercase">
            UrbanPulse <span className="text-[#b89065]"></span>
          </h1>
          <p className="text-[#8a6642] text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            <span>Indore, Madhya Pradesh</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#b89065]/50 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]" />
            <span className="text-gray-500">Live Telemetry</span>
          </p>
        </div>
      </div>

      {/* ── Right — Physical Status Indicators ── */}
      <div className="flex items-center gap-6 relative z-10">

        {/* Last updated (Muted text) */}
        {lastUpdated && (
          <div className="flex items-center gap-2 text-gray-500 text-[9px] font-black uppercase tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
            <RefreshCw size={12} className="text-[#b89065]" />
            <span>Updated {formatTime(lastUpdated)}</span>
          </div>
        )}

        {/* Live clock (Recessed LCD Screen) */}
        <div className="flex items-center px-4 py-2.5 rounded-xl bg-[#EAE6DF] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/50">
          <span className="text-[#1a1a1a] text-[11px] font-mono font-black tracking-widest drop-shadow-sm">
            {currentTime}
          </span>
        </div>

        {/* WebSocket status (Recessed LED Socket) */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#EAE6DF] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/50 min-w-[100px] justify-center">
          {wsConnected ? (
            <>
              <div className="relative flex items-center justify-center">
                <span className="absolute w-3 h-3 rounded-full border border-[#10B981] animate-ping opacity-50" />
                <Wifi size={14} className="text-[#10B981] drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              </div>
              <span className="text-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-sm">Uplink</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-sm">Offline</span>
            </>
          )}
        </div>

        {/* Current risk badge */}
        {currentRisk && (
          <div className="shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] rounded-full">
            <StatusBadge
              level={currentRisk.risk_level}
              size="sm"
            />
          </div>
        )}

        {/* Physical Engraved Divider */}
        <div className="w-[2px] h-10 bg-black/5 shadow-[1px_0_0_rgba(255,255,255,1)] mx-2 rounded-full" />

        {/* Alert bell (Raised Tactile Button) */}
        <button
          onClick={clearUnread}
          className="relative p-3.5 rounded-full bg-[#F0EBE1] shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all duration-300 group active:scale-95"
        >
          <Bell size={18} className="text-gray-400 group-hover:text-[#b89065] transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,1)]" />
          
          {/* Glowing Red LED Notification */}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-1 -right-1",
                "min-w-[22px] h-[22px] px-1 rounded-full",
                "bg-red-500 border-2 border-[#F0EBE1] shadow-[0_0_12px_rgba(239,68,68,0.7)] text-white",
                "text-[10px] font-black font-mono tracking-tighter",
                "flex items-center justify-center",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>

      </div>
    </header>
  )
}