from dataclasses import dataclass


@dataclass
class AppConfig:
    PROJECT_NAME: str = "AI Pet Health System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    DESCRIPTION: str = (
        "An intelligent pet health assistant powered by AI. "
        "NOTE: This system is NOT a diagnostic tool and does not replace "
        "professional veterinary advice."
    )


app_config = AppConfig()
