#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Maha AI OS Deployment Script${NC}\n"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Configuration
NAMESPACE=${NAMESPACE:-maha}
ENVIRONMENT=${ENVIRONMENT:-production}
TAG=${TAG:-latest}

echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}Namespace: ${NAMESPACE}${NC}"
echo -e "${GREEN}Image Tag: ${TAG}${NC}\n"

# Build and push images
echo -e "${BLUE}Building Docker images...${NC}"
docker build -t maha/backend:${TAG} -f Dockerfile.backend .
docker build -t maha/frontend:${TAG} -f Dockerfile.frontend ./frontend

echo -e "${GREEN}✓ Images built successfully${NC}\n"

# Apply Kubernetes manifests
echo -e "${BLUE}Applying Kubernetes manifests...${NC}"

# Create namespace if not exists
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml -n ${NAMESPACE}

# Apply Secrets (if exists)
if [ -f k8s/secrets.yaml ]; then
    kubectl apply -f k8s/secrets.yaml -n ${NAMESPACE}
fi

# Apply Deployments
kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}
kubectl apply -f k8s/worker-deployment.yaml -n ${NAMESPACE}
kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
kubectl apply -f k8s/redis-deployment.yaml -n ${NAMESPACE}

# Apply Services
kubectl apply -f k8s/services.yaml -n ${NAMESPACE}

# Apply Ingress (if exists)
if [ -f k8s/ingress.yaml ]; then
    kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}
fi

# Apply HPA
kubectl apply -f k8s/hpa.yaml -n ${NAMESPACE}

echo -e "${GREEN}✓ Kubernetes manifests applied${NC}\n"

# Wait for deployments
echo -e "${BLUE}Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/maha-backend -n ${NAMESPACE} --timeout=300s
kubectl rollout status deployment/maha-frontend -n ${NAMESPACE} --timeout=300s
kubectl rollout status deployment/maha-worker -n ${NAMESPACE} --timeout=300s

echo -e "${GREEN}✓ All deployments are ready${NC}\n"

# Show status
echo -e "${BLUE}Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}

echo -e "\n${GREEN}🎉 Maha AI OS deployed successfully!${NC}"
echo -e "${BLUE}Access the application at:${NC}"
kubectl get ingress maha-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}'
echo ""