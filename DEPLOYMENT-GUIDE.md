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
15. [Deploying on a Linux server](#15-deploying-on-a-linux-server)

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
| `connection refused` from `kubectl` | Kubernetes not enabled or wrong context: `kubectl config use-context docker-desktop` (Docker Desktop). On Linux, set `KUBECONFIG` to your cluster config (e.g. K3s `~/.kube/config` copied from `/etc/rancher/k3s/k3s.yaml`). |
| Port forward fails | Another process may be using the local port; try another port: `kubectl port-forward svc/construction-app-svc 9090:80`. |
| Pod stays `Pending` | `kubectl describe pod ...` — check resources and cluster capacity. |
| **K3s / MicroK8s:** `ImagePullBackOff` for local image name | The cluster uses containerd, not Docker’s image store. After `docker build`, import the image — see **section 15.4 Path A** (K3s) or **Path B** (MicroK8s). |

---

## 14. Legacy ConfigMap (optional)

There was an older nginx + `configmap.yaml` demo. The current Node Deployment **does not mount** that ConfigMap. To remove the old ConfigMap from the cluster:

```bash
kubectl delete configmap construction-app-html --ignore-not-found
```

---

## 15. Deploying on a Linux server

Examples below use **Ubuntu 22.04/24.04 LTS** (`apt`). On **RHEL / Rocky / Fedora**, use `dnf` and [Docker’s RHEL install docs](https://docs.docker.com/engine/install/rhel/) instead of `apt`.

### 15.1 Get the project onto the server

**Option A — Git clone (after you pushed to GitHub):**

```bash
sudo apt update && sudo apt install -y git
git clone https://github.com/ashararsi/Kubernetes.git
cd Kubernetes
```

**Option B — Copy the folder** with `scp` / `rsync` from your laptop:

```bash
# from your laptop (example)
rsync -avz --exclude 'node_modules' "./files (1)/" user@YOUR_SERVER_IP:~/Kubernetes/
ssh user@YOUR_SERVER_IP
cd ~/Kubernetes
```

---

### 15.2 Install Docker Engine (Linux)

Official repo (recommended):

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME:-$VERSION_ID}") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Add your user to the `docker` group (avoids typing `sudo docker` every time):

```bash
sudo usermod -aG docker "$USER"
```

Log out and SSH back in (or run `newgrp docker`), then verify:

```bash
docker run --rm hello-world
```

---

### 15.3 Run the app with Docker only (no Kubernetes)

From the project directory (where the `Dockerfile` is):

```bash
docker build -t construction-node-app:1.0 .
docker run --rm -d --name construction-welcome -p 3000:3000 construction-node-app:1.0
```

Open **http://SERVER_PUBLIC_IP:3000** from another machine only if the firewall allows it.

**UFW example (Ubuntu firewall):**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp comment 'construction-welcome-app'
sudo ufw enable   # if not already enabled
sudo ufw status
```

---

### 15.4 Kubernetes on Linux — pick one path

Docker Desktop does not exist on a typical Linux VPS. You either install a **lightweight cluster on the same machine** or use a **managed cluster** (EKS, GKE, AKS, etc.) and `kubectl` from the server or your laptop.

#### Path A — **K3s** (single server, common for VPS)

Install:

```bash
curl -sfL https://get.k3s.io | sh -
sudo systemctl status k3s
```

Use `kubectl` as the k3s user:

```bash
sudo mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown "$USER:$USER" ~/.kube/config
export KUBECONFIG=~/.kube/config
kubectl get nodes
```

K3s uses **containerd**, not the Docker daemon, so it **does not** see images you built with `docker build` until you import them:

```bash
cd ~/Kubernetes   # or your clone path
docker build -t construction-node-app:1.0 .
docker save construction-node-app:1.0 | sudo k3s ctr images import -
kubectl apply -f deployment.yaml -f service.yaml
kubectl get pods,svc -l app=construction-mgmt
```

**NodePort from outside:** this repo’s Service uses **30080**. Open the port and browse `http://SERVER_IP:30080`.

```bash
sudo ufw allow 30080/tcp comment 'k8s NodePort construction-app'
```

**Port-forward over SSH** (no public NodePort needed):

```bash
# on laptop
ssh -L 8080:127.0.0.1:8080 user@SERVER_IP
# on server
kubectl port-forward svc/construction-app-svc 8080:80
```

Then on the laptop: **http://localhost:8080**

#### Path B — **MicroK8s** (Snap)

```bash
sudo snap install microk8s --classic
sudo usermod -aG microk8s "$USER"
# log out / in, then:
microk8s status --wait-ready
alias kubectl='microk8s kubectl'
```

Import a Docker-built image, then apply manifests (same idea as K3s):

```bash
docker build -t construction-node-app:1.0 .
docker save construction-node-app:1.0 | microk8s ctr image import -
kubectl apply -f deployment.yaml -f service.yaml
```

#### Path C — **Minikube** on Linux

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube start --driver=docker
eval $(minikube docker-env)
docker build -t construction-node-app:1.0 .
kubectl apply -f deployment.yaml -f service.yaml
minikube service construction-app-svc --url
```

#### Path D — **Remote / cloud cluster only**

Build on the server (or in CI), **push** the image to a registry (Docker Hub, GHCR, ECR, etc.), set `deployment.yaml` `image:` to that full name, and run `kubectl apply` from anywhere that has kubeconfig for that cluster. The cluster nodes pull the image from the registry — no `docker save` import needed.

---

### 15.5 Install `kubectl` on Linux (standalone)

If you only have kubeconfig for a remote cluster:

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

Copy `~/.kube/config` from another machine or use your cloud provider’s CLI to fetch credentials.

---

### 15.6 Linux quick checklist

| Step | Action |
|------|--------|
| 1 | Install Docker (or use a cluster that can pull from a registry). |
| 2 | Clone or copy this repo; `cd` into it. |
| 3 | **Docker only:** `docker build` → `docker run -p 3000:3000` → open firewall for `3000`. |
| 4 | **K3s / MicroK8s:** `docker build` → **import image** into the runtime → `kubectl apply`. |
| 5 | **NodePort 30080:** open in cloud security group + `ufw` if used. |
| 6 | Prefer **HTTPS + domain** in production (Ingress + reverse proxy or managed LB), not raw NodePort on the public internet. |

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
