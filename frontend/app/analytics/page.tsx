"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  AreaChart, Area, BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { CardSkeleton }      from "@/components/ui/LoadingSkeleton"
import { fetchRiskHistory, fetchTraffic, fetchAnalytics } from "@/lib/api"
import type { RiskHistoryItem, TrafficReading, AnalyticsDataPoint } from "@/lib/types"
import { getRiskColor } from "@/lib/utils"
import { Activity, Network, CloudLightning, ShieldAlert, Radio } from "lucide-react"

export default function AnalyticsPage() {
  const [hours,        setHours]        = useState(24)
  const [riskHistory,  setRiskHistory]  = useState<RiskHistoryItem[]>([])
  const [trafficData,  setTrafficData]  = useState<TrafficReading[]>([])
  const [analyticsData,setAnalyticsData]= useState<AnalyticsDataPoint[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [rh, tr, an] = await Promise.all([
          fetchRiskHistory(hours),
          fetchTraffic(hours),
          fetchAnalytics(hours),
        ])
        setRiskHistory(rh.history || [])
        setTrafficData(tr.traffic || [])
        setAnalyticsData(an.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hours])

  const fmtTime = (t: string) => {
    try { return new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }
    catch { return "" }
  }

  // Hyper-Premium Physical Tooltip Wrapper
  const tooltipStyle = {
    backgroundColor: "rgba(26, 26, 26, 0.95)", // Dark physical glass
    backdropFilter:  "blur(16px)",
    border:          "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius:    "1.5rem",
    color:           "#ffffff",
    fontSize:        "11px",
    fontWeight:      "900",
    fontFamily:      "monospace",
    textTransform:   "uppercase" as const,
    boxShadow:       "0 20px 40px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.1)",
    padding:         "16px 20px",
  }

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
          <ShinyCard className="p-8 md:p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 overflow-hidden">
            {/* Glossy reflection line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_5px_rgba(255,255,255,0.2)]">
                  <Activity size={18} className="text-[#b89065]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b89065] drop-shadow-sm">
                    Urban Analytics
                  </span>
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Historical Telemetry
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1a1a1a] leading-none drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                Intelligence Analytics.
              </h1>
              <p className="text-[#8a6642] text-[11px] font-black uppercase tracking-[0.2em] mt-4 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                Risk trends · Traffic matrices · Environmental correlation
              </p>
            </div>

            {/* ── PHYSICAL TOGGLE SWITCHES (Time Filter) ── */}
            <div className="flex items-center gap-3 bg-[#EAE6DF] p-3 rounded-full shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40">
              {[6, 12, 24, 48].map((h) => {
                const isActive = hours === h;
                return (
                  <button
                    key={h}
                    onClick={() => setHours(h)}
                    className={`h-12 px-6 rounded-full text-[11px] uppercase tracking-[0.2em] font-black transition-all duration-300 flex items-center justify-center ${
                      isActive
                        ? "bg-[#1a1a1a] text-[#e3cba8] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-2px_-2px_8px_rgba(255,255,255,0.1),0_10px_20px_rgba(184,144,101,0.3)] scale-[0.98]"
                        : "bg-[#F0EBE1] text-gray-500 shadow-[6px_6px_12px_rgba(0,0,0,0.05),-6px_-6px_12px_rgba(255,255,255,0.9)] border border-white hover:text-black hover:shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,1)]"
                    }`}
                  >
                    {h}H
                  </button>
                )
              })}
            </div>
          </ShinyCard>
        </motion.div>

        {/* ── DASHBOARD CONTENT ── */}
        {loading ? (
          <div className="space-y-8">
            <ShinyCard className="p-8"><CardSkeleton /></ShinyCard>
            <ShinyCard className="p-8"><CardSkeleton /></ShinyCard>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-10"
          >

            {/* ── Chart 1: System Risk Trajectory ── */}
            <ShinyCard className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                  <Activity size={14} className="text-[#b89065]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">System Risk Trajectory</h2>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Aggregated threat data over the last {hours} hours</p>
                </div>
              </div>

              {riskHistory.length === 0 ? (
                <div className="h-[340px] flex flex-col items-center justify-center bg-[#EAE6DF] rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40">
                  <Radio size={30} className="text-gray-400 animate-pulse mb-4" />
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] font-mono">
                    Awaiting telemetry packets...
                  </p>
                </div>
              ) : (
                /* Recessed Screen Container */
                <div className="bg-[#EAE6DF] p-6 pt-10 rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40 relative">
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={riskHistory.map((r) => ({
                      ...r,
                      time:          fmtTime(r.computed_at),
                      overall:       Math.round(r.risk_score * 100),
                      weather_score: Math.round(r.weather_score * 100),
                      traffic_score: Math.round(r.traffic_score * 100),
                      crowd_score:   Math.round(r.crowd_score * 100),
                    }))}>
                      <defs>
                        <linearGradient id="gOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#b89065" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#b89065" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace", fontWeight: "900" }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace", fontWeight: "900" }} axisLine={false} tickLine={false} dx={-15} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
                      <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a1a1a", paddingTop: "24px" }} iconType="circle" />
                      
                      <Area type="monotone" dataKey="overall"       name="Overall Risk"  stroke="#b89065" fill="url(#gOverall)" strokeWidth={4} activeDot={{ r: 8, fill: "#1a1a1a", stroke: "#b89065", strokeWidth: 3 }} />
                      <Area type="monotone" dataKey="traffic_score" name="Traffic Node"  stroke="#1a1a1a" fill="none" strokeWidth={2} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="weather_score" name="Weather Node"  stroke="#8a6642" fill="none" strokeWidth={2} opacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ShinyCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* ── Chart 2: Traffic Matrix Deviations ── */}
                <ShinyCard className="p-8">
                  <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                    <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                      <Network size={14} className="text-[#b89065]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Traffic Matrix Deviations</h2>
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Congestion & Active Incidents</p>
                    </div>
                  </div>

                  {trafficData.length === 0 ? (
                    <div className="h-[280px] flex flex-col items-center justify-center bg-[#EAE6DF] rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] font-mono">No network data</p>
                    </div>
                  ) : (
                    <div className="bg-[#EAE6DF] p-6 pt-10 rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40 relative">
                      <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={trafficData.slice(-30).map((t) => ({
                            time:       fmtTime(t.recorded_at),
                            congestion: Math.round((1 - t.congestion_ratio) * 100),
                            incidents:  t.incident_count,
                          }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                          <XAxis dataKey="time"      tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace", fontWeight: "900" }} axisLine={false} tickLine={false} dy={15} />
                          <YAxis tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace", fontWeight: "900" }} axisLine={false} tickLine={false} dx={-15} />
                          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                          <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a1a1a", paddingTop: "24px" }} iconType="circle" />
                          
                          {/* Physical looking bars */}
                          <Bar dataKey="congestion" name="Congestion %" fill="#b89065" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="incidents"  name="Incidents"    fill="#1a1a1a" radius={[6, 6, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ShinyCard>

                {/* ── Chart 3: Atmospheric Correlation ── */}
                <ShinyCard className="p-8">
                  <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                    <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                      <CloudLightning size={14} className="text-[#b89065]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Atmospheric Correlation</h2>
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Rainfall density vs resulting incidents</p>
                    </div>
                  </div>

                  {analyticsData.length === 0 ? (
                    <div className="h-[280px] flex flex-col items-center justify-center bg-[#EAE6DF] rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] font-mono">No atmospheric data</p>
                    </div>
                  ) : (
                    <div className="bg-[#EAE6DF] p-6 pt-10 rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40 relative">
                      <ResponsiveContainer width="100%" height={280}>
                          <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey="rainfall_1h"  name="Rainfall (mm/h)" type="number" tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace", fontWeight: "900" }} axisLine={false} tickLine={false} dy={15} />
                          <YAxis dataKey="incident_count" name="Incidents"       type="number" tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace", fontWeight: "900" }} axisLine={false} tickLine={false} dx={-15} />
                          <Tooltip
                              contentStyle={tooltipStyle}
                              cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1, strokeDasharray: "3 3" }}
                          />
                          <Scatter
                              name="Anomalies"
                              data={analyticsData}
                              fill="#1a1a1a"
                              opacity={0.8}
                          />
                          </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ShinyCard>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}