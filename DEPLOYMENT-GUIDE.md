# Construction Welcome App — Deployment Guidelines

This document is a step-by-step reference for deploying the Node.js welcome app with **Docker** and **Kubernetes**. Use it alongside this project folder (`files (1)`).

---

## Table of contents

1. [Overview](#1-overview)
2. [Folder structure](#2-folder-structure)
3. [Prerequisites](#3-prerequisites)
4. [Docker only (no Kubernetes)](#4-docker-only-no-kubernetes)
5. [Kubernetes — first-time setup](#5-kubernetes--first-time-setup)
6. [Build image and deploy to the cluster](#6-build-image-and-deploy-to-the-cluster)
7. [Open the app in a browser](#7-open-the-app-in-a-browser)
8. [Day-to-day commands](#8-day-to-day-commands)
9. [Scale replicas](#9-scale-replicas)
10. [Update after a new image](#10-update-after-a-new-image)
11. [Cleanup](#11-cleanup)
12. [What to learn or build next](#12-what-to-learn-or-build-next)
13. [Troubleshooting](#13-troubleshooting)
14. [Legacy ConfigMap (optional)](#14-legacy-configmap-optional)

---

## 1. Overview

| Component | Detail |
|-----------|--------|
| **App** | Node.js 20 + Express — welcome HTML on `/`, `/health` for probes |
| **Container port** | `3000` |
| **Kubernetes image** | `construction-node-app:1.0` (local build; `imagePullPolicy: IfNotPresent`) |
| **Service** | `construction-app-svc` — service port `80` → pod port `3000`, **NodePort `30080`** |
| **Deployment** | `construction-app` — label `app: construction-mgmt` |

---

## 2. Folder structure

```text
.
├── app/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js          # Express server + welcome page
├── Dockerfile             # Image: construction-node-app:1.0
├── .dockerignore
├── deployment.yaml        # Deployment + probes
├── service.yaml           # NodePort service
├── configmap.yaml         # Legacy nginx demo (not wired to this Node flow)
└── DEPLOYMENT-GUIDE.md    # This file
```

---

## 3. Prerequisites

- **Docker Desktop** installed and **running** (whale icon stable in the menu bar).
- **Kubernetes** (Docker Desktop): *Settings → Kubernetes → Enable Kubernetes*. Until the cluster is running, `kubectl` will not reach an API server.
- **kubectl** (usually bundled with Docker Desktop).
- From a terminal, go to the project folder:

  ```bash
  cd "/Users/apple/Downloads/files (1)"
  ```

---

## 4. Docker only (no Kubernetes)

Build the image:

```bash
docker build -t construction-node-app:1.0 .
```

Run a container:

```bash
docker run --rm -d --name construction-welcome -p 3000:3000 construction-node-app:1.0
```

- App: **http://localhost:3000**
- Health: **http://localhost:3000/health** → `ok`

Stop:

```bash
docker stop construction-welcome
```

---

## 5. Kubernetes — first-time setup

1. Open Docker Desktop, **enable Kubernetes**, and wait until it is fully ready.
2. Check context:

   ```bash
   kubectl config get-contexts
   ```

   Your active context (e.g. `docker-desktop`) should be marked **CURRENT**.

3. Verify the cluster:

   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

---

## 6. Build image and deploy to the cluster

**Docker Desktop’s Kubernetes** can use images from the same machine’s Docker engine — build the image first, then apply the YAML.

```bash
cd "/Users/apple/Downloads/files (1)"

docker build -t construction-node-app:1.0 .

kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

Check status:

```bash
kubectl rollout status deployment/construction-app
kubectl get pods,svc -l app=construction-mgmt
```

You should see the pod **READY 1/1** and **Running**.

---

## 7. Open the app in a browser

### Option A — Port forward (recommended, especially on Docker Desktop)

In a terminal:

```bash
kubectl port-forward svc/construction-app-svc 8080:80
```

Open **http://localhost:8080** in your browser.

Press `Ctrl+C` in that terminal to stop forwarding.

### Option B — NodePort

The Service maps **NodePort `30080`**. The exact URL depends on your environment (node IP + `:30080`). On Docker Desktop, NodePort can be awkward; **Option A** is more reliable.

---

## 8. Day-to-day commands

| Task | Command |
|------|---------|
| List pods | `kubectl get pods -l app=construction-mgmt` |
| Logs (follow) | `kubectl logs -f deployment/construction-app` |
| Describe (debug) | `kubectl describe pod -l app=construction-mgmt` |
| Service | `kubectl get svc construction-app-svc` |
| Deployment detail | `kubectl describe deployment construction-app` |

---

## 9. Scale replicas

```bash
kubectl scale deployment construction-app --replicas=2
kubectl get pods -l app=construction-mgmt
```

To make it permanent, edit `spec.replicas` in `deployment.yaml` and run `kubectl apply -f deployment.yaml` again.

---

## 10. Update after a new image

1. Change the code, then build with a **new tag** (good practice):

   ```bash
   docker build -t construction-node-app:1.1 .
   ```

2. Set `image: construction-node-app:1.1` in `deployment.yaml`, then:

   ```bash
   kubectl apply -f deployment.yaml
   kubectl rollout status deployment/construction-app
   ```

   If you keep the same tag, rebuild the image and recycle pods:

   ```bash
   kubectl rollout restart deployment/construction-app
   ```

---

## 11. Cleanup

```bash
kubectl delete -f service.yaml --ignore-not-found
kubectl delete -f deployment.yaml --ignore-not-found
```

If you used the local Docker-only container:

```bash
docker rm -f construction-welcome 2>/dev/null
```

---

## 12. What to learn or build next

Roadmap for production or deeper learning:

1. **Registry** — Push to Docker Hub / GHCR; use a full image name in the Deployment, e.g. `docker.io/username/construction-node-app:1.0`.
2. **Secrets / ConfigMap** — DB URLs, API keys; avoid hardcoding in the image.
3. **Namespace** — `kubectl create namespace construction` and set `metadata.namespace` in manifests.
4. **Ingress + TLS** — Public hostname + HTTPS (e.g. cert-manager + Let’s Encrypt).
5. **CI/CD** — GitHub Actions: build → push → deploy (or Argo CD).
6. **Resource limits** — Tune `resources` in `deployment.yaml` for your workload.
7. **Monitoring** — Centralised logs; optional Prometheus/Grafana.

---

## 13. Troubleshooting

| Issue | What to check |
|--------|----------------|
| `ImagePullBackOff` / image not found | Run `docker build -t construction-node-app:1.0 .` locally first; on a remote cluster, push to a registry and use the correct image reference. |
| `CrashLoopBackOff` | `kubectl logs deployment/construction-app` — confirm the app listens on port `3000` and `/health` returns HTTP 200. |
| `connection refused` from `kubectl` | Kubernetes not enabled or wrong context: `kubectl config use-context docker-desktop`. |
| Port forward fails | Another process may be using the local port; try another port: `kubectl port-forward svc/construction-app-svc 9090:80`. |
| Pod stays `Pending` | `kubectl describe pod ...` — check resources and cluster capacity. |

---

## 14. Legacy ConfigMap (optional)

There was an older nginx + `configmap.yaml` demo. The current Node Deployment **does not mount** that ConfigMap. To remove the old ConfigMap from the cluster:

```bash
kubectl delete configmap construction-app-html --ignore-not-found
```

---

## Quick reference (copy-paste)

```bash
cd "/Users/apple/Downloads/files (1)"
docker build -t construction-node-app:1.0 .
kubectl apply -f deployment.yaml -f service.yaml
kubectl get pods,svc -l app=construction-mgmt
kubectl port-forward svc/construction-app-svc 8080:80
```

Then open **http://localhost:8080**.

---

*Last updated: aligned with `deployment.yaml`, `service.yaml`, and `Dockerfile` in this folder.*
