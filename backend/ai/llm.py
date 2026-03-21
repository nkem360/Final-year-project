import os
from langchain_openai import ChatOpenAI
from core.settings import get_openai_credentials

_llm_instance = None


def get_llm() -> ChatOpenAI:
    """Return a singleton ChatOpenAI instance."""
    global _llm_instance
    if _llm_instance is None:
        creds = get_openai_credentials()
        _llm_instance = ChatOpenAI(
            api_key=creds["OPENAI_API_KEY"],
            model=creds["OPENAI_MODEL"],
            temperature=0.3,  # Lower temperature for medical-adjacent advice
        )
    return _llm_instance


def get_fast_llm() -> ChatOpenAI:
    """Faster, cheaper model for lightweight tasks like query rewriting."""
    creds = get_openai_credentials()
    return ChatOpenAI(
        api_key=creds["OPENAI_API_KEY"],
        model="gpt-4o-mini",
        temperature=0.2,
    )
