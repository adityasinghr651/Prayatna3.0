"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Eye, EyeOff, ArrowRight, Lock, Activity, Fingerprint } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [org, setOrg] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Simulate network request
    setTimeout(() => {
      setLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans selection:bg-[#b89065] selection:text-white">
      
      {/* ── LEFT: AUTHENTICATION FORM (Light Mode) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Subtle background grid for the form side */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:2rem_2rem]" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Brand Identity */}
          <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
              <Shield size={18} className="text-[#e3cba8]" />
            </div>
            <div>
              <p className="text-black font-extrabold tracking-tight text-lg leading-none">UrbanRisk</p>
              <p className="text-[#b89065] text-[10px] font-bold uppercase tracking-widest mt-1">Intelligence Systems</p>
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-black text-4xl font-black mb-3 tracking-tighter">Command Access.</h1>
            <p className="text-gray-500 text-sm font-medium">Authenticate to establish a secure uplink with your municipal dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-black text-[11px] font-bold uppercase tracking-widest mb-2 block">Operator Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@city.gov"
                required
                className="w-full px-4 py-3.5 bg-white border border-black/10 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-[#b89065] focus:ring-4 focus:ring-[#b89065]/10 text-sm transition-all shadow-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-black text-[11px] font-bold uppercase tracking-widest mb-2 block">Security Clearance (Password)</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-3.5 bg-white border border-black/10 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-[#b89065] focus:ring-4 focus:ring-[#b89065]/10 text-sm pr-12 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="text-black text-[11px] font-bold uppercase tracking-widest mb-2 block">Jurisdiction / Network</label>
              <input
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g., Sector 7 Protocol"
                className="w-full px-4 py-3.5 bg-white border border-black/10 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:border-[#b89065] focus:ring-4 focus:ring-[#b89065]/10 text-sm transition-all shadow-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-black text-white font-bold rounded-xl transition-all hover:bg-[#1a1a1a] hover:shadow-[0_8px_20px_rgba(184,144,101,0.3)] flex items-center justify-center gap-3 text-sm disabled:opacity-70 disabled:hover:shadow-none group relative overflow-hidden"
            >
              {loading ? (
                <>
                   <div className="w-5 h-5 border-2 border-white/20 border-t-[#b89065] rounded-full animate-spin" />
                   <span className="text-[#e3cba8] tracking-widest uppercase text-xs">Authenticating...</span>
                </>
              ) : (
                <>
                  Initialize Session 
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-[#b89065]" />
                </>
              )}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-black/5"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">or</span>
              <div className="flex-grow border-t border-black/5"></div>
            </div>

            {/* Google SSO */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 bg-white border border-black/10 hover:bg-gray-50 hover:border-black/20 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Federal SSO
            </button>
          </form>
        </motion.div>

        {/* Footer Links */}
        <div className="absolute bottom-8 text-center w-full flex justify-center gap-6 text-xs font-medium text-gray-400">
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Clearance</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
        </div>
      </div>

      {/* ── RIGHT: TACTICAL VISUALIZATION (Dark Mode) ── */}
      <div className="hidden lg:flex flex-1 bg-[#0a0a0a] relative items-center justify-center p-12 overflow-hidden border-l border-black/10">
        
        {/* Deep ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b89065]/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Tactical Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg"
        >
          {/* Central Animated Core */}
          <div className="relative w-64 h-64 mx-auto mb-16 flex items-center justify-center">
            {/* Outer spinning ring */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/10 border-dashed"
            />
            {/* Middle scanning ring */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-[#b89065]/30 flex items-center justify-center"
            >
                 <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-[#b89065]/20 rounded-r-full origin-left" />
            </motion.div>
            {/* Inner Core */}
            <div className="absolute inset-16 rounded-full bg-black border border-[#b89065]/40 shadow-[0_0_50px_rgba(184,144,101,0.2)] flex items-center justify-center z-10">
                 {loading ? (
                     <Fingerprint size={48} className="text-[#b89065] animate-pulse" />
                 ) : (
                     <Lock size={40} className="text-[#e3cba8]" />
                 )}
            </div>

            {/* Connecting Lines to Stats */}
            <svg className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 z-0 pointer-events-none opacity-30">
                <line x1="50%" y1="50%" x2="20%" y2="85%" stroke="#b89065" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="80%" y2="85%" stroke="#b89065" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="#b89065" strokeWidth="1" />
            </svg>
          </div>

          {/* Text Context */}
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-white text-3xl font-black mb-4 tracking-tighter">
              Secure Uplink Required
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
              You are entering a restricted municipal intelligence zone. All activities are monitored and encrypted via AES-256.
            </p>
          </div>

          {/* System Metrics (Glassmorphism) */}
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {[
              { label: "Live APIs", value: "Active", icon: <Activity size={14} className="text-green-400"/> },
              { label: "ML Engine", value: "XGB-v4", icon: <Fingerprint size={14} className="text-[#b89065]"/> },
              { label: "Latency", value: "12ms", icon: <Shield size={14} className="text-blue-400"/> },
            ].map((s, i) => (
              <motion.div 
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl"
              >
                <div className="mb-2">{s.icon}</div>
                <p className="text-white font-bold text-sm mb-0.5">{s.value}</p>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{s.label}</p>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  )
}