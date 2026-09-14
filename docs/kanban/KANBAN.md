# 🟢 Kanban: EvaBot Online (Core Engine & Web Cyber-Terminal)

> **Репозиторий:** [`evabot-online`](https://github.com/evaline-online/evabot-online)  
> **Локальный путь:** `/var/www/evabot-backend`  
> **Публичный адрес:** [https://evabot.online](https://evabot.online)  
> **Роль в кластере:** Основное вычислительное ядро (Frankfurt `100.66.98.4:3000`), маршрутизация LLM, API Hub, TUI & Web Client.

---

## 📋 Текущие задачи проекта

### ⚡ В работе / Спринт 1
- [x] **TASK-363 (P0)**: Починить маршрутизацию `/face/` на edge-шлюзе Caddy (проксирование на EvaBrain :80).
- [ ] **TASK-360 (P1)**: Полноценный WebAudio голосовой ввод и воспроизведение в веб-интерфейсе `src/web/app.ts` через `/voice/`.
- [ ] **TASK-373 (P1)**: Сохранение истории диалогов в `localStorage` + кнопка «Экспорт в Markdown/JSON».
- [ ] **TASK-374 (P2)**: Поиск и теги по 78 моделям флота в диалоговом окне настроек.

### 📋 Бэклог фич
- [ ] **FEAT-101 (P2)**: Поддержка переключения тем оформления в веб-интерфейсе: Cyber Neon, Matrix CRT, Clean Day.
- [ ] **FEAT-102 (P2)**: Встраиваемый плавающий виджет 3D-аватара прямо в чате `evabot.online`.
- [ ] **FEAT-103 (P1)**: Доведение покрытия тестами фронтенда (`vitest`) с 35% до 60%.
- [ ] **FEAT-104 (P2)**: Экспорт диалогов в Telegram-бот и сохранение избранных ответов консилиума.

### ✅ Завершено (v0.1.0)
- [x] **TASK-343**: Жесткая языковая фиксация (Language Mirroring) UK/RU/EN на всех уровнях.
- [x] **TASK-346**: Полный селф-хостинг вариативного шрифта Roboto (woff2 100..900) + переключатель [CSS:ON/OFF].
- [x] **TASK-350**: Индексация базы знаний EvaLine в SQLite FTS5 (1438 чанков) и ChromaDB (1075 векторов).
- [x] **TASK-351**: Интеграция Edge-TTS нейро-голосов (uk-UA-PolinaNeural, ru-RU-DmitryNeural).
- [x] **TASK-354**: Прохождение всех 33 тест-сьютов бэкенда (85.7% statement coverage).
