# Team_Task_Tracker

A full-stack team task tracker with role-based permissions and a live activity timeline. Admins can create teams and invite members; team members can assign tasks, update their status, and discuss work through comments.

## Features

- Registration and login with hashed passwords and JWT access/refresh tokens
- Admin and Member roles
- Admin-only team creation and simulated email invitations
- Team-only access to tasks and activity
- Task assignment, status updates, and status filters
- Activity timeline that refreshes every five seconds
- Responsive interface

## Tech stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Django REST Framework, MongoEngine
- **Database:** MongoDB
- **Deployment:** Docker Compose
