# Urban Risk Platform — API Reference

Base URL: http://localhost:8000

## Risk Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/risk/current | Current risk for default zone |
| GET | /api/risk/latest | Instant Redis cache read |
| GET | /api/risk/history?hours=24 | Risk trend for charts |
| GET | /api/risk/heatmap | Deck.gl heatmap data |
| GET | /api/risk/scores | All zone scores |
| GET | /api/risk/explain/indore-center | XAI explanation |

## Data Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/data/weather?limit=1 | Latest weather |
| GET | /api/data/traffic?limit=1 | Latest traffic |
| GET | /api/data/events | Today's crowd events |
| GET | /api/data/social | Social signal summary |
| GET | /api/data/analytics/traffic-weather | Correlation data |

## Camera Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/camera/stream/cam-01 | MJPEG live stream |
| GET | /api/camera/list | All cameras + stats |
| GET | /api/camera/stats/cam-01 | Single camera stats |
| GET | /api/camera/snapshot/cam-01 | Single JPEG frame |

## Alert Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/alerts/active | All active alerts |
| GET | /api/alerts/history?hours=24 | Alert history |
| GET | /api/alerts/stats | Count by severity |
| PATCH | /api/alerts/acknowledge/{id} | Mark acknowledged |
| PATCH | /api/alerts/resolve/{id} | Mark resolved |

## WebSocket Events
Connect to: ws://localhost:8000/socket.io

| Event | Direction | Payload |
|-------|-----------|---------|
| welcome | server→client | Connection confirmation |
| new_alert | server→client | Alert object when risk threshold crossed |

## Swagger UI
http://localhost:8000/api/docs