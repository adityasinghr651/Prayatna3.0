"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { RiskHistoryItem } from "@/lib/types"
import { getRiskColor } from "@/lib/utils"

interface RiskTrendChartProps {
  data:   RiskHistoryItem[]
  height?: number
}

const tooltipStyle = {
  backgroundColor: "#141A2F",
  border:          "1px solid #1E293B",
  borderRadius:    "8px",
  color:           "#F1F5F9",
  fontSize:        "12px",
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour:   "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

export function RiskTrendChart({
  data,
  height = 250,
}: RiskTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No trend data yet — workers collecting...
      </div>
    )
  }

  const chartData = data.map((r) => ({
    time:          formatTime(r.computed_at),
    overall:       Math.round(r.risk_score    * 100),
    traffic:       Math.round(r.traffic_score * 100),
    weather:       Math.round(r.weather_score * 100),
    crowd:         Math.round(r.crowd_score   * 100),
    camera:        Math.round(r.camera_score  * 100),
    risk_level:    r.risk_level,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gOverall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="gTraffic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F97316" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="gWeather" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0}   />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />

        <XAxis
          dataKey="time"
          tick={{ fill: "#475569", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1E293B" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#475569", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />

        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
          formatter={(value: number, name: string) => [
            `${value}%`,
            name.charAt(0).toUpperCase() + name.slice(1),
          ]}
        />

        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#94A3B8", paddingTop: "8px" }}
        />

        <Area
          type="monotone"
          dataKey="overall"
          name="Overall Risk"
          stroke="#3B82F6"
          fill="url(#gOverall)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#3B82F6" }}
        />
        <Area
          type="monotone"
          dataKey="traffic"
          name="Traffic"
          stroke="#F97316"
          fill="url(#gTraffic)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#F97316" }}
        />
        <Area
          type="monotone"
          dataKey="weather"
          name="Weather"
          stroke="#22C55E"
          fill="url(#gWeather)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#22C55E" }}
        />
        <Area
          type="monotone"
          dataKey="crowd"
          name="Crowd"
          stroke="#A855F7"
          fill="none"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#A855F7" }}
        />
        <Area
          type="monotone"
          dataKey="camera"
          name="Camera"
          stroke="#EC4899"
          fill="none"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#EC4899" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}