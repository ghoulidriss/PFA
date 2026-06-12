from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="User's question in natural language")
    session_id: Optional[str] = Field(None, description="Session ID for conversation history")
    username: Optional[str] = Field(None, description="Authenticated username")


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    sources: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ConversationHistory(BaseModel):
    session_id: str
    username: Optional[str]
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductData(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    category: str
    stockQuantity: int
    status: str


class StockStatsData(BaseModel):
    totalProducts: int
    availableProducts: int
    outOfStockProducts: int
    discontinuedProducts: int
    totalStockUnits: int


class OrderStatsData(BaseModel):
    total: int
    pending: int
    confirmed: int
    shipped: int
    delivered: int
    cancelled: int
