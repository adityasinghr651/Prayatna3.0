"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Search, ShieldAlert, Crosshair, Radio } from "lucide-react"
import { Card }        from "@/components/ui/card"
import { AlertItem }   from "@/components/ui/AlertItem"
import { AlertSkeleton } from "@/components/ui/LoadingSkeleton"
import { useAlerts }     from "@/hooks/useAlerts"
import { useAlertStore } from "@/store/useAlertStore"

export default function AlertsPage() {
  useAlerts(30000)
  const { alerts, alertStats, loading } = useAlertStore()

  const [search,   setSearch]   = useState("")
  const [severity, setSeverity] = useState<"ALL" | "HIGH" | "MEDIUM">("ALL")

  const filtered = alerts.filter((a) => {
    const matchSearch   = a.title.toLowerCase().includes(search.toLowerCase()) ||
                          a.zone_id.toLowerCase().includes(search.toLowerCase())
    const matchSeverity = severity === "ALL" || a.severity === severity
    return matchSearch && matchSeverity
  })

  // Hyper-Premium Shiny Card Wrapper
  const ShinyCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF] border border-white/80 shadow-[20px_20px_60px_rgba(0,0,0,0.06),-20px_-20px_60px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(184,144,101,0.05)] ${className}`}>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-black font-sans relative overflow-x-hidden p-6 lg:p-10 selection:bg-[#1a1a1a] selection:text-[#b89065]">
      
      {/* ── AMBIENT PHYSICAL LIGHTING ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep Brown Ambient Glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#b89065]/5 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/5 rounded-full blur-[100px] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto space-y-10">
        
        {/* ── HEADER PANEL (Shiny Metal Plate) ── */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShinyCard className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
            {/* Glossy reflection line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_5px_rgba(255,255,255,0.2)]">
                  <ShieldAlert size={18} className="text-[#b89065]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b89065] drop-shadow-sm">
                    Urban Alert
                  </span>
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Threat Detection Matrix
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1a1a1a] leading-none drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                Active Anomalies.
              </h1>
            </div>

            {/* Operator Badge (Pressed-in Neumorphic) */}
            <div className="px-6 py-3 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)] border border-white/50 flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                 <div className="absolute w-4 h-4 rounded-full border border-[#10B981] animate-ping opacity-50" />
                 <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
              </div>
              <span className="text-[#1a1a1a] text-[11px] font-black uppercase tracking-[0.2em]">
                Operator: A. Singh
              </span>
            </div>
          </ShinyCard>
        </motion.div>

        {/* ── STATS DIALS (Physical Gauges) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { label: "Total Active",  value: alertStats?.total_active ?? 0, ring: "border-[#1a1a1a]/20" },
            { label: "High Risk",     value: alertStats?.active_high  ?? 0, ring: "border-red-500/40" },
            { label: "Medium Risk",   value: alertStats?.active_medium ?? 0, ring: "border-amber-500/40" },
            { label: "Last Hour",     value: alertStats?.last_hour    ?? 0, ring: "border-[#b89065]/50" },
          ].map((s, i) => (
            <motion.div 
              key={s.label} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6, type: "spring", bounce: 0.4 }}
              className="group relative h-48 rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] to-[#EAE6DF] shadow-[15px_15px_30px_rgba(0,0,0,0.05),-15px_-15px_30px_rgba(255,255,255,1)] border border-white/60 flex flex-col items-center justify-center cursor-pointer hover:-translate-y-2 transition-transform duration-500"
            >
              {/* Inner shiny dial */}
              <div className={`w-28 h-28 rounded-full bg-[#F0EBE1] shadow-[inset_8px_8px_16px_rgba(0,0,0,0.06),inset_-8px_-8px_16px_rgba(255,255,255,0.9)] flex items-center justify-center border-4 border-white ${s.ring} relative`}>
                 <p className="text-4xl font-black font-mono tracking-tighter text-[#1a1a1a] drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                  {s.value}
                </p>
                {/* Glossy top highlight */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-b from-white to-transparent opacity-60 rounded-full blur-[2px]" />
              </div>
              <p className="text-[#8a6642] text-[10px] font-black uppercase tracking-[0.2em] mt-4 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── FILTER CONSOLE (Recessed Control Panel) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#EAE6DF] p-4 rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40"
        >
          {/* Deep Search Input */}
          <div className="relative w-full md:w-96 h-14">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#b89065]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query anomalies..."
              className="w-full h-full pl-14 pr-6 bg-[#F0EBE1] shadow-[inset_6px_6px_12px_rgba(0,0,0,0.06),inset_-6px_-6px_12px_rgba(255,255,255,1)] rounded-full text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b89065]/30 text-sm font-bold tracking-wide transition-all"
            />
          </div>

          {/* Physical Toggle Buttons */}
          <div className="flex items-center gap-3">
            {(["ALL", "HIGH", "MEDIUM"] as const).map((s) => {
              const isActive = severity === s;
              return (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`h-14 px-8 rounded-full text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-300 flex items-center justify-center ${
                    isActive
                      ? "bg-[#1a1a1a] text-[#e3cba8] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-2px_-2px_8px_rgba(255,255,255,0.1),0_10px_20px_rgba(184,144,101,0.3)] scale-[0.98]"
                      : "bg-[#F0EBE1] text-gray-500 shadow-[6px_6px_12px_rgba(0,0,0,0.05),-6px_-6px_12px_rgba(255,255,255,0.9)] border border-white hover:text-black hover:shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,1)]"
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ── ALERTS LIST (Floating Plates) ── */}
        <ShinyCard className="min-h-[500px] p-6 md:p-8">
          {loading && alerts.length === 0 ? (
            <div className="space-y-6">
              <AlertSkeleton />
              <AlertSkeleton />
              <AlertSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-32"
            >
              <div className="relative w-32 h-32 rounded-full bg-[#EAE6DF] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] flex items-center justify-center mb-8 border border-white">
                <Radio size={40} className="text-[#10B981] drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                <div className="absolute inset-2 rounded-full border border-[#10B981]/20 animate-ping" />
              </div>
              <p className="text-[#1a1a1a] font-black text-3xl tracking-tighter drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                System Nominal.
              </p>
              <p className="text-gray-500 text-sm mt-3 max-w-md font-bold leading-relaxed">
                {search || severity !== "ALL" 
                  ? "Adjust search parameters. No alerts match the current TRINETRA query matrix." 
                  : "Zero active anomalies detected across all monitoring sectors. You are clear."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((alert, index) => (
                  <motion.div
                    key={alert.alert_id}
                    layout
                    initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="p-1" // Gives room for the shadow
                  >
                    {/* The physical alert plate */}
                    <div className="bg-[#F0EBE1] rounded-[1.5rem] p-4 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.9)] border border-white hover:shadow-[12px_12px_24px_rgba(184,144,101,0.1),-12px_-12px_24px_rgba(255,255,255,1)] transition-all duration-300">
                        <AlertItem alert={alert} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ShinyCard>
      </div>
    </div>
  )
}