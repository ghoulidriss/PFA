"""
AI Service — calls Google Gemini API to generate intelligent responses.
Uses the new google-genai SDK with API version v1.
generate_content() is synchronous — wrapped in asyncio.to_thread() to
avoid blocking the FastAPI event loop.
"""

import asyncio
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class AIService:

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.client = genai.Client(
            api_key=api_key,
            http_options={"api_version": "v1beta"}
        )
        self.model_name = model_name
        logger.info(f"AIService initialized with model: {model_name}")

    def _call_gemini(self, prompt: str):
        """Synchronous Gemini call — run via asyncio.to_thread."""
        return self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
            )
        )

    async def generate_response(self, prompt: str) -> str:
        try:
            # Run the blocking SDK call in a thread pool so we don't block the event loop
            response = await asyncio.to_thread(self._call_gemini, prompt)
            return response.text
        except Exception as e:
            logger.error(f"[GEMINI ERROR] {type(e).__name__}: {e}")
            return self._fallback_response(str(e))

    def _fallback_response(self, error: str) -> str:
        return (
            "Je suis désolé, je rencontre des difficultés à générer une réponse pour le moment. "
            "Veuillez réessayer dans quelques instants ou contacter notre support."
        )
