from pydantic import BaseModel, EmailStr
from datetime import date as date_type


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str 

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    amount: float
    description: str
    date: date_type

class ExpenseOut(BaseModel):
    id: int
    amount: float
    description: str
    category: str
    date: date_type

    class Config:
        from_attributes = True

class BudgetCreate(BaseModel):
    month: str
    amount: float


class BudgetOut(BaseModel):
    id: int
    month: str
    amount: float

    class Config:
        from_attributes = True
        

