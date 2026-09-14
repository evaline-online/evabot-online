# 📋 Changelog Index

**Modular changelog structure** — каждый релиз = отдельный файл

---

## 📂 Структура

```
docs/changelog/
├── README.md              # Этот файл (index)
├── CHANGELOG.md           # Полная сводка всех релизов
└── (планируется) v0.1.0.md, v0.2.0.md, ...
```

---

## 📋 Активные релизы

### [CHANGELOG.md](./CHANGELOG.md)
**Полная сводка:** все релизы + unreleased features

**Текущая версия:** v0.0.2  
**Следующая:** v0.1.0 (Sept 2026)

---

## 🔍 Как добавить новый релиз

1. Создай файл: `docs/changelog/v0.1.0.md`
2. Используй шаблон:
```markdown
## [v0.1.0] - YYYY-MM-DD — Название

### Added
- Feature 1
- Feature 2

### Changed
- Change 1
- Change 2

### Fixed
- Bug 1
- Bug 2

### Removed
- Deprecated feature
```
3. Добавь ссылку в CHANGELOG.md
4. Обнови этот README.md

---

**Format:** [Keep a Changelog](https://keepachangelog.com/)  
**Versioning:** [Semantic Versioning](https://semver.org/)
