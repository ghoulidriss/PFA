"""
Chat Service — orchestrates the full chatbot flow:
1. Detect user intent
2. Fetch real data from business services
3. Build contextual prompt
4. Call Gemini AI
5. Save conversation history
6. Return response
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from app.models.chat import ChatRequest, ChatResponse, ChatMessage, MessageRole, ConversationHistory
from app.services.data_service import DataService
from app.services.ai_service import AIService
from app.services.prompt_builder import PromptBuilder
from app.services.intent_detector import IntentDetector, Intent

logger = logging.getLogger(__name__)


class ChatService:

    def __init__(self, data_service: DataService, ai_service: AIService):
        self.data_service = data_service
        self.ai_service = ai_service
        self.prompt_builder = PromptBuilder()
        self.intent_detector = IntentDetector()
        # In-memory history store (replace with MongoDB in production)
        self._history: dict[str, ConversationHistory] = {}

    async def process_question(self, request: ChatRequest) -> ChatResponse:
        session_id = request.session_id or str(uuid.uuid4())
        logger.info(f"Processing question for session: {session_id}")

        # Step 1: Detect intent
        intent, param = self.intent_detector.detect(request.question)
        logger.info(f"Detected intent: {intent}, param: {param}")

        # Step 2: Fetch relevant real data from business services
        prompt = await self._build_contextual_prompt(request.question, intent, param)

        # Step 3: Call Gemini AI with enriched prompt
        answer = await self.ai_service.generate_response(prompt)

        # Step 4: Save conversation history
        self._save_history(session_id, request.username, request.question, answer)

        return ChatResponse(
            answer=answer,
            session_id=session_id,
            sources=self._get_sources(intent),
            timestamp=datetime.utcnow()
        )

    async def _build_contextual_prompt(self, question: str, intent: Intent, param: Optional[str]) -> str:
        if intent == Intent.AVAILABILITY_CHECK:
            if param and param.isdigit():
                product = await self.data_service.get_product_by_id(int(param))
                return self.prompt_builder.build_product_availability_prompt(question, product)
            else:
                products = await self.data_service.search_products(question[:50])
                return self.prompt_builder.build_product_search_prompt(question, products)

        elif intent == Intent.STATS:
            stock_stats = await self.data_service.get_stock_stats()
            order_stats = await self.data_service.get_order_stats()
            return self.prompt_builder.build_stock_stats_prompt(question, stock_stats, order_stats)

        elif intent == Intent.RECOMMENDATION:
            products = await self.data_service.get_available_products()
            return self.prompt_builder.build_recommendation_prompt(question, products)

        elif intent == Intent.PRICE_SEARCH and param:
            try:
                max_price = float(param)
                products = await self.data_service.get_products_by_max_price(max_price)
                return self.prompt_builder.build_product_search_prompt(question, products)
            except ValueError:
                pass

        elif intent == Intent.CATEGORY_SEARCH and param:
            products = await self.data_service.get_products_by_category(param)
            return self.prompt_builder.build_product_search_prompt(question, products)

        # Default: search by question
        products = await self.data_service.search_products(question[:50])
        if not products:
            products = await self.data_service.get_all_products()
        return self.prompt_builder.build_product_search_prompt(question, products)

    def _save_history(self, session_id: str, username: Optional[str], question: str, answer: str):
        if session_id not in self._history:
            self._history[session_id] = ConversationHistory(
                session_id=session_id,
                username=username
            )

        history = self._history[session_id]
        history.messages.append(ChatMessage(role=MessageRole.USER, content=question))
        history.messages.append(ChatMessage(role=MessageRole.ASSISTANT, content=answer))
        history.updated_at = datetime.utcnow()

        # Keep only last 20 messages
        if len(history.messages) > 20:
            history.messages = history.messages[-20:]

    def get_history(self, session_id: str) -> Optional[ConversationHistory]:
        return self._history.get(session_id)

    def _get_sources(self, intent: Intent) -> list[str]:
        sources = []
        if intent in [Intent.AVAILABILITY_CHECK, Intent.PRODUCT_SEARCH,
                      Intent.CATEGORY_SEARCH, Intent.PRICE_SEARCH, Intent.RECOMMENDATION]:
            sources.append("product-service")
        if intent in [Intent.STATS, Intent.ORDER_STATUS]:
            sources.append("order-service")
        return sources
