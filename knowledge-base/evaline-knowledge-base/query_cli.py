#!/usr/bin/env python3
"""
Interactive CLI for testing the EvaLine LLM Knowledge Base.
Usage:
    python3 query_cli.py "EVA sheets for cosplay"
    python3 query_cli.py "спортивне покриття" --lang uk
    python3 query_cli.py --interactive
"""

import sys
import argparse
from agent_tool import EvaLineKnowledgeBase, query_evaline_knowledge_base


def main():
    parser = argparse.ArgumentParser(description="Query EvaLine Knowledge Base")
    parser.add_argument("query", nargs="?", default=None, help="Search query string")
    parser.add_argument("--lang", choices=["uk", "ru", "en", "pl", "de", "ro"], default=None, help="Filter by language")
    parser.add_argument("--cat", choices=["b2b", "b2c", "news", "general"], default=None, help="Filter by category")
    parser.add_argument("-k", "--top-k", type=int, default=3, help="Number of top chunks to retrieve")
    parser.add_argument("-i", "--interactive", action="store_true", help="Start interactive query loop")

    args = parser.parse_args()

    kb = EvaLineKnowledgeBase()

    if args.interactive or not args.query:
        print("=== EvaLine Knowledge Base Interactive Search ===")
        print("Type your questions or search keywords. Type 'exit' or 'q' to quit.\n")
        while True:
            try:
                user_input = input("\n🔍 Enter query > ").strip()
                if not user_input or user_input.lower() in ["exit", "quit", "q"]:
                    break
                context = kb.format_context_for_llm(
                    kb.search_hybrid(user_input, n_results=args.top_k, language=args.lang, category=args.cat)
                )
                print("\n" + context)
            except (KeyboardInterrupt, EOFError):
                break
        print("\nExiting. Goodbye!")
    else:
        results = kb.search_hybrid(args.query, n_results=args.top_k, language=args.lang, category=args.cat)
        print(kb.format_context_for_llm(results))


if __name__ == "__main__":
    main()
