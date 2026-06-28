from fastapi import FastAPI
from app.database import engine, Base
from app import models
from app.routes import auth

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def read_root():
    return {"message": "SpendWise AI backend is running"}


