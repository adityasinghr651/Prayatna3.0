<div align="center">

<img src="https://img.shields.io/badge/Prayatna-3.0-FF9933?style=for-the-badge&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Live-22C55E?style=for-the-badge" />
<img src="https://img.shields.io/badge/City-Indore%2C%20MP-138808?style=for-the-badge" />
<img src="https://img.shields.io/badge/Made%20with-❤️%20in%20India-FF9933?style=for-the-badge" />

<br/><br/>

<h1>
  🛡️ Urban Risk Intelligence Platform
</h1>

<h3>
  <em>AI-powered real-time monitoring and prediction of urban safety risks</em>
</h3>

<br/>

> **Proactive. Intelligent. Real-time.**
> Integrating fragmented urban safety systems into one unified AI-driven command center for smarter, safer cities.

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-006400?style=flat-square)](https://xgboost.ai)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-blue?style=flat-square)](https://ultralytics.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

## 🎯 Problem Statement

> *"Current urban safety systems rely on fragmented forecasting and surveillance mechanisms, leading to reactive responses and delayed intervention."*

Cities like Indore have **weather departments**, **traffic monitoring**, **CCTV networks**, **police databases**, and **disaster management systems** — all operating in **complete isolation**.

| ❌ Current Reality | ✅ Our Solution |
|---|---|
| Siloed systems, no data sharing | Unified integration layer |
| Reactive — act after incidents | Proactive — predict before incidents |
| Manual monitoring, slow response | AI-driven, automated alerts in 30s |
| No explainability for decisions | Full XAI breakdown for every prediction |
| Single-source data | 5 live data sources fused together |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION LAYER                          │
│  🌦 OpenWeatherMap  │  🚗 TomTom Traffic  │  🎪 PredictHQ Events │
│  📱 Bluesky Social  │  📷 YOLOv8 Camera   │                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │  Celery Workers (every 30-120s)
┌──────────────────────────────▼──────────────────────────────────┐
│                    PROCESSING LAYER                              │
│                                                                  │
│   PostgreSQL + PostGIS    ◄──►    Redis Cache                   │
│   (Persistent Storage)            (Real-time State)             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    INTELLIGENCE LAYER                            │
│                                                                  │
│         XGBoost ML Model  (19 features, R² = 0.96)             │
│         Risk Engine  →  Weighted Score  →  Alert Dispatcher     │
└──────────────────────────────┬──────────────────────────────────┘
                               │  WebSocket (Socket.IO)
┌──────────────────────────────▼──────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                                                                  │
│    Next.js 14 Dashboard  │  Leaflet Maps  │  Recharts Analytics  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI & Machine Learning
- **XGBoost Risk Model** — Trained on 5,000+ samples with **19 engineered features** (R² = 0.96)
- **YOLOv8 Computer Vision** — Real-time detection of persons, vehicles, crowds from live camera streams
- **Explainable AI (XAI)** — Every prediction comes with plain-English reasoning — no black box

### 📡 Real-time Data Fusion
| Source | Data | Update Frequency |
|---|---|---|
| 🌦 OpenWeatherMap | Temperature, rainfall, visibility, wind | Every 2 min |
| 🚗 TomTom Traffic API | Speed, congestion ratio, incidents | Every 90s |
| 🎪 PredictHQ Events | Crowd events, attendance, rank | Every 10 min |
| 📱 Bluesky Social | Risk keyword signals from public posts | Every 3 min |
| 📷 IP Webcam + YOLOv8 | Vehicle count, crowd density, detection | Live stream |

### 🗺️ Live Dashboard
- **Interactive Risk Map** — OpenStreetMap with real-time heatmap zones
- **3-column Command Console** — Risk gauge, live map, AI explanation panel
- **WebSocket Alerts** — Push notifications under 30 seconds from threshold breach
- **Analytics** — Risk trends, traffic charts, weather correlation graphs

### 🎥 Demo Analysis
- Upload any traffic video or image
- YOLOv8 processes it and returns annotated output
- Frame-by-frame risk score visualization

---

## 🔬 ML Model Details

```
Model:          XGBoost Regressor
Output:         Risk Score (0.0 → 1.0)
Training Data:  5,000 Indore-specific synthetic samples
MAE:            0.0198
RMSE:           0.0289  
R² Score:       0.9621

Top Features by Importance:
  congestion_ratio        ████████████████  28.4%
  rainfall_1h             ██████████        19.2%
  crowd_density           ████████          14.6%
  incident_count_norm     ██████            11.0%
  visibility_norm         █████              8.9%
  ... 14 more features
```

**Risk Thresholds:**
```
🔴 HIGH   → Score ≥ 0.70  (immediate action required)
🟠 MEDIUM → Score ≥ 0.40  (monitor closely)
🟢 SAFE   → Score < 0.40  (normal operations)
```

---

## 🛠️ Tech Stack

### Backend
```
FastAPI 0.111        — REST API + WebSocket server
PostgreSQL 15        — Primary database with PostGIS
Redis 7.2            — Cache + Celery message broker
Celery 5.3           — Background task scheduler
SQLAlchemy 2.0       — ORM with async support
XGBoost 2.0          — ML risk prediction model
Ultralytics YOLOv8   — Computer vision detection
OpenCV 4.9           — Video/image processing
```

### Frontend
```
Next.js 14          — App Router, TypeScript
TailwindCSS         — Utility-first styling
Framer Motion       — Smooth animations
React-Leaflet       — Interactive maps (OpenStreetMap)
Recharts            — Analytics charts
Socket.IO Client    — Real-time WebSocket updates
Zustand             — Global state management
```

### Infrastructure
```
Docker + Docker Compose  — Containerized services
PostGIS extension        — Geospatial queries
Redis Pub/Sub            — Alert broadcasting
```

---

## 🚀 Quick Start

### Prerequisites
```
Node.js 20+
Python 3.11
Redis (WSL or Memurai)
PostgreSQL 15
```

### 1. Clone Repository
```bash
git clone https://github.com/adityasinghr651/Prayatna3.0.git
cd Prayatna3.0
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env
# Fill your API keys in .env
python -m app.ml.train         # Train ML model
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# No API keys needed for frontend
```

### 4. Run Everything
```bash
# Terminal 1 — Backend
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Celery Worker
celery -A app.workers.celery_app worker --loglevel=info --pool=solo

# Terminal 3 — Celery Beat
celery -A app.workers.celery_app beat --loglevel=info

# Terminal 4 — Frontend
cd frontend && npm run dev
```

### 5. Open Platform
```
🌐 Dashboard:   http://localhost:3000
📖 API Docs:    http://localhost:8000/api/docs
```

Or double-click `start.bat` — everything starts automatically!

---

## 🔑 API Keys Required

| Service | Purpose | Get Key |
|---|---|---|
| OpenWeatherMap | Live weather data | [openweathermap.org/api](https://openweathermap.org/api) |
| TomTom | Traffic flow + incidents | [developer.tomtom.com](https://developer.tomtom.com) |
| PredictHQ | Crowd event data | [predicthq.com](https://www.predicthq.com) |
| Bluesky | Social signal monitoring | [bsky.app](https://bsky.app) (free account) |

---

## 📁 Project Structure

```
Prayatna3.0/
│
├── 📂 backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry + Socket.IO
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # PostgreSQL connection
│   │   ├── routes/              # 18 REST API endpoints
│   │   │   ├── risk.py          # Risk score APIs
│   │   │   ├── camera.py        # Camera stream APIs
│   │   │   ├── data.py          # Weather/Traffic/Events
│   │   │   ├── alerts.py        # Alert management
│   │   │   └── video_analysis.py# YOLOv8 upload demo
│   │   ├── services/            # Business logic
│   │   │   ├── weather_service.py
│   │   │   ├── traffic_service.py
│   │   │   ├── events_service.py
│   │   │   ├── social_service.py
│   │   │   └── risk_engine.py   # Core risk computation
│   │   ├── ml/                  # Machine Learning
│   │   │   ├── train.py         # XGBoost training
│   │   │   ├── predict.py       # Inference + XAI
│   │   │   └── features.py      # Feature engineering
│   │   ├── vision/              # Computer Vision
│   │   │   ├── detector.py      # YOLOv8 detection
│   │   │   └── stream_handler.py# IP camera handler
│   │   └── workers/             # Background tasks
│   │       ├── celery_app.py    # Celery config
│   │       ├── data_collector.py# Periodic API fetching
│   │       └── alert_dispatcher.py
│   └── requirements.txt
│
├── 📂 frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # Main dashboard
│   │   ├── cameras/             # Camera monitoring
│   │   ├── analytics/           # Charts & trends
│   │   ├── alerts/              # Alert management
│   │   └── demo/                # YOLOv8 demo upload
│   ├── components/
│   │   ├── ui/                  # Design system
│   │   ├── sidebar/             # Navigation
│   │   ├── navbar/              # Top bar
│   │   ├── map/                 # Leaflet heatmap
│   │   └── charts/              # Recharts components
│   └── lib/
│       ├── api.ts               # Backend API calls
│       ├── socket.ts            # WebSocket client
│       └── types.ts             # TypeScript types
│
├── 📂 docker/
│   ├── Dockerfile.backend
│   └── init.sql                 # DB schema auto-creation
│
├── docker-compose.yml           # 5-service orchestration
├── start.bat                    # One-click Windows launcher
└── README.md
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | System health check |
| GET | `/api/risk/current` | Live risk score + XAI |
| GET | `/api/risk/history?hours=24` | Risk trend data |
| GET | `/api/risk/heatmap` | Map heatmap data |
| GET | `/api/data/weather` | Latest weather reading |
| GET | `/api/data/traffic` | Latest traffic data |
| GET | `/api/data/events` | Today's crowd events |
| GET | `/api/alerts/active` | Active risk alerts |
| GET | `/api/camera/stream/{id}` | Live MJPEG stream |
| POST | `/api/video/analyze-image` | YOLOv8 image analysis |
| POST | `/api/video/analyze-video` | YOLOv8 video analysis |

> Full interactive docs: `http://localhost:8000/api/docs`

---

## 📸 Platform Screenshots

### 🏠 Landing Page
> Animated hero with live risk status, feature overview, and how-it-works flow

### 📊 Command Dashboard
> 3-column layout — Risk gauge · Live map heatmap · AI explanation panel

### 📹 Camera Monitoring
> Live YOLO detection feeds with person/vehicle counts and crowd density

### 📈 Analytics
> Risk trend charts, traffic congestion bars, weather-accident correlation

### 🚨 Alerts
> Real-time WebSocket alert feed with severity filtering and acknowledge actions

### 🎥 Demo Analysis
> Upload any traffic image/video — get YOLOv8 annotated output + risk score

---

## 👥 Team

| Role | Name |
|---|---|
| Backend + ML + CV | Aditya Singh |
| Frontend + UI/UX | Team Member 2 |

**Institution:** [Your College Name]
**Event:** Prayatna 3.0 Hackathon

---

## 🎖️ How We Address the Problem Statement

| Requirement | Our Implementation |
|---|---|
| ✅ Integrated framework | Single unified platform connecting 5 data sources |
| ✅ Real-time assessment | Risk recomputed every 60 seconds automatically |
| ✅ Multi-source data | Weather + Traffic + Events + Camera + Social |
| ✅ Proactive response | ML predicts risk BEFORE incidents, triggers alerts |
| ✅ Ethical governance | No facial recognition, anonymized data, explainable AI |
| ✅ Transparent predictions | XAI panel shows exact reasoning for every score |
| ✅ Dynamic risk tracking | Celery workers update continuously in background |

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ for Prayatna 3.0 · Indore, Madhya Pradesh**

<img src="https://img.shields.io/badge/🇮🇳-Made%20in%20India-FF9933?style=for-the-badge" />

*"Shifting urban safety from reactive to proactive — one prediction at a time."*

</div>
