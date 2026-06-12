"""
Liste les modèles disponibles et trouve lequel marche — python3 test_gemini.py
"""
import os, sys

api_key = None
for line in open(os.path.join(os.path.dirname(__file__), ".env")):
    if line.strip().startswith("GEMINI_API_KEY="):
        api_key = line.strip().split("=", 1)[1].strip()
        break

if not api_key:
    print("❌ Clé introuvable"); sys.exit(1)

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("pip install google-genai --break-system-packages"); sys.exit(1)

client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})

# Liste tous les modèles disponibles
print("📋 Modèles disponibles pour ta clé :\n")
try:
    models = client.models.list()
    generate_models = []
    for m in models:
        if hasattr(m, 'supported_actions') and 'generateContent' in str(m.supported_actions):
            print(f"  ✅ {m.name}")
            generate_models.append(m.name)
        else:
            print(f"  ➖ {m.name}")
except Exception as e:
    print(f"❌ Erreur listing: {e}")
    generate_models = []

# Teste quelques modèles connus
print("\n🧪 Test de génération sur modèles courants :\n")
MODELS_TO_TRY = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview-05-20",
    "gemini-pro",
]

working = None
for model in MODELS_TO_TRY:
    try:
        resp = client.models.generate_content(
            model=model,
            contents="Dis: OK",
            config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=5)
        )
        print(f"  ✅ {model} → {resp.text.strip()}")
        working = model
        break
    except Exception as e:
        err = str(e)[:80]
        print(f"  ❌ {model} → {err}")

if working:
    print(f"\n🎯 Modèle qui marche : {working}")
    print(f"   → Ajoute dans .env :  GEMINI_MODEL={working}")
    print(f"   → Puis : docker compose up -d --build chatbot-service")
else:
    print("\n⚠️  Aucun modèle ne fonctionne avec cette clé.")
    print("   Le projet a probablement le quota à 0 (limit: 0).")
    print("   Solution : créer une NOUVELLE clé sur un autre compte Google.")
    print("   → https://aistudio.google.com  (connecte-toi avec un autre compte Google)")
