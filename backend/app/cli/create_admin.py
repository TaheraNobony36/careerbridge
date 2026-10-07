from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest


def main() -> int:
    try:
        email = str(TypeAdapter(EmailStr).validate_python(input("Admin email: "))).strip().lower()
        password = getpass("Admin password: ")
        confirmation = getpass("Confirm password: ")
        validated = RegisterRequest(email=email, password=password)
    except (ValueError, ValidationError):
        print("Invalid admin email or password requirements.")
        return 1

    if password != confirmation:
        print("Passwords do not match.")
        return 1

    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first() is not None:
            print("An account with that email already exists.")
            return 1

        db.add(
            User(
                email=email,
                password_hash=hash_password(validated.password),
                role=UserRole.ADMIN.value,
                is_active=True,
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            print("An account with that email already exists.")
            return 1

    print(f"Admin account created for {email}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
