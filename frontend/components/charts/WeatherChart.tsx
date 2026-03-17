"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts"
import type { AnalyticsDataPoint } from "@/lib/types"

interface WeatherChartProps {
  data:    AnalyticsDataPoint[]
  height?: number
}

const tooltipStyle = {
  backgroundColor: "#141A2F",
  border:          "1px solid #1E293B",
  borderRadius:    "8px",
  color:           "#F1F5F9",
  fontSize:        "12px",
}

export function WeatherChart({
  data,
  height = 220,
}: WeatherChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No correlation data yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    x: d.rainfall_1h      ?? 0,
    y: d.incident_count   ?? 0,
    z: Math.round((1 - (d.congestion_ratio ?? 1)) * 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />

        <XAxis
          dataKey="x"
          name="Rainfall mm/h"
          tick={{ fill: "#475569", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1E293B" }}
          label={{
            value:    "Rainfall (mm/h)",
            position: "insideBottom",
            offset:   -2,
            fill:     "#475569",
            fontSize: 11,
          }}
        />
        <YAxis
          dataKey="y"
          name="Incidents"
          tick={{ fill: "#475569", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          label={{
            value:    "Incidents",
            angle:    -90,
            position: "insideLeft",
            fill:     "#475569",
            fontSize: 11,
          }}
        />
        <ZAxis
          dataKey="z"
          range={[40, 200]}
          name="Congestion %"
        />

        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ strokeDasharray: "3 3", stroke: "#1E293B" }}
          formatter={(value: number, name: string) => {
            if (name === "Rainfall mm/h") return [`${value} mm/h`, name]
            if (name === "Congestion %")  return [`${value}%`, name]
            return [value, name]
          }}
        />

        <Scatter
          name="Rain vs Incidents"
          data={chartData}
          fill="#3B82F6"
          opacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}