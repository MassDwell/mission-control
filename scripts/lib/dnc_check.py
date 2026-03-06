"""
Shared Do-Not-Contact (DNC) enforcement module for Python scripts.
ALL email-sending scripts MUST use this before sending.

Features:
- Case-insensitive matching
- Matches primary email AND alt_emails
- Logs all skips for audit trail
- Safe default: if DNC list fails to load, blocks ALL sends (fail-closed)
"""

import json
import time
from pathlib import Path

DNC_LIST_PATH = Path.home() / '.openclaw/workspace/data/massdwell/sales/do-not-contact-list.json'

_cached_emails = None
_cache_time = 0
_CACHE_TTL = 60  # seconds


def load_dnc_emails():
    """Load all DNC emails (primary + alt_emails), lowercased. Returns set or None (fail-closed)."""
    global _cached_emails, _cache_time
    now = time.time()
    if _cached_emails is not None and (now - _cache_time) < _CACHE_TTL:
        return _cached_emails

    if not DNC_LIST_PATH.exists():
        print(f"🚨 DNC list not found at {DNC_LIST_PATH} — BLOCKING ALL SENDS (fail-closed)")
        return None

    try:
        data = json.loads(DNC_LIST_PATH.read_text())
        emails = set()
        for contact in data.get('contacts', []):
            if contact.get('email'):
                emails.add(contact['email'].lower().strip())
            for alt in contact.get('alt_emails', []):
                emails.add(alt.lower().strip())
        _cached_emails = emails
        _cache_time = now
        return emails
    except Exception as e:
        print(f"🚨 DNC list failed to load: {e} — BLOCKING ALL SENDS (fail-closed)")
        return None


def is_dnc(email, context='unknown'):
    """Check if email is on DNC list. Returns True if blocked (DO NOT SEND)."""
    if not email:
        return True

    dnc_emails = load_dnc_emails()
    if dnc_emails is None:
        print(f"🚨 [DNC:{context}] BLOCKING {email} — DNC list failed to load (fail-closed)")
        return True

    normalized = email.lower().strip()
    if normalized in dnc_emails:
        print(f"⏭️ [DNC:{context}] SKIPPING {email} — on do-not-contact list")
        return True
    return False


def filter_dnc(prospects, email_key='email', context='unknown'):
    """Filter a list of prospect dicts, removing DNC entries."""
    return [p for p in prospects if not is_dnc(p.get(email_key, ''), context)]
