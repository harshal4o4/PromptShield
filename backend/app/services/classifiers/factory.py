from typing import Optional
from app.core.config import settings
from app.services.classifiers.base import BasePromptClassifier
from app.services.classifiers.groq_classifier import GroqPromptGuardClassifier
from app.services.classifiers.local_classifier import LocalSemanticClassifier


def get_classifier(provider: Optional[str] = None) -> BasePromptClassifier:
    """
    Factory resolving the active prompt injection classifier.
    If provider is 'auto', uses GroqPromptGuardClassifier when GROQ_API_KEY is configured,
    otherwise falls back smoothly to LocalSemanticClassifier.
    """
    selected = (provider or settings.classifier_provider).lower()

    if selected == "groq":
        return GroqPromptGuardClassifier()
    elif selected == "local":
        return LocalSemanticClassifier()
    else:  # "auto"
        if settings.groq_api_key and settings.groq_api_key.strip():
            return GroqPromptGuardClassifier()
        return LocalSemanticClassifier()
