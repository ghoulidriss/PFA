from functools import lru_cache
from app.config import Settings
from app.services.data_service import DataService
from app.services.ai_service import AIService
from app.services.chat_service import ChatService


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_data_service() -> DataService:
    settings = get_settings()
    return DataService(
        product_service_url=settings.product_service_url,
        order_service_url=settings.order_service_url
    )


def get_ai_service() -> AIService:
    settings = get_settings()
    return AIService(
        api_key=settings.gemini_api_key,
        model_name=settings.gemini_model
    )


def get_chat_service() -> ChatService:
    return ChatService(
        data_service=get_data_service(),
        ai_service=get_ai_service()
    )
