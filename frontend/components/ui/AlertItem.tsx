"use client"

import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, MapPin, Clock } from "lucide-react"
import { cn, formatDateTime, toPercent } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"
import type { Alert } from "@/lib/types"
import { acknowledgeAlert } from "@/lib/api"
import { useAlertStore } from "@/store/useAlertStore"

interface AlertItemProps {
  alert:     Alert
  compact?:  boolean
}

// FILE: components/ui/AlertItem.tsx
// CHANGES:
// 1. Updated flat backgrounds to a premium deep black gradient (#111111 to #0A0A0A) with shiny inset white shadows.
// 2. Added a distinct left border to indicate severity clearly, with a soft inner shadow bleeding from the left edge.
// 3. Typography adjusted: Titles are `font-bold` turning Saffron (#FF9933) on hover. Metadata is `font-mono uppercase`.
// 4. "Ack" button restyled as a sleek ghost button with Saffron glowing borders/text on hover.
// 5. Acknowledged status given the specific Safe Green (#22C55E) glow.
// 6. Upgraded Framer Motion entry/exit animations for a smoother, premium feel.

export function AlertItem({ alert, compact = false }: AlertItemProps) {
  const { acknowledgeAlert: ackInStore } = useAlertStore()

  async function handleAcknowledge() {
    try {
      await acknowledgeAlert(alert.alert_id)
      ackInStore(alert.alert_id)
    } catch (err) {
      console.error("Failed to acknowledge alert:", err)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-xl border-y border-r border-[rgba(255,255,255,0.05)] border-l-4 p-4",
        "bg-gradient-to-r from-[#111111] to-[#0A0A0A] backdrop-blur-xl",
        "transition-all duration-300 hover:border-y-[rgba(255,255,255,0.15)] hover:border-r-[rgba(255,255,255,0.15)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_12px_30px_rgba(0,0,0,0.6)]",
        alert.severity === "HIGH"
          ? "border-l-[#EF4444] shadow-[inset_40px_0_40px_-30px_rgba(239,68,68,0.08)]"
          : "border-l-[#F97316] shadow-[inset_40px_0_40px_-30px_rgba(249,115,22,0.08)]"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle
            size={16}
            className={cn(
              "shrink-0 mt-0.5 drop-shadow-md transition-transform duration-300 group-hover:scale-110",
              alert.severity === "HIGH"
                ? "text-[#EF4444]"
                : "text-[#F97316]"
            )}
          />
          <p className="text-[#FFFFFF] text-sm font-bold tracking-wide truncate transition-colors duration-300 group-hover:text-[#FF9933]">
            {alert.title}
          </p>
        </div>
        <StatusBadge level={alert.severity} size="sm" />
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-[#A0A0A0] text-xs mt-2.5 leading-relaxed line-clamp-2 pr-4">
          {alert.description}
        </p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-4 gap-2 border-t border-[rgba(255,255,255,0.05)] pt-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Location */}
          <span className="flex items-center gap-1.5 text-[#555555] text-[10px] font-mono uppercase tracking-widest transition-colors group-hover:text-[#A0A0A0]">
            <MapPin size={12} className="text-[#555555]" />
            {alert.zone_id}
          </span>

          {/* Time */}
          <span className="flex items-center gap-1.5 text-[#555555] text-[10px] font-mono uppercase tracking-widest transition-colors group-hover:text-[#A0A0A0]">
            <Clock size={12} className="text-[#555555]" />
            {formatDateTime(alert.created_at)}
          </span>

          {/* Risk score */}
          <span className="text-[#555555] text-[10px] font-mono uppercase tracking-widest transition-colors group-hover:text-[#FFFFFF]">
            Risk: <span className={cn(
              "font-bold",
              alert.severity === "HIGH" ? "text-[#EF4444]" : "text-[#F97316]"
            )}>{toPercent(alert.risk_score)}</span>
          </span>
        </div>

        {/* Acknowledge button */}
        {!alert.acknowledged && (
          <button
            onClick={handleAcknowledge}
            className={cn(
              "flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5",
              "rounded-lg border border-[rgba(255,255,255,0.1)] text-[#A0A0A0] bg-[#1A1A1A]",
              "hover:border-[#FF9933]/50 hover:text-[#FF9933] hover:bg-[#FF9933]/10 hover:shadow-[0_0_15px_rgba(255,153,51,0.2)]",
              "transition-all duration-300 active:scale-95"
            )}
          >
            <CheckCircle size={12} />
            Ack
          </button>
        )}

        {/* Already acknowledged */}
        {alert.acknowledged && (
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-[#22C55E] drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] bg-[#22C55E]/10 px-3 py-1.5 rounded-lg border border-[#22C55E]/20">
            <CheckCircle size={12} />
            Acknowledged
          </span>
        )}
      </div>
    </motion.div>
  )
}