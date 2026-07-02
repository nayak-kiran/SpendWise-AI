from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from pydantic import BaseModel
import asyncio
from app.database import get_db
from app import models, schemas
from app.routes.expenses import get_current_user
from app.email_service import send_budget_alert

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


class BudgetAdjust(BaseModel):
    month: str
    amount: float
    action: str


@router.post("/adjust")
def adjust_budget(
    adjustment: BudgetAdjust,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = (
        db.query(models.Budget)
        .filter(models.Budget.user_id == current_user.id, models.Budget.month == adjustment.month)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="No budget set for this month")

    if adjustment.action == "add":
        budget.amount += adjustment.amount
    elif adjustment.action == "withdraw":
        budget.amount = max(0, budget.amount - adjustment.amount)
    else:
        raise HTTPException(status_code=400, detail="Action must be 'add' or 'withdraw'")

    db.commit()
    db.refresh(budget)
    return {"message": "Budget updated successfully", "new_amount": budget.amount}


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

    for threshold in [100, 80]:
        if percent_used >= threshold:
            already_sent = (
                db.query(models.AlertSent)
                .filter(
                    models.AlertSent.user_id == current_user.id,
                    models.AlertSent.month == month,
                    models.AlertSent.threshold == threshold,
                )
                .first()
            )
            if not already_sent:
                asyncio.run(
                    send_budget_alert(current_user.email, current_user.username, month, percent_used, threshold)
                )
                new_alert = models.AlertSent(user_id=current_user.id, month=month, threshold=threshold)
                db.add(new_alert)
                db.commit()
            break

    return {
        "month": month,
        "budget": budget.amount,
        "total_spent": total_spent,
        "remaining": remaining,
        "percent_used": round(percent_used, 2),
    }