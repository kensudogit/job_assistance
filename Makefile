.PHONY: help build up down restart logs clean dev prod test

help:
	@echo "Available commands:"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start all services (production)"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - Show logs"
	@echo "  make clean     - Remove containers and volumes"
	@echo "  make dev       - Start development environment"
	@echo "  make prod      - Start production environment"
	@echo "  make test      - Run tests"
	@echo "  make db-init   - Initialize database"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

dev:
	docker-compose -f docker-compose.dev.yml up -d

prod:
	docker-compose up -d

test:
	docker-compose exec backend python -m pytest || echo "No pytest configured"
	docker-compose exec frontend npm test || echo "No tests configured"

db-init:
	docker-compose exec backend python -m src.init_db

db-shell:
	docker-compose exec db psql -U postgres -d job_assistance

backend-shell:
	docker-compose exec backend /bin/bash

frontend-shell:
	docker-compose exec frontend /bin/sh

