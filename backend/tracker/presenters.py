def iso(value):
    return value.isoformat().replace("+00:00", "Z") if value else None


def user_data(user):
    if not user:
        return None
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


def team_data(team):
    return {
        "id": str(team.id),
        "name": team.name,
        "description": team.description,
        "created_by": user_data(team.created_by),
        "members": [user_data(member) for member in team.members],
        "member_count": len(team.members),
        "created_at": iso(team.created_at),
    }


def task_data(task):
    return {
        "id": str(task.id),
        "team_id": str(task.team.id),
        "title": task.title,
        "description": task.description,
        "assigned_to": user_data(task.assigned_to),
        "status": task.status,
        "created_by": user_data(task.created_by),
        "created_at": iso(task.created_at),
        "updated_at": iso(task.updated_at),
    }


def comment_data(comment):
    return {
        "id": str(comment.id),
        "body": comment.body,
        "author": user_data(comment.author),
        "created_at": iso(comment.created_at),
    }


def activity_data(activity):
    return {
        "id": str(activity.id),
        "team_id": str(activity.team.id),
        "task_id": str(activity.task.id) if activity.task else None,
        "actor": user_data(activity.actor),
        "action": activity.action,
        "message": activity.message,
        "metadata": activity.metadata,
        "created_at": iso(activity.created_at),
    }
