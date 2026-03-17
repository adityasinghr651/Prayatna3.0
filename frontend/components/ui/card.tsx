"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CardProps {
  children:   React.ReactNode
  className?: string
  title?:     string
  subtitle?:  string
  icon?:      React.ReactNode
  glowColor?: "high" | "medium" | "safe" | "accent" | "none"
  animate?:   boolean
  padding?:   "sm" | "md" | "lg"
}

// FILE: components/ui/Card.tsx
// CHANGES: 
// 1. Replaced dull dark blue with a shiny, high-contrast black/white aesthetic using inner white box-shadows (glass reflection) and deep #0A0A0A gradients.
// 2. Updated typography to font-black for headings and relaxed text-sm for subtitles per Linear/Vercel design principles.
// 3. Updated glowMap to strictly use the required Risk colors and Saffron (#FF9933) for accents, with soft spreading shadows.
// 4. Added a premium hover effect (smooth lift, intensified glossy border, and scaling icon).
// 5. Improved Framer Motion entrance animation with a premium ease curve.
// 6. Increased padding slightly for more generous whitespace.

export function Card({
  children,
  className,
  title,
  subtitle,
  icon,
  glowColor = "none",
  animate   = true,
  padding   = "md",
}: CardProps) {
  const glowMap = {
    high:   "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_20px_rgba(239,68,68,0.15)] border-[#EF4444]/30 hover:border-[#EF4444]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_30px_rgba(239,68,68,0.25)]",
    medium: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_20px_rgba(249,115,22,0.15)] border-[#F97316]/30 hover:border-[#F97316]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_30px_rgba(249,115,22,0.25)]",
    safe:   "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_20px_rgba(34,197,94,0.15)] border-[#22C55E]/30 hover:border-[#22C55E]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_30px_rgba(34,197,94,0.25)]",
    accent: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_20px_rgba(255,153,51,0.15)] border-[#FF9933]/30 hover:border-[#FF9933]/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_30px_rgba(255,153,51,0.25)]",
    none:   "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_12px_40px_rgba(0,0,0,0.6)]",
  }
  const paddingMap = { sm: "p-4", md: "p-6", lg: "p-8" }

  const content = (
    <div
      className={cn(
        "group bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-2xl border transition-all duration-500 hover:-translate-y-1 relative overflow-hidden backdrop-blur-xl",
        glowMap[glowColor],
        paddingMap[padding],
        className,
      )}
    >
      {(title || icon) && (
        <div className="flex items-center gap-4 mb-6 relative z-10">
          {icon && (
            <div className="text-[#FF9933] shrink-0 drop-shadow-[0_0_10px_rgba(255,153,51,0.4)] transition-transform duration-500 group-hover:scale-110">
              {icon}
            </div>
          )}
          <div>
            {title    && <h3 className="text-[#FFFFFF] font-black tracking-tight text-lg">{title}</h3>}
            {subtitle && <p className="text-[#A0A0A0] text-sm font-normal leading-relaxed mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="relative z-10 text-[#FFFFFF]">
        {children}
      </div>
    </div>
  )

  if (!animate) return content
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {content}
    </motion.div>
  )
}