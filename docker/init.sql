-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Table 1: Weather Data ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS weather_data (
    id              SERIAL PRIMARY KEY,
    city            VARCHAR(100) NOT NULL,
    lat             DECIMAL(9,6) NOT NULL,
    lon             DECIMAL(9,6) NOT NULL,
    temperature     DECIMAL(5,2),
    feels_like      DECIMAL(5,2),
    humidity        INTEGER,
    pressure        INTEGER,
    wind_speed      DECIMAL(6,2),
    wind_direction  INTEGER,
    rainfall_1h     DECIMAL(6,2) DEFAULT 0,
    rainfall_3h     DECIMAL(6,2) DEFAULT 0,
    weather_main    VARCHAR(50),
    weather_desc    VARCHAR(200),
    visibility      INTEGER,
    uv_index        DECIMAL(4,2),
    raw_response    JSONB,
    recorded_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Table 2: Traffic Data ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS traffic_data (
    id                  SERIAL PRIMARY KEY,
    city                VARCHAR(100) NOT NULL,
    lat                 DECIMAL(9,6) NOT NULL,
    lon                 DECIMAL(9,6) NOT NULL,
    current_speed       DECIMAL(6,2),
    free_flow_speed     DECIMAL(6,2),
    congestion_ratio    DECIMAL(5,4),
    incident_count      INTEGER DEFAULT 0,
    incident_types      JSONB,
    road_closure        BOOLEAN DEFAULT FALSE,
    confidence          DECIMAL(4,3),
    raw_response        JSONB,
    recorded_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Table 3: Risk Scores ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_scores (
    id                  SERIAL PRIMARY KEY,
    zone_id             VARCHAR(50) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    lat                 DECIMAL(9,6) NOT NULL,
    lon                 DECIMAL(9,6) NOT NULL,
    risk_score          DECIMAL(4,3) NOT NULL,
    risk_level          VARCHAR(20) NOT NULL,
    weather_score       DECIMAL(4,3),
    traffic_score       DECIMAL(4,3),
    crowd_score         DECIMAL(4,3),
    camera_score        DECIMAL(4,3),
    social_score        DECIMAL(4,3),
    contributing_factors JSONB,
    model_version       VARCHAR(20) DEFAULT '1.0.0',
    computed_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Table 4: Camera Events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS camera_events (
    id              SERIAL PRIMARY KEY,
    camera_id       VARCHAR(50) NOT NULL,
    camera_name     VARCHAR(100),
    lat             DECIMAL(9,6),
    lon             DECIMAL(9,6),
    vehicle_count   INTEGER DEFAULT 0,
    person_count    INTEGER DEFAULT 0,
    bike_count      INTEGER DEFAULT 0,
    bus_count       INTEGER DEFAULT 0,
    car_count       INTEGER DEFAULT 0,
    crowd_density   DECIMAL(4,3) DEFAULT 0,
    detections      JSONB,
    frame_url       VARCHAR(500),
    recorded_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Table 5: Alerts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id              SERIAL PRIMARY KEY,
    alert_id        VARCHAR(100) UNIQUE NOT NULL,
    city            VARCHAR(100) NOT NULL,
    zone_id         VARCHAR(50),
    lat             DECIMAL(9,6),
    lon             DECIMAL(9,6),
    alert_type      VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    risk_score      DECIMAL(4,3),
    risk_factors    JSONB,
    is_active       BOOLEAN DEFAULT TRUE,
    acknowledged    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at     TIMESTAMP WITH TIME ZONE
);

-- ── Table 6: Events Data (PredictHQ) ──────────────────────────
CREATE TABLE IF NOT EXISTS events_data (
    id              SERIAL PRIMARY KEY,
    event_id        VARCHAR(100) UNIQUE NOT NULL,
    city            VARCHAR(100),
    lat             DECIMAL(9,6),
    lon             DECIMAL(9,6),
    title           VARCHAR(300),
    category        VARCHAR(100),
    rank            INTEGER,
    attendance      INTEGER,
    start_time      TIMESTAMP WITH TIME ZONE,
    end_time        TIMESTAMP WITH TIME ZONE,
    raw_response    JSONB,
    recorded_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes for fast queries ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_weather_city_time
    ON weather_data(city, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_traffic_city_time
    ON traffic_data(city, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_zone_time
    ON risk_scores(zone_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_active
    ON alerts(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_camera_id_time
    ON camera_events(camera_id, recorded_at DESC);

-- ── Seed one default zone for Indore ──────────────────────────
INSERT INTO risk_scores (
    zone_id, city, lat, lon,
    risk_score, risk_level,
    weather_score, traffic_score,
    crowd_score, camera_score, social_score,
    contributing_factors
) VALUES (
    'indore-center', 'Indore', 22.7196, 75.8577,
    0.0, 'SAFE',
    0.0, 0.0, 0.0, 0.0, 0.0,
    '{"message": "Awaiting first data collection"}'::jsonb
) ON CONFLICT DO NOTHING;