# EvaBot Online — Quick Start

**Version:** v0.1.0
**Date:** 2026-09-07

---

## 🌐 Адреса для подключения

### Internal GCP (для server-to-server):
- **Backend API:** `http://10.156.0.2:3000`
- **Tailscale mesh:** `http://100.66.98.4:3000` (GARAНТИРОВАННО работает)
- **Internal IP:** `127.0.0.1:3000` (localhost)

### Public (для внешних клиентов):
- **Backend API:** `http://34.159.202.82:3000` — Frankfurt
- **Edge Gateway (Iowa):** `http://136.114.26.252:443` (Caddy)
- **Domains (когда настроен DNS):**
  - https://evabot.online
  - https://evaline.online
  - https://evaline.network
  - https://evaline.website

> ⚠️ **NOTE:** Если `curl http://34.159.202.82:3000/` с самой VM возвращает timeout — это **нормально** (GCP anti-spoofing). С внешних клиентов должно работать.

---

## 🧪 Как проверить работоспособность

### 1. Health check:
```bash
curl http://100.66.98.4:3000/api/health
```
Ответ (если работает):
```json
{
  "status": "online",
  "version": "v0.1.0",
  "server": "evabot-online-edge",
  "uptimeSeconds": 856,
  "plugins": {
    "loaded": 3,
    "active": 3,
    "list": [
      {"id": "llm-providers", "name": "LLM Multi-Provider Gateway"},
      {"id": "consilium", "name": "Consilium Multi-Agent Engine"},
      {"id": "knowledge-base", "name": "EvaLine Knowledge Base"}
    ]
  }
}
```

### 2. Visualizer (в браузере):
```
http://34.159.202.82:3000/visualize.html
http://100.66.98.4:3000/visualize.html
```

### 3. Test chat (отправить сообщение):
```bash
curl -X POST http://100.66.98.4:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Привет, EvaBot!","model":"gemini-2.5-flash"}'
```

### 4. Test knowledge base:
```bash
curl "http://100.66.98.4:3000/api/kb/search?q=EVA%20sheets&limit=3"
```

### 5. Test consilium (multi-agent):
```bash
curl -X POST http://100.66.98.4:3000/api/consilium \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "broadcast",
    "prompt": "Что такое EVA?",
    "models": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
  }'
```

---

## 🔌 Все Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/health` | GET | Статус сервера и плагинов |
| `/api/plugins` | GET | Список плагинов |
| `/api/plugins/:id` | GET | Информация о плагине |
| `/api/plugins/:id/enable` | POST | Включить плагин |
| `/api/plugins/:id/disable` | POST | Выключить плагин |
| `/api/llm/providers` | GET | LLM провайдеры |
| `/api/llm/chat` | POST | Чат через любой провайдер |
| `/api/llm/test` | POST | Тест провайдера |
| `/api/kb/status` | GET | Статистика KB |
| `/api/kb/search` | GET | Поиск в KB |
| `/api/kb/list` | GET | Список документов |
| `/api/kb/command` | POST | Выполнить /kb команду |
| `/api/models` | GET | Все 78 моделей |
| `/api/models/free` | GET | 46 бесплатных |
| `/api/models/paid` | GET | 32 платные |
| `/api/models/top` | GET | Топ моделей |
| `/api/models/command` | POST | /top, /free, /paid |
| `/api/chat` | POST | Чат |
| `/api/chat/stream` | POST | Стриминг |
| `/api/consilium` | POST | Multi-agent |
| `/api/roles` | GET | Роли |
| `/api/security/status` | GET | Безопасность |
| `/api/security/block` | POST | Блокировать IP |
| `/api/logs/recent` | GET | Логи |
| `/api/alerts/stats` | GET | Алёрты |
| `/api/worklog` | GET | WORKLOG |
| `/visualize.html` | GET | Визуализация |

---

## 🐛 Если что-то не работает

1. **Health endpoint:** `curl /api/health` → должен вернуть `{"status":"online"}`
2. **Проверь плагины:** `curl /api/plugins` → должен быть список
3. **Проверь firewall:** `gcloud compute firewall-rules list`
4. **Проверь сервер:** `ss -tlnp | grep 3000`
5. **Проверь логи:** `tail -f /tmp/evabot-server.log`

---

**© 2026 EvaBot Ecosystem**
