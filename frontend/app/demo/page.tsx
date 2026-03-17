"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, Video, Image, AlertTriangle,
  Users, Car, Activity, CheckCircle,
  Play, BarChart3, Eye, Radio,
  Crosshair, Focus
} from "lucide-react"
import { Card }        from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { toPercent }   from "@/lib/utils"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ── Pre-defined demo scenarios ────────────────────
const DEMO_SCENARIOS = [
  {
    id:          "traffic_high",
    label:       "Heavy Traffic — Rush Hour",
    thumbnail:   "/demo-samples/traffic1.jpg",
    type:        "image",
    description: "Busy intersection during peak hours — multiple vehicles detected",
    result: {
      detections: {
        total:         23,
        person_count:  8,
        vehicle_count: 15,
        car_count:     10,
        bike_count:    4,
        bus_count:     1,
      },
      risk: {
        camera_risk_score: 0.72,
        crowd_density:     0.40,
        risk_level:        "HIGH",
      },
      frame_by_frame: [
        { frame: 0,  camera_risk_score: 0.65 },
        { frame: 10, camera_risk_score: 0.70 },
        { frame: 20, camera_risk_score: 0.72 },
        { frame: 30, camera_risk_score: 0.68 },
        { frame: 40, camera_risk_score: 0.75 },
        { frame: 50, camera_risk_score: 0.71 },
      ],
    },
  },
  {
    id:          "crowd_medium",
    label:       "Crowded Market Area",
    thumbnail:   "/demo-samples/crowd1.jpg",
    type:        "image",
    description: "High footfall in market zone — crowd density elevated",
    result: {
      detections: {
        total:         31,
        person_count:  28,
        vehicle_count: 3,
        car_count:     2,
        bike_count:    1,
        bus_count:     0,
      },
      risk: {
        camera_risk_score: 0.55,
        crowd_density:     0.75,
        risk_level:        "MEDIUM",
      },
      frame_by_frame: [
        { frame: 0,  camera_risk_score: 0.45 },
        { frame: 10, camera_risk_score: 0.52 },
        { frame: 20, camera_risk_score: 0.58 },
        { frame: 30, camera_risk_score: 0.55 },
        { frame: 40, camera_risk_score: 0.60 },
        { frame: 50, camera_risk_score: 0.53 },
      ],
    },
  },
  {
    id:          "road_safe",
    label:       "Normal Road — Off Peak",
    thumbnail:   "/demo-samples/road1.jpg",
    type:        "image",
    description: "Light traffic during off-peak hours — normal conditions",
    result: {
      detections: {
        total:         7,
        person_count:  2,
        vehicle_count: 5,
        car_count:     4,
        bike_count:    1,
        bus_count:     0,
      },
      risk: {
        camera_risk_score: 0.18,
        crowd_density:     0.10,
        risk_level:        "SAFE",
      },
      frame_by_frame: [
        { frame: 0,  camera_risk_score: 0.15 },
        { frame: 10, camera_risk_score: 0.18 },
        { frame: 20, camera_risk_score: 0.20 },
        { frame: 30, camera_risk_score: 0.16 },
        { frame: 40, camera_risk_score: 0.19 },
        { frame: 50, camera_risk_score: 0.17 },
      ],
    },
  },
]

type ScenarioResult = typeof DEMO_SCENARIOS[0]["result"]
type Scenario       = typeof DEMO_SCENARIOS[0]

// ── HYPER-PREMIUM PHYSICAL WRAPPERS ──
const ShinyCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF] border border-white/80 shadow-[20px_20px_60px_rgba(0,0,0,0.05),-20px_-20px_60px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(184,144,101,0.05)] ${className}`}>
    {children}
  </div>
)

const RecessedPanel = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-[#EAE6DF] rounded-[2rem] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white/50 ${className}`}>
    {children}
  </div>
)

export default function DemoPage() {
  const [selected,  setSelected]  = useState<Scenario | null>(null)
  const [result,    setResult]    = useState<ScenarioResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [uploadFile,setUploadFile]= useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploadError,  setUploadError]  = useState<string | null>(null)

  // ── Select preset scenario ──────────────────────
  function handleSelect(scenario: Scenario) {
    setSelected(scenario)
    setResult(null)
    setUploadResult(null)
  }

  function handleAnalyzePreset() {
    if (!selected) return
    setLoading(true)
    // Simulate processing delay
    setTimeout(() => {
      setResult(selected.result)
      setLoading(false)
    }, 1500)
  }

  // ── Real upload ─────────────────────────────────
  async function handleRealUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    setUploadFile(f)
    setUploadResult(null)
    setUploadError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", f)

      const isVideo = f.type.startsWith("video/") ||
        [".mp4", ".avi", ".mov", ".mkv"].some(ext =>
          f.name.toLowerCase().endsWith(ext)
        )

      if (isVideo) {
        formData.append("max_frames", "30")
        formData.append("frame_skip", "10")
      }

      const endpoint = isVideo
        ? `${BASE_URL}/api/video/analyze-video`
        : `${BASE_URL}/api/video/analyze-image`

      const res  = await fetch(endpoint, { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || "Upload failed")

      setUploadResult(data)
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const riskLevel = result?.risk?.risk_level as "HIGH" | "MEDIUM" | "SAFE" | undefined

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-black font-sans relative overflow-x-hidden p-6 lg:p-10 selection:bg-[#1a1a1a] selection:text-[#b89065]">
      
      {/* ── AMBIENT PHYSICAL LIGHTING ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#b89065]/5 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-black/5 rounded-full blur-[100px] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-10">

        {/* ── HEADER PANEL (Shiny Metal Plate) ── */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShinyCard className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_5px_rgba(255,255,255,0.2)]">
                  <Focus size={18} className="text-[#b89065]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b89065] drop-shadow-sm">
                    
                  </span>
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Neural Engine Sandbox
                  </span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1a1a1a] leading-none drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                Detection Demo.
              </h1>
              <p className="text-gray-500 text-sm font-bold tracking-wide mt-4">
                Select a preset scenario or inject a custom file payload to test the inferencing engine.
              </p>
            </div>
          </ShinyCard>
        </motion.div>

        <div className="grid grid-cols-12 gap-8">

          {/* ── LEFT COLUMN: Input Selection ── */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* Preset Scenarios */}
            <ShinyCard className="p-8 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                  <Eye size={14} className="text-[#b89065]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Demo Scenarios</h2>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Pre-loaded matrices</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {DEMO_SCENARIOS.map((s) => (
                  <motion.div
                    key={s.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(s)}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300
                      ${selected?.id === s.id
                        ? "bg-[#1a1a1a] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_4px_rgba(255,255,255,0.1),0_10px_20px_rgba(184,144,101,0.2)] border border-gray-800"
                        : "bg-[#EAE6DF] shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]"
                      }
                    `}
                  >
                    {/* Thumbnail (Recessed) */}
                    <div className="w-16 h-16 rounded-[1rem] overflow-hidden shrink-0 border border-black/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] bg-black">
                      <img
                        src={s.thumbnail}
                        alt={s.label}
                        className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%231a1a1a' width='56' height='56'/%3E%3C/svg%3E"
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-black tracking-tight truncate transition-colors ${selected?.id === s.id ? "text-white" : "text-[#1a1a1a]"}`}>
                        {s.label}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 line-clamp-2 transition-colors ${selected?.id === s.id ? "text-gray-400" : "text-gray-500"}`}>
                        {s.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Analyze button (Hardware Switch) */}
              <button
                onClick={handleAnalyzePreset}
                disabled={!selected || loading}
                className={`mt-6 w-full py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  !selected || loading
                    ? "bg-[#EAE6DF] text-gray-400 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-white/50 cursor-not-allowed"
                    : "bg-[#1a1a1a] text-[#e3cba8] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),0_10px_20px_rgba(184,144,101,0.3)] hover:-translate-y-1 hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),0_15px_30px_rgba(184,144,101,0.4)] active:translate-y-0 active:shadow-[inset_2px_2px_8px_rgba(0,0,0,0.8)]"
                }`}
              >
                {loading ? (
                  <>
                    <Radio size={16} className="animate-pulse text-[#b89065]" />
                    Processing Feed...
                  </>
                ) : (
                  <>
                    <Play size={16} className={selected ? "text-[#b89065]" : "text-gray-400"} />
                    Run Demo Analysis
                  </>
                )}
              </button>
            </ShinyCard>

            {/* Real Upload (Recessed Panel) */}
            <ShinyCard className="p-8">
              <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                  <Upload size={14} className="text-[#b89065]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Custom Payload</h2>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Inject local file</p>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center gap-4 p-8 bg-[#EAE6DF] rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/50 cursor-pointer hover:border-[#b89065]/30 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-[#F0EBE1] shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={18} className="text-gray-400 group-hover:text-[#b89065] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-[#1a1a1a] font-black text-sm tracking-wide">
                    {uploadFile ? uploadFile.name : "Click to select file"}
                  </p>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    JPG, PNG, MP4, AVI
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleRealUpload}
                  className="hidden"
                />
              </label>

              {uploading && (
                <div className="flex items-center justify-center gap-3 mt-6 p-4 rounded-xl bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border border-white/50">
                  <div className="w-4 h-4 border-2 border-[#b89065]/30 border-t-[#b89065] rounded-full animate-spin" />
                  <span className="text-[#1a1a1a] text-[10px] font-black uppercase tracking-widest">Processing Upload...</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-6 flex items-center justify-center gap-3 p-4 rounded-xl bg-red-500/5 shadow-inner border border-red-500/20">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-red-600 text-[10px] font-black uppercase tracking-widest">{uploadError}</span>
                </div>
              )}

              {uploadResult && (
                <div className="mt-6 p-4 rounded-xl bg-green-500/5 shadow-inner border border-green-500/20 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">Analysis Complete</span>
                  </div>
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest font-mono">
                    PAX: {uploadResult.detections?.person_count ?? 0} · 
                    VEH: {uploadResult.detections?.vehicle_count ?? 0} · 
                    RSK: {uploadResult.risk?.risk_level ?? "SAFE"}
                  </p>
                </div>
              )}
            </ShinyCard>
          </div>

          {/* ── RIGHT COLUMN: Results Display ── */}
          <div className="col-span-12 lg:col-span-8 flex flex-col">
            <AnimatePresence mode="wait">

              {/* Empty State */}
              {!result && !loading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 h-full min-h-[600px]"
                >
                  <ShinyCard className="h-full flex flex-col items-center justify-center p-12 border border-dashed border-gray-300">
                    <div className="w-24 h-24 rounded-[2rem] bg-[#EAE6DF] flex items-center justify-center mx-auto mb-8 shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white">
                      <BarChart3 size={40} className="text-gray-400 drop-shadow-md" />
                    </div>
                    <p className="text-[#1a1a1a] font-black text-2xl tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Awaiting Selection</p>
                    <p className="text-gray-500 text-sm mt-3 max-w-sm mx-auto font-bold text-center">
                      Select a predefined scenario or inject a custom payload to engage the diagnostic engine.
                    </p>
                  </ShinyCard>
                </motion.div>
              )}

              {/* Loading State */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 h-full min-h-[600px]"
                >
                  <ShinyCard className="h-full flex flex-col items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white mb-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border-4 border-t-[#b89065] border-r-[#b89065] border-b-transparent border-l-transparent rounded-full" />
                      <Radio size={30} className="text-[#1a1a1a] animate-pulse drop-shadow-sm" />
                    </div>
                    <p className="text-[#1a1a1a] font-black text-2xl tracking-tighter drop-shadow-sm">Analyzing Vectors...</p>
                    <p className="text-[#b89065] text-[10px] font-black font-mono uppercase tracking-[0.3em] mt-4 animate-pulse">Running Neural Inferencing</p>
                  </ShinyCard>
                </motion.div>
              )}

              {/* Results Data */}
              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Selected Image Preview + Global Risk */}
                  <ShinyCard className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                      
                      {/* Image Source (Recessed) */}
                      {selected?.thumbnail && (
                        <div className="w-full md:w-64 h-48 rounded-[1.5rem] bg-black overflow-hidden shrink-0 border border-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative">
                          <img
                            src={selected.thumbnail}
                            alt="analyzed source"
                            className="w-full h-full object-cover mix-blend-luminosity opacity-90"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
                        </div>
                      )}

                      {/* Risk Overview (Gauge) */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-6 mb-4">
                          <div className="relative w-24 h-24 shrink-0 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white/50">
                            <svg viewBox="0 0 100 100" className="absolute w-20 h-20 -rotate-90 drop-shadow-sm">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#d6d1c7" strokeWidth="8" />
                              <motion.circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={riskLevel === "HIGH" ? "#EF4444" : riskLevel === "MEDIUM" ? "#F97316" : "#22C55E"}
                                strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - result.risk.camera_risk_score) }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                              />
                            </svg>
                            <span className="text-xl font-black font-mono" style={{ color: riskLevel === "HIGH" ? "#EF4444" : riskLevel === "MEDIUM" ? "#F97316" : "#22C55E" }}>
                              {Math.round(result.risk.camera_risk_score * 100)}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-black">Global Index</span>
                            <StatusBadge level={riskLevel ?? "SAFE"} size="lg" className="shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,1)]" />
                            <span className="text-gray-600 text-xs font-bold mt-1 bg-white/50 px-2 py-1 rounded shadow-sm border border-white">
                              Crowd Density: <span className="font-black text-[#1a1a1a] font-mono">{toPercent(result.risk.crowd_density)}</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm font-bold leading-relaxed mt-auto border-t border-black/5 pt-4">
                          {selected?.description}
                        </p>
                      </div>
                    </div>
                  </ShinyCard>

                  {/* Object Detections (Physical LED Screens) */}
                  <ShinyCard className="p-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                      <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                        <Users size={14} className="text-[#b89065]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Classified Detections</h2>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Identified Vectors</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {[
                        { label: "Total",    value: result.detections?.total,         color: "text-blue-500" },
                        { label: "Persons",  value: result.detections?.person_count,  color: "text-green-500" },
                        { label: "Vehicles", value: result.detections?.vehicle_count, color: "text-orange-500" },
                        { label: "Cars",     value: result.detections?.car_count,     color: "text-yellow-600" },
                        { label: "Bikes",    value: result.detections?.bike_count,    color: "text-purple-500" },
                        { label: "Buses",    value: result.detections?.bus_count,     color: "text-red-500" },
                      ].map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                          className="bg-[#EAE6DF] rounded-[1.5rem] p-4 text-center shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white/50 flex flex-col justify-center"
                        >
                          <p className={`text-2xl font-black font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,1)] ${s.color}`}>
                            {s.value}
                          </p>
                          <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] mt-2">
                            {s.label}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </ShinyCard>

                  {/* Frame by Frame Chart (Physical LED Array) */}
                  <ShinyCard className="p-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-6">
                      <div className="w-8 h-8 rounded-full bg-[#EAE6DF] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center border border-white">
                        <Activity size={14} className="text-[#b89065]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Frame-by-Frame Index</h2>
                        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Temporal Risk Distribution</p>
                      </div>
                    </div>

                    <div className="bg-[#EAE6DF] p-6 rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/50">
                      <div className="flex items-end gap-[3px] h-24 w-full">
                        {result.frame_by_frame?.map((f, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 rounded-[2px] min-w-[8px] relative group border border-white/20 shadow-sm cursor-crosshair"
                            style={{
                              backgroundColor: f.camera_risk_score >= 0.7 ? "#EF4444" : f.camera_risk_score >= 0.4 ? "#F97316" : "#22C55E",
                              opacity: 0.85,
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(f.camera_risk_score * 100, 10)}%` }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                          >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-2 py-1 rounded shadow-lg text-[10px] font-black font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              {Math.round(f.camera_risk_score * 100)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] font-black font-mono uppercase tracking-[0.2em] text-gray-400 mt-4 px-1">
                        <span>Frame 0</span>
                        <span>Frame {result.frame_by_frame?.[result.frame_by_frame.length - 1]?.frame}</span>
                      </div>
                    </div>
                  </ShinyCard>

                  {/* Engine Specs (Dark Hardware Plate) */}
                  <ShinyCard className="p-8">
                     <div className="bg-[#1a1a1a] p-6 rounded-[2rem] shadow-[10px_10px_20px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.8),inset_0_2px_5px_rgba(255,255,255,0.2)] border border-gray-800 relative overflow-hidden">
                       <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1rem_1rem]" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
                          {[
                            { label: "Engine", value: "YOLOv8n" },
                            { label: "Protocol", value: "Detection" },
                            { label: "Targets", value: "8 Classes" },
                            { label: "Threshold", value: "0.40 Conf" },
                          ].map((item) => (
                            <div key={item.label} className="w-full md:flex-1 pt-4 md:pt-0 md:px-4 first:pt-0 first:pl-0 text-center md:text-left">
                               <p className="text-[#b89065] text-lg font-black font-mono drop-shadow-sm">{item.value}</p>
                               <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">{item.label}</p>
                            </div>
                          ))}
                       </div>
                     </div>
                  </ShinyCard>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}