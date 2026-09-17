"""Structured terminal logger — mirrors `Logger.ts`."""

from __future__ import annotations

import logging
import sys
from enum import IntEnum


class LogLevel(IntEnum):
    DEBUG = 10
    INFO = 20
    WARN = 30
    ERROR = 40


class EvaBotLogger:
    _instance: "EvaBotLogger | None" = None

    def __init__(self, name: str = "evabot", level: int = LogLevel.INFO) -> None:
        self._logger = logging.getLogger(name)
        self._logger.setLevel(level)
        if not self._logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(
                logging.Formatter(
                    "[%(asctime)s] [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S"
                )
            )
            self._logger.addHandler(handler)

    def _fmt(self, module: str, message: str) -> str:
        return f"[{module}] {message}"

    def debug(self, module: str, message: str) -> None:
        self._logger.debug(self._fmt(module, message))

    def info(self, module: str, message: str) -> None:
        self._logger.info(self._fmt(module, message))

    def warn(self, module: str, message: str) -> None:
        self._logger.warning(self._fmt(module, message))

    def error(self, module: str, message: str) -> None:
        self._logger.error(self._fmt(module, message))


_logger = EvaBotLogger()

__all__ = ["logger", "LogLevel"]


def get_logger() -> EvaBotLogger:
    return _logger


logger = _logger
