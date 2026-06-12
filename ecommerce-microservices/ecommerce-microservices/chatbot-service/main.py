from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from prometheus_client import make_asgi_app, Counter, Histogram
import time

# Prometheus metrics
REQUEST_COUNT = Counter("chatbot_requests_total", "Total chatbot requests", ["method", "endpoint", "status"])
REQUEST_DURATION = Histogram("chatbot_request_duration_seconds", "Request duration")

app = FastAPI(
    title="ShopBot — Chatbot AI Microservice",
    description="""
## Chatbot IA pour E-Commerce

Ce microservice reçoit des questions en **langage naturel** et y répond en utilisant
les **données réelles** du catalogue produits et des commandes.

### Flux de traitement :
1. Réception de la question via l'API Gateway
2. Détection de l'intention (disponibilité, recherche, stats, recommandation)
3. Requête REST vers le service produits/commandes
4. Construction du prompt enrichi avec les données réelles
5. Appel à l'API Google Gemini
6. Retour de la réponse formatée
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include routers
app.include_router(chat.router, prefix="/api/chatbot")


@app.middleware("http")
async def track_metrics(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    REQUEST_DURATION.observe(duration)
    return response


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "ShopBot Chatbot AI",
        "version": "1.0.0",
        "status": "UP",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
