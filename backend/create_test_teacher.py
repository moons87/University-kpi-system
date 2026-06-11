"""Run with: python create_test_teacher.py"""
import secrets
from database import SessionLocal
from models.teacher import Teacher
from models.user import User
from routers.auth import pwd_context

db = SessionLocal()
try:
    existing_user = db.query(User).filter(User.email == "teacher@university.edu").first()
    if existing_user:
        print("Оқытушы аккаунты бар!")
    else:
        new_teacher = Teacher(
            full_name="Смирнов Алексей Петрович",
            email="teacher@university.edu",
        )
        db.add(new_teacher)
        db.commit()
        db.refresh(new_teacher)

        password = secrets.token_urlsafe(14)
        new_user = User(
            email="teacher@university.edu",
            password_hash=pwd_context.hash(password),
            role="teacher",
            teacher_id=new_teacher.id,
        )
        db.add(new_user)
        db.commit()

        print(f"Оқытушы жасалды. ID: {new_teacher.id}")
        print(f"Email: teacher@university.edu")
        print(f"Уақытша пароль: {password}")
        print("МАҢЫЗДЫ: Бұл парольді сақтаңыз.")
except Exception as e:
    db.rollback()
    print("Қате:", e)
finally:
    db.close()
