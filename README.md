# Team Task Manager

Built this to make team collaboration simpler — track projects, assign tasks, and manage attendance all in one place. It has proper role-based access so admins and members each see and do only what they need to.

---

## What it does

- Sign up and log in securely — sessions persist across page refreshes
- Admins create projects, add team members, and assign tasks
- Members can update their own task status and mark their own attendance
- Dashboard gives a quick overview with charts showing task completion and priorities
- Attendance page lets you view and edit records by date
- Switches between dark and light mode

---

## Built with

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Router v6 |
| Charts     | Recharts                                      |
| HTTP       | Axios                                         |
| Backend    | Node.js, Express.js                           |
| Database   | MongoDB, Mongoose                             |
| Auth       | JWT, bcryptjs                                 |

---

## Who can do what

| Action                   | Admin | Member   |
|--------------------------|-------|----------|
| Create and delete projects | Yes | No       |
| Add and remove members   | Yes   | No       |
| Create and assign tasks  | Yes   | No       |
| Update task status       | Yes   | Own only |
| Mark attendance          | Yes   | Own only |
| View dashboard           | Yes   | Yes      |

---

## Running it locally

You will need Node.js 18 or higher and a MongoDB Atlas account.

### Backend