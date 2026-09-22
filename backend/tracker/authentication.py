from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from django.conf import settings
from mongoengine.errors import DoesNotExist, ValidationError
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import User


def create_token(user, token_type):
    now = datetime.now(timezone.utc)
    if token_type == "access":
        expires = now + timedelta(minutes=settings.JWT_ACCESS_MINUTES)
    elif token_type == "refresh":
        expires = now + timedelta(days=settings.JWT_REFRESH_DAYS)
    else:
        raise ValueError("Unsupported token type")

    payload = {
        "sub": str(user.id),
        "type": token_type,
        "iat": now,
        "exp": expires,
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def token_pair(user):
    return {
        "access": create_token(user, "access"),
        "refresh": create_token(user, "refresh"),
    }


def decode_token(token, expected_type=None):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationFailed("Token has expired.") from exc
    except jwt.PyJWTError as exc:
        raise AuthenticationFailed("Invalid token.") from exc

    if expected_type and payload.get("type") != expected_type:
        raise AuthenticationFailed(f"Expected a {expected_type} token.")
    return payload


def user_from_payload(payload):
    try:
        return User.objects.get(id=payload.get("sub"))
    except (DoesNotExist, ValidationError, TypeError) as exc:
        raise AuthenticationFailed("User no longer exists.") from exc


class MongoJWTAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header:
            return None
        if len(header) != 2 or header[0].decode().lower() != self.keyword.lower():
            raise AuthenticationFailed("Authorization header must be 'Bearer <token>'.")

        try:
            raw_token = header[1].decode()
        except UnicodeError as exc:
            raise AuthenticationFailed("Invalid token header.") from exc

        payload = decode_token(raw_token, "access")
        return user_from_payload(payload), payload

    def authenticate_header(self, request):
        return self.keyword
