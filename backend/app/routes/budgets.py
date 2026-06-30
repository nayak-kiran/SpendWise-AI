from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.routes.expenses import get_current_user
from sqlalchemy import func as sql_func
from datetime import date

router = APIRouter()


@router.post("/", response_model=schemas.BudgetOut)
def set_budget(
    budget: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing_budget = (
        db.query(models.Budget)
        .filter(models.Budget.user_id == current_user.id, models.Budget.month == budget.month)
        .first()
    )

    if existing_budget:
        existing_budget.amount = budget.amount
        db.commit()
        db.refresh(existing_budget)
        return existing_budget

    new_budget = models.Budget(
        user_id=current_user.id,
        month=budget.month,
        amount=budget.amount,
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget 

@router.get("/status/{month}")
def get_budget_status(
    month: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = (
        db.query(models.Budget)
        .filter(models.Budget.user_id == current_user.id, models.Budget.month == month)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="No budget set for this month")

    total_spent = (
        db.query(sql_func.sum(models.Expense.amount))
        .filter(
            models.Expense.user_id == current_user.id,
            sql_func.strftime("%Y-%m", models.Expense.date) == month,
        )
        .scalar()
    ) or 0

    remaining = budget.amount - total_spent
    percent_used = (total_spent / budget.amount * 100) if budget.amount > 0 else 0

    return {
        "month": month,
        "budget": budget.amount,
        "total_spent": total_spent,
        "remaining": remaining,
        "percent_used": round(percent_used, 2),
    }