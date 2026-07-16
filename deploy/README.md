# Deployment

Reference container/K8s manifests for self-hosting the Maha stack outside Lovable.

- `docker/` — docker-compose stack (backend, frontend, redis, worker, optional postgres) plus Dockerfiles and nginx config.
- `k8s/` — Kubernetes manifests (namespace, configmap, secrets, backend/frontend/worker deployments). Apply in filename order.

These are not used by the Lovable preview (which runs TanStack Start directly). Edit secrets before applying.
## Usage

```bash
make dev              # Local dev via docker-compose
make test             # Run tests
make build            # Build images
make deploy           # Deploy to Kubernetes
make logs-backend     # Tail backend logs
make scale REPLICAS=5 # Scale backend
```
