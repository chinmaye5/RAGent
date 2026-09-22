import logging
from fastapi import FastAPI
from app.api.routes.health import router as health_router
from app.api.routes.documents import router as document_router
from app.api.routes.db_test import router as db_test_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Server running succesfully!"}

app.include_router(health_router)
app.include_router(document_router)
app.include_router(db_test_router)