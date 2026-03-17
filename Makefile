# ══════════════════════════════════════════════
# Urban Risk Intelligence Platform — Makefile
# ══════════════════════════════════════════════

.PHONY: help up down restart logs ps \
        backend-shell db-shell redis-shell \
        train-model test-apis test-camera test-ml \
        clean reset

# ── Show help ─────────────────────────────────
help:
	@echo ""
	@echo "  Urban Risk Platform — Available Commands"
	@echo "  ──────────────────────────────────────────"
	@echo "  make up           Start all services"
	@echo "  make down         Stop all services"
	@echo "  make restart      Restart all services"
	@echo "  make logs         Tail all logs"
	@echo "  make ps           Show service status"
	@echo ""
	@echo "  make backend-logs  Tail backend only"
	@echo "  make worker-logs   Tail worker only"
	@echo "  make backend-shell Open shell in backend"
	@echo "  make db-shell      Open PostgreSQL shell"
	@echo "  make redis-shell   Open Redis CLI"
	@echo ""
	@echo "  make train-model   Train XGBoost model"
	@echo "  make test-apis     Test all 4 API keys"
	@echo "  make test-camera   Test phone camera"
	@echo "  make test-ml       Test ML prediction"
	@echo ""
	@echo "  make clean         Remove containers + images"
	@echo "  make reset         Full reset (deletes DB data)"
	@echo ""

# ── Start / Stop ──────────────────────────────
up:
	docker compose up -d
	@echo "✓ All services started."
	@echo "  Backend:  http://localhost:8000/api/docs"
	@echo "  Flower:   http://localhost:5555"

down:
	docker compose down

restart:
	docker compose down
	docker compose up -d

# ── Logs ──────────────────────────────────────
logs:
	docker compose logs -f

backend-logs:
	docker compose logs -f backend

worker-logs:
	docker compose logs -f worker

beat-logs:
	docker compose logs -f beat

# ── Status ────────────────────────────────────
ps:
	docker compose ps

# ── Shells ────────────────────────────────────
backend-shell:
	docker compose exec backend bash

db-shell:
	docker compose exec postgres psql -U postgres -d urbanrisk

redis-shell:
	docker compose exec redis redis-cli

# ── ML + Testing ──────────────────────────────
train-model:
	cd backend && venv\Scripts\activate && python -m app.ml.train

test-apis:
	cd backend && venv\Scripts\activate && python test_apis.py

test-camera:
	cd backend && venv\Scripts\activate && python test_camera.py

test-ml:
	cd backend && venv\Scripts\activate && python test_ml.py

# ── Cleanup ───────────────────────────────────
clean:
	docker compose down --rmi local

reset:
	docker compose down -v
	@echo "⚠️  All volumes deleted. Run 'make up' to start fresh."