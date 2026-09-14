# Secure SSH Access — Developer Guide

> EN + RU · target: GCP Compute Engine (evabot-agent-vm, evaline-micro-vm) · project: evabot-agent-server

---

## EN — Overview

All SSH access to EvaLine GCP VMs is now secured via three layers:

```
Developer Google Account
       │
       ▼   IAM: roles/compute.osLogin / osAdminLogin
       │
       ▼   Google IAP TCP Forwarding  (tunnel, no public port 22)
       │
       ▼   OS Login on VM (auto-generates temp SSH key)
       │
       ▼   Firewall: allow-iap-ssh (source 35.235.240.0/20 only)
```

- **No public port 22 exposure** — firewall only allows IAP IP range
- **No manual SSH keys** — access is identity-based via IAM
- **Per-user audit trail** — who connected is logged in Cloud Audit Logs

---

## EN — Usage

### Method 1: gcloud compute ssh (Recommended)

```bash
# Authenticate with your Google account
gcloud auth login

# Connect to any VM (IAP tunnel used automatically)
gcloud compute ssh evabot@evabot-agent-vm --zone=europe-west3-a
gcloud compute ssh evabot@evaline-micro-vm  --zone=us-central1-a
```

### Method 2: IAP tunnel + any SSH client (PuTTY, OpenSSH, Termius)

If you need to use a third-party client (PuTTY, Termius, etc.):

```bash
# 1. Start an IAP tunnel on a local port (e.g. 2222)
gcloud compute start-iap-tunnel evabot-agent-vm \
  --local-host-port=localhost:2222 \
  --zone=europe-west3-a

# 2. In another terminal, SSH into the local tunnel port
ssh -i ~/.ssh/google_compute_engine evabot@localhost -p 2222
# Or use password if enabled on the VM
ssh evabot@localhost -p 2222
```

### Method 3: OS Login user mapping

When you connect via IAM, Google maps your email to a POSIX username:

| Google Account | OS Login Username |
|---|---|
| `evabot.online@gmail.com` | `evabot_online_gmail_com` |
| `olegzai.server@gmail.com` | `olegzai_server_gmail_com` |

To get sudo: `sudo -i` (requires `osAdminLogin` role).

---

## EN — How access is granted/revoked

### Grant access to a new developer

```bash
# Standard SSH access (no root)
gcloud projects add-iam-policy-binding evabot-agent-server \
  --member="user:developer@gmail.com" \
  --role="roles/compute.osLogin"

# Admin SSH access (root via sudo)
gcloud projects add-iam-policy-binding evabot-agent-server \
  --member="user:admin@gmail.com" \
  --role="roles/compute.osAdminLogin"
```

### Revoke access

```bash
gcloud projects remove-iam-policy-binding evabot-agent-server \
  --member="user:developer@gmail.com" \
  --role="roles/compute.osLogin"
```

### Service accounts (for automation)

```bash
gcloud projects add-iam-policy-binding evabot-agent-server \
  --member="serviceAccount:my-sa@evabot-agent-server.iam.gserviceaccount.com" \
  --role="roles/compute.osLogin"
```

---

## EN — Firewall details

```bash
# Only IAP range (35.235.240.0/20) can reach port 22
gcloud compute firewall-rules describe allow-iap-ssh

# Both VMs have the 'allow-iap-ssh' network tag
gcloud compute instances describe evabot-agent-vm   --zone=europe-west3-a  --format="table(name,tags)"
gcloud compute instances describe evaline-micro-vm  --zone=us-central1-a   --format="table(name,tags)"
```

---

## RU — Обзор

Все SSH-подключения к GCP VMs теперь защищены трёхслойной системой:

```
Google Аккаунт Разработчика
       │
       ▼   IAM: roles/compute.osLogin / osAdminLogin
       │
       ▼   Google IAP TCP Forwarding  (тunnel, нет публичного порта 22)
       │
       ▼   OS Login на VM (автоматически генерирует временный ключ)
       │
       ▼   Firewall: allow-iap-ssh (только IP 35.235.240.0/20)
```

- **Нет публичного порта 22** — firewall пропускает только IAP-диапазон
- **Нет ручных SSH-ключей** — доступ через IAM
- **Аудит по пользователю** — в Cloud Audit Logs видно кто подключался

---

## RU — Использование

### Способ 1: gcloud compute ssh (рекомендуется)

```bash
gcloud auth login                       # вход через Google аккаунт
gcloud compute ssh evabot@evabot-agent-vm --zone=europe-west3-a
gcloud compute ssh evabot@evaline-micro-vm  --zone=us-central1-a
```

### Способ 2: IAP tunnel + любой SSH-клиент

```bash
# 1. Запускаем IAP tunnel на локальном порту 2222
gcloud compute start-iap-tunnel evabot-agent-vm \
  --local-host-port=localhost:2222 \
  --zone=europe-west3-a

# 2. Подключаемся из другого терминала
ssh -i ~/.ssh/google_compute_engine evabot@localhost -p 2222
```

### Способ 3: Пароль (опционально)

Для прямого ввода пароля (PuTTY, Termius) можно включить на VM:

```bash
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/ChallengeResponseAuthentication no/ChallengeResponseAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
sudo passwd evabot
```

---

## RU — Управление доступом

### Добавить разработчика

```bash
# Обычный доступ (без root)
gcloud projects add-iam-policy-binding evabot-agent-server \
  --member="user:developer@gmail.com" \
  --role="roles/compute.osLogin"

# Админский доступ (с root)
gcloud projects add-iam-policy-binding evabot-agent-server \
  --member="user:admin@gmail.com" \
  --role="roles/compute.osAdminLogin"
```

### Удалить доступ

```bash
gcloud projects remove-iam-policy-binding evabot-agent-server \
  --member="user:developer@gmail.com" \
  --role="roles/compute.osLogin"
```

---

## RU — Firewall детали

Правило `allow-iap-ssh` пропускает SSH только из Google IAP диапазона `35.235.240.0/20`. Публичный интернет не может подключиться к порту 22 напрямую.

**Last verified:** 2026-09-09 — `gcloud compute ssh evabot@evabot-agent-vm` → `SSH OK`
