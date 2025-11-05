# PerfectPlan

Simple student event coordination app (Express backend + React frontend).

## Quick summary
- Backend: Node + Express + Mongoose (requires a MongoDB URI in `backend/.env`)
- Frontend: Create React App at `frontend/perfectplan` (dev server on port 3000)

## Prerequisites
- Node.js (LTS) and npm
- Git
- A MongoDB URI (Atlas or local). Must be provided in `backend/.env`.

## Setup (local)

1. Backend
```powershell
cd backend
copy .env.example .env
# Edit backend/.env and set MONGO_URI and JWT_SECRET
npm install
npm start
```
- The backend reads `MONGO_URI` from `backend/.env`. Server will try to connect on startup and may exit if it cannot connect.
- Default port: 5000.

2. Frontend (in a new terminal)
```powershell
cd frontend\perfectplan
npm install
npm start
```
