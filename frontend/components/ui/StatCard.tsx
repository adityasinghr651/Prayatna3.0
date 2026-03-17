"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title:     string
  value:     number | string
  subtitle?: string
  icon:      React.ReactNode
  color?:    "high" | "medium" | "safe" | "accent"
  suffix?:   string
  loading?:  boolean
}

// FILE: components/ui/StatCard.tsx
// CHANGES: 
// 1. Replaced flat dark colors with deep #1A1A1A to #0A0A0A gradient and glassmorphic inner white borders.
// 2. Updated accent colors to strictly use the Indian Tricolor system (Saffron #FF9933 replacing blue).
// 3. Upgraded icon container with glossy backgrounds, inner shine (`inset` shadows), and premium hover scaling.
// 4. Changed data text to `text-4xl font-black font-mono` with a shiny drop-shadow that corresponds to the risk status.
// 5. Changed title text to `text-xs font-bold uppercase tracking-widest` to match the Linear/Vercel label style.
// 6. Upgraded Framer Motion transition for a smoother, premium ease-out lift.
// 7. Loading skeleton upgraded to a shiny, high-contrast pulse gradient.

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color   = "accent",
  suffix  = "",
  loading = false,
}: StatCardProps) {
  const colorMap = {
    high:   "text-[#EF4444] drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]",
    medium: "text-[#F97316] drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]",
    safe:   "text-[#22C55E] drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]",
    accent: "text-[#FF9933] drop-shadow-[0_0_12px_rgba(255,153,51,0.5)]",
  }
  const bgMap = {
    high:   "bg-[#EF4444]/10 border border-[#EF4444]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]",
    medium: "bg-[#F97316]/10 border border-[#F97316]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]",
    safe:   "bg-[#22C55E]/10 border border-[#22C55E]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]",
    accent: "bg-[#FF9933]/10 border border-[#FF9933]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]",
  }
  const glowMap = {
    high:   "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(239,68,68,0.05)] border-[#EF4444]/20 hover:border-[#EF4444]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_40px_rgba(239,68,68,0.25)]",
    medium: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(249,115,22,0.05)] border-[#F97316]/20 hover:border-[#F97316]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_40px_rgba(249,115,22,0.25)]",
    safe:   "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(34,197,94,0.05)] border-[#22C55E]/20 hover:border-[#22C55E]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_40px_rgba(34,197,94,0.25)]",
    accent: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(255,153,51,0.05)] border-[#FF9933]/20 hover:border-[#FF9933]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_40px_rgba(255,153,51,0.25)]",
  }

  const count    = useMotionValue(0)
  const rounded  = useTransform(count, (v) => Math.round(v))
  const isNumber = typeof value === "number"

  useEffect(() => {
    if (!isNumber) return
    const controls = animate(count, value as number, {
      duration: 1.2,
      ease:     [0.23, 1, 0.32, 1],
    })
    return controls.stop
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-2xl border p-6 backdrop-blur-xl relative overflow-hidden",
        "transition-all duration-500 hover:-translate-y-1",
        glowMap[color],
      )}
    >
      <div className={cn("p-2.5 rounded-xl w-fit transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3", bgMap[color])}>
        <div className={cn("w-5 h-5 transition-colors", colorMap[color])}>{icon}</div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="h-10 w-24 bg-gradient-to-r from-[#1A1A1A] via-[#333333] to-[#1A1A1A] bg-[length:200%_100%] rounded-lg animate-pulse border border-[rgba(255,255,255,0.05)]" />
        ) : (
          <div className={cn("text-4xl font-black font-mono tracking-tight", colorMap[color])}>
            {isNumber
              ? <motion.span>{rounded}</motion.span>
              : <span>{value}</span>
            }
            {suffix && (
              <span className="text-sm ml-1 text-[#A0A0A0] font-sans font-medium drop-shadow-none">{suffix}</span>
            )}
          </div>
        )}
        <p className="text-[#FFFFFF] text-xs font-bold uppercase tracking-widest mt-2 transition-colors group-hover:text-white/90">{title}</p>
        {subtitle && (
          <p className="text-[#555555] text-[10px] font-medium mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}