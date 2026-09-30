import os, uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from livekit import api

BASE = Path(__file__).parent
app = FastAPI(title="AURA Web")
app.mount("/static", StaticFiles(directory=BASE / "public"), name="static")

@app.get("/")
def index():
    return FileResponse(BASE / "public" / "index.html")

@app.get("/api/config")
def config():
    url = os.getenv("LIVEKIT_URL", "").strip()
    ready = bool(url and os.getenv("LIVEKIT_API_KEY") and os.getenv("LIVEKIT_API_SECRET"))
    return {"ready": ready, "livekitUrl": url}

@app.post("/api/token")
def token():
    key = os.getenv("LIVEKIT_API_KEY", "").strip()
    secret = os.getenv("LIVEKIT_API_SECRET", "").strip()
    url = os.getenv("LIVEKIT_URL", "").strip()
    if not (key and secret and url):
        raise HTTPException(503, "LiveKit server credentials are not configured")
    room = "aura-" + uuid.uuid4().hex[:12]
    identity = "student-" + uuid.uuid4().hex[:8]
    access = api.AccessToken(key, secret).with_identity(identity).with_grants(
        api.VideoGrants(room_join=True, room=room, can_publish=True, can_subscribe=True)
    )
    return {"token": access.to_jwt(), "serverUrl": url, "room": room, "identity": identity}

@app.get("/api/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
