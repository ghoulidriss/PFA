"""
Unit tests for ChatService with mocked dependencies.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from app.models.chat import ChatRequest
from app.services.chat_service import ChatService
from app.services.intent_detector import Intent


class TestChatService:

    def setup_method(self):
        self.mock_data_service = MagicMock()
        self.mock_ai_service = MagicMock()
        self.chat_service = ChatService(
            data_service=self.mock_data_service,
            ai_service=self.mock_ai_service
        )

    def test_get_history_returns_none_for_unknown_session(self):
        history = self.chat_service.get_history("unknown-session")
        assert history is None

    def test_save_and_get_history(self):
        self.chat_service._save_history("sess1", "user1", "Question?", "Réponse.")
        history = self.chat_service.get_history("sess1")
        assert history is not None
        assert history.session_id == "sess1"
        assert len(history.messages) == 2
        assert history.messages[0].content == "Question?"
        assert history.messages[1].content == "Réponse."

    def test_history_limited_to_20_messages(self):
        for i in range(12):
            self.chat_service._save_history("sess2", "user1", f"Q{i}", f"A{i}")
        history = self.chat_service.get_history("sess2")
        assert len(history.messages) <= 20

    def test_get_sources_for_product_intent(self):
        sources = self.chat_service._get_sources(Intent.PRODUCT_SEARCH)
        assert "product-service" in sources

    def test_get_sources_for_stats_intent(self):
        sources = self.chat_service._get_sources(Intent.STATS)
        assert "order-service" in sources

    @pytest.mark.asyncio
    async def test_process_question_generates_session_id(self):
        self.mock_data_service.search_products = AsyncMock(return_value=[])
        self.mock_data_service.get_all_products = AsyncMock(return_value=[])
        self.mock_ai_service.generate_response = AsyncMock(return_value="Réponse test.")

        request = ChatRequest(question="Test question", username="testuser")
        response = await self.chat_service.process_question(request)

        assert response.session_id is not None
        assert len(response.session_id) > 0
        assert response.answer == "Réponse test."

    @pytest.mark.asyncio
    async def test_process_question_stats_fetches_both_services(self):
        self.mock_data_service.get_stock_stats = AsyncMock(return_value={"totalProducts": 50})
        self.mock_data_service.get_order_stats = AsyncMock(return_value={"total": 100})
        self.mock_ai_service.generate_response = AsyncMock(return_value="Stats: 50 produits.")

        request = ChatRequest(question="Combien de produits en stock ?")
        response = await self.chat_service.process_question(request)

        self.mock_data_service.get_stock_stats.assert_called_once()
        self.mock_data_service.get_order_stats.assert_called_once()
        assert "Stats" in response.answer

    @pytest.mark.asyncio
    async def test_process_question_uses_existing_session(self):
        self.mock_data_service.search_products = AsyncMock(return_value=[])
        self.mock_data_service.get_all_products = AsyncMock(return_value=[])
        self.mock_ai_service.generate_response = AsyncMock(return_value="Réponse.")

        request = ChatRequest(question="Bonjour", session_id="existing-session")
        response = await self.chat_service.process_question(request)

        assert response.session_id == "existing-session"
