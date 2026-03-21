class PetHealthBaseError(Exception):
    """Base exception for the AI Pet Health System."""


class UserAlreadyExists(PetHealthBaseError):
    pass


class UserNotFound(PetHealthBaseError):
    pass


class PasswordMismatch(PetHealthBaseError):
    pass


class InvalidCredentials(PetHealthBaseError):
    pass


class TokenExpired(PetHealthBaseError):
    pass


class TokenInvalid(PetHealthBaseError):
    pass


class PetNotFound(PetHealthBaseError):
    pass


class Forbidden(PetHealthBaseError):
    pass


class RecordNotFound(PetHealthBaseError):
    pass


class AIAnalysisError(PetHealthBaseError):
    pass


class KnowledgeBaseError(PetHealthBaseError):
    pass
