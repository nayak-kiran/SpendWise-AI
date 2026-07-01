import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("EMAIL_ADDRESS"),
    MAIL_PASSWORD=os.getenv("EMAIL_APP_PASSWORD"),
    MAIL_FROM=os.getenv("EMAIL_ADDRESS"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


async def send_budget_alert(to_email: str, username: str, month: str, percent_used: float, threshold: int):
    message = MessageSchema(
        subject=f"SpendWise AI: You've used {threshold}% of your {month} budget",
        recipients=[to_email],
        body=(
            f"Hi {username},\n\n"
            f"You've used {round(percent_used, 1)}% of your budget for {month}.\n"
            f"This crosses your {threshold}% alert threshold.\n\n"
            f"Log in to SpendWise AI to review your spending.\n\n"
            f"- SpendWise AI"
        ),
        subtype=MessageType.plain,
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    
