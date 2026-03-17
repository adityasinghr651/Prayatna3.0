"use client"

import { motion } from "framer-motion"
import {
  Camera, AlertTriangle, Car, Activity,
  Cpu, Radio, Crosshair, ShieldAlert,
  Thermometer, Zap, Map,
} from "lucide-react"

import { AlertItem }   from "@/components/ui/AlertItem"
import { StatusBadge } from "@/components/ui/StatusBadge"

import { useRiskStore }   from "@/store/useRiskStore"
import { useAlertStore }  from "@/store/useAlertStore"
import { useCameraStore } from "@/store/useCameraStore"

import { useRiskData } from "@/hooks/useRiskData"
import { useAlerts }   from "@/hooks/useAlerts"
import { useCameras }  from "@/hooks/useCameras"

import { toPercent, getRiskColor, formatTime } from "@/lib/utils"

import dynamic from "next/dynamic"

// ── Map lazy load ─────────────────────────────────────────────
const RiskMap = dynamic(
  () => import("@/components/map/RiskMap").then((m) => m.RiskMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[560px] bg-[#F0EBE1] rounded-[1.5rem] flex items-center justify-center relative overflow-hidden shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#b8906515_1px,transparent_1px),linear-gradient(to_bottom,#b8906515_1px,transparent_1px)] bg-[size:2rem_2rem]" />
        <div className="relative z-10 flex flex-col items-center gap-5 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white shadow-xl">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white">
            <Radio size={24} className="text-[#b89065] animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 border-2 border-dashed border-[#b89065]/40 rounded-full"
            />
          </div>
          <div className="text-[#8a6642] font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
            Establishing Map Surface...
          </div>
        </div>
      </div>
    ),
  }
)

// ── UI Components ─────────────────────────────────────────────
const ShinyCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={`relative rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF] border border-white/80 shadow-[20px_20px_60px_rgba(0,0,0,0.06),-20px_-20px_60px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(184,144,101,0.05)] ${className}`}
  >
    {children}
  </div>
)

