"""
Hard-coded veterinary triage rules.
These act as a safety net BEFORE the LLM is called.
If any emergency keyword is detected, we override the AI response
to flag it as an emergency and direct the owner to immediate care.
"""

from typing import Optional

# ─── Emergency Keyword Sets ──────────────────────────────────────────────────

EMERGENCY_KEYWORDS = {
    # Neurological
    "seizure", "convulsion", "fitting", "unconscious", "unresponsive", "collapse",
    "collapsed", "falling over", "can't stand", "cannot stand",
    # Respiratory
    "difficulty breathing", "can't breathe", "cannot breathe", "struggling to breathe",
    "gasping", "blue gums", "blue lips", "purple gums",
    # Bleeding / Trauma
    "severe bleeding", "heavy bleeding", "won't stop bleeding", "gushing blood",
    "hit by car", "run over", "broken bone", "suspected fracture",
    # Toxicity
    "ate poison", "ingested poison", "swallowed poison", "ate chocolate",
    "ate grapes", "ate raisins", "ate xylitol", "ate rat poison", "ate antifreeze",
    "suspected poisoning", "toxic",
    # Urinary
    "can't urinate", "cannot urinate", "blocked bladder", "straining to urinate",
    "no urine", "crying when urinating",
    # GI / Bloat
    "bloated abdomen", "distended abdomen", "swollen belly", "bloat",
    "twisted stomach", "gDV",
    # Eye
    "eye popped out", "eye prolapse",
    # Birthing
    "difficulty giving birth", "laboring for hours", "stuck puppy", "stuck kitten",
    # Cardiac
    "heart attack", "sudden collapse",
}

URGENT_KEYWORDS = {
    "not eating for 3 days", "not drinking for 2 days", "severe pain",
    "screaming in pain", "pale gums", "yellow gums", "jaundice",
    "blood in urine", "blood in stool", "bloody vomit", "vomiting blood",
    "diarrhea with blood", "severe vomiting", "swollen face",
    "eye discharge", "severe eye", "rapid breathing",
}


# ─── Triage Function ─────────────────────────────────────────────────────────


def check_emergency(symptoms_text: str) -> tuple[bool, Optional[str]]:
    """
    Returns (is_emergency, emergency_message).
    Checks symptom text against hard-coded emergency keywords.
    """
    lower = symptoms_text.lower()
    triggered = [kw for kw in EMERGENCY_KEYWORDS if kw in lower]

    if triggered:
        message = (
            "⚠️ EMERGENCY DETECTED: Your pet may be experiencing a life-threatening situation. "
            "Please contact your nearest emergency veterinary clinic or animal hospital IMMEDIATELY. "
            f"Detected concern(s): {', '.join(triggered)}. "
            "Do NOT wait — time is critical."
        )
        return True, message

    return False, None


def check_urgency_from_rules(symptoms_text: str) -> Optional[str]:
    """
    Returns a suggested urgency level based on keyword matching.
    Returns None if no keywords match (let the LLM decide).
    """
    lower = symptoms_text.lower()

    if any(kw in lower for kw in EMERGENCY_KEYWORDS):
        return "emergency"

    if any(kw in lower for kw in URGENT_KEYWORDS):
        return "high"

    return None


# ─── Species-specific Guardrails ─────────────────────────────────────────────

CAT_SPECIFIC_EMERGENCY = {
    "straining to urinate",
    "no litter box",
    "hiding and not eating",
    "open mouth breathing",
}

DOG_SPECIFIC_EMERGENCY = {
    "bloated",
    "distended belly",
    "retching without vomiting",
    "sudden extreme lethargy",
}


def check_species_specific_emergency(symptoms_text: str, species: str) -> tuple[bool, Optional[str]]:
    """Additional species-specific emergency checks."""
    lower = symptoms_text.lower()

    if species == "cat":
        triggered = [kw for kw in CAT_SPECIFIC_EMERGENCY if kw in lower]
        if triggered:
            return True, (
                "⚠️ EMERGENCY: This symptom in cats can be life-threatening. "
                "Contact a vet immediately."
            )

    if species == "dog":
        triggered = [kw for kw in DOG_SPECIFIC_EMERGENCY if kw in lower]
        if triggered:
            return True, (
                "⚠️ EMERGENCY: This symptom in dogs can indicate GDV (bloat) or another "
                "life-threatening condition. Contact a vet immediately."
            )

    return False, None
