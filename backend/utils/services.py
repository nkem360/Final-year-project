"""
Shared utility helpers.
"""

import secrets
import string


def generate_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def truncate(text: str, max_length: int = 200) -> str:
    """Truncate text to max_length characters, appending '...' if needed."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."
