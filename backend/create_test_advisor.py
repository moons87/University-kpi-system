"""Run with: python create_test_advisor.py"""
import secrets
from database import SessionLocal
from models.user import User
from routers.auth import pwd_context

db = SessionLocal()
try:
    password = secrets.token_urlsafe(14)
    existing = db.query(User).filter(User.email == "advisor@university.edu").first()
    if existing:
        existing.password_hash = pwd_context.hash(password)
        existing.role = "advisor"
        db.commit()
        print("Advisor аккаунты жаңартылды.")
    else:
        user = User(
            email="advisor@university.edu",
            password_hash=pwd_context.hash(password),
            role="advisor",
        )
        db.add(user)
        db.commit()
        print("Advisor жасалды: advisor@university.edu")
    print(f"Уақытша пароль: {password}")
    print("МАҢЫЗДЫ: Бұл парольді сақтаңыз.")
finally:
    db.close()
