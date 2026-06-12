"""
Prompt Builder — constructs the contextual prompt sent to Google Gemini.
Pattern: System context + Real data from DB + User question.
"""

import json
from typing import List, Dict, Any, Optional


class PromptBuilder:

    SYSTEM_CONTEXT = """Tu es l'assistant IA de ShopBot E-Commerce. Tu aides les clients à :
- Vérifier la disponibilité des produits
- Rechercher des produits par nom, catégorie ou prix
- Obtenir des statistiques sur le catalogue et les commandes
- Avoir des recommandations personnalisées

RÈGLES IMPORTANTES :
1. Réponds UNIQUEMENT en te basant sur les données JSON fournies ci-dessous
2. Si une information n'est pas dans les données, dis-le clairement
3. Sois concis, précis et utile
4. Formule des réponses en français
5. Pour les prix, affiche toujours la devise (DT pour dinars tunisiens)
6. Indique clairement la disponibilité : ✅ Disponible, ❌ Épuisé, 🚫 Discontinué
"""

    def build_product_availability_prompt(self, question: str, product: Optional[Dict]) -> str:
        if product is None:
            data_context = "Aucun produit trouvé avec cet identifiant."
        else:
            data_context = json.dumps(product, ensure_ascii=False, indent=2)

        return self._format_prompt(question, data_context, "disponibilité produit")

    def build_product_search_prompt(self, question: str, products: List[Dict]) -> str:
        if not products:
            data_context = "Aucun produit trouvé correspondant à votre recherche."
        else:
            data_context = json.dumps(products[:10], ensure_ascii=False, indent=2)  # max 10 results

        return self._format_prompt(question, data_context, "recherche produits")

    def build_stock_stats_prompt(self, question: str, stats: Optional[Dict], order_stats: Optional[Dict] = None) -> str:
        context_data = {}
        if stats:
            context_data["stock_catalogue"] = stats
        if order_stats:
            context_data["statistiques_commandes"] = order_stats

        if not context_data:
            data_context = "Impossible de récupérer les statistiques pour le moment."
        else:
            data_context = json.dumps(context_data, ensure_ascii=False, indent=2)

        return self._format_prompt(question, data_context, "statistiques")

    def build_recommendation_prompt(self, question: str, products: List[Dict]) -> str:
        if not products:
            data_context = "Aucun produit disponible pour une recommandation."
        else:
            available = [p for p in products if p.get("status") == "AVAILABLE"]
            data_context = json.dumps(available[:8], ensure_ascii=False, indent=2)

        return self._format_prompt(question, data_context, "recommandation")

    def build_general_prompt(self, question: str, context_data: Dict) -> str:
        data_context = json.dumps(context_data, ensure_ascii=False, indent=2)
        return self._format_prompt(question, data_context, "général")

    def _format_prompt(self, question: str, data_context: str, intent: str) -> str:
        return f"""{self.SYSTEM_CONTEXT}

--- DONNÉES RÉELLES DE LA BASE DE DONNÉES ({intent}) ---
{data_context}
--- FIN DES DONNÉES ---

Question de l'utilisateur : {question}

Réponse de l'assistant :"""
