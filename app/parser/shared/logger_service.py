"""ECS-format JSON logger service for the parser.

Mirrors the server-side LoggerService (Winston JSON output) so logs from both
components share a single shape. Five log levels are exposed (`log`/`info`,
`error`, `warn`, `debug`, `verbose`); each call accepts a message and a
log_context literal ("app-monitoring" or "app-workflow"). The project,
component, environment, and user fields are predefined on the service.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Literal


LogContext = Literal["app-monitoring", "app-workflow"]

_PROJECT = "buster"
_COMPONENT = "parser"

_DEFAULT_USER = {
    "email": "system@buster.local",
    "name": "system",
    "role": "system",
}

# Maps Winston-style level names to Python logging levels so the parser and
# server share the same vocabulary.
_LEVEL_MAP = {
    "info": logging.INFO,
    "warn": logging.WARNING,
    "error": logging.ERROR,
    "debug": logging.DEBUG,
    "verbose": logging.DEBUG,
}

_PYTHON_LEVEL_TO_WINSTON_LABEL = {
    "INFO": "info",
    "WARNING": "warn",
    "ERROR": "error",
    "DEBUG": "debug",
}


class _EcsJsonFormatter(logging.Formatter):
    """Renders the LogRecord's payload (a dict on `record.msg`) as a JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        payload = record.msg if isinstance(record.msg, dict) else {"message": record.getMessage()}
        timestamp = datetime.now(timezone.utc).isoformat()
        level_label = _PYTHON_LEVEL_TO_WINSTON_LABEL.get(record.levelname, record.levelname.lower())
        return json.dumps({"timestamp": timestamp, "level": level_label, **payload})


class LoggerService:
    """Singleton-style service exposing Winston-equivalent log methods in ECS format."""

    def __init__(self) -> None:
        self._project = _PROJECT
        self._component = _COMPONENT
        self._environment = os.environ.get("PYTHON_ENV", "development")
        self._user = _DEFAULT_USER
        self._logger = logging.getLogger("buster.parser")
        self._logger.setLevel(logging.DEBUG)
        self._logger.propagate = False
        if not self._logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(_EcsJsonFormatter())
            self._logger.addHandler(handler)

    def log(self, message: str, log_context: LogContext) -> None:
        self._write("info", message, log_context)

    def info(self, message: str, log_context: LogContext) -> None:
        self._write("info", message, log_context)

    def warn(self, message: str, log_context: LogContext) -> None:
        self._write("warn", message, log_context)

    def error(self, message: str, log_context: LogContext) -> None:
        self._write("error", message, log_context)

    def debug(self, message: str, log_context: LogContext) -> None:
        self._write("debug", message, log_context)

    def verbose(self, message: str, log_context: LogContext) -> None:
        self._write("verbose", message, log_context)

    def _write(self, level: str, message: str, log_context: LogContext) -> None:
        payload = {
            "project": self._project,
            "component": self._component,
            "environment": self._environment,
            "message": message,
            "user": self._user,
            "logContext": log_context,
        }
        self._logger.log(_LEVEL_MAP[level], payload)


logger_service = LoggerService()
