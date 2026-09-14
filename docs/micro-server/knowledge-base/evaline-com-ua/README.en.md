# Evaline Website to Markdown Archive

Complete, structured Markdown conversion of the official web presence of EvaLine across all language editions:
- 🇺🇦 **Ukrainian**: `site/uk/` (43 pages from `evaline.com.ua`)
- 🌐 **Russian**: `site/ru/` (67 pages from `evaline.com.ua/ru/`)
- 🇬🇧 **English**: `site/en/` (34 pages from `eva-line.com`)
- 🇵🇱 **Polish**: `site/pl/` (31 pages from `eva-line.pl`)
- 🇩🇪 **German**: `site/de/` (1 page from `de.eva-line.com`)
- 🇷🇴 **Romanian**: `site/ro/` (1 page from `ro.eva-line.com`)

**Total Converted Pages:** 177 content pages + 1 master `SUMMARY.md` navigation index.

---

## Key Features

1. **Modern Clean Markdown Pipeline**:
   - Converted using custom Python DOM processing with BeautifulSoup4, `html2text`, and PyYAML.
   - Preserves headings, tables, product lists, specifications, image galleries, and contact blocks.
2. **PageSpeed Lazy-Loading Resolution**:
   - Automatically detects and resolves Google PageSpeed lazy loading (`data-pagespeed-lazy-src`), restoring original full-resolution media assets instead of blank placeholder GIFs (`1.JiBnMqyl6S.gif`).
3. **Structured YAML Frontmatter**:
   - Every file includes clean metadata: `title`, `description`, original `url`, `lastmod`, `og_image`, `language`, `language_name`, `category`, and relative `file` path.
4. **Internal Link Rewriting**:
   - Internal `.html` links are mapped and rewritten to relative Markdown links (`.md`), enabling seamless offline browsing in Obsidian, Foam, GitHub, or any Markdown viewer.
5. **Universal Multilingual Sitemap & Index**:
   - `site/SUMMARY.md` provides an organized table of contents grouped by language edition and product categories (`b2b`, `b2c`, `news`, `general`).

---

## Directory Structure

```text
.
├── site/
│   ├── SUMMARY.md                # Master Table of Contents across all 6 languages
│   ├── conversion_stats.json     # Detailed audit log of every page
│   ├── uk/                       # Ukrainian pages (43 files)
│   │   ├── index.md
│   │   ├── b2b/
│   │   ├── b2c/
│   │   ├── novini/
│   │   └── ...
│   ├── ru/                       # Russian pages (67 files)
│   │   ├── index.md
│   │   ├── b2b/
│   │   ├── b2c/
│   │   ├── news/
│   │   └── ...
│   ├── en/                       # English pages (34 files)
│   │   ├── index.md
│   │   ├── b2b/
│   │   ├── b2c/
│   │   ├── news/
│   │   └── ...
│   ├── pl/                       # Polish pages (31 files)
│   │   ├── index.md
│   │   ├── b2b/
│   │   ├── b2c/
│   │   └── ...
│   ├── de/                       # German edition (1 file)
│   │   └── index.md
│   └── ro/                       # Romanian edition (1 file)
│       └── index.md
├── scripts/
│   └── convert_evaline.py       # Full automated crawling & conversion script
├── README.en.md                  # Project overview (English)
├── README.ru.md                  # Project overview (Russian)
├── README.uk.md                  # Project overview (Ukrainian)
├── REPORT.en.md                  # Conversion audit report (English)
├── REPORT.ru.md                  # Conversion audit report (Russian)
└── REPORT.uk.md                  # Conversion audit report (Ukrainian)
```

---

## Re-running the Converter

To update the archive or re-run the crawl:

```bash
python3 scripts/convert_evaline.py
```
