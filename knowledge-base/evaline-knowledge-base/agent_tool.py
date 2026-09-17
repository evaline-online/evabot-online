#!/usr/bin/env python3
"""
EvaLine Knowledge Base Agent Tool
Provides hybrid semantic + keyword retrieval for LLM agents and assistants.
Combines ChromaDB vector search with SQLite FTS5 keyword matching using
Reciprocal Rank Fusion (RRF).
"""

import os
import re
import sqlite3
from pathlib import Path
from typing import Optional, List, Dict, Any

import chromadb

KB_DIR = Path(__file__).resolve().parent
CHROMA_DIR = KB_DIR / "chroma_db"
FTS_DB_PATH = KB_DIR / "fts_index.db"
COLLECTION_NAME = "evaline_knowledge"


class EvaLineKnowledgeBase:
    """Hybrid Knowledge Base query engine for LLM agents."""

    def __init__(self):
        if not CHROMA_DIR.exists() or not FTS_DB_PATH.exists():
            raise FileNotFoundError(
                f"Knowledge base not built yet. Run 'python3 build_knowledge_base.py' first."
            )
        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        self.collection = self.chroma_client.get_collection(COLLECTION_NAME)

    def search_semantic(
        self,
        query: str,
        n_results: int = 5,
        language: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Dense semantic search using ChromaDB."""
        where = {}
        if language and category:
            where = {"$and": [{"language": language}, {"category": category}]}
        elif language:
            where = {"language": language}
        elif category:
            where = {"category": category}

        kwargs = {"query_texts": [query], "n_results": n_results}
        if where:
            kwargs["where"] = where

        res = self.collection.query(**kwargs)
        results = []
        if res and res["ids"] and res["ids"][0]:
            for i in range(len(res["ids"][0])):
                results.append({
                    "id": res["ids"][0][i],
                    "text": res["documents"][0][i],
                    "metadata": res["metadatas"][0][i],
                    "distance": res["distances"][0][i] if "distances" in res and res["distances"] else None,
                    "source": "vector"
                })
        return results

    def search_keyword(
        self,
        query: str,
        n_results: int = 5,
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Exact BM25 / keyword search using SQLite FTS5."""
        conn = sqlite3.connect(str(FTS_DB_PATH))
        cursor = conn.cursor()

        # Sanitize query for FTS5 syntax
        clean_words = [re.sub(r"[^\w\s]", "", w).strip() for w in query.split()]
        clean_words = [w for w in clean_words if w]
        if not clean_words:
            return []

        fts_query = " OR ".join(clean_words)

        sql = """
            SELECT chunk_id, title, header, language, category, url, file_path, content, rank
            FROM chunks_fts
            WHERE chunks_fts MATCH ?
        """
        params = [fts_query]
        if language:
            sql += " AND language = ?"
            params.append(language)

        sql += " ORDER BY rank LIMIT ?"
        params.append(n_results)

        try:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
        except Exception:
            rows = []
        finally:
            conn.close()

        results = []
        for r in rows:
            results.append({
                "id": r[0],
                "text": r[7],
                "metadata": {
                    "title": r[1],
                    "header": r[2],
                    "language": r[3],
                    "category": r[4],
                    "url": r[5],
                    "file": r[6],
                },
                "rank": r[8],
                "source": "keyword"
            })
        return results

    def search_hybrid(
        self,
        query: str,
        n_results: int = 5,
        language: Optional[str] = None,
        category: Optional[str] = None,
        rrf_k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Reciprocal Rank Fusion (RRF) combining dense vector search
        and exact BM25 keyword matching for optimal RAG precision.
        """
        vec_results = self.search_semantic(query, n_results=n_results * 2, language=language, category=category)
        kw_results = self.search_keyword(query, n_results=n_results * 2, language=language)

        scores: Dict[str, float] = {}
        item_map: Dict[str, Dict[str, Any]] = {}

        for rank, item in enumerate(vec_results):
            cid = item["id"]
            scores[cid] = scores.get(cid, 0.0) + (1.0 / (rrf_k + rank + 1))
            item_map[cid] = item

        for rank, item in enumerate(kw_results):
            cid = item["id"]
            scores[cid] = scores.get(cid, 0.0) + (1.0 / (rrf_k + rank + 1))
            if cid not in item_map:
                item_map[cid] = item

        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)[:n_results]

        final_results = []
        for cid in sorted_ids:
            res = item_map[cid]
            res["rrf_score"] = scores[cid]
            final_results.append(res)

        return final_results

    def format_context_for_llm(self, results: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks into clean grounded context for LLM prompt."""
        if not results:
            return "No relevant documents found in the EvaLine knowledge base."

        output = ["### Retrieved Knowledge from EvaLine:\n"]
        for idx, r in enumerate(results, 1):
            m = r.get("metadata", {})
            title = m.get("title", "Untitled")
            header = m.get("header", "")
            url = m.get("url", "")
            lang = m.get("language", "")
            cat = m.get("category", "")

            output.append(f"--- [Source {idx} | {title} | Section: {header} | Lang: {lang} | URL: {url}] ---")
            output.append(r["text"].strip())
            output.append("\n")

        return "\n".join(output)


# Standalone function for tool-calling frameworks (LangChain, AutoGen, CrewAI, Gemini)
def query_evaline_knowledge_base(
    query: str,
    language: Optional[str] = None,
    category: Optional[str] = None,
    top_k: int = 5
) -> str:
    """
    Query the EvaLine knowledge base using hybrid vector and keyword search.

    Args:
        query: User question or search keywords (e.g. 'толщина спортивных татами', 'дитячий килимок пазл', 'contacts').
        language: Optional language filter ('uk', 'ru', 'en', 'pl', 'de', 'ro').
        category: Optional category filter ('b2b', 'b2c', 'news', 'general').
        top_k: Number of most relevant sections to return.

    Returns:
        Structured context string containing verified information, technical specs, and live source URLs.
    """
    import re
    kb = EvaLineKnowledgeBase()
    results = kb.search_hybrid(query=query, n_results=top_k, language=language, category=category)
    return kb.format_context_for_llm(results)


if __name__ == "__main__":
    import re
    import sys
    test_query = sys.argv[1] if len(sys.argv) > 1 else "м'яка підлога для дому характеристики"
    print(f"Testing Knowledge Base Query: '{test_query}'\n")
    print(query_evaline_knowledge_base(test_query, top_k=3))
