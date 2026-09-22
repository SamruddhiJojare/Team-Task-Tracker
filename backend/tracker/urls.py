from django.urls import path

from .views import (
    HealthView,
    LoginView,
    MeView,
    RefreshView,
    RegisterView,
    TaskCommentView,
    TaskDetailView,
    TeamActivityView,
    TeamDetailView,
    TeamInviteView,
    TeamListCreateView,
    TeamTaskListCreateView,
)


urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("teams/", TeamListCreateView.as_view(), name="teams"),
    path("teams/<str:team_id>/", TeamDetailView.as_view(), name="team-detail"),
    path("teams/<str:team_id>/invite/", TeamInviteView.as_view(), name="team-invite"),
    path("teams/<str:team_id>/tasks/", TeamTaskListCreateView.as_view(), name="team-tasks"),
    path("teams/<str:team_id>/activities/", TeamActivityView.as_view(), name="team-activities"),
    path("tasks/<str:task_id>/", TaskDetailView.as_view(), name="task-detail"),
    path("tasks/<str:task_id>/comments/", TaskCommentView.as_view(), name="task-comments"),
]
