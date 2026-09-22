from rest_framework import serializers

from .models import Task, User


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.ROLE_MEMBER)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects(email=value).first():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class TeamCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(max_length=1000, allow_blank=True, required=False, default="")


class InviteSerializer(serializers.Serializer):
    email = serializers.EmailField()


class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(max_length=3000, allow_blank=True, required=False, default="")
    assigned_to = serializers.CharField()
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=False, default=Task.STATUS_PENDING)


class TaskUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(max_length=3000, allow_blank=True, required=False)
    assigned_to = serializers.CharField(required=False)
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=False)


class CommentSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=2000, allow_blank=False, trim_whitespace=True)
