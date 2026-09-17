#!/usr/bin/env python3
"""Trendshift & GitHub Daily Scanner for EvaLine Agent Factory.
Scans trending open-source AI agent and coding tools, indexes them into
knowledge base, and alerts the dispatcher if high-priority tools emerge.
"""

import datetime
import json
import os
import sys
import urllib.request

DATA_DIR = "/var/www/evabot-backend/data"
OUTPUT_FILE = os.path.join(DATA_DIR, "trending-insights.json")
LOG_FILE = "/var/log/trendshift-scanner.log"

QUERIES = [
    "topic:ai-agents stars:>500",
    "topic:coding-assistant stars:>500",
    "topic:mcp-server stars:>100"
]

def log(msg: str):
    ts = datetime.datetime.utcnow().isoformat()
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def fetch_github(query: str, limit: int = 5):
    url = f"https://api.github.com/search/repositories?q={urllib.parse.quote(query)}&sort=stars&order=desc&per_page={limit}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "EvaLine-Agent-Factory/1.0",
        "Accept": "application/vnd.github.v3+json"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("items", [])
    except Exception as e:
        log(f"GitHub search failed for query '{query}': {e}")
        return []

def main():
    log("Starting daily trend scan...")
    os.makedirs(DATA_DIR, exist_ok=True)

    all_trends = []
    seen = set()

    for q in QUERIES:
        items = fetch_github(q, limit=5)
        for item in items:
            name = item.get("full_name")
            if not name or name in seen:
                continue
            seen.add(name)
            all_trends.append({
                "name": name,
                "url": item.get("html_url"),
                "stars": item.get("stargazers_count", 0),
                "description": item.get("description") or "",
                "language": item.get("language") or "",
                "updated_at": item.get("updated_at")
            })

    all_trends.sort(key=lambda x: x["stars"], reverse=True)

    output = {
        "updated_at": datetime.datetime.utcnow().isoformat(),
        "count": len(all_trends),
        "trends": all_trends
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    log(f"Scan complete. {len(all_trends)} repositories saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
