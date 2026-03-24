# Pause - Before You Sign

Before you sign.

Pause is a cybersecurity-focused web platform that helps users evaluate the trustworthiness of job and internship offers. The platform performs risk assessment using technical and behavioral indicators and returns a risk score with explanations.

The system does not claim to automatically detect scams.

## Tech Stack

- Frontend: React (Vite), React Router, Axios
- Backend: Python Flask REST API, Flask-CORS, Flask-SQLAlchemy
- Auth: JWT-style token structure (development-safe placeholder)
- Database: PostgreSQL via Flask-SQLAlchemy

## Project Structure

```
pause/
	backend/
		app.py
		config.py
		models/
		routes/
		services/
		utils/
	frontend/
		src/
			components/
			pages/
			services/
			styles/
```

## Backend API

### Auth

- `POST /auth/register`
	- Body: `name`, `email`, `password`
- `POST /auth/login`
	- Body: `email`, `password`
	- Returns: token + user profile

### Analysis

- `POST /analysis/analyze` (requires Bearer token)
	- Body: `companyName`, `jobDescription`, `recruiterEmail`, `companyWebsite`
	- Returns: `risk_score`, `risk_level`, `reasons`, `meta`
- `GET /analysis/history` (requires Bearer token)

### Admin

- `GET /admin/dashboard` (admin token)
- `GET /admin/rules` (admin token)
- `PUT /admin/rules/<rule_name>` (admin token)
- `GET /admin/logs` (admin token)

## Risk Engine Rules

Implemented in `pause/backend/services/risk_engine.py`:

- Domain age < 90 days: +40
- Domain age < 1 year: +20
- Free email domain (`gmail.com`, `yahoo.com`, `outlook.com`): +20
- Suspicious wording (`urgent`, `payment`, `fee`, `immediately`): +15
- Website not HTTPS: +15

Risk levels:

- 0-25: LOW
- 26-60: MEDIUM
- 61+: HIGH

Domain age is currently deterministic mock logic (ready for future WHOIS integration).

## Database Schema (PostgreSQL + Flask-SQLAlchemy)

The following table schemas are mapped to SQLAlchemy models/repositories:

- `users`
- `offer_analyses`
- `risk_rules`
- `audit_logs`

## Run Instructions

### Backend

1. Open terminal in `pause/backend`
2. Install dependencies:

	 ```bash
	 pip install flask flask-cors flask-sqlalchemy psycopg2-binary
	 ```

	 Or use:

	 ```bash
	 pip install -r requirements.txt
	 ```

3. Run API:

	 ```bash
	 python app.py
	 ```

4. Backend runs on `http://localhost:5000`

### Create tables manually (if needed)

```python
from app import create_app, db

app = create_app()
with app.app_context():
    db.create_all()
```

Admin test account (seeded on first login call):

- Email: `admin@pause.local`
- Password: `admin123`

### Frontend

1. Open terminal in `pause/frontend`
2. Install dependencies:

	 ```bash
	 npm install
	 ```

3. Start dev server:

	 ```bash
	 npm run dev
	 ```

4. Frontend runs on `http://localhost:5173`

## Current State

This repository is intentionally structured like a partially completed production system:

- Modular services and routes
- Auth and role-protected endpoints
- Explainable risk engine
- Admin rule management and audit logging flow
- Frontend user and admin paths

Planned next phase:

- Production-grade JWT library and key rotation
- Input validation hardening and test suite coverage
