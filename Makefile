.PHONY: up down logs seed seed-users test build clean shell migrate kafka-topics

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

seed:
	docker compose run --rm api python scripts/seed_demo.py

seed-users:
	docker compose run --rm api python scripts/seed_users.py

kafka-topics:
	docker compose run --rm api python scripts/create_kafka_topics.py

test:
	docker compose run --rm api pytest tests/ -v

migrate:
	docker compose run --rm api alembic upgrade head

shell:
	docker compose run --rm api bash

clean:
	docker compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
