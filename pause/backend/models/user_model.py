"""User SQLAlchemy model and repository abstractions."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    verification_code = db.Column(db.String(10), nullable=True)
    verification_code_expiry = db.Column(db.BigInteger, nullable=True)
    reset_token = db.Column(db.Text, nullable=True)
    reset_token_expiry = db.Column(db.BigInteger, nullable=True)
    failed_login_attempts = db.Column(db.Integer, nullable=False, default=0)
    lock_until = db.Column(db.BigInteger, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    offers = db.relationship("OfferAnalysis", back_populates="user", cascade="all, delete-orphan")

    @property
    def verification_token(self) -> Optional[str]:
        return self.verification_code

    @verification_token.setter
    def verification_token(self, value: Optional[str]) -> None:
        self.verification_code = value

    @property
    def verification_token_expiry(self) -> Optional[int]:
        return self.verification_code_expiry

    @verification_token_expiry.setter
    def verification_token_expiry(self, value: Optional[int]) -> None:
        self.verification_code_expiry = value

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "password_hash": self.password_hash,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_verified": self.is_verified,
            "verification_token": self.verification_token,
            "verification_token_expiry": self.verification_token_expiry,
            "reset_token": self.reset_token,
            "reset_token_expiry": self.reset_token_expiry,
            "failed_login_attempts": self.failed_login_attempts,
            "lock_until": self.lock_until,
            "is_active": self.is_active,
        }


class UserRepository:
    """Database-backed repository for user operations."""

    @classmethod
    def create(cls, name: str, email: str, password_hash: str, role: str = "user") -> User:
        user = User(
            name=name,
            email=email.lower(),
            password_hash=password_hash,
            role=role,
            is_verified=True,
            verification_code=None,
            verification_code_expiry=None,
            reset_token=None,
            reset_token_expiry=None,
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        return user

    @classmethod
    def find_by_email(cls, email: str) -> Optional[User]:
        return User.query.filter_by(email=email.lower()).first()

    @classmethod
    def find_by_id(cls, user_id: int) -> Optional[User]:
        return db.session.get(User, user_id)

    @classmethod
    def delete_by_id(cls, user_id: int) -> bool:
        user = cls.find_by_id(user_id)
        if not user:
            return False

        db.session.delete(user)
        db.session.commit()
        return True

    @classmethod
    def list_all(cls) -> list[User]:
        return User.query.order_by(User.id.asc()).all()

    @classmethod
    def list_filtered(
        cls,
        *,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
    ) -> list[User]:
        query = User.query

        if search:
            normalized = f"%{search.strip().lower()}%"
            query = query.filter(db.func.lower(User.email).like(normalized))

        if role:
            query = query.filter(db.func.lower(User.role) == role.strip().lower())

        if status == "active":
            query = query.filter(User.is_active.is_(True))
        elif status == "disabled":
            query = query.filter(User.is_active.is_(False))

        return query.order_by(User.created_at.desc()).all()

    @classmethod
    def update_profile(
        cls,
        user_id: int,
        *,
        name: Optional[str] = None,
        email: Optional[str] = None,
    ) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        if name is not None:
            user.name = name.strip()

        if email is not None:
            normalized_email = email.strip().lower()
            existing = cls.find_by_email(normalized_email)
            if existing and existing.id != user_id:
                return None
            user.email = normalized_email

        db.session.commit()
        return user

    @classmethod
    def set_verification_code(cls, user_id: int, code: str, expiry_ts: int) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.verification_code = code
        user.verification_code_expiry = expiry_ts
        user.is_verified = False
        db.session.commit()
        return user

    @classmethod
    def mark_verified(cls, user_id: int) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.is_verified = True
        user.verification_code = None
        user.verification_code_expiry = None
        db.session.commit()
        return user

    @classmethod
    def set_reset_token(cls, user_id: int, token: str, expiry_ts: int) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.reset_token = token
        user.reset_token_expiry = expiry_ts
        db.session.commit()
        return user

    @classmethod
    def find_by_reset_token(cls, token: str) -> Optional[User]:
        return User.query.filter_by(reset_token=token).first()

    @classmethod
    def clear_reset_token(cls, user_id: int) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        return user

    @classmethod
    def set_password_hash(cls, user_id: int, password_hash: str) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.password_hash = password_hash
        db.session.commit()
        return user

    @classmethod
    def increment_failed_login(cls, user_id: int, *, lock_until: Optional[int] = None) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if lock_until is not None:
            user.lock_until = lock_until
        db.session.commit()
        return user

    @classmethod
    def reset_failed_login(cls, user_id: int) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.failed_login_attempts = 0
        user.lock_until = None
        db.session.commit()
        return user

    @classmethod
    def update_status(cls, user_id: int, *, is_active: bool) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.is_active = is_active
        if not is_active:
            user.lock_until = None
            user.failed_login_attempts = 0
        db.session.commit()
        return user

    @classmethod
    def update_role(cls, user_id: int, *, role: str) -> Optional[User]:
        user = cls.find_by_id(user_id)
        if not user:
            return None

        user.role = role
        db.session.commit()
        return user

    @classmethod
    def seed_admin(cls) -> None:
        """Seed one admin account for local testing only."""
        if not cls.find_by_email("admin@pause.local"):
            user = User(
                name="System Admin",
                email="admin@pause.local",
                password_hash="seeded-admin-hash",
                role="admin",
                is_verified=True,
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
