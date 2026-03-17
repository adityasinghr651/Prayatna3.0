"use client"

import { motion } from "framer-motion"
import { Camera, Users, Car, Wifi, WifiOff, Activity, Radio } from "lucide-react"
import { Card }        from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { useCameras }  from "@/hooks/useCameras"
import { useCameraStore } from "@/store/useCameraStore"
import { getCameraStreamUrl } from "@/lib/api"
import { toPercent, getRiskColor } from "@/lib/utils"

// ── HYPER-PREMIUM PHYSICAL WRAPPERS ──
const ShinyCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative rounded-[2.5rem] bg-gradient-to-br from-[#ffffff] via-[#fcfbf9] to-[#EAE6DF] border border-white/80 shadow-[20px_20px_60px_rgba(0,0,0,0.05),-20px_-20px_60px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(184,144,101,0.05)] ${className}`}>
    {children}
  </div>
)

const RecessedPanel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#EAE6DF] rounded-[2rem] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-white/50 ${className}`}>
    {children}
  </div>
)

export default function CamerasPage() {
  useCameras(5000)
  const { cameras, loading } = useCameraStore()

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
                  <Camera size={18} className="text-[#b89065]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b89065] drop-shadow-sm">
                    Urban Surveillance
                  </span>
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Sensor Grid Matrix
                  </span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1a1a1a] leading-none drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                Optical Network.
              </h1>
            </div>

            {/* Active Nodes Badge (Pressed-in Neumorphic) */}
            <div className="px-6 py-4 rounded-[1.5rem] bg-[#EAE6DF] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.05),inset_-5px_-5px_10px_rgba(255,255,255,0.8)] border border-white/50 flex flex-col items-end">
              <span className="text-gray-400 text-[8px] font-black uppercase tracking-widest mb-1">Active Nodes</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                   <div className="absolute w-3 h-3 rounded-full border border-[#10B981] animate-ping opacity-50" />
                   <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                </div>
                <span className="text-[#1a1a1a] text-xl font-black font-mono tracking-tighter">
                  {cameras.length}
                </span>
              </div>
            </div>
          </ShinyCard>
        </motion.div>

        {/* ── CAMERA GRID ── */}
        {loading && cameras.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <ShinyCard key={i} className="p-4 flex flex-col overflow-hidden">
                <RecessedPanel className="h-52 w-full animate-pulse bg-gradient-to-r from-[#EAE6DF] via-[#F0EBE1] to-[#EAE6DF] bg-[length:200%_100%] rounded-[1.5rem]" />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-1/2 bg-[#EAE6DF] rounded-md animate-pulse shadow-inner" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-[#EAE6DF] rounded-xl animate-pulse shadow-inner" />
                    <div className="h-20 bg-[#EAE6DF] rounded-xl animate-pulse shadow-inner" />
                    <div className="h-20 bg-[#EAE6DF] rounded-xl animate-pulse shadow-inner" />
                  </div>
                </div>
              </ShinyCard>
            ))}
          </div>
        ) : cameras.length === 0 ? (
          <ShinyCard className="min-h-[400px] flex items-center justify-center p-12 border border-dashed border-gray-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-[#EAE6DF] flex items-center justify-center mx-auto mb-8 shadow-[inset_10px_10px_20px_rgba(0,0,0,0.05),inset_-10px_-10px_20px_rgba(255,255,255,0.9)] border border-white">
                <Radio size={40} className="text-gray-400 drop-shadow-md animate-pulse" />
              </div>
              <p className="text-[#1a1a1a] font-black text-3xl tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">No Nodes Online</p>
              <p className="text-gray-500 text-sm mt-3 max-w-sm mx-auto font-bold">
                Start IP Webcam on your hardware and inject <span className="font-mono text-[#b89065] bg-white/50 px-1 rounded shadow-sm">PHONE_CAMERA_URL</span> in the environment to establish uplink.
              </p>
            </motion.div>
          </ShinyCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {cameras.map((cam, i) => (
              <motion.div
                key={cam.camera_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
              >
                <ShinyCard className="group h-full flex flex-col hover:-translate-y-2 transition-transform duration-500">
                  
                  {/* Glossy top edge highlight */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />

                  {/* Live Stream Screen (Recessed) */}
                  <div className="p-4 pb-0 relative z-10">
                    <RecessedPanel className="relative h-56 w-full overflow-hidden border border-white/60 bg-black">
                      <img
                        src={getCameraStreamUrl(cam.camera_id)}
                        alt={cam.camera_name}
                        className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105 opacity-90 mix-blend-luminosity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                      
                      {/* Scanning Line Overlay (Tactical look) */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                      
                      {/* Physical "LIVE" Indicator Pill */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="flex items-center gap-2 bg-[#F0EBE1]/90 backdrop-blur-md border border-white text-[#1a1a1a] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.15)]">
                          <span className="relative flex w-2 h-2 items-center justify-center">
                             <span className="absolute w-full h-full rounded-full border border-[#10B981] animate-ping opacity-50" />
                             <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_5px_#10B981]" />
                          </span>
                          LIVE
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-10 shadow-[0_5px_10px_rgba(0,0,0,0.2)] rounded-full">
                        <StatusBadge
                          level={cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE"}
                          size="sm"
                        />
                      </div>

                      {/* Inner screen shadow */}
                      <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] pointer-events-none" />
                    </RecessedPanel>
                  </div>

                  {/* Stats & Controls Area */}
                  <div className="p-6 relative z-10 flex flex-col flex-1">
                    
                    {/* Title & Connection Status */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-[#1a1a1a] font-black tracking-tight text-xl drop-shadow-[0_1px_1px_rgba(255,255,255,1)] group-hover:text-[#b89065] transition-colors">{cam.camera_name}</p>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">{cam.camera_id}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] bg-[#EAE6DF] px-2.5 py-1.5 rounded shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] border border-white">
                        <Wifi size={10} className="text-[#10B981] drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                        <span>Online</span>
                      </div>
                    </div>

                    {/* Telemetry Dials (Recessed Sockets) */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <RecessedPanel className="p-4 flex flex-col items-center justify-center border border-white/50 group-hover:border-[#b89065]/30 transition-colors">
                        <Users size={14} className="text-[#b89065] mb-2 drop-shadow-sm" />
                        <p className="text-[#1a1a1a] text-xl font-black font-mono leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">{cam.person_count}</p>
                        <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">PAX</p>
                      </RecessedPanel>
                      <RecessedPanel className="p-4 flex flex-col items-center justify-center border border-white/50 group-hover:border-[#b89065]/30 transition-colors">
                        <Car size={14} className="text-[#b89065] mb-2 drop-shadow-sm" />
                        <p className="text-[#1a1a1a] text-xl font-black font-mono leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">{cam.vehicle_count}</p>
                        <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">VEH</p>
                      </RecessedPanel>
                      <RecessedPanel className="p-4 flex flex-col items-center justify-center border border-white/50 group-hover:border-[#b89065]/30 transition-colors">
                        <div 
                          className="w-3 h-3 mb-2.5 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),0_0_8px_currentColor]" 
                          style={{ backgroundColor: getRiskColor(cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE"), color: getRiskColor(cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE") }} 
                        />
                        <p className="text-[#1a1a1a] text-xl font-black font-mono leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">{toPercent(cam.crowd_density)}</p>
                        <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-1">Density</p>
                      </RecessedPanel>
                    </div>

                    {/* Risk Bar (Physical Groove) */}
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] drop-shadow-sm">Index Score</span>
                        <span className="font-mono font-black drop-shadow-sm text-sm" style={{ color: getRiskColor(cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE") }}>
                          {toPercent(cam.score)}
                        </span>
                      </div>
                      <RecessedPanel className="h-3 w-full rounded-full p-[1.5px] border border-white/60">
                        <motion.div
                          className="h-full rounded-full relative shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: getRiskColor(cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE"), color: getRiskColor(cam.score >= 0.7 ? "HIGH" : cam.score >= 0.4 ? "MEDIUM" : "SAFE") }}
                          initial={{ width: 0 }}
                          animate={{ width: toPercent(cam.score) }}
                          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                        >
                          {/* Inner glossy tube highlight */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent rounded-full" />
                        </motion.div>
                      </RecessedPanel>
                    </div>

                  </div>
                </ShinyCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}