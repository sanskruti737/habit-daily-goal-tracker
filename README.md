# Habit & Daily Goal Tracker

A polished full-stack habit tracker built for the CodeNova Full Stack Development Internship Task 1. The application lets you create and manage habits, mark daily checkpoints, follow weekly progress, build streaks, and browse historical completion data. All records are persisted in SQLite through an Express REST API.

The product UI is branded **Habit Flow**.

## Features

- Modern, responsive dashboard with glassmorphism styling.
- Create, edit, and delete habits.
- Daily completion checkboxes for every habit and any past date.
- Weekly progress bars with per-day completion rates.
- Current and longest streak counters.
- Historical calendar for the whole dashboard and for each individual habit.
- Progress statistics: daily rate, weekly rate, perfect days, total checkpoints, and best streak.
- Month navigation and a date picker for reviewing past performance.
- Loading states, validation messages, error banners, retry actions, and success notifications.
- SQLite persistence with relational completion history and cascading deletes.
- Automated API tests covering CRUD, validation, statistics, error handling, and persistence.

## Technology Stack

**Frontend**

- React.js 19
- Vite 6
- HTML5, CSS3, JavaScript (JSX)
- ESLint

**Backend**

- Node.js 20+
- Express.js 4
- better-sqlite3
- express-validator
- CORS
- Node.js built-in test runner and Supertest

**Database**

- SQLite with WAL mode, foreign keys, indexes, and cascade deletes.

## Folder Structure

```text
habit-daily-goal-tracker/
├── backend/
│   ├── data/                     # Local SQLite files (ignored by Git)
│   ├── src/
│   │   ├── app.js                # Express app, API routes, static hosting
│   │   ├── config.js             # Environment configuration
│   │   ├── db.js                 # SQLite connection and schema
│   │   ├── middleware/
│   │   │   └── validation.js     # Unified validation error responses
│   │   ├── routes/
│   │   │   └── habits.js         # Habits, completions and stats routes
│   │   ├── services/
│   │   │   └── habits.js         # Business logic and streak calculations
│   │   ├── utils/
│   │   │   └── date.js           # Date helpers
│   │   └── server.js             # HTTP server entry point
│   ├── tests/
│   │   └── api.test.js           # REST API integration tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── lib/
│   │   │   ├── api.js            # REST API client
│   │   │   └── date.js           # Frontend date helpers
│   │   ├── App.jsx               # Dashboard and application state
│   │   ├── main.jsx              # React entry point
│   │   └── styles.css            # Complete responsive stylesheet
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   └── screenshots/              # UI captures
├── scripts/
│   └── dev.js                    # Starts frontend and backend together
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Git (only required for version control / GitHub upload)
- GitHub CLI (optional, only for repository creation from the terminal)

## Installation

```bash
git clone <your-repository-url>
cd habit-daily-goal-tracker
npm run install:all
```

To install each part manually:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Environment configuration is optional. The defaults work out of the box.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | API server port |
| `HOST` | `0.0.0.0` | API bind address |
| `DB_PATH` | `./data/habits.db` | SQLite file path, relative to `backend/` |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | Runtime environment |

### Frontend environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | API base path; Vite proxies it to port 5000 during development |

Never commit `.env` files, credentials, API keys, or secrets. `.env.*` files are ignored by Git, while `.env.example` files are committed as safe templates.

## Running the Application

### Development (recommended)

From the project root, run both servers in one command:

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:5000>
- API health: <http://localhost:5000/api/health>

### Run servers separately

Terminal 1:

```bash
npm --prefix backend run dev
```

Terminal 2:

```bash
npm --prefix frontend run dev
```

### Production build

```bash
npm run build
npm start
```

`npm start` builds the React app and starts the Express server. Express serves the compiled frontend from `frontend/dist` and the REST API from `/api` on the same origin.

## Testing

```bash
npm test
```

This runs the backend integration suite with Supertest against an in-memory SQLite database. Verified areas include:

- API health and 404 handling
- Malformed JSON handling
- Habit create, read, update, and delete
- Input validation
- Completion toggle and streak calculation
- Monthly history
- Dashboard statistics
- SQLite persistence after reopening the database file

Frontend checks:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

## API Documentation

Base URL: `/api`

All responses are JSON except `DELETE /api/habits/:id`, which returns `204 No Content`.

| Method | Endpoint | Query / Body | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | -- | Health check |
| `GET` | `/api/habits` | `date=YYYY-MM-DD` optional | List habits with progress for a date |
| `GET` | `/api/habits/:id` | -- | Get one habit |
| `POST` | `/api/habits` | `{ name, description?, category?, color? }` | Create a habit |
| `PUT` | `/api/habits/:id` | `{ name, description?, category?, color? }` | Update a habit |
| `DELETE` | `/api/habits/:id` | -- | Delete a habit and its history |
| `GET` | `/api/habits/:id/completions` | `month=YYYY-MM` optional | Monthly history for one habit |
| `PUT` | `/api/habits/:id/completions/:date` | `{ completed: true|false }` | Set a daily checkpoint |
| `GET` | `/api/stats` | `date=YYYY-MM-DD`, `month=YYYY-MM` optional | Dashboard statistics |

### Create habit example

```http
POST /api/habits
Content-Type: application/json

