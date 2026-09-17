#!/usr/bin/env python3
"""
EvaLine Knowledge Base Builder
Reads all Markdown files from evaline-com-ua/site/, performs semantic chunking,
and populates:
1. ChromaDB Persistent Vector Database (for semantic search & LLM agent RAG)
2. SQLite FTS5 Full-Text Search Database (for exact keyword, part number, and contact search)
"""

import os
import re
import sys
import json
import sqlite3
from pathlib import Path

import chromadb
from chromadb.config import Settings
import yaml

WORKSPACE_DIR = Path(__file__).resolve().parent.parent
SOURCE_SITE_DIR = WORKSPACE_DIR / "evaline-com-ua" / "site"
KB_DIR = WORKSPACE_DIR / "evaline-knowledge-base"
CHROMA_DIR = KB_DIR / "chroma_db"
FTS_DB_PATH = KB_DIR / "fts_index.db"

COLLECTION_NAME = "evaline_knowledge"


def extract_frontmatter_and_body(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from Markdown."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
                body = parts[2].strip()
                return meta, body
            except Exception:
                pass
    return {}, text.strip()


def chunk_markdown(meta: dict, body: str, file_path: Path) -> list[dict]:
    """
    Split markdown body into logical semantic chunks based on headers.
    Keeps chunks between 150 - 1500 characters with contextual headers.
    """
    chunks = []
    lines = body.split("\n")

    current_header = meta.get("title", file_path.stem)
    current_lines = []
    chunk_index = 0

    def flush_chunk():
        nonlocal chunk_index, current_lines
        content = "\n".join(current_lines).strip()
        if not content:
            return

        # Build contextual text including document title and current section
        doc_title = meta.get("title", file_path.stem)
        context_prefix = f"Document: {doc_title}\nSection: {current_header}\n\n"
        full_text = context_prefix + content

        chunk_id = f"{meta.get('language', 'uk')}_{file_path.stem}_{chunk_index}"
        chunks.append({
            "id": chunk_id,
            "text": full_text,
            "raw_content": content,
            "metadata": {
                "title": doc_title,
                "header": current_header,
                "url": meta.get("url", ""),
                "language": meta.get("language", "uk"),
                "category": meta.get("category", "general"),
                "file": str(file_path.relative_to(SOURCE_SITE_DIR)),
                "chunk_index": chunk_index,
            }
        })
        chunk_index += 1
        current_lines = []

    for line in lines:
        # Detect markdown headers
        if re.match(r"^#{1,3}\s+", line):
            if current_lines:
                flush_chunk()
            current_header = line.lstrip("#").strip()
            current_lines.append(line)
        else:
            current_lines.append(line)
            # If current chunk gets too long, flush
            if sum(len(l) for l in current_lines) > 1200:
                flush_chunk()

    if current_lines:
        flush_chunk()

    return chunks


def init_sqlite_fts(db_path: Path) -> sqlite3.Connection:
    """Initialize SQLite database with FTS5 virtual table for keyword search."""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS chunks_fts")
    cursor.execute("""
        CREATE VIRTUAL TABLE chunks_fts USING fts5(
            chunk_id,
            title,
            header,
            language,
            category,
            url,
            file_path,
            content,
            tokenize='unicode61'
        )
    """)
    conn.commit()
    return conn


def main():
    print("=== Building EvaLine LLM Knowledge Base ===")
    KB_DIR.mkdir(parents=True, exist_ok=True)
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Discover all Markdown files
    md_files = [f for f in SOURCE_SITE_DIR.rglob("*.md") if f.name != "SUMMARY.md"]
    print(f"Found {len(md_files)} Markdown source files in {SOURCE_SITE_DIR}")

    # 2. Chunk all files
    all_chunks = []
    for f in md_files:
        try:
            raw_text = f.read_text(encoding="utf-8")
            meta, body = extract_frontmatter_and_body(raw_text)
            chunks = chunk_markdown(meta, body, f)
            all_chunks.extend(chunks)
        except Exception as e:
            print(f"Error chunking {f}: {e}")

    print(f"Total semantic chunks created: {len(all_chunks)}")

    # 3. Populate SQLite FTS5 Index
    print(f"Indexing chunks into SQLite FTS5 ({FTS_DB_PATH})...")
    conn = init_sqlite_fts(FTS_DB_PATH)
    cursor = conn.cursor()
    for ch in all_chunks:
        m = ch["metadata"]
        cursor.execute("""
            INSERT INTO chunks_fts (chunk_id, title, header, language, category, url, file_path, content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ch["id"],
            m["title"],
            m["header"],
            m["language"],
            m["category"],
            m["url"],
            m["file"],
            ch["text"]
        ))
    conn.commit()
    conn.close()
    print("SQLite FTS5 indexing complete.")

    # 4. Populate ChromaDB Vector Database
    print(f"Indexing chunks into ChromaDB ({CHROMA_DIR})...")
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    # Reset collection if exists
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "EvaLine multilingual knowledge base for LLM agents"}
    )

    # Batch add to ChromaDB
    batch_size = 100
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        collection.add(
            ids=[b["id"] for b in batch],
            documents=[b["text"] for b in batch],
            metadatas=[b["metadata"] for b in batch]
        )
        print(f"Indexed vector batch {i + len(batch)} / {len(all_chunks)}")

    print(f"ChromaDB collection '{COLLECTION_NAME}' created with {collection.count()} vectors.")
    print("=== Knowledge Base Build Finished Successfully! ===")


if __name__ == "__main__":
    main()
