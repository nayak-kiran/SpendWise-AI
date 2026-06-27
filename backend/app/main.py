from fastapi import FastAPI
from app.database import engine, Base
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "SpendWise AI backend is running"}

