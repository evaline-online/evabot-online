"""Universal text-interface content — the canonical ANSI drawings of EvaBot Online.

Single source of truth for the text "screen art" that is rendered identically by:
  - the Terminal CLI (prints ANSI directly),
  - the Web UI (converts ANSI -> HTML),
  - mobile clients (web-responsive render of the same ANSI stream).
Content here must stay 1:1 with frontend/src/ansi.ts. Strictly USD ($) & EUR (€).
"""

from __future__ import annotations

# ANSI codes — identical palette to frontend/src/ansi.ts / src/core/AnsiStreamEngine.ts
RESET = "\x1b[0m"
BOLD = "\x1b[1m"
GRAY = "\x1b[90m"
GREEN = "\x1b[32m"
BRIGHT_GREEN = "\x1b[92m"
CYAN = "\x1b[36m"
BRIGHT_CYAN = "\x1b[96m"
WHITE = "\x1b[37m"
BRIGHT_WHITE = "\x1b[97m"
YELLOW = "\x1b[33m"
BRIGHT_YELLOW = "\x1b[93m"
RED = "\x1b[31m"


def divider(char: str = "─", width: int = 78, color: str = GRAY) -> str:
    return f"{color}{char * width}{RESET}"


def boot_banner() -> str:
    """Identical to terminal-chat.ts runBootSequence + ansi.ts renderBootBanner()."""
    return (
        f"{GRAY}┌{'─' * 78}┐{RESET}\n"
        f"{GRAY}│{RESET} {BOLD}{BRIGHT_WHITE}[>>] EVABOT ONLINE v0.0.1 MVP // LINEAR CYBER-TERMINAL{RESET}{' ' * 26}{GRAY}│{RESET}\n"
        f"{GRAY}│{RESET} {GRAY}Hybrid Topology: Web Edge Gateway (Face) ◄──► Agent Server (Brain){RESET}          {GRAY}│{RESET}\n"
        f"{GRAY}│{RESET} {BRIGHT_CYAN}Base: Chernomorsk (UA) & Bratislava (EU) │ USD ($) & EUR (€) │ Zero-Trust{RESET}{' ' * 3}{GRAY}│{RESET}\n"
        f"{GRAY}└{'─' * 78}┘{RESET}"
    )


def status_bar(
    model: str,
    is_free: bool,
    mode: str,
    role: str,
    tokens: int,
    cost_usd: float,
    cost_eur: float,
    model_count: int,
) -> str:
    """Identical to ansi.ts renderStatusBar() / terminal printStatusBar()."""
    tier_badge = f"{GREEN}[FREE]{RESET}" if is_free else f"{YELLOW}[PAID]{RESET}"
    return (
        f"{divider('─', 80)}\n"
        f"  {BOLD}{WHITE}EVABOT{RESET} {GREEN}[ONLINE]{RESET} │ "
        f"{BOLD}{CYAN}{model}{RESET} [{tier_badge}] │ "
        f"{BOLD}{BRIGHT_YELLOW}{mode.upper()}{RESET} │ "
        f"{BOLD}{WHITE}{role}{RESET}\n"
        f"  {GRAY}Session Tokens: {tokens:,} │ "
        f"Session Cost: ${cost_usd:.4f} / €{cost_eur:.4f} │ "
        f"USD ($) & EUR (€) │ {model_count} Models │ /help for commands{RESET}\n"
        f"{divider('─', 80)}"
    )
