from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from app.models.chat import ChatRequest, ChatResponse, ConversationHistory
from app.services.chat_service import ChatService
from app.dependencies import get_chat_service

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/", response_model=ChatResponse, summary="Send a question to the AI chatbot")
async def ask_chatbot(
    request: ChatRequest,
    x_auth_user: Optional[str] = Header(None),
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Send a natural language question and receive an AI-generated answer
    backed by real product/order data from the e-commerce platform.

    Examples:
    - "Est-ce que le produit 5 est disponible ?"
    - "Je cherche des laptops"
    - "Combien de produits sont en stock ?"
    - "Recommande-moi quelque chose dans l'électronique"
    - "Produits à moins de 500 DT"
    """
    if x_auth_user:
        request.username = x_auth_user

    try:
        return await chat_service.process_question(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")


@router.get("/history/{session_id}", response_model=ConversationHistory,
            summary="Get conversation history")
async def get_history(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service)
):
    history = chat_service.get_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session not found")
    return history


@router.get("/health", summary="Health check")
async def health():
    return {"status": "UP", "service": "chatbot-service"}