{
  "name": "Read for 20 minutes",
  "description": "Finish one chapter before bed.",
  "category": "Learning",
  "color": "#6366f1"
}
```

Response `201 Created`:

```json
{
  "habit": {
    "id": 1,
    "name": "Read for 20 minutes",
    "description": "Finish one chapter before bed.",
    "category": "Learning",
    "color": "#6366f1",
    "createdDate": "2026-11-22",
    "createdAt": "2026-11-22 07:30:00",
    "updatedAt": "2026-11-22 07:30:00"
  }
}
```

### Toggle completion example

```http
PUT /api/habits/1/completions/2026-11-22
Content-Type: application/json

{ "completed": true }
```

Response `200 OK`:

```json
{
  "habit": { "id": 1, "name": "Read for 20 minutes" },
  "completion": { "date": "2026-11-22", "completed": true },
  "currentStreak": 3,
  "totalCompletions": 12
}
```

### Validation and error format

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name must be between 1 and 80 characters."
    }
  ]
}
```

Other errors use `{ "error": "Habit not found" }` or `{ "error": "Internal server error" }` with the appropriate HTTP status.

## Database Information

SQLite is accessed through `better-sqlite3`. The database file is created automatically at `backend/data/habits.db` on first run. WAL mode improves concurrent read performance, foreign keys enforce referential integrity, and indexes speed up date-based queries.

### Tables

**`habits`**

| Column | Type | Description |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY | Unique habit identifier |
| `name` | TEXT NOT NULL | Habit name |
| `description` | TEXT NOT NULL | Optional description |
| `category` | TEXT NOT NULL | Habit category |
| `color` | TEXT NOT NULL | Accent color hex value |
| `created_date` | TEXT NOT NULL | Local creation date (`YYYY-MM-DD`) |
| `created_at` | TEXT NOT NULL | Creation timestamp |
| `updated_at` | TEXT NOT NULL | Last update timestamp |

**`completions`**

| Column | Type | Description |
| --- | --- | --- |
| `habit_id` | INTEGER NOT NULL | Foreign key to `habits.id` |
| `date` | TEXT NOT NULL | Completion day (`YYYY-MM-DD`) |
| `completed_at` | TEXT NOT NULL | When the checkpoint was saved |

The primary key is `(habit_id, date)`, so each habit can have only one checkpoint per day. Deleting a habit automatically deletes its completion history through `ON DELETE CASCADE`.

## Screenshots

UI captures are stored in `docs/screenshots/`. After running the application, add the following captures to that directory:

| Screenshot | Suggested filename | Shows |
| --- | --- | --- |
| Dashboard | `dashboard.png` | Stat cards, habit list, calendar, and weekly progress |
| Habit editor | `habit-form.png` | Add/edit habit dialog with validation |
| History view | `history.png` | Per-habit historical calendar and streak statistics |
| Mobile layout | `mobile.png` | Responsive single-column dashboard |

Screenshots are not bundled in this submission, but the section and directory are prepared so they can be added without changing the project structure.

## GitHub Preparation

This project is prepared for a public GitHub repository named `habit-daily-goal-tracker`. The default branch is `main`. Sensitive files, local databases, build output, and dependency directories are excluded by `.gitignore`.

Do not deploy this application until explicitly approved.
