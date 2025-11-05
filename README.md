# PerfectPlan

Simple student event coordination app (Express backend + React frontend).

## Quick summary
- Backend: Node + Express + Mongoose (requires a MongoDB URI in `backend/.env`)
- Frontend: Create React App at `frontend/perfectplan` (dev server on port 3000)

## Prerequisites
- Node.js (LTS) and npm
- Git
- A MongoDB URI (Atlas or local). You must provide this in `backend/.env`.

## Setup (local)

1. Clone
```powershell
git clone <repo-url>
cd PerfectPlan
```

2. Backend
```powershell
cd backend
copy .env.example .env         # Windows PowerShell
# Edit backend/.env and set MONGO_URI and JWT_SECRET
npm install
npm start
```
- The backend reads `MONGO_URI` from `backend/.env`. Server will try to connect on startup and may exit if it cannot connect.
- Default port: 5000.

3. Frontend (in a new terminal)
```powershell
cd frontend\perfectplan
npm install
npm start
```
- CRA dev server opens at http://localhost:3000
- The frontend dev server proxies `/api` calls to the backend during development.

## .env.example
Copy `backend/.env.example` to `backend/.env` and fill values (do NOT commit `.env`).

Example format (do not include real secrets in the repo):
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

## Quick API checks (PowerShell / curl)
- Signup
```powershell
curl.exe -X POST http://localhost:5000/api/signup -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"pass123\"}"
```
- Login (returns JWT)
```powershell
curl.exe -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"password\":\"pass123\"}"
```
- Create group (body must include `name` and either `userId` or send Authorization: Bearer <token>)
```powershell
curl.exe -X POST http://localhost:5000/api/groups -H "Content-Type: application/json" -d "{\"name\":\"MyGroup\",\"userId\":\"<userId>\"}"
```
- Fetch user groups
```powershell
curl.exe http://localhost:5000/api/groups/user/<userId>
```

## Notes
- `backend/.env` is ignored by git. Commit only `.env.example`.
- If you want to run without an Atlas URI, run a local Mongo (Docker or local install) and set `MONGO_URI` accordingly.
- If you run into connection errors, verify the URI, network access (Atlas IP whitelist), and that `JWT_SECRET` is set.

