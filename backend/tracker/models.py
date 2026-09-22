from datetime import datetime, timezone

from django.contrib.auth.hashers import check_password, make_password
from mongoengine import (
    CASCADE,
    NULLIFY,
    DateTimeField,
    DictField,
    Document,
    EmailField,
    ListField,
    ReferenceField,
    StringField,
)


def utcnow():
    return datetime.now(timezone.utc)


class User(Document):
    ROLE_ADMIN = "admin"
    ROLE_MEMBER = "member"
    ROLE_CHOICES = (ROLE_ADMIN, ROLE_MEMBER)

    name = StringField(required=True, max_length=120)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(required=True, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    created_at = DateTimeField(default=utcnow)

    meta = {"collection": "users", "indexes": ["email"]}

    @property
    def is_authenticated(self):
        return True

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def save(self, *args, **kwargs):
        self.email = self.email.strip().lower()
        return super().save(*args, **kwargs)


class Team(Document):
    name = StringField(required=True, max_length=120)
    description = StringField(default="", max_length=1000)
    created_by = ReferenceField(User, required=True, reverse_delete_rule=NULLIFY)
    members = ListField(ReferenceField(User), default=list)
    created_at = DateTimeField(default=utcnow)

    meta = {"collection": "teams", "indexes": ["members", "-created_at"]}


class Invitation(Document):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"

    team = ReferenceField(Team, required=True, reverse_delete_rule=CASCADE)
    email = EmailField(required=True)
    invited_by = ReferenceField(User, required=True, reverse_delete_rule=NULLIFY)
    status = StringField(choices=(STATUS_PENDING, STATUS_ACCEPTED), default=STATUS_PENDING)
    created_at = DateTimeField(default=utcnow)

    meta = {
        "collection": "invitations",
        "indexes": ["email", "team", {"fields": ["team", "email"], "unique": True}],
    }

    def save(self, *args, **kwargs):
        self.email = self.email.strip().lower()
        return super().save(*args, **kwargs)


class Task(Document):
    STATUS_PENDING = "pending"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_DONE = "done"
    STATUS_CHOICES = (STATUS_PENDING, STATUS_IN_PROGRESS, STATUS_DONE)

    title = StringField(required=True, max_length=200)
    description = StringField(default="", max_length=3000)
    assigned_to = ReferenceField(User, required=True, reverse_delete_rule=NULLIFY)
    status = StringField(required=True, choices=STATUS_CHOICES, default=STATUS_PENDING)
    team = ReferenceField(Team, required=True, reverse_delete_rule=CASCADE)
    created_by = ReferenceField(User, required=True, reverse_delete_rule=NULLIFY)
    created_at = DateTimeField(default=utcnow)
    updated_at = DateTimeField(default=utcnow)

    meta = {"collection": "tasks", "indexes": ["team", "status", "assigned_to", "-updated_at"]}


class Comment(Document):
    task = ReferenceField(Task, required=True, reverse_delete_rule=CASCADE)
    author = ReferenceField(User, required=True, reverse_delete_rule=NULLIFY)
    body = StringField(required=True, max_length=2000)
    created_at = DateTimeField(default=utcnow)

    meta = {"collection": "comments", "indexes": ["task", "created_at"]}


class Activity(Document):
    ACTION_TASK_CREATED = "task_created"
    ACTION_TASK_UPDATED = "task_updated"
    ACTION_TASK_COMMENTED = "task_commented"
    ACTION_TASK_DELETED = "task_deleted"
    ACTION_TEAM_CREATED = "team_created"
    ACTION_MEMBER_INVITED = "member_invited"
    ACTION_MEMBER_JOINED = "member_joined"

    team = ReferenceField(Team, required=True, reverse_delete_rule=CASCADE)
    task = ReferenceField(Task, required=False, null=True, reverse_delete_rule=NULLIFY)
    actor = ReferenceField(User, required=True, reverse_delete_rule=NULLIFY)
    action = StringField(required=True, max_length=40)
    message = StringField(required=True, max_length=500)
    metadata = DictField(default=dict)
    created_at = DateTimeField(default=utcnow)

    meta = {"collection": "activities", "indexes": ["team", "-created_at"]}
