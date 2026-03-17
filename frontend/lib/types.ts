// ═══════════════════════════════════════════════
// RISK TYPES
// ═══════════════════════════════════════════════

export interface RiskAssessment {
  zone_id:    string
  city:       string
  lat:        number
  lon:        number
  risk_score: number
  risk_level: "HIGH" | "MEDIUM" | "SAFE"
  contributing_factors: {
    weather: {
      score:   number
      weight:  string
      details: {
        temperature:  number | null
        rainfall_1h:  number | null
        wind_speed:   number | null
        visibility:   number | null
        weather_desc: string | null
      }
    }
    traffic: {
      score:   number
      weight:  string
      details: {
        current_speed:    number | null
        free_flow_speed:  number | null
        congestion_ratio: number | null
        incident_count:   number | null
        road_closure:     boolean | null
      }
    }
    crowd_events: {
      score:   number
      weight:  string
      details: {
        active_events:   number
        top_event:       string | null
        max_attendance:  number
      }
    }
    camera: {
      score:   number
      weight:  string
      details: {
        persons:       number
        vehicles:      number
        crowd_density: number
      }
    }
    social: {
      score:   number
      weight:  string
      details: {
        total_posts:  number
        top_keywords: string[]
      }
    }
  }
  explanation: {
    reasons:       string[]
    contributions: Array<{
      feature:      string
      value:        number
      importance:   number
      contribution: number
    }>
    risk_score: number
  }
  model_version: string
  data_freshness: {
    weather_at: string
    traffic_at: string
    camera_at:  string
    social_at:  string
  }
  computed_at: string
}

export interface RiskHistoryItem {
  zone_id:       string
  risk_score:    number
  risk_level:    "HIGH" | "MEDIUM" | "SAFE"
  weather_score: number
  traffic_score: number
  crowd_score:   number
  camera_score:  number
  social_score:  number
  computed_at:   string
}

export interface HeatmapZone {
  zone_id:     string
  coordinates: [number, number]
  weight:      number
  risk_level:  "HIGH" | "MEDIUM" | "SAFE"
}

// ═══════════════════════════════════════════════
// WEATHER TYPES
// ═══════════════════════════════════════════════

export interface WeatherReading {
  city:          string
  lat:           number
  lon:           number
  temperature:   number
  feels_like:    number
  humidity:      number
  pressure:      number
  wind_speed:    number
  wind_direction:number
  rainfall_1h:   number
  rainfall_3h:   number
  weather_main:  string
  weather_desc:  string
  visibility:    number
  uv_index:      number
  recorded_at:   string
}

export interface WeatherResponse {
  city:    string
  count:   number
  weather: WeatherReading[]
}

// ═══════════════════════════════════════════════
// TRAFFIC TYPES
// ═══════════════════════════════════════════════

export interface TrafficReading {
  city:             string
  lat:              number
  lon:              number
  current_speed:    number
  free_flow_speed:  number
  congestion_ratio: number
  incident_count:   number
  incident_types:   Record<string, number>
  road_closure:     boolean
  confidence:       number
  recorded_at:      string
}

export interface TrafficResponse {
  city:    string
  count:   number
  traffic: TrafficReading[]
}

// ═══════════════════════════════════════════════
// ALERT TYPES
// ═══════════════════════════════════════════════

export interface Alert {
  alert_id:     string
  city:         string
  zone_id:      string
  lat:          number
  lon:          number
  alert_type:   string
  severity:     "HIGH" | "MEDIUM"
  title:        string
  description:  string
  risk_score:   number
  risk_factors: Record<string, unknown>
  is_active:    boolean
  acknowledged: boolean
  created_at:   string
  resolved_at:  string | null
}

export interface AlertsResponse {
  city:    string
  count:   number
  alerts:  Alert[]
}

export interface AlertStats {
  city:          string
  total:         number
  active_high:   number
  active_medium: number
  total_active:  number
  last_hour:     number
}

// ═══════════════════════════════════════════════
// CAMERA TYPES
// ═══════════════════════════════════════════════

export interface Camera {
  camera_id:       string
  camera_name:     string
  lat:             number
  lon:             number
  score:           number
  person_count:    number
  vehicle_count:   number
  crowd_density:   number
  vehicle_density: number
  status?:         "online" | "offline"
  updated_at?:     string
  summary?: {
    persons:  number
    vehicles: number
    cars:     number
    bikes:    number
    buses:    number
  }
}

export interface CameraListResponse {
  cameras: Camera[]
  total:   number
}

// ═══════════════════════════════════════════════
// EVENTS TYPES
// ═══════════════════════════════════════════════

export interface EventItem {
  event_id:    string
  city:        string
  lat:         number
  lon:         number
  title:       string
  category:    string
  rank:        number
  attendance:  number
  start_time:  string
  end_time:    string
  recorded_at: string
}

export interface EventsResponse {
  city:   string
  count:  number
  events: EventItem[]
}

// ═══════════════════════════════════════════════
// SOCIAL TYPES
// ═══════════════════════════════════════════════

export interface SocialResponse {
  score:         number
  total_posts:   number
  top_keywords:  string[]
  sample_texts:  string[]
  posts:         Array<{
    keyword:    string
    text:       string
    author:     string
    created_at: string
    weight:     number
  }>
  updated_at: string
}

// ═══════════════════════════════════════════════
// ANALYTICS TYPES
// ═══════════════════════════════════════════════

export interface AnalyticsDataPoint {
  time:             string
  rainfall_1h:      number
  temperature:      number
  humidity:         number
  congestion_ratio: number
  incident_count:   number
  current_speed:    number
}

export interface AnalyticsResponse {
  city:  string
  hours: number
  count: number
  data:  AnalyticsDataPoint[]
}

// ═══════════════════════════════════════════════
// WEBSOCKET TYPES
// ═══════════════════════════════════════════════

export interface WsNewAlert {
  alert_id:    string
  title:       string
  description: string
  severity:    "HIGH" | "MEDIUM"
  risk_score:  number
  zone_id:     string
  lat:         number
  lon:         number
  created_at:  string
}

// ═══════════════════════════════════════════════
// API RESPONSE WRAPPER
// ═══════════════════════════════════════════════

export interface ApiState<T> {
  data:    T | null
  loading: boolean
  error:   string | null
}