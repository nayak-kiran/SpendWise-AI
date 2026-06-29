import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

VALID_CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Entertainment", "Other"]


def categorize_expense(description: str) -> str:
    try:
        prompt = (
            f"Classify this expense description into exactly one of these categories: "
            f"{', '.join(VALID_CATEGORIES)}. "
            f"Respond with ONLY the category word, nothing else.\n\n"
            f"Expense description: {description}"
        )
        response = model.generate_content(prompt)
        category = response.text.strip()

        if category not in VALID_CATEGORIES:
            return "Uncategorized"
        return category
    except Exception:
        return "Uncategorized" 
