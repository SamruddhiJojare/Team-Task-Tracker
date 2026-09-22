from mongoengine.errors import DoesNotExist, NotUniqueError, ValidationError
from mongoengine.connection import get_db
from pymongo.errors import PyMongoError
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import decode_token, token_pair, user_from_payload
from .models import Activity, Comment, Invitation, Task, Team, User, utcnow
from .permissions import require_admin, require_team_member
from .presenters import activity_data, comment_data, task_data, team_data, user_data
from .serializers import (
    CommentSerializer,
    InviteSerializer,
    LoginSerializer,
    RefreshSerializer,
    RegisterSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TeamCreateSerializer,
)


def get_team(team_id):
    try:
        return Team.objects.get(id=team_id)
    except (DoesNotExist, ValidationError) as exc:
        raise NotFound("Team not found.") from exc


def get_task(task_id):
    try:
        return Task.objects.get(id=task_id)
    except (DoesNotExist, ValidationError) as exc:
        raise NotFound("Task not found.") from exc


def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except (DoesNotExist, ValidationError) as exc:
        raise NotFound("Assigned user not found.") from exc


def record_activity(team, task, actor, action, message, metadata=None):
    return Activity(
        team=team,
        task=task,
        actor=actor,
        action=action,
        message=message,
        metadata=metadata or {},
    ).save()


