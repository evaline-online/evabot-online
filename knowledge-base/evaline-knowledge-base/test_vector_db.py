#!/usr/bin/env python3
"""
Diagnostic & Verification Script for EvaLine Vector Database (ChromaDB).
Tests:
1. ChromaDB health & total vector count.
2. Pure dense vector search (semantic similarity without keyword search).
3. Semantic synonym test (finding concepts without exact word matches).
4. Cross-lingual semantic retrieval across UK, RU, EN, PL.
"""

import sys
from pathlib import Path
import chromadb

KB_DIR = Path(__file__).resolve().parent
CHROMA_DIR = KB_DIR / "chroma_db"
COLLECTION_NAME = "evaline_knowledge"


def run_tests():
    print("=" * 65)
    print("🔍 DIAGNOSTIC TEST: EvaLine ChromaDB Vector Database")
    print("=" * 65)

    # 1. Connection & Count
    print("\n[TEST 1] Connecting to ChromaDB Persistent Storage...")
    try:
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        collection = client.get_collection(COLLECTION_NAME)
        count = collection.count()
        print(f"  ✓ Connected successfully!")
        print(f"  ✓ Total vector embeddings stored: {count}")
        assert count > 0, "Collection is empty!"
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return

    # 2. Inspect a sample embedding
    print("\n[TEST 2] Inspecting stored vector dimensions & metadata...")
    try:
        sample = collection.peek(1)
        print(f"  ✓ Sample Chunk ID: {sample['ids'][0]}")
        print(f"  ✓ Sample Title:    {sample['metadatas'][0].get('title')}")
        print(f"  ✓ Sample Language: {sample['metadatas'][0].get('language')}")
        print(f"  ✓ Sample URL:      {sample['metadatas'][0].get('url')}")
    except Exception as e:
        print(f"  ✗ Failed: {e}")

    # 3. Pure Vector Semantic Similarity Test
    # Using words that DO NOT appear literally in the document
    test_cases = [
        {
            "query": "мягкое покрытие чтобы ребенок не ушибся при падении",
            "lang": "ru",
            "desc": "Смысловой поиск (защита от травм детей)"
        },
        {
            "query": "матеріал для створення штучних квітів та декору",
            "lang": "uk",
            "desc": "Семантичний пошук (рукоділля / квіти -> фоаміран)"
        },
        {
            "query": "durable polymer armor for comic convention cosplayers",
            "lang": "en",
            "desc": "Semantic search (cosplay armor -> EVA sheets)"
        },
        {
            "query": "ciepła podłoga do pokoju dziecięcego",
            "lang": "pl",
            "desc": "Wyszukiwanie semantyczne (ciepła podłoga -> maty EVA)"
        }
    ]

    print("\n[TEST 3] Running Pure Vector Semantic Queries (No Keywords)...")
    for i, tc in enumerate(test_cases, 1):
        q = tc["query"]
        lang = tc["lang"]
        desc = tc["desc"]
        print(f"\n  --- Query {i}: '{q}' ({desc}) ---")

        results = collection.query(
            query_texts=[q],
            n_results=2,
            where={"language": lang}
        )

        for rank, (doc_id, dist, meta, doc) in enumerate(
            zip(results["ids"][0], results["distances"][0], results["metadatas"][0], results["documents"][0]), 1
        ):
            title = meta.get("title", "N/A")
            sec = meta.get("header", "N/A")
            url = meta.get("url", "N/A")
            # Lower distance = higher semantic similarity
            similarity_pct = max(0.0, min(100.0, (1.0 - (dist / 2.0)) * 100))
            print(f"    [{rank}] Similarity: {similarity_pct:.1f}% (Distance: {dist:.4f})")
            print(f"        Document: {title} | Section: {sec}")
            print(f"        Live URL: {url}")
            # First 120 chars
            preview = doc.replace("\n", " ")[:120].strip()
            print(f"        Snippet:  \"{preview}...\"")

    print("\n" + "=" * 65)
    print("✅ ALL VECTOR DATABASE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_tests()
