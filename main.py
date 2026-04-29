from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import quests, photos, scores, admin
from dotenv import load_dotenv
import uvicorn
import os

load_dotenv()

app = FastAPI(title="WaterQuest API", version="1.0.0")

# Allow the Vite dev server and Vercel deployments
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://aqua-quest-psi.vercel.app",
    os.environ.get("FRONTEND_URL", ""),
]
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(quests.router, prefix="/api/v1")
app.include_router(photos.router, prefix="/api/v1")
app.include_router(scores.router, prefix="/api/v1")
app.include_router(admin.router,  prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "WaterQuest API"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
