from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.complaints import router as complaints_router
from api.routes.auth import router as auth_router
from api.routes.dashboard import router as dashboard_router
from api.routes.ai import router as ai_router
from api.routes.agents import router as agents_router
from api.routes.analytics import router as analytics_router
from api.routes.simulation import router as simulation_router
from api.routes.history import router as history_router
from apscheduler.schedulers.background import BackgroundScheduler
from services.sla_service import check_all_sla
from services.telegram_bot import start_telegram_bot
from contextlib import asynccontextmanager
from api.websocket import router as ws_router

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start SLA checking scheduler
    scheduler.add_job(check_all_sla, 'interval', minutes=1)
    scheduler.start()
    # Start Telegram Bot listener
    start_telegram_bot()
    yield
    scheduler.shutdown()

app = FastAPI(title="Customer Complaint Management API", version="1.0", lifespan=lifespan)

allow_origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(complaints_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(ai_router)
app.include_router(agents_router)
app.include_router(analytics_router)
app.include_router(simulation_router)
app.include_router(history_router)
app.include_router(ws_router, prefix="/api/v1")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

