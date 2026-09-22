from django.core.management.base import BaseCommand

from tracker.models import Activity, Comment, Task, Team, User


class Command(BaseCommand):
    help = "Create idempotent demo users, a team, tasks, comments, and activity."

    def handle(self, *args, **options):
        admin = User.objects(email="admin@example.com").first()
        if not admin:
            admin = User(name="Avery Admin", email="admin@example.com", role=User.ROLE_ADMIN)
            admin.set_password("Admin123!")
            admin.save()
        member = User.objects(email="member@example.com").first()
        if not member:
            member = User(name="Morgan Member", email="member@example.com", role=User.ROLE_MEMBER)
            member.set_password("Member123!")
            member.save()

        team = Team.objects(name="Product Launch", created_by=admin).first()
        if not team:
            team = Team(
                name="Product Launch",
                description="Coordinate the public launch across design, engineering, and operations.",
                created_by=admin,
                members=[admin, member],
            ).save()

        if not Task.objects(team=team).count():
            task = Task(
                title="Design API endpoints",
                description="Finalize endpoint names, payloads, and error contracts.",
                assigned_to=member,
                status=Task.STATUS_IN_PROGRESS,
                team=team,
                created_by=admin,
            )
            task.save()
            comment = Comment(
                task=task,
                author=admin,
                body="Please include the refresh-token flow.",
            ).save()
            Activity(
                team=team,
                task=task,
                actor=admin,
                action=Activity.ACTION_TASK_CREATED,
                message=f'{admin.name} created task "{task.title}".',
            ).save()
            Activity(
                team=team,
                task=task,
                actor=member,
                action=Activity.ACTION_TASK_UPDATED,
                message=f'{member.name} changed status of "{task.title}" from Pending to In Progress.',
            ).save()
            Activity(
                team=team,
                task=task,
                actor=admin,
                action=Activity.ACTION_TASK_COMMENTED,
                message=f'{admin.name} commented on "{task.title}".',
                metadata={"comment_id": str(comment.id)},
            ).save()

        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
        self.stdout.write("Admin: admin@example.com / Admin123!")
        self.stdout.write("Member: member@example.com / Member123!")