def add_member(team, user):
    if not any(member.id == user.id for member in team.members):
        team.members.append(user)
        team.save()


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            get_db().command("ping")
        except PyMongoError:
            return Response({"status": "unavailable", "detail": "MongoDB is not reachable."}, status=503)
        return Response({"status": "ok"})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User(name=data["name"], email=data["email"], role=data["role"])
        user.set_password(data["password"])
        try:
            user.save()
        except NotUniqueError:
            return Response({"email": ["A user with this email already exists."]}, status=400)

        # A pending simulated invitation is accepted when its email registers.
        for invitation in Invitation.objects(email=user.email, status=Invitation.STATUS_PENDING):
            add_member(invitation.team, user)
            invitation.status = Invitation.STATUS_ACCEPTED
            invitation.save()
            record_activity(
                invitation.team,
                None,
                user,
                Activity.ACTION_MEMBER_JOINED,
                f"{user.name} joined the team.",
            )

        return Response({"user": user_data(user), **token_pair(user)}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = User.objects(email=email).first()
        if not user or not user.check_password(serializer.validated_data["password"]):
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({"user": user_data(user), **token_pair(user)})


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = decode_token(serializer.validated_data["refresh"], "refresh")
        user = user_from_payload(payload)
        return Response(token_pair(user))


class MeView(APIView):
    def get(self, request):
        return Response(user_data(request.user))


class TeamListCreateView(APIView):
    def get(self, request):
        teams = Team.objects(members=request.user).order_by("-created_at")
        return Response([team_data(team) for team in teams])

    def post(self, request):
        require_admin(request.user)
        serializer = TeamCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = Team(
            **serializer.validated_data,
            created_by=request.user,
            members=[request.user],
        ).save()
        record_activity(
            team,
            None,
            request.user,
            Activity.ACTION_TEAM_CREATED,
            f'{request.user.name} created team "{team.name}".',
        )
        return Response(team_data(team), status=status.HTTP_201_CREATED)


class TeamDetailView(APIView):
    def get(self, request, team_id):
        team = get_team(team_id)
        require_team_member(request.user, team)
        return Response(team_data(team))


class TeamInviteView(APIView):
    def post(self, request, team_id):
        team = get_team(team_id)
        require_team_member(request.user, team)
        require_admin(request.user)
        serializer = InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        existing = User.objects(email=email).first()
        if existing:
            if any(member.id == existing.id for member in team.members):
                return Response({"detail": "This user is already a team member."}, status=400)
            add_member(team, existing)
            invite_status = Invitation.STATUS_ACCEPTED
            message = f"{request.user.name} added {existing.name} to the team."
        else:
            invite_status = Invitation.STATUS_PENDING
            message = f"{request.user.name} invited {email} to the team."

        invitation = Invitation.objects(team=team, email=email).first()
        if invitation:
            invitation.status = invite_status
            invitation.invited_by = request.user
            invitation.save()
        else:
            invitation = Invitation(
                team=team,
                email=email,
                invited_by=request.user,
                status=invite_status,
            ).save()

        record_activity(
            team,
            None,
            request.user,
            Activity.ACTION_MEMBER_INVITED,
            message,
            {"email": email, "invitation_status": invite_status},
        )
        return Response(
            {
                "id": str(invitation.id),
                "email": email,
                "status": invite_status,
                "member": user_data(existing) if existing else None,
            },
            status=status.HTTP_201_CREATED,
        )


class TeamTaskListCreateView(APIView):
    def get(self, request, team_id):
        team = get_team(team_id)
        require_team_member(request.user, team)
        tasks = Task.objects(team=team)
        requested_status = request.query_params.get("status")
        if requested_status:
            if requested_status not in Task.STATUS_CHOICES:
                return Response({"status": ["Invalid task status."]}, status=400)
            tasks = tasks.filter(status=requested_status)
        return Response([task_data(task) for task in tasks.order_by("-updated_at")])

    def post(self, request, team_id):
        team = get_team(team_id)
        require_team_member(request.user, team)
        serializer = TaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        assignee = get_user(data.pop("assigned_to"))
        if not any(member.id == assignee.id for member in team.members):
            raise PermissionDenied("Tasks can only be assigned to team members.")

        task = Task(
            **data,
            assigned_to=assignee,
            team=team,
            created_by=request.user,
        ).save()
        record_activity(
            team,
            task,
            request.user,
            Activity.ACTION_TASK_CREATED,
            f'{request.user.name} created task "{task.title}" and assigned it to {assignee.name}.',
        )
        return Response(task_data(task), status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    def get(self, request, task_id):
        task = get_task(task_id)
        require_team_member(request.user, task.team)
        return Response(task_data(task))

    def patch(self, request, task_id):
        task = get_task(task_id)
        require_team_member(request.user, task.team)
        serializer = TaskUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        changed_fields = []
        old_status = task.status
        if "assigned_to" in data:
            assignee = get_user(data.pop("assigned_to"))
            if not any(member.id == assignee.id for member in task.team.members):
                raise PermissionDenied("Tasks can only be assigned to team members.")
            if task.assigned_to.id != assignee.id:
                task.assigned_to = assignee
                changed_fields.append("assignee")

        for field, value in data.items():
            if getattr(task, field) != value:
                setattr(task, field, value)
                changed_fields.append(field)

        if not changed_fields:
            return Response(task_data(task))

        task.updated_at = utcnow()
        task.save()

        if "status" in changed_fields:
            labels = {"pending": "Pending", "in_progress": "In Progress", "done": "Done"}
            message = f'{request.user.name} changed status of "{task.title}" to {labels[task.status]}.'
        else:
            message = f'{request.user.name} updated "{task.title}".'

        record_activity(
            task.team,
            task,
            request.user,
            Activity.ACTION_TASK_UPDATED,
            message,
            {"changed_fields": changed_fields, "previous_status": old_status},
        )
        return Response(task_data(task))

    def delete(self, request, task_id):
        task = get_task(task_id)
        require_team_member(request.user, task.team)
        team = task.team
        title = task.title
        Comment.objects(task=task).delete()
        task.delete()
        record_activity(
            team,
            None,
            request.user,
            Activity.ACTION_TASK_DELETED,
            f'{request.user.name} deleted task "{title}".',
            {"task_title": title},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskCommentView(APIView):
    def get(self, request, task_id):
        task = get_task(task_id)
        require_team_member(request.user, task.team)
        comments = Comment.objects(task=task).order_by("created_at")
        return Response([comment_data(comment) for comment in comments])

    def post(self, request, task_id):
        task = get_task(task_id)
        require_team_member(request.user, task.team)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = Comment(task=task, author=request.user, **serializer.validated_data).save()
        task.updated_at = utcnow()
        task.save()
        record_activity(
            task.team,
            task,
            request.user,
            Activity.ACTION_TASK_COMMENTED,
            f'{request.user.name} commented on "{task.title}".',
            {"comment_id": str(comment.id)},
        )
        return Response(comment_data(comment), status=status.HTTP_201_CREATED)


class TeamActivityView(APIView):
    def get(self, request, team_id):
        team = get_team(team_id)
        require_team_member(request.user, team)
        # ObjectId is a stable tie-breaker because MongoDB stores datetimes at
        # millisecond precision and several actions can land in the same tick.
        activities = Activity.objects(team=team).order_by("-created_at", "-id")[:100]
        return Response([activity_data(activity) for activity in activities])
