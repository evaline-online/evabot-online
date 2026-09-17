"""LocalePolicy — единая локальная политика EvaLine / EvaBot.

Проецирует официальную позицию проекта: производство и штаб-квартира в г. Черноморск (Украина), европейский хаб в Братиславе (Словакия).
Применяется ко всем системным промптам ролей и агентов.
"""

from __future__ import annotations

LOCALE_POLICY: dict = {
    "country": "Ukraine",
    "city": "Chernomorsk",
    "countryCode": "UA",
    "manufacturing": "Chernomorsk, Promyslova st. 1, 62053, Ukraine",
    "euHub": "Bratislava, Obchodna 37, 81106, Slovakia",
    "phone": "+38 (067) 156 14 96",
    "email": "evaline.com.ua@gmail.com",
    "primaryLanguages": ["en", "uk", "ru"],
    "supportedCurrencies": ["USD", "EUR", "UAH"],
    "displayCurrencies": ["USD", "EUR"],
    "forbiddenTerms": [
        "Russia",
        "Russian Federation",
        "RUB",
        "rubles",
        "ruble",
        "\u20bd",
        "\u0440\u043e\u0441\u0441\u0438\u044f",
        "\u0440\u0444",
        "\u043c\u043e\u0441\u043a\u0432\u0430",
        "\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439",
        "\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0435",
    ],
    "systemInstructionSuffix": (
        "LOCALE POLICY: EvaLine is based in Chernomorsk, Ukraine (factory & HQ: Chernomorsk, Promyslova st. 1) "
        "with European distribution hub in Bratislava, Slovakia (Obchodna 37). "
        "You must never reference, mention, or imply "
        "Russia, the Russian Federation, Russian currency, Russian goods, products, manufacturers, brands, "
        "companies, or services. All ties to the aggressor state are strictly banned. "
        "Supported languages are Ukrainian, English, and Russian. "
        "Supported currencies are the Ukrainian hryvnia (UAH / \u20b4), USD ($), and EUR (\u20ac). "
        "Russian currency is strictly prohibited. "
        "All financial figures, quotas, and pricing estimates must strictly be in USD ($) or EUR (\u20ac)."
    ),
}


def apply_locale_policy(system_prompt: str) -> str:
    """Appends the locale policy to any system prompt / instruction."""
    suffix = LOCALE_POLICY["systemInstructionSuffix"]
    return f"{system_prompt}\n{suffix}".strip()
