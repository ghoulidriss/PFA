"""
Unit tests for IntentDetector (TDD approach: Red → Green → Refactor)
"""
import pytest
from app.services.intent_detector import IntentDetector, Intent


class TestIntentDetector:
    """TDD Unit Tests for Intent Detection"""

    def setup_method(self):
        self.detector = IntentDetector()

    # ===== RED PHASE: write tests first =====

    def test_detect_availability_by_product_id(self):
        """[TDD-RED] Should detect availability check with product ID"""
        intent, param = self.detector.detect("Est-ce que le produit id 5 est disponible ?")
        assert intent == Intent.AVAILABILITY_CHECK
        assert param == "5"

    def test_detect_availability_by_article_id(self):
        """[TDD-RED] Should detect article ID pattern"""
        intent, param = self.detector.detect("L'article 102 est-il en stock ?")
        assert intent == Intent.AVAILABILITY_CHECK
        assert param == "102"

    def test_detect_stats_intent(self):
        """[TDD-RED] Should detect statistics questions"""
        intent, param = self.detector.detect("Combien de produits sont en stock ?")
        assert intent == Intent.STATS
        assert param is None

    def test_detect_recommendation_intent(self):
        """[TDD-RED] Should detect recommendation requests"""
        intent, param = self.detector.detect("Qu'est-ce que tu me recommandes comme produit ?")
        assert intent == Intent.RECOMMENDATION

    def test_detect_price_search_with_amount(self):
        """[TDD-RED] Should extract max price from query"""
        intent, param = self.detector.detect("Je veux des produits à moins de 500 DT")
        assert intent == Intent.PRICE_SEARCH
        assert param == "500"

    def test_detect_general_search_fallback(self):
        """[TDD-RED] Fallback to general search for unrecognized intent"""
        intent, param = self.detector.detect("Je cherche un laptop performant")
        assert intent == Intent.PRODUCT_SEARCH

    def test_detect_stats_with_order_keywords(self):
        """[TDD-GREEN] Order-related statistics"""
        intent, _ = self.detector.detect("Combien de commandes sont en cours ?")
        assert intent == Intent.STATS

    def test_detect_recommendation_conseil(self):
        """[TDD-GREEN] Recommendation with 'conseil' keyword"""
        intent, _ = self.detector.detect("Donne-moi un conseil pour choisir un téléphone")
        assert intent == Intent.RECOMMENDATION


class TestPromptBuilder:
    """Unit tests for PromptBuilder"""

    def setup_method(self):
        from app.services.prompt_builder import PromptBuilder
        self.builder = PromptBuilder()

    def test_prompt_contains_system_context(self):
        prompt = self.builder.build_general_prompt("question?", {"data": "value"})
        assert "ShopBot E-Commerce" in prompt
        assert "question?" in prompt

    def test_product_availability_prompt_with_product(self):
        product = {"id": 1, "name": "Laptop", "status": "AVAILABLE", "stockQuantity": 5}
        prompt = self.builder.build_product_availability_prompt("Disponible ?", product)
        assert "Laptop" in prompt
        assert "AVAILABLE" in prompt

    def test_product_availability_prompt_without_product(self):
        prompt = self.builder.build_product_availability_prompt("Disponible ?", None)
        assert "Aucun produit trouvé" in prompt

    def test_stock_stats_prompt_with_data(self):
        stats = {"totalProducts": 100, "availableProducts": 80}
        prompt = self.builder.build_stock_stats_prompt("Combien ?", stats)
        assert "100" in prompt
        assert "80" in prompt
