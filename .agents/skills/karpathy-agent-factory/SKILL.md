---
name: karpathy-agent-factory
description: >-
  Andrej Karpathy's lean coding and autonomous agent principles adapted for EvaBot LLM Factory.
  Enforces extreme simplicity, surgical changes, bounded agent-spawning, and anti-hallucination gates.
---

# Karpathy Agent Factory Guidelines (EvaBot & Multi-Agent Network)

Adapted from Andrej Karpathy's foundational LLM engineering observations for autonomous multi-agent factories where AI agents design, build, and supervise other AI agents.

## Core Mandate: Simplicity, Precision, and Bounded Autonomy

### 1. Think Before Coding & Spawning (Anti-Hallucination Gate)
- **Never assume environment state:** Always verify with live inspection (`ss -tlpn`, `systemctl status`, `ls`, `curl`) before writing code or configuring services.
- **Surface tradeoffs explicitly:** When designing child agents or pipelines, state pros, cons, and alternatives. Never pick a complex architecture silently.
- **Stop on real ambiguity:** If user intent or data schema has multiple conflicting interpretations, pause and resolve with one clear question.

### 2. Simplicity First (Anti-Bloat & Lean Code)
- **Minimum viable implementation:** If a 30-line script solves the problem, reject 300-line abstraction layers and speculative frameworks.
- **No speculative configurability:** Do not add parameters, flags, or interfaces that are not needed immediately.
- **Lean Toolsets for Subagents:** Equip spawned agents only with the precise tools they require (e.g., read-only for research, write-only for patching), never unrestricted omni-toolsets.

### 3. Surgical Changes & System Preservation
- **Touch only the target:** Never reformat, refactor, or "clean up" adjacent working files, comments, or configurations.
- **Respect Port & Process Boundaries:**
  - `3000`: `evabot-brain`
  - `8000`: `evabot-voice`
  - `5055`: `evabot-userbot`
  - `3005`: `openhands`
  - `5678`: `n8n`
  - `20128`: `omniroute`
  - Never allow child agents or tools to bind conflicting ports.
- **Preserve Fallback Chains:** Always retain local fallbacks (e.g., faster-whisper STT, Edge-TTS Svetlana).

### 4. Agent-Spawning Rules (Factory Governance)
- **Bounded Hierarchy:** Maximum recursion depth is 2 (Parent Agent → Worker Agent). No runaway agent loops.
- **Verifiable Contracts:** Every spawned agent task must have an explicit acceptance test: HTTP status, JSON schema, or unit test pass.
- **Timeout & Failure Limits:** Every subagent call must specify strict timeouts (<= 120s) and max retry count (3 attempts before alerting Telegram creator).
- **Log Everything to Experience Store:** Successful solutions and critical fixes must be committed into `learned_lessons` in SQLite for continuous cross-agent learning.
