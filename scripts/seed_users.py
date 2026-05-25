import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.auth import hash_password
from api.db.session import get_db
from api.models.user import User


DEMO_USERS = [
    {
        "email_env": "DEMO_SUPERVISOR_EMAIL",
        "password_env": "DEMO_SUPERVISOR_PASSWORD",
        "email": "supervisor@example.com",
        "full_name": "Demo Supervisor",
        "role": "SUPERVISOR",
    },
    {
        "email_env": "DEMO_AGENT_EMAIL",
        "password_env": "DEMO_AGENT_PASSWORD",
        "email": "agent@example.com",
        "full_name": "Demo Agent",
        "role": "AGENT",
    },
    {
        "email_env": "DEMO_COMPLIANCE_EMAIL",
        "password_env": "DEMO_COMPLIANCE_PASSWORD",
        "email": "compliance@example.com",
        "full_name": "Demo Compliance Officer",
        "role": "COMPLIANCE",
    },
]


def seed_users() -> None:
    db = next(get_db())
    try:
        for item in DEMO_USERS:
            email = os.getenv(item["email_env"], item["email"])
            password = os.getenv(item["password_env"])
            if not password:
                print(f"Skipping {item['role']} user {email}: no password env var set")
                continue
            user = db.query(User).filter(User.email == email).first()
            if user is None:
                user = User(
                    email=email,
                    full_name=item["full_name"],
                    hashed_password=hash_password(password),
                    role=item["role"],
                    is_active=True,
                )
                db.add(user)
                print(f"Created {item['role']} user: {email}")
            else:
                user.full_name = item["full_name"]
                user.hashed_password = hash_password(password)
                user.role = item["role"]
                user.is_active = True
                print(f"Updated {item['role']} user: {email}")
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
