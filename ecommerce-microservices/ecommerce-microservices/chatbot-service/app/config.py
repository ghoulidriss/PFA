from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # AI Configuration
    gemini_api_key: str = "your-gemini-api-key-here"
    gemini_model: str = "gemini-2.5-flash"

    # Internal service URLs
    product_service_url: str = "http://product-service:8082"
    order_service_url: str = "http://order-service:8083"

    # MongoDB for conversation history (optional)
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "chatbot_db"

    # App settings
    app_name: str = "ShopBot Chatbot Service"
    debug: bool = False
    port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False
