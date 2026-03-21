"""
Core AI symptom analysis pipeline.

Flow:
  1. Pre-screen with vet_rules (emergency keyword check)
  2. Rewrite query for better retrieval
  3. Retrieve relevant vet knowledge from vector store
  4. Call LLM with structured prompt
  5. Parse and validate JSON response
  6. Post-process: merge vet_rules override if needed
"""

import json
import logging
from typing import Optional

from langchain.schema import HumanMessage, SystemMessage

from ai.llm import get_llm, get_fast_llm
from ai.prompts import (
    PET_HEALTH_SYSTEM_PROMPT,
    SYMPTOM_ANALYSIS_USER_TEMPLATE,
    QUERY_REWRITE_TEMPLATE,
    SYMPTOM_EXTRACTION_TEMPLATE,
)
from ai.embeddings import retrieve_relevant_context
from ai.vet_rules import check_emergency, check_species_specific_emergency
from schema_models.health_schemas import AnalysisResult, PossibleCondition
from db_models.models import Pet

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "⚠️ IMPORTANT: This analysis is provided for informational purposes only and is NOT a "
    "veterinary diagnosis. The information should not replace professional veterinary advice, "
    "diagnosis, or treatment. Always consult a licensed veterinarian for your pet's health concerns."
)


async def rewrite_query(symptoms_text: str) -> str:
    """Use a fast LLM to rewrite the symptom description as a better search query."""
    try:
        llm = get_fast_llm()
        prompt = QUERY_REWRITE_TEMPLATE.format(query=symptoms_text)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        rewritten = response.content.strip()
        logger.debug(f"Query rewritten: '{symptoms_text[:60]}...' → '{rewritten}'")
        return rewritten
    except Exception as e:
        logger.warning(f"Query rewriting failed: {e}. Using original.")
        return symptoms_text


async def extract_symptoms(symptoms_text: str) -> list[str]:
    """Extract normalised symptom tags from free-text description."""
    try:
        llm = get_fast_llm()
        prompt = SYMPTOM_EXTRACTION_TEMPLATE.format(text=symptoms_text)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        raw = response.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        symptoms = json.loads(raw)
        return [s.lower().strip() for s in symptoms if isinstance(s, str)]
    except Exception as e:
        logger.warning(f"Symptom extraction failed: {e}")
        return []


def _build_pet_context(pet: Pet) -> dict:
    """Build human-readable pet context strings for the prompt."""
    return {
        "pet_name": pet.name,
        "species": pet.species.value if pet.species else "unknown",
        "breed": pet.breed or "unknown",
        "age": f"{pet.age_years} years" if pet.age_years is not None else "unknown",
        "weight": f"{pet.weight_kg} kg" if pet.weight_kg is not None else "unknown",
        "gender": pet.gender or "unknown",
        "neutered": str(pet.is_neutered) if pet.is_neutered is not None else "unknown",
        "medical_notes": pet.medical_notes or "none",
    }


def _parse_llm_response(raw: str) -> dict:
    """Parse JSON from LLM response, stripping markdown fences if present."""
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        # parts[1] is the content between first pair of fences
        text = parts[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


async def analyse_symptoms(pet: Pet, symptoms_text: str, image_url: Optional[str] = None) -> AnalysisResult:
    """
    Full analysis pipeline. Returns an AnalysisResult.
    Raises ValueError on unrecoverable parse errors.
    """
    species = pet.species.value if pet.species else "unknown"

    # ── Step 1: Emergency pre-screening ──────────────────────────────────────
    is_emergency, emergency_msg = check_emergency(symptoms_text)
    if not is_emergency:
        is_emergency, emergency_msg = check_species_specific_emergency(symptoms_text, species)

    # ── Step 2: Query rewriting for better retrieval ──────────────────────────
    search_query = await rewrite_query(symptoms_text)

    # ── Step 3: Knowledge base retrieval ─────────────────────────────────────
    retrieved_context = await retrieve_relevant_context(search_query, k=4)
    if not retrieved_context:
        retrieved_context = "No specific veterinary references retrieved. Use general knowledge."

    # ── Step 4: Build prompt & call LLM ──────────────────────────────────────
    pet_ctx = _build_pet_context(pet)
    user_message = SYMPTOM_ANALYSIS_USER_TEMPLATE.format(
        **pet_ctx,
        symptoms_text=symptoms_text,
        retrieved_context=retrieved_context,
    )

    llm = get_llm()
    messages = [
        SystemMessage(content=PET_HEALTH_SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ]

    try:
        response = await llm.ainvoke(messages)
        data = _parse_llm_response(response.content)
    except json.JSONDecodeError as e:
        logger.error(f"LLM returned non-JSON response: {e}")
        raise ValueError("AI returned an unstructured response. Please try again.")
    except Exception as e:
        logger.error(f"LLM invocation failed: {e}")
        raise

    # ── Step 5: Post-process — apply vet_rules override ──────────────────────
    if is_emergency:
        data["is_emergency"] = True
        data["urgency_level"] = "emergency"
        data["emergency_message"] = emergency_msg

    # Always enforce disclaimer
    data["disclaimer"] = DISCLAIMER

    # ── Step 6: Parse into validated Pydantic model ───────────────────────────
    conditions = [
        PossibleCondition(**c) for c in data.get("possible_conditions", [])
    ]

    return AnalysisResult(
        possible_conditions=conditions,
        urgency_level=data.get("urgency_level", "moderate"),
        recommendations=data.get("recommendations", []),
        home_care_tips=data.get("home_care_tips", []),
        when_to_see_vet=data.get("when_to_see_vet", "Consult a vet if symptoms persist or worsen."),
        ai_summary=data.get("ai_summary", ""),
        confidence_score=float(data.get("confidence_score", 0.5)),
        disclaimer=data["disclaimer"],
        is_emergency=data.get("is_emergency", False),
        emergency_message=data.get("emergency_message"),
    )
