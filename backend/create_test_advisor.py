"""Run with: python create_test_advisor.py"""
from database import SessionLocal
from models.user import User
from routers.auth import pwd_context

db = SessionLocal()

try:
    existing = db.query(User).filter(User.email == "advisor@university.edu").first()
    if existing:
        existing.password_hash = pwd_context.hash("advisor123")
        existing.role = "advisor"
        db.commit()
        print("Updated existing user → role=advisor, password=advisor123")
    else:
        user = User(
            email="advisor@university.edu",
            password_hash=pwd_context.hash("advisor123"),
            role="advisor",
        )
        db.add(user)
        db.commit()
        print("Created advisor@university.edu / advisor123")
finally:
    db.close()
