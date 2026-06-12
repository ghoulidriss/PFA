"""
Data Service — fetches real data from product-service and order-service via REST.
This is what makes the chatbot "intelligent": it answers based on actual DB data.
"""

import httpx
import logging
from typing import Optional, List, Dict, Any
from app.models.chat import ProductData, StockStatsData, OrderStatsData

logger = logging.getLogger(__name__)


class DataService:

    def __init__(self, product_service_url: str, order_service_url: str):
        self.product_service_url = product_service_url
        self.order_service_url = order_service_url

    async def get_all_products(self) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.product_service_url}/api/products")
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching products: {e}")
                return []

    async def get_product_by_id(self, product_id: int) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.product_service_url}/api/products/{product_id}")
                if resp.status_code == 404:
                    return None
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching product {product_id}: {e}")
                return None

    async def search_products(self, query: str) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    f"{self.product_service_url}/api/products/search",
                    params={"name": query}
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error searching products: {e}")
                return []

    async def get_products_by_category(self, category: str) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.product_service_url}/api/products/category/{category}")
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching products by category: {e}")
                return []

    async def get_available_products(self) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.product_service_url}/api/products/available")
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching available products: {e}")
                return []

    async def get_products_by_max_price(self, max_price: float) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    f"{self.product_service_url}/api/products/price",
                    params={"maxPrice": max_price}
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching products by price: {e}")
                return []

    async def get_stock_stats(self) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.product_service_url}/api/products/stats")
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching stock stats: {e}")
                return None

    async def get_order_stats(self) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.order_service_url}/api/orders/stats")
                resp.raise_for_status()
                return resp.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching order stats: {e}")
                return None
