from fastapi import FastAPI
from app.database import engine, Base
from app import models
from app.routes import auth , expenses

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])

@app.get("/")
def read_root():
    return {"message": "SpendWise AI backend is running"}


