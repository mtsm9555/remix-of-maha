.PHONY: help dev build deploy test clean

# Variables
IMAGE_BACKEND=maha/backend
IMAGE_FRONTEND=maha/frontend
TAG=latest
NAMESPACE=maha

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment with Docker Compose
	docker-compose up -d
	@echo "✅ Development environment started"
	@echo "   Frontend: http://localhost"
	@echo "   Backend: http://localhost:3000"
	@echo "   Redis: localhost:6379"

dev-stop: ## Stop development environment
	docker-compose down
	@echo "✅ Development environment stopped"

build: ## Build Docker images
	docker build -t $(IMAGE_BACKEND):$(TAG) -f Dockerfile.backend .
	docker build -t $(IMAGE_FRONTEND):$(TAG) -f Dockerfile.frontend ./frontend
	@echo "✅ Images built: $(IMAGE_BACKEND):$(TAG), $(IMAGE_FRONTEND):$(TAG)"

test: ## Run tests
	bun test

test-coverage: ## Run tests with coverage
	bun test:coverage

deploy: ## Deploy to Kubernetes cluster
	@./scripts/deploy.sh

deploy-staging: ## Deploy to staging
	ENVIRONMENT=staging ./scripts/deploy.sh

logs-backend: ## View backend logs
	kubectl logs -n $(NAMESPACE) -l app=maha-backend -f

logs-worker: ## View worker logs
	kubectl logs -n $(NAMESPACE) -l app=maha-worker -f

logs-frontend: ## View frontend logs
	kubectl logs -n $(NAMESPACE) -l app=maha-frontend -f

scale: ## Scale backend replicas (usage: make scale REPLICAS=5)
	kubectl scale deployment maha-backend -n $(NAMESPACE) --replicas=$(REPLICAS)

restart: ## Restart all deployments
	kubectl rollout restart deployment/maha-backend -n $(NAMESPACE)
	kubectl rollout restart deployment/maha-worker -n $(NAMESPACE)
	kubectl rollout restart deployment/maha-frontend -n $(NAMESPACE)

clean: ## Remove all Docker containers and images
	docker-compose down -v
	docker system prune -af
	@echo "✅ Cleanup complete"