"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Camera,
  BarChart3,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { useRiskStore } from "@/store/useRiskStore"
import { useAlertStore } from "@/store/useAlertStore"
import { useState } from "react"

const navLinks = [
  {
    href:  "/dashboard",
    label: "Dashboard",
    icon:  LayoutDashboard,
  },
  {
    href:  "/cameras",
    label: "Cameras",
    icon:  Camera,
  },
  {
    href:  "/analytics",
    label: "Analytics",
    icon:  BarChart3,
  },
  {
    href:  "/alerts",
    label: "Alerts",
    icon:  Bell,
  },
  {
    href:  "/demo",
    label: "Demo Analysis",
    icon:  Video,
  },
]

export function Sidebar() {
  const pathname       = usePathname()
  const { currentRisk } = useRiskStore()
  const { unreadCount } = useAlertStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "bg-gradient-to-b from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF]",
        "border-r border-white/80 shadow-[10px_0_30px_rgba(0,0,0,0.03)]",
        "flex flex-col",
        "overflow-hidden",
      )}
    >
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-80" />

      <div className="flex items-center gap-4 p-6 border-b border-black/5 h-24 shrink-0 relative z-10">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[#1a1a1a] shadow-[0_5px_10px_rgba(0,0,0,0.2),inset_0_2px_5px_rgba(255,255,255,0.2)] flex items-center justify-center relative">
          <Shield size={18} className="text-[#e3cba8] drop-shadow-[0_1px_2px_rgba(0,0,0,1)]" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-[#1a1a1a] font-black tracking-tighter text-xl whitespace-nowrap leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
                UrbanPulse<span className="text-[#b89065]"></span>
              </p>
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap mt-1 drop-shadow-sm">
                Intelligence Core
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!collapsed && currentRisk && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mx-5 mt-6 p-5 rounded-[1.5rem] bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white/50 relative overflow-hidden"
        >
          <p className="text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] mb-2 drop-shadow-sm">
            Sector Status
          </p>
          <div className="flex items-center justify-between relative z-10 mb-4">
            <span className="text-[#1a1a1a] font-black text-sm tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
              {currentRisk.city}
            </span>
            <div className="shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,1)] rounded-full">
               <StatusBadge level={currentRisk.risk_level} size="sm" />
            </div>
          </div>

          <div className="h-2.5 rounded-full bg-[#F0EBE1] border border-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] overflow-hidden relative z-10">
            <motion.div
              className={cn(
                "h-full rounded-full relative shadow-[0_0_8px_currentColor]",
                currentRisk.risk_level === "HIGH"   && "bg-red-500",
                currentRisk.risk_level === "MEDIUM" && "bg-amber-500",
                currentRisk.risk_level === "SAFE"   && "bg-green-500",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${currentRisk.risk_score * 100}%` }}
              transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      )}

      <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {navLinks.map((link) => {
          const Icon      = link.icon
          const isActive  = pathname === link.href
          const showBadge = link.href === "/alerts" && unreadCount > 0

          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-[1.2rem]",
                  "transition-all duration-300 relative",
                  "cursor-pointer group overflow-hidden",
                  isActive
                    ? "bg-[#1a1a1a] text-[#e3cba8] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_4px_rgba(255,255,255,0.1),0_5px_15px_rgba(184,144,101,0.2)]"
                    : "bg-[#F0EBE1] text-gray-500 shadow-[4px_4px_8px_rgba(0,0,0,0.04),-4px_-4px_8px_rgba(255,255,255,0.9)] border border-white hover:text-black hover:shadow-[6px_6px_12px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,1)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#b89065] rounded-r-full shadow-[0_0_10px_#b89065]"
                  />
                )}

                <Icon size={18} className={cn(
                  "shrink-0 transition-colors duration-300 drop-shadow-sm",
                  isActive ? "text-[#b89065]" : "text-gray-400 group-hover:text-[#1a1a1a]"
                )} />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        "text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap drop-shadow-sm",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-[#1a1a1a]"
                      )}
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                        "ml-auto text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[24px] text-center",
                        isActive 
                            ? "bg-red-500 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]" 
                            : "bg-red-500 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,1)] border border-white"
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="p-6 bg-[#EAE6DF] border-t border-white/50 shadow-[inset_0_5px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#F0EBE1] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border border-white">
              <motion.div
                animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-2 h-2 rounded-full bg-green-500"
              />
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E] relative z-10" />
            </div>
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] drop-shadow-sm">
              Live Monitoring
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-4 top-28",
          "w-8 h-8 rounded-full",
          "bg-[#F0EBE1] border border-white shadow-[3px_3px_6px_rgba(0,0,0,0.06),-3px_-3px_6px_rgba(255,255,255,0.9)]",
          "flex items-center justify-center",
          "text-gray-400 hover:text-[#b89065] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]",
          "transition-all duration-300",
          "z-50 active:scale-95"
        )}
      >
        {collapsed
          ? <ChevronRight size={16} className="ml-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]" />
          : <ChevronLeft size={16} className="mr-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]" />
        }
      </button>
    </motion.aside>
  )
}