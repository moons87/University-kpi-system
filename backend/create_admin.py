"""
Run once to create the admin account:
    python create_admin.py

A cryptographically secure temporary password is generated and printed ONCE.
Store it in a password manager immediately.
"""
import secrets
from database import SessionLocal
from models.user import User
from routers.auth import pwd_context

EMAIL = "admin@university.edu"

db = SessionLocal()
try:
    if db.query(User).filter(User.email == EMAIL).first():
        print("Админ аккаунты бар. Жаңа аккаунт жасалмады.")
    else:
        password = secrets.token_urlsafe(16)
        db.add(User(
            email=EMAIL,
            password_hash=pwd_context.hash(password),
            role="admin",
        ))
        db.commit()
        print("Админ жасалды.")
        print(f"  Email:    {EMAIL}")
        print(f"  Пароль:   {password}")
        print("  МАҢЫЗДЫ: Бұл парольді дереу сақтаңыз. Ол қайтадан көрсетілмейді.")
except Exception as e:
    db.rollback()
    print("Қате:", e)
finally:
    db.close()
