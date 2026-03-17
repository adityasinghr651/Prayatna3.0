"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatusBadgeProps {
  level:     "HIGH" | "MEDIUM" | "SAFE" | string
  size?:     "sm" | "md" | "lg"
  pulse?:    boolean
  showDot?:  boolean
}

// FILE: components/ui/StatusBadge.tsx
// CHANGES: 
// 1. Replaced abstract Tailwind variables with precise exact Hex codes (#EF4444, #F97316, #22C55E).
// 2. Transformed the flat design into a "shiny" premium aesthetic using `inset` white shadows for a glass rim effect and soft colored drop-shadows.
// 3. Adjusted typography to match the Vercel/Linear style: `font-bold uppercase tracking-widest` with micro text sizes.
// 4. Added glowing `box-shadow` to the inner dot indicators.
// 5. Refined the Framer Motion pulse animation to be smoother and scale wider for a more cinematic alert effect.

export function StatusBadge({
  level,
  size    = "md",
  pulse   = true,
  showDot = true,
}: StatusBadgeProps) {

  const styleMap: Record<string, string> = {
    HIGH: cn(
      "bg-[#EF4444]/10 text-[#EF4444]",
      "border border-[#EF4444]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_10px_rgba(239,68,68,0.15)]",
    ),
    MEDIUM: cn(
      "bg-[#F97316]/10 text-[#F97316]",
      "border border-[#F97316]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_10px_rgba(249,115,22,0.15)]",
    ),
    SAFE: cn(
      "bg-[#22C55E]/10 text-[#22C55E]",
      "border border-[#22C55E]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_10px_rgba(34,197,94,0.15)]",
    ),
  }

  const dotColorMap: Record<string, string> = {
    HIGH:   "bg-[#EF4444] shadow-[0_0_8px_#EF4444]",
    MEDIUM: "bg-[#F97316] shadow-[0_0_8px_#F97316]",
    SAFE:   "bg-[#22C55E] shadow-[0_0_8px_#22C55E]",
  }

  const sizeMap = {
    sm: "text-[9px] px-2.5 py-0.5 gap-1.5",
    md: "text-[10px] px-3 py-1 gap-2",
    lg: "text-[11px] px-3.5 py-1.5 gap-2.5",
  }

  const dotSizeMap = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  }

  const style = styleMap[level] || styleMap.SAFE

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold backdrop-blur-md",
        "tracking-widest uppercase transition-all duration-300",
        style,
        sizeMap[size],
      )}
    >
      {showDot && (
        <span className="relative flex items-center justify-center shrink-0">
          {/* Pulse ring — only on HIGH */}
          {pulse && level === "HIGH" && (
            <motion.span
              className={cn(
                "absolute inline-flex rounded-full opacity-75",
                dotColorMap[level],
                dotSizeMap[size],
              )}
              animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full",
              dotColorMap[level] || "bg-[#555555]",
              dotSizeMap[size],
            )}
          />
        </span>
      )}
      {level}
    </span>
  )
}