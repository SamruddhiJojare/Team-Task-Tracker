from rest_framework.exceptions import PermissionDenied

from .models import User


def require_admin(user):
    if user.role != User.ROLE_ADMIN:
        raise PermissionDenied("Only admins can perform this action.")


def is_team_member(user, team):
    return any(member.id == user.id for member in team.members)


def require_team_member(user, team):
    if not is_team_member(user, team):
        raise PermissionDenied("You are not a member of this team.")
