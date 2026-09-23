from app.database import SessionLocal
from app.models import User


db = SessionLocal()

try:
    user = db.query(User).filter(
        User.email == "sarthak@example.com"
    ).first()

    if user is None:
        print("User not found.")
    else:
        user.role = "admin"
        db.commit()

        print("User role updated successfully.")
        print("Email:", user.email)
        print("Role:", user.role)

finally:
    db.close()