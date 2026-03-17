"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { TrafficReading } from "@/lib/types"

interface TrafficChartProps {
  data:    TrafficReading[]
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

function getCongestionColor(value: number): string {
  if (value >= 60) return "#EF4444"
  if (value >= 30) return "#F97316"
  return "#22C55E"
}

export function TrafficChart({
  data,
  height = 220,
}: TrafficChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No traffic data yet
      </div>
    )
  }

  const chartData = data.slice(-30).map((t) => ({
    time:       formatTime(t.recorded_at),
    congestion: Math.round((1 - (t.congestion_ratio ?? 1)) * 100),
    incidents:  t.incident_count ?? 0,
    speed:      Math.round(t.current_speed ?? 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />

        <XAxis
          dataKey="time"
          tick={{ fill: "#475569", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1E293B" }}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
          formatter={(value: number, name: string) => {
            if (name === "Congestion %") return [`${value}%`, name]
            return [value, name]
          }}
        />

        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#94A3B8", paddingTop: "8px" }}
        />

        <Bar
          dataKey="congestion"
          name="Congestion %"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={getCongestionColor(entry.congestion)}
              opacity={0.85}
            />
          ))}
        </Bar>

        <Bar
          dataKey="incidents"
          name="Incidents"
          fill="#EF4444"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
          opacity={0.7}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}