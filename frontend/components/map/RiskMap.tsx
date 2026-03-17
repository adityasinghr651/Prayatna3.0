"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import { useRiskStore }   from "@/store/useRiskStore"
import { useCameraStore } from "@/store/useCameraStore"
import { getRiskColor, toPercent } from "@/lib/utils"
import "leaflet/dist/leaflet.css"

function HeatmapLayer() {
  const { heatmapZones } = useRiskStore()
  return (
    <>
      {heatmapZones.map((zone) => (
        <CircleMarker
          key={zone.zone_id}
          center={[zone.coordinates[0], zone.coordinates[1]]}
          radius={45}
          pathOptions={{
            color:       getRiskColor(zone.risk_level),
            fillColor:   getRiskColor(zone.risk_level),
            fillOpacity: 0.2,
            weight:      1,
          }}
        >
          <Popup>
            <div style={{ background: "#141A2F", color: "#F1F5F9", padding: "8px", borderRadius: "6px", minWidth: "120px", fontSize: "12px" }}>
              <b>{zone.zone_id}</b><br />
              Risk: {toPercent(zone.weight)}<br />
              Level: {zone.risk_level}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}

function CameraLayer() {
  const { cameras } = useCameraStore()
  return (
    <>
      {cameras.map((cam) => (
        <CircleMarker
          key={cam.camera_id}
          center={[cam.lat, cam.lon]}
          radius={7}
          pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <div style={{ background: "#141A2F", color: "#F1F5F9", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>
              <b>{cam.camera_name}</b><br />
              Persons: {cam.person_count}<br />
              Vehicles: {cam.vehicle_count}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}

export function RiskMap() {
  useEffect(() => {
    // Fix leaflet icons
    const L = require("leaflet")
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl:       "/leaflet/marker-icon.png",
      shadowUrl:     "/leaflet/marker-shadow.png",
    })
  }, [])

  return (
    <MapContainer
      center={[22.7196, 75.8577]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='© OpenStreetMap © CARTO'
      />
      <HeatmapLayer />
      <CameraLayer />
    </MapContainer>
  )
}