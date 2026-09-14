#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json

sys.path.append('/home/evabot')
sys.path.append('/home/evabot/manifesto_builder')

import css_styles
import nav_and_hero
import sections_01_03
import sections_04_07
import section_08
import section_09
import models_renderer
import section_00_monetization
import section_10_trillion
import section_11_professions
import footer_and_scripts
import section_toc

print("Compiling full manifesto...")

# Pre-render initial free models
prerendered_models_html = models_renderer.get_prerendered_models()
sec00 = section_00_monetization.get_section_00()

head_html = """<!DOCTYPE html>
<html lang="ru" data-lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Манифест EvaLine // Фабрика автономных ИИ-агентов, система «Консилиум», Тетраксис ролей и производство полимеров EVA</title>
  <meta name="description" content="Технологический манифест EvaLine: фабрика автономных ИИ-агентов, система Консилиум, матрица из 94 LLM моделей, 10 ролей Тетраксиса и реальное производство полимеров EVA.">
  
  <!-- Complete Roboto Font Family: Roboto, Roboto Mono, Roboto Condensed, Roboto Slab (All weights & styles) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Roboto+Condensed:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Roboto+Slab:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style id="main-manifesto-styles">
""" + css_styles.CSS_CONTENT + """
  </style>
<style id="reset-styles">
    /* RESET ONLY: cross-browser/cross-OS unification, no design. Survives ?theme=raw */
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; line-height: 1.5; }
    body { margin: 0; min-height: 100dvh; }
    h1,h2,h3,h4,h5,h6,p,figure,blockquote,dl,dd,hr,pre { margin: 0; }
    ul,ol { padding-inline-start: 24px; }
    img,picture,video,canvas { max-width: 100%; height: auto; }
    button,input,select,textarea { font: inherit; color: inherit; background: none; border: none; }
    details > summary { cursor: pointer; list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    table { border-collapse: collapse; border-spacing: 0; max-width: 100%; }
    a { color: inherit; text-decoration: none; }
    strong,b { font-weight: 700; }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
"""

nav_hero = nav_and_hero.get_nav_and_hero()
toc_block = section_toc.get_section_toc()
sec1 = sections_01_03.get_section_01()
sec2 = sections_01_03.get_section_02()
sec3 = sections_01_03.get_section_03()
sec4 = sections_04_07.get_section_04(prerendered_models_html)
sec5 = sections_04_07.get_section_05()
sec6 = sections_04_07.get_section_06()
sec7 = sections_04_07.get_section_07()
sec8 = section_08.get_section_08()
sec9 = section_09.get_section_09()
sec10 = section_10_trillion.get_section_10()
sec11 = section_11_professions.get_section_11()
footer = footer_and_scripts.get_footer()
scripts = footer_and_scripts.get_scripts()

full_html = head_html + nav_hero + toc_block + sec1 + sec2 + sec3 + sec4 + sec5 + sec6 + sec7 + sec8 + sec11 + sec10 + sec00 + sec9 + footer + scripts

print(f"Compilation complete! Total HTML length: {len(full_html)} characters.")

# Write to target files
targets = [
    '/var/www/evabot-backend/public/manifesto.html',
    '/home/evabot/evaline-online/index.html',
    '/home/evabot/evaline-online/public/manifesto.html'
]

for t in targets:
    os.makedirs(os.path.dirname(t), exist_ok=True)
    with open(t, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Successfully wrote {t} ({len(full_html)} bytes)")

# Also copy models_catalog.json to evaline-online
with open('/home/evabot/evaline-online/models_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(models_renderer.raw_models, f, ensure_ascii=False, indent=2)

print("Master compilation successfully completed!")
