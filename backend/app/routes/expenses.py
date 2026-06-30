from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import get_db
from app import models, schemas
from app.routes.auth import SECRET_KEY, ALGORITHM

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user 

from app.gemini_service import categorize_expense


@router.post("/", response_model=schemas.ExpenseOut)
def add_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    category = categorize_expense(expense.description)

    new_expense = models.Expense(
        user_id=current_user.id,
        amount=expense.amount,
        description=expense.description,
        category=category,
        date=expense.date,
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

from typing import List


@router.get("/", response_model=List[schemas.ExpenseOut])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == current_user.id)
        .order_by(models.Expense.date.desc())
        .all()
    )
    return expenses

@router.put("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    updated_expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense.amount = updated_expense.amount
    expense.description = updated_expense.description
    expense.date = updated_expense.date
    expense.category = categorize_expense(updated_expense.description)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"detail": "Expense deleted successfully"}
