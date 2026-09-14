# Google Cloud Infrastructure Audit & Diagnostics Report

**Date:** September 3, 2026  
**Account:** `evabot.online@gmail.com`  
**GCP Project:** `evabot-agent-server` (Project Number: `873069440066`)  
**Pricing Standards:** Strictly USD ($) / EUR (€)  

---

## 1. Executive Summary

A comprehensive diagnostic check was performed on the Google Cloud project `evabot-agent-server`. The infrastructure consists of two running compute engine instances:
1. **`evabot-agent-vm`** in Frankfurt (`europe-west3-a`) — Heavy-duty compute node (`c3-standard-8`, 32 GB DDR5 RAM, 100 GB NVMe).
2. **`evaline-micro-vm`** in Iowa (`us-central1-a`) — Web frontend and domain gateway (`e2-micro`, 1 GB RAM + 2 GB Swap, 20 GB Disk), running Caddy web server and hosting multiple web domains including `evabot.online`.

The existing `/var/www/evabot.online` implementation was verified to be a mock demonstration without genuine Gemini LLM connectivity or conversational capabilities. The previous files have been archived remotely (`/var/www/evabot.online_pre_gemini_backup_20260903_150219.tar.gz`) and locally (`legacy_archive/evabot_v001_initial_snapshot.tar.gz`).

---

## 2. Server Inventory & Resource Analysis

### 2.1 Server 1: `evabot-agent-vm` (Frankfurt Compute Node)
- **Zone:** `europe-west3-a`
- **Machine Type:** `c3-standard-8` (8 vCPUs Sapphire Rapids, 32 GB DDR5 RAM)
- **External IP:** `34.179.253.183`
- **Internal VPC IP:** `10.156.0.2`
- **Disks:**
  - `persistent-disk-0`: 50 GB Boot NVMe (`/`)
  - `persistent-disk-1`: 50 GB Attached NVMe (`/data`)
- **Operating System:** Debian 12 (Bookworm), Linux kernel 6.1
- **Active Services:** Nginx, Code-Server (`code-server@evabot.service`), Tailscale, SSH daemon
- **Resource Utilization:** CPU load 0.00, Free RAM ~30 GB.

### 2.2 Server 2: `evaline-micro-vm` (Iowa Edge & Web Gateway)
- **Zone:** `us-central1-a`
- **Machine Type:** `e2-micro` (2 vCPUs burstable, 1 GB RAM, 2 GB Swap enabled)
- **External IP:** `136.114.26.252`
- **Internal VPC IP:** `10.128.0.2`
- **Disks:**
  - `persistent-disk-0`: 20 GB SCSI (`/`, 3.9 GB used, 15 GB free)
- **Operating System:** Debian 12 (Bookworm), Linux kernel 6.12
- **Runtimes Installed:** Node.js v20.20.2, npm 10.8.2, Git 2.47.3, Python 3.11, Caddy web server
- **Active Services:**
  - Caddy Web Server (ports 80 and 443 with automated Let's Encrypt TLS)
  - TigerVNC (`Xtigervnc` on port 5901 with XFCE4 desktop)
  - Tailscale node agent
  - SSH daemon, systemd
- **Web Domains Configured in Caddy:**
  - `evabot.online` & `www.evabot.online` (serves `/var/www/evabot.online`)
  - `evaline.website` & `www.evaline.website` (serves `/var/www/evaline.website`)
  - `evaline.online` & `www.evaline.online` (serves `/var/www/evaline.online`)
  - `evaline.network` & `www.evaline.network` (serves `/var/www/evaline.network`)

---

## 3. EvaBot Legacy Codebase Analysis

The `/var/www/evabot.online` directory contained an initial prototype (`v0.0.1`):
1. **Mock Responses:** Generated pre-scripted dummy text rather than calling Google Gemini models.
2. **Fixed Canvas:** A 3D wireframe mesh canvas and simulated telemetry metrics.
3. **Missing Real LLM Features:** Lacked real streaming client, model switching, and conversation memory.
4. **Archiving & Safety:**
   - Server backup: `/var/www/evabot.online_pre_gemini_backup_20260903_150219.tar.gz`
   - Local snapshot: `legacy_archive/evabot_v001_initial_snapshot.tar.gz`

---

## 4. Architectural Roadmap for New Modular Chat

1. **Dual Execution Environment:**
   - Works both in any terminal (CLI REPL & CLI arguments) and modern web browsers.
2. **Google AI Pro / Gemini API Integration:**
   - Multi-model selection: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro`.
   - Real-time streaming tokens via SSE / ReadableStream.
3. **Lightweight Daemon for Microserver:**
   - Memory footprint under 40 MB RAM.
   - Caddy reverse proxy integration (`/api/*` to backend daemon).
4. **Testing & Logging:**
   - Automated tests (`npm test`) and structured logging with file and console outputs.