const RecessedPanel = ({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={`bg-[#EAE6DF] rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40 ${className}`}
  >
    {children}
  </div>
)

const DashboardCard = ({
  title,
  subtitle,
  icon,
  children,
  className = "",
}: any) => (
  <ShinyCard className={`p-6 md:p-8 flex flex-col ${className}`}>
    <div className="flex items-center gap-4 mb-6 border-b border-black/5 pb-6">
      <div className="w-10 h-10 rounded-full bg-[#EAE6DF] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[#8a6642] text-[9px] uppercase tracking-[0.2em] font-bold mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <div className="flex-1 flex flex-col relative z-10">{children}</div>
  </ShinyCard>
)

// ── Mock Data — Real API structure se match karta hai ─────────
const MOCK_RISK = {
  risk_score: 0.72,
  risk_level: "HIGH",
  city:       "Indore (Live Sync)",
  contributing_factors: {
    weather: {
      score:   0.15,
      weight:  "25%",
      details: {
        temperature:  32,
        rainfall_1h:  0,
        wind_speed:   5,
        visibility:   8000,
        weather_desc: "clear sky",
      },
    },
    traffic: {
      score:   0.85,
      weight:  "30%",
      details: {
        current_speed:    22,
        free_flow_speed:  60,
        congestion_ratio: 0.37,
        incident_count:   17,
        road_closure:     false,
      },
    },
    crowd_events: {
      score:   0.62,
      weight:  "20%",
      details: {
        active_events:  3,
        top_event:      "Rajwada Market Event",
        max_attendance: 5000,
      },
    },
    camera: {
      score:   0.76,
      weight:  "15%",
      details: {
        persons:       142,
        vehicles:      89,
        crowd_density: 0.82,
      },
    },
    social: {
      score:   0.10,
      weight:  "10%",
      details: {
        total_posts:  4,
        top_keywords: ["traffic", "accident"],
      },
    },
  },
  explanation: {
    reasons: [
      "Severe bottleneck at Palasia Sq.",
      "Crowd density exceeding 80% at Market Zone",
      "Normal weather patterns detected",
    ],
  },
  data_freshness: {
    weather_at: new Date().toISOString(),
    traffic_at: new Date().toISOString(),
    camera_at:  new Date().toISOString(),
    social_at:  new Date().toISOString(),
  },
  model_version: "1.0.0",
}

const MOCK_CAMERAS = [
  { camera_id: "OPT-01", camera_name: "Palasia Intersection", person_count: 142, vehicle_count: 89,  score: 0.85, crowd_density: 0.82 },
  { camera_id: "OPT-02", camera_name: "Rajwada Market",       person_count: 312, vehicle_count: 12,  score: 0.76, crowd_density: 0.94 },
  { camera_id: "OPT-03", camera_name: "Bhawarkuan Transit",   person_count: 45,  vehicle_count: 156, score: 0.62, crowd_density: 0.45 },
  { camera_id: "OPT-04", camera_name: "Vijay Nagar Flow",     person_count: 88,  vehicle_count: 43,  score: 0.35, crowd_density: 0.25 },
]

const MOCK_ALERTS = [
  { alert_id: "A1", title: "Gridlock Detected",     severity: "HIGH",   zone_id: "Palasia Sq.",    description: "Heavy traffic congestion at major intersection", risk_score: 0.85, is_active: true, acknowledged: false, created_at: new Date().toISOString(), resolved_at: null, city: "Indore", alert_type: "RISK", lat: 22.7196, lon: 75.8577 },
  { alert_id: "A2", title: "Unusual Crowd Surge",   severity: "HIGH",   zone_id: "Rajwada",        description: "Crowd density exceeding safe threshold",          risk_score: 0.76, is_active: true, acknowledged: false, created_at: new Date().toISOString(), resolved_at: null, city: "Indore", alert_type: "RISK", lat: 22.7196, lon: 75.8577 },
  { alert_id: "A3", title: "Speed Violation Spike", severity: "MEDIUM", zone_id: "Super Corridor", description: "Multiple speed violations detected on corridor",    risk_score: 0.52, is_active: true, acknowledged: false, created_at: new Date().toISOString(), resolved_at: null, city: "Indore", alert_type: "RISK", lat: 22.7196, lon: 75.8577 },
]

// ── Main Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  useRiskData(60000)
  useAlerts(30000)
  useCameras(5000)

  const { currentRisk, riskHistory } = useRiskStore()
  const { alerts, alertStats }       = useAlertStore()
  const { cameras }                  = useCameraStore()

  // Real data aaye to use karo, warna mock
  const displayRisk    = currentRisk    || MOCK_RISK
  const displayCameras = cameras.length > 0 ? cameras : MOCK_CAMERAS
  const displayAlerts  = alerts.length  > 0 ? alerts  : MOCK_ALERTS

  const statsFallback = {
    total_cameras:      cameras.length || 24,
    high_alerts:        alertStats?.active_high || 3,
    traffic_incidents:  (currentRisk?.contributing_factors as any)?.traffic?.details?.incident_count || 17,
    temperature:        (currentRisk?.contributing_factors as any)?.weather?.details?.temperature    || "32",
  }

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-black font-sans relative overflow-x-hidden p-6 lg:p-10">

      {/* Ambient lighting */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#b89065]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-10">

        {/* ── HEADER ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShinyCard className="p-8 md:p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                  <ShieldAlert size={18} className="text-[#b89065]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b89065]">
                    URBAN RISK // NYAY.AI
                  </span>
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Central Intelligence Hub
                  </span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1a1a1a] leading-none drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                Command Console.
              </h1>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-6 bg-[#EAE6DF] px-8 py-4 rounded-full shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)] border border-white/50">
              <div className="flex flex-col">
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">
                  Operator
                </span>
                <span className="text-[#1a1a1a] text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
                  Indore MC
                </span>
              </div>
              <div className="h-8 w-px bg-black/10" />
              <div className="flex flex-col">
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">
                  Index Score
                </span>
                <span
                  className="text-lg font-black font-mono tracking-tighter"
                  style={{ color: getRiskColor(displayRisk.risk_level) }}
                >
                  {toPercent(displayRisk.risk_score)}
                </span>
              </div>
            </div>
          </ShinyCard>
        </motion.div>

        {/* ── STAT DIALS ───────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { label: "Optical Nodes",    value: statsFallback.total_cameras,     icon: <Camera      size={16} />, ring: "border-blue-400/40"     },
            { label: "Critical Sectors", value: statsFallback.high_alerts,        icon: <ShieldAlert size={16} />, ring: "border-red-500/50"       },
            { label: "Traffic Anomalies",value: statsFallback.traffic_incidents,  icon: <Car         size={16} />, ring: "border-[#b89065]/50"     },
            { label: "Thermal State",    value: `${statsFallback.temperature}°C`, icon: <Thermometer size={16} />, ring: "border-amber-400/40"     },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6, type: "spring", bounce: 0.4 }}
              className="group relative h-48 rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] to-[#EAE6DF] shadow-[15px_15px_30px_rgba(0,0,0,0.05),-15px_-15px_30px_rgba(255,255,255,1)] border border-white/60 flex flex-col items-center justify-center hover:-translate-y-2 transition-transform duration-500"
            >
              <div className="absolute top-6 left-6 text-gray-300">{s.icon}</div>
              <div
                className={`w-28 h-28 rounded-full bg-[#F0EBE1] shadow-[inset_8px_8px_16px_rgba(0,0,0,0.06),inset_-8px_-8px_16px_rgba(255,255,255,0.9)] flex items-center justify-center border-4 border-white relative ${s.ring}`}
              >
                <p className="text-4xl font-black font-mono tracking-tighter text-[#1a1a1a]">
                  {s.value}
                </p>
              </div>
              <p className="text-[#8a6642] text-[10px] font-black uppercase tracking-[0.2em] mt-4">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── THREE COLUMN LAYOUT ──────────────────── */}
        <div className="grid grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="col-span-12 xl:col-span-3 space-y-8">

            {/* Threat Assessment */}
            <DashboardCard
              title="Threat Assessment"
              subtitle="Global Matrix"
              icon={<Crosshair size={16} className="text-[#b89065]" />}
            >
              {/* Circular gauge */}
              <div className="flex flex-col items-center py-6">
                <div className="relative w-40 h-40 rounded-full bg-[#EAE6DF] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.08),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/50 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="#d6d1c7"
                      strokeWidth="8"
                      strokeDasharray="4 4"
                    />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke={getRiskColor(displayRisk.risk_level)}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 42 * (1 - displayRisk.risk_score),
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center w-24 h-24 m-auto bg-gradient-to-br from-[#ffffff] to-[#EAE6DF] rounded-full shadow-[5px_5px_10px_rgba(0,0,0,0.1),-5px_-5px_10px_rgba(255,255,255,1)] border border-white">
                    <span
                      className="text-4xl font-black font-mono tracking-tighter"
                      style={{ color: getRiskColor(displayRisk.risk_level) }}
                    >
                      {Math.round(displayRisk.risk_score * 100)}
                    </span>
                  </div>
                </div>
                <div className="mt-8">
                  <StatusBadge level={displayRisk.risk_level} size="md" />
                </div>
                <p className="text-gray-400 text-xs mt-2">{displayRisk.city}</p>
              </div>

              {/* Vector Analysis — FIXED */}
              <div className="space-y-4 mt-2">
                <div className="text-[9px] font-black text-[#1a1a1a] uppercase tracking-[0.3em]">
                  Vector Analysis
                </div>

                {Object.entries(displayRisk.contributing_factors).map(
                  ([key, val]: any) => {
                    // Handle both real API and mock data safely
                    const score: number =
                      val && typeof val === "object" && typeof val.score === "number"
                        ? val.score
                        : 0

                    const weight: string =
                      val && typeof val === "object"
                        ? typeof val.weight === "string"
                          ? val.weight
                          : `${Math.round((val.weight || 0) * 100)}%`
                        : "0%"

                    const riskColor =
                      score >= 0.7
                        ? getRiskColor("HIGH")
                        : score >= 0.4
                        ? getRiskColor("MEDIUM")
                        : getRiskColor("SAFE")

                    return (
                      <div key={key}>
                        <div className="flex justify-between text-[10px] mb-1.5 font-black uppercase tracking-widest text-gray-500">
                          <span>{key.replace(/_/g, " ")}</span>
                          <span style={{ color: riskColor }}>
                            {toPercent(score)} · {weight}
                          </span>
                        </div>
                        <div className="h-2 bg-[#EAE6DF] rounded-full overflow-hidden shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: riskColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(score * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </DashboardCard>

            {/* Optical Network */}
            <DashboardCard
              title="Optical Network"
              subtitle="Live Feeds"
              icon={<Camera size={16} className="text-[#b89065]" />}
            >
              <div className="space-y-3">
                {displayCameras.slice(0, 4).map((cam: any) => (
                  <div
                    key={cam.camera_id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#F0EBE1] shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white hover:-translate-y-0.5 transition-transform cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#10B981] animate-pulse" />
                      <div>
                        <p className="text-[#1a1a1a] text-[11px] font-black uppercase tracking-widest">
                          {cam.camera_name}
                        </p>
                        <p className="text-gray-500 text-[9px] font-bold mt-0.5 font-mono">
                          PAX:{cam.person_count} VEH:{cam.vehicle_count}
                        </p>
                      </div>
                    </div>
                    <div
                      className="text-[12px] font-black font-mono px-3 py-1.5 rounded-lg bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,1)]"
                      style={{
                        color: getRiskColor(
                          cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE"
                        ),
                      }}
                    >
                      {toPercent(cam.score)}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>

          {/* CENTER COLUMN — MAP */}
          <div className="col-span-12 xl:col-span-6 flex flex-col">
            <DashboardCard
              title="Geospatial Intelligence"
              subtitle="Real-time map surface"
              className="flex-1"
              icon={<Map size={16} className="text-[#b89065]" />}
            >
              <RecessedPanel className="h-[600px] p-2 flex flex-col group relative">
                <div className="flex-1 rounded-[1.5rem] overflow-hidden border border-black/10 relative shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#b8906515_1px,transparent_1px),linear-gradient(to_bottom,#b8906515_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-10" />
                  <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-20" />
                  <RiskMap />
                </div>
              </RecessedPanel>
            </DashboardCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 xl:col-span-3 space-y-8">

            {/* Priority Alerts */}
            <DashboardCard
              title="Priority Alerts"
              subtitle="Active Anomalies"
              icon={<AlertTriangle size={16} className="text-[#b89065]" />}
            >
              <div className="space-y-3">
                {displayAlerts.slice(0, 3).map((alert: any) => (
                  <div
                    key={alert.alert_id}
                    className="bg-[#F0EBE1] rounded-[1.5rem] p-3 shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white"
                  >
                    <AlertItem alert={alert} compact />
                  </div>
                ))}
                {displayAlerts.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-4">
                    No active alerts
                  </p>
                )}
              </div>
            </DashboardCard>

            {/* XAI Diagnostic */}
            <DashboardCard
              title="Diagnostic (XAI)"
              subtitle="Logic Breakdown"
              icon={<Zap size={16} className="text-[#b89065]" />}
            >
              <RecessedPanel className="p-4 space-y-3">
                {displayRisk.explanation?.reasons?.map(
                  (reason: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 bg-[#F0EBE1] p-3 rounded-xl shadow-[3px_3px_6px_rgba(0,0,0,0.05),-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#b89065] mt-1 shrink-0" />
                      <span className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-wider">
                        {reason}
                      </span>
                    </motion.div>
                  )
                )}
              </RecessedPanel>
            </DashboardCard>

            {/* Telemetry Sync */}
            <DashboardCard
              title="Telemetry Sync"
              subtitle="Payload Status"
              icon={<Activity size={16} className="text-[#b89065]" />}
            >
              <RecessedPanel className="p-2">
                {Object.entries(displayRisk.data_freshness).map(
                  ([key, val]: any) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-[10px] border-b border-black/5 py-3 px-3 last:border-0"
                    >
                      <span className="text-[#1a1a1a] uppercase font-black tracking-widest">
                        {key.replace("_at", "")}_NODE
                      </span>
                      <span className="text-gray-500 font-mono font-bold bg-[#F0EBE1] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] px-3 py-1 rounded border border-white">
                        {formatTime(val as string)}
                      </span>
                    </div>
                  )
                )}
              </RecessedPanel>
            </DashboardCard>

            {/* Engine Status */}
            <DashboardCard
              title="Engine Status"
              subtitle="Hardware Specs"
              icon={<Cpu size={16} className="text-[#b89065]" />}
            >
              <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-gray-800 relative overflow-hidden shadow-[10px_10px_20px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.8)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1rem_1rem]" />
                <div className="space-y-4 relative z-10 text-[10px] font-mono">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="uppercase tracking-widest text-gray-500 font-bold">
                      Build Version
                    </span>
                    <span className="text-[#e3cba8] font-black bg-[#e3cba8]/10 px-3 py-1 rounded">
                      v{displayRisk.model_version}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="uppercase tracking-widest text-gray-500 font-bold">
                      Compute Arch
                    </span>
                    <span className="text-white font-black">
                      XGBoost Cluster
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="uppercase tracking-widest text-gray-500 font-bold">
                      Active Vectors
                    </span>
                    <span className="text-white font-black">19 Nodes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-widest text-gray-500 font-bold">
                      City
                    </span>
                    <span className="text-[#10B981] font-black">
                      Indore, MP
                    </span>
                  </div>
                </div>
              </div>
            </DashboardCard>

            {/* Risk trend mini chart */}
            {riskHistory && riskHistory.length > 0 && (
              <DashboardCard title="Risk Trend" subtitle="Last 24 hours">
                <div className="flex items-end gap-0.5 h-16">
                  {riskHistory.slice(-30).map((item: any, i: number) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm min-w-[2px]"
                      style={{
                        backgroundColor: getRiskColor(item.risk_level),
                        opacity: 0.75,
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${item.risk_score * 100}%` }}
                      transition={{ delay: i * 0.02 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>24h ago</span>
                  <span>Now</span>
                </div>
              </DashboardCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}