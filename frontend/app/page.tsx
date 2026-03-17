"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Shield, Activity, Camera,
  ArrowRight, Globe, Layers, Zap, BarChart3, Crosshair, Map, ActivitySquare, Users, Car
} from "lucide-react"

// ── Counter (UNCHANGED) ──
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 24)
    return () => clearInterval(timer)
  }, [target])
  return <span>{count}{suffix}</span>
}

// ── HYPER-PREMIUM PHYSICAL WRAPPERS ──
const ShinyCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF] border border-white/80 shadow-[20px_20px_60px_rgba(0,0,0,0.06),-20px_-20px_60px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(184,144,101,0.05)] ${className}`}>
    {children}
  </div>
)

const RecessedPanel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#EAE6DF] rounded-[2rem] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white/40 ${className}`}>
    {children}
  </div>
)

// ── Feature Card (Physical Plate) ──
function FeatureCard({ icon, title, desc, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ShinyCard className="group p-8 h-full hover:-translate-y-2 transition-transform duration-500 cursor-default">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="w-16 h-16 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white/50 flex items-center justify-center mb-6">
            <div className="text-[#b89065] drop-shadow-sm group-hover:scale-110 transition-transform duration-500">
              {icon}
            </div>
          </div>
          <h3 className="text-[#1a1a1a] font-black text-2xl mb-3 tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed font-bold tracking-wide mt-auto">
            {desc}
          </p>
        </div>
      </ShinyCard>
    </motion.div>
  )
}

// ── MAIN ──
export default function LandingPage() {
  const router = useRouter()
  const { scrollY } = useScroll()
  
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, 100])
  const dashboardScale = useTransform(scrollY, [0, 600], [1, 1.05])
  const dashboardY = useTransform(scrollY, [0, 600], [0, -40])

  const stats = [
    { label: "Data Sources", value: 4, suffix: "+" },
    { label: "Update Speed", value: 30, suffix: "s" },
    { label: "Model Accuracy", value: 96, suffix: "%" },
    { label: "Zones Covered", value: 12, suffix: "" },
  ]

  const features = [
    {
      icon: <Activity size={24} strokeWidth={2.5} />,
      title: "Real-time Intelligence",
      desc: "Continuously analyzes urban signals and generates risk insights every few seconds via neural processing.",
    },
    {
      icon: <Camera size={24} strokeWidth={2.5} />,
      title: "AI Vision Monitoring",
      desc: "Detects movement, density, and anomalies from live camera feeds using proprietary spatial compute.",
    },
    {
      icon: <Globe size={24} strokeWidth={2.5} />,
      title: "Live Spatial Awareness",
      desc: "Understand city-wide patterns through ultra-low latency geospatial visualization and dynamic heat-mapping.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-black selection:bg-[#1a1a1a] selection:text-[#b89065] relative overflow-x-hidden">

      {/* ── AMBIENT PHYSICAL LIGHTING ── */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-[#dcb892]/20 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      {/* ── FLOATING NAV (Physical Pill) ── */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-6xl z-50 px-4 py-3 flex justify-between items-center rounded-full bg-gradient-to-br from-[#ffffff] to-[#EAE6DF] shadow-[10px_10px_20px_rgba(0,0,0,0.06),-10px_-10px_20px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(184,144,101,0.05)] border border-white/80"
      >
        <div className="flex items-center gap-3 cursor-pointer group px-2">
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-[0_5px_10px_rgba(0,0,0,0.2),inset_0_2px_5px_rgba(255,255,255,0.2)]">
            <Shield size={16} className="text-[#b89065]" />
          </div>
          <span className="font-black text-xl tracking-tighter drop-shadow-sm text-[#1a1a1a]">UrbanPulse</span>
        </div>

        <div className="hidden md:flex gap-2 p-1 bg-[#EAE6DF] rounded-full shadow-[inset_3px_3px_6px_rgba(0,0,0,0.05),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white/40">
           {['Platform', 'Solutions', 'Network'].map((item) => (
             <button key={item} className="px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#1a1a1a] hover:bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all">
               {item}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/login")} className="hidden sm:block px-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-black transition">
            Sign In
          </button>
          <button onClick={() => router.push("/dashboard")} className="px-6 py-3 text-[11px] rounded-full bg-[#1a1a1a] text-[#e3cba8] font-black uppercase tracking-[0.2em] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),0_10px_20px_rgba(184,144,101,0.3)] hover:scale-105 transition-all">
            Dashboard
          </button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative pt-[22vh] pb-20 px-6 z-10 flex flex-col items-center">
        <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-5xl mx-auto"
        >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 mb-8 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white/50">
                <span className="relative flex items-center justify-center w-2.5 h-2.5">
                  <span className="absolute w-full h-full rounded-full border border-[#10B981] animate-ping opacity-50" />
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                </span>
                <span className="text-[#1a1a1a] text-[11px] font-black uppercase tracking-[0.3em] drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
                  UrbanPulse Core Operational
                </span>
            </div>
            
            <h1 className="text-[4rem] md:text-[6.5rem] font-black mb-6 leading-[0.9] tracking-tighter text-[#1a1a1a] drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
              Urban Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a1a1a] via-[#634526] to-[#b89065]">
                for Safer Cities.
              </span>
            </h1>

            <p className="text-gray-500 max-w-2xl mx-auto mb-12 text-lg md:text-xl font-bold tracking-wide leading-relaxed">
              A unified AI platform transforming raw municipal data into 
              predictive risk intelligence. The definitive infrastructure for proactive urban management.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
              <button onClick={() => router.push("/dashboard")} className="px-8 py-5 rounded-full bg-[#1a1a1a] text-[#e3cba8] text-sm font-black uppercase tracking-[0.2em] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),0_15px_30px_rgba(184,144,101,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                Explore Platform <ArrowRight size={16} />
              </button>
              <button onClick={() => router.push("/login")} className="px-8 py-5 rounded-full bg-[#F0EBE1] text-[#1a1a1a] text-sm font-black uppercase tracking-[0.2em] shadow-[10px_10px_20px_rgba(0,0,0,0.06),-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white hover:shadow-[15px_15px_30px_rgba(0,0,0,0.1),-15px_-15px_30px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all flex items-center justify-center">
                Request Demo
              </button>
            </div>
        </motion.div>

        {/* ── THE PHYSICAL DASHBOARD PREVIEW ── */}
        <motion.div 
          style={{ scale: dashboardScale, y: dashboardY }}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-6xl mx-auto"
        >
          <ShinyCard className="p-4 md:p-6 pb-2 md:pb-4">
            <div className="flex gap-2.5 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-red-400 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)]" />
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)]" />
              <div className="w-3 h-3 rounded-full bg-green-400 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)]" />
            </div>

            <RecessedPanel className="w-full aspect-[16/10] md:aspect-video flex relative overflow-hidden">
              
              {/* Fake Sidebar */}
              <div className="hidden md:flex flex-col w-64 bg-[#EAE6DF] border-r border-white/40 p-6 space-y-6 z-20 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.02)]">
                <div className="h-8 w-32 bg-[#F0EBE1] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] rounded-lg mb-6 border border-white/50" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center opacity-60">
                    <div className="w-8 h-8 rounded-lg bg-[#F0EBE1] shadow-[3px_3px_6px_rgba(0,0,0,0.05),-3px_-3px_6px_rgba(255,255,255,0.9)] border border-white" />
                    <div className="h-4 w-full bg-[#F0EBE1] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] rounded-md border border-white/50" />
                  </div>
                ))}
              </div>

              {/* ── CENTRAL DATA VISUALIZATION ── */}
              <div className="flex-1 p-6 flex flex-col relative overflow-hidden bg-[#faf9f7] shadow-[inset_10px_10px_20px_rgba(0,0,0,0.03)]">
                
                {/* Top Bar */}
                <div className="flex justify-between mb-6 z-20">
                  <div className="h-10 px-4 bg-white border border-black/5 rounded-xl shadow-sm flex items-center gap-3">
                      <ActivitySquare size={16} className="text-[#b89065]" />
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]">Telemetry Feed</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 px-4 bg-[#1a1a1a] text-[#e3cba8] rounded-xl shadow-md flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22C55E]" />
                      Live Sync
                    </div>
                  </div>
                </div>

                {/* Radar Grid & Connections */}
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-[0.03]" />
                  
                  {/* Radar Rings */}
                  <div className="absolute w-[500px] h-[500px] border border-[#b89065]/10 rounded-full" />
                  <div className="absolute w-[350px] h-[350px] border border-[#b89065]/20 rounded-full" />
                  <motion.div 
                      animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="absolute w-[200px] h-[200px] border border-[#b89065]/40 rounded-full border-dashed flex items-center justify-center"
                  >
                      <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-[#b89065]/15 rounded-r-full origin-left" />
                  </motion.div>

                  {/* SVG Connecting Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                     <line x1="50%" y1="50%" x2="30%" y2="30%" stroke="#b89065" strokeWidth="2" strokeDasharray="6 6" />
                     <line x1="50%" y1="50%" x2="70%" y2="35%" stroke="#b89065" strokeWidth="1.5" />
                     <line x1="50%" y1="50%" x2="65%" y2="70%" stroke="#b89065" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>

                  {/* Core Node */}
                  <div className="absolute w-6 h-6 bg-[#b89065] rounded-full shadow-[0_0_30px_#b89065] flex items-center justify-center z-10 border-2 border-white">
                      <div className="w-full h-full bg-[#b89065] rounded-full animate-ping opacity-60" />
                  </div>
                  
                  {/* Threat Node (Red) */}
                  <div className="absolute top-[30%] left-[30%] z-10 flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_20px_red] relative border-2 border-white">
                          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <div className="bg-white/80 backdrop-blur border border-red-200 px-2 py-0.5 rounded text-[8px] font-black font-mono text-red-600 shadow-sm uppercase">
                          CRIT-04
                      </div>
                  </div>

                  {/* Warning Node (Amber) */}
                  <div className="absolute top-[70%] left-[65%] z-10 flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_amber] relative border-2 border-white">
                          <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-75" />
                      </div>
                      <div className="bg-white/80 backdrop-blur border border-amber-200 px-2 py-0.5 rounded text-[8px] font-black font-mono text-amber-600 shadow-sm uppercase">
                          WARN-12
                      </div>
                  </div>

                  {/* Safe Node (Black/Neutral) */}
                  <div className="absolute top-[35%] left-[70%] z-10 flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 bg-[#1a1a1a] rounded-full relative border border-white" />
                      <div className="bg-white/80 backdrop-blur border border-black/10 px-2 py-0.5 rounded text-[8px] font-black font-mono text-gray-600 shadow-sm uppercase">
                          NODE-A
                      </div>
                  </div>

                  {/* Floating Analytics Panel (Top Right) */}
                  <div className="absolute top-20 right-6 w-56 bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] p-5 shadow-[10px_10px_20px_rgba(0,0,0,0.05)] z-20">
                     <div className="text-[9px] font-black text-[#1a1a1a] mb-4 uppercase tracking-[0.2em] flex items-center justify-between">
                         System Load
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     </div>
                     <div className="space-y-4">
                       <div>
                           <div className="flex justify-between text-[9px] text-gray-500 mb-1.5 font-bold font-mono"><span>CPU_USAGE</span><span>82%</span></div>
                           <div className="w-full h-1.5 bg-[#EAE6DF] rounded-full shadow-inner overflow-hidden">
                             <motion.div animate={{ width: ["70%", "85%", "82%"] }} transition={{ duration: 4, repeat: Infinity }} className="h-full bg-[#b89065] rounded-full" />
                           </div>
                       </div>
                       <div>
                           <div className="flex justify-between text-[9px] text-gray-500 mb-1.5 font-bold font-mono"><span>NETWORK_IO</span><span>45%</span></div>
                           <div className="w-full h-1.5 bg-[#EAE6DF] rounded-full shadow-inner overflow-hidden">
                             <motion.div animate={{ width: ["40%", "50%", "45%"] }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-[#1a1a1a] rounded-full" />
                           </div>
                       </div>
                     </div>
                  </div>
                </div>
                
                {/* Floating Bottom Cards (Populated with mock data) */}
                <div className="mt-auto grid grid-cols-3 gap-5 z-20">
                   {/* Card 1 */}
                   <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[1.5rem] shadow-[5px_5px_15px_rgba(0,0,0,0.05)] flex flex-col transition-transform hover:-translate-y-1">
                      <div className="flex items-center gap-2 mb-auto">
                        <Car size={14} className="text-red-500" />
                        <span className="text-red-500 text-[9px] font-black uppercase tracking-widest">Traffic Alert</span>
                      </div>
                      <h4 className="text-[#1a1a1a] font-black text-xl leading-none mt-4">Sector 7G</h4>
                      <p className="text-gray-500 text-[10px] font-bold mt-1 font-mono uppercase tracking-widest">14 Vehicles Detected</p>
                   </div>
                   {/* Card 2 */}
                   <div className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[1.5rem] shadow-[5px_5px_15px_rgba(0,0,0,0.05)] flex flex-col transition-transform hover:-translate-y-1">
                      <div className="flex items-center gap-2 mb-auto">
                        <Users size={14} className="text-amber-500" />
                        <span className="text-amber-500 text-[9px] font-black uppercase tracking-widest">Crowd Warning</span>
                      </div>
                      <h4 className="text-[#1a1a1a] font-black text-xl leading-none mt-4">Market Sq.</h4>
                      <p className="text-gray-500 text-[10px] font-bold mt-1 font-mono uppercase tracking-widest">Density at 85%</p>
                   </div>
                   {/* Card 3 */}
                   <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-800 p-5 rounded-[1.5rem] shadow-[5px_5px_15px_rgba(0,0,0,0.1)] flex flex-col transition-transform hover:-translate-y-1">
                      <div className="flex items-center gap-2 mb-auto">
                        <Shield size={14} className="text-[#10B981]" />
                        <span className="text-[#10B981] text-[9px] font-black uppercase tracking-widest">System</span>
                      </div>
                      <h4 className="text-white font-black text-xl leading-none mt-4">All Clear</h4>
                      <p className="text-gray-400 text-[10px] font-bold mt-1 font-mono uppercase tracking-widest">Global Matrix Stable</p>
                   </div>
                </div>

              </div>
            </RecessedPanel>
          </ShinyCard>
        </motion.div>
      </section>

      {/* ── STATS SECTION (Physical Gauges) ── */}
      <section className="py-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-5xl mx-auto px-6">
          {stats.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-full bg-[#F0EBE1] shadow-[10px_10px_20px_rgba(0,0,0,0.06),-10px_-10px_20px_rgba(255,255,255,0.9)] border-4 border-white flex items-center justify-center relative mb-4">
                <div className="absolute inset-2 rounded-full bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)]" />
                <div className="relative z-10 text-3xl font-black font-mono tracking-tighter text-[#1a1a1a] drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#8a6642] drop-shadow-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
                <div className="max-w-xl">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1a1a1a] mb-6 drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                        Precision <br/>Infrastructure.
                    </h2>
                    <p className="text-gray-500 font-bold text-lg tracking-wide leading-relaxed">Engineered for government agencies and tactical operators who cannot afford downtime.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
                <FeatureCard key={i} {...f} delay={i * 0.1} />
            ))}
            </div>
        </div>
      </section>

      {/* ── BOTTOM CTA (Onyx Metal Plate) ── */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-[#1a1a1a] p-12 md:p-24 text-center relative overflow-hidden shadow-[20px_20px_60px_rgba(0,0,0,0.2),inset_0_2px_5px_rgba(255,255,255,0.2)] border border-gray-800">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#b89065]/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#2a2a2a] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.5),inset_-5px_-5px_10px_rgba(255,255,255,0.05)] border border-white/5 flex items-center justify-center mb-8">
               <Shield size={24} className="text-[#e3cba8]" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white drop-shadow-md">
              Secure Your Territory.
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-12 text-lg font-bold tracking-wide">
              Awaken your city's neural grid. Real-time threat detection and spatial compute, online in minutes.
            </p>
            <button onClick={() => router.push("/dashboard")} className="px-10 py-5 rounded-full bg-gradient-to-b from-[#e3cba8] to-[#b89065] text-[#1a1a1a] font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(184,144,101,0.3),inset_0_2px_5px_rgba(255,255,255,0.5)] hover:scale-105 transition-transform">
              Initialize Command Center
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 text-center relative z-10 border-t border-white/40 bg-gradient-to-b from-transparent to-[#EAE6DF]">
        <div className="flex justify-center gap-8 mb-8">
            {[<Map key="1" size={20}/>, <Zap key="2" size={20}/>, <BarChart3 key="3" size={20}/>].map((icon, i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-[#F0EBE1] shadow-[5px_5px_10px_rgba(0,0,0,0.05),-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white flex items-center justify-center text-[#b89065] hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.05),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all cursor-pointer">
                  {icon}
              </div>
            ))}
        </div>
        <div className="text-[#1a1a1a] font-black text-xs uppercase tracking-[0.4em] mb-3 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">Secure City System</div>
        <p className="text-gray-500 font-bold text-xs tracking-widest uppercase">© 2026. The foundation of secure infrastructure.</p>
      </footer>
    </div>
  )
}