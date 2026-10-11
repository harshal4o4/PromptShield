import sqlite3
import json
import logging
from datetime import datetime, timezone
from contextlib import contextmanager
from typing import Generator
from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_POLICY_CONFIG = {
    "version": "1.0.0",
    "updated_at": "2026-10-11T12:00:00Z",
    "sanitization_enabled": True,
    "ambiguous_escalation": True,
    "rules": {
        "DIRECT_OVERRIDE": {
            "name": "Direct Instruction Override",
            "enabled": True,
            "severity": "high",
            "action": "BLOCK",
            "description": "Detects attempts to override system role or ignore instructions."
        },
        "SYSTEM_PROMPT_LEAK": {
            "name": "System Prompt Extraction",
            "enabled": True,
            "severity": "high",
            "action": "BLOCK",
            "description": "Detects attempts to reveal hidden system prompts or instructions."
        },
        "SYNTHETIC_SECRET_EXTRACTION": {
            "name": "Synthetic Canary Extraction",
            "enabled": True,
            "severity": "critical",
            "action": "BLOCK",
            "description": "Detects attempts to expose configured synthetic canary secrets."
        },
        "DATA_EXFILTRATION": {
            "name": "Data Exfiltration Intent",
            "enabled": True,
            "severity": "high",
            "action": "BLOCK",
            "description": "Detects unauthorized payload transmission or external URL exfiltration."
        },
        "INDIRECT_INJECTION": {
            "name": "Indirect Prompt Injection",
            "enabled": True,
            "severity": "high",
            "action": "BLOCK",
            "description": "Detects injected instruction payloads embedded inside document/web sources."
        },
        "OBFUSCATION_EVASION": {
            "name": "Obfuscation & Evasion Indicators",
            "enabled": True,
            "severity": "medium",
            "action": "SANITIZE",
            "description": "Detects base64, hex, or unicode control obfuscation patterns."
        }
    },
    "severity_actions": {
        "critical": "BLOCK",
        "high": "BLOCK",
        "medium": "SANITIZE",
        "low": "ALLOW"
    }
}

DEFAULT_SETTINGS = {
    "retention_mode": "redacted_excerpt",
    "telemetry_enabled": True,
    "alert_threshold": "high",
    "max_text_length": settings.max_text_length
}


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(settings.db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Initializes tables and default data idempotently."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source_type TEXT NOT NULL,
                trust_level TEXT NOT NULL,
                decision TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                summary TEXT NOT NULL,
                signals_json TEXT NOT NULL,
                redacted_excerpt TEXT NOT NULL,
                sanitized_text TEXT,
                detector_version TEXT NOT NULL,
                policy_version TEXT NOT NULL,
                is_attack INTEGER NOT NULL DEFAULT 0,
                is_demo INTEGER NOT NULL DEFAULT 0
            );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_decision ON events(decision);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_is_attack ON events(is_attack);")

        # Policies table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policies (
                id TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                config_json TEXT NOT NULL
            );
        """)

        # App settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                id TEXT PRIMARY KEY,
                updated_at TEXT NOT NULL,
                settings_json TEXT NOT NULL
            );
        """)

        # Evaluation runs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_runs (
                id TEXT PRIMARY KEY,
                run_at TEXT NOT NULL,
                dataset_version TEXT NOT NULL,
                total_samples INTEGER NOT NULL,
                precision REAL NOT NULL,
                recall REAL NOT NULL,
                f1_score REAL NOT NULL,
                false_positive_rate REAL NOT NULL,
                true_positives INTEGER NOT NULL,
                false_positives INTEGER NOT NULL,
                true_negatives INTEGER NOT NULL,
                false_negatives INTEGER NOT NULL,
                category_metrics_json TEXT NOT NULL,
                failure_cases_json TEXT NOT NULL
            );
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_run_at ON evaluation_runs(run_at DESC);")

        # Initialize default policy if not present
        cursor.execute("SELECT id FROM policies WHERE id = 'active'")
        if not cursor.fetchone():
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                "INSERT INTO policies (id, version, updated_at, config_json) VALUES (?, ?, ?, ?)",
                ("active", "1.0.0", now_iso, json.dumps(DEFAULT_POLICY_CONFIG))
            )

        # Initialize default settings if not present
        cursor.execute("SELECT id FROM app_settings WHERE id = 'global'")
        if not cursor.fetchone():
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                "INSERT INTO app_settings (id, updated_at, settings_json) VALUES (?, ?, ?)",
                ("global", now_iso, json.dumps(DEFAULT_SETTINGS))
            )

    logger.info("Database initialized successfully.")
