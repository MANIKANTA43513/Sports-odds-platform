# OddsIQ — Sports Odds Intelligence Platform

> AI-generated sports odds · Node.js + Python + React · Full-stack internship assessment

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Matches · Match Detail · Favorites · AI Agent Chat     │
└────────────────────┬───────────────────────────────────┘
                     │ HTTP /api/*
┌────────────────────▼───────────────────────────────────┐
│              Node.js Backend (Express)                  │
│  Auth · Matches · Favorites · Agent · Odds Caching     │
└───────┬────────────────────────────────┬───────────────┘
        │ pg                             │ axios POST /generate-odds
┌───────▼────────┐             ┌─────────▼───────────────┐
│  PostgreSQL 15  │             │  Python AI Service       │
│  + Redis Cache  │             │  Rating-Logistic Model  │
└────────────────┘             └─────────────────────────┘
```

## Quick Start — Docker (Recommended)

```bash
# 1. Clone / unzip the project
cd sports-odds-platform

# 2. Copy env file
cp backend/.env.example backend/.env

# 3. Start everything
docker-compose up --build

# Services:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:4000/api
#   Python    → http://localhost:5001
#   Postgres  → localhost:5432
#   Redis     → localhost:6379
```

---

## Quick Start — Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15
- Redis (optional — caching degrades gracefully)

### 1. PostgreSQL Setup

```bash
psql -U postgres
CREATE USER sportsuser WITH PASSWORD 'sportspass';
CREATE DATABASE sportsodds OWNER sportsuser;
\q

psql -U sportsuser -d sportsodds -f backend/src/config/init.sql
```

### 2. Python AI Service

```bash
cd python-service
pip install -r requirements.txt
python app.py
# Running on http://localhost:5001
```

### 3. Node.js Backend

```bash
cd backend
cp .env.example .env   # edit if needed
npm install
npm start
# Running on http://localhost:4000
```

### 4. React Frontend

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/profile` | Get current user (auth) |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | All matches + AI odds |
| GET | `/api/matches/:id` | Single match + odds |
| GET | `/api/matches/sports` | Sports/leagues list |

**Query params for GET /matches:**
- `sport=Football|Basketball|Hockey|Tennis|Cricket`
- `league=Premier+League`
- `status=upcoming|live|finished`
- `limit=20&offset=0`

### Favorites (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | User's favorites + odds |
| POST | `/api/favorites/:matchId` | Add to favorites |
| DELETE | `/api/favorites/:matchId` | Remove from favorites |
| GET | `/api/favorites/check/:matchId` | Check if favorited |

### AI Agent
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/agent/query` | `{ "query": "who will win?" }` | Natural language query |

### Python Service (Internal)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-odds` | Single match odds |
| POST | `/generate-odds-batch` | Batch odds generation |
| POST | `/agent/analyze` | AI reasoning engine |
| GET | `/health` | Health check |

---

## Python Odds Model

The model uses a **rating-based logistic regression** approach:

```
1. Normalize rating differential → [-2, 2] range
2. Apply form factor (win/loss record) with 30% weight
3. Pass through sigmoid → P(teamA wins | no draw)
4. Allocate draw probability by sport type
   - Football: 25%  Hockey: 10%  Basketball: 2%
5. Convert fair probability → market odds (with 5% overround)
6. Add ±2% stochastic noise for market realism
```

**Sport draw weights:**
| Sport | Draw Prob |
|-------|-----------|
| Football | 25% |
| Cricket | 15% |
| Hockey | 10% |
| Basketball | 2% |
| Tennis | 0% |

---

## AI Agent — Intent Detection

The agent detects natural language intent and routes to the appropriate tool:

| Intent | Keywords | Tool |
|--------|----------|------|
| `favorite` | "who will win", "favorite" | `get_favorite` |
| `close_odds` | "close", "competitive", "50/50" | `get_close_matches` |
| `predictable` | "predictable", "safe bet" | `get_predictable` |
| `highest_odds` | "underdog", "upset" | `get_highest_odds` |
| `summary` | "summary", "all matches" | `summarize` |

---

## Caching Strategy (Bonus)

Odds are cached at **two levels**:

1. **Redis** (in-memory, TTL: 10 min) — fastest, checked first
2. **PostgreSQL `cached_odds` table** (TTL: 10 min) — survives Redis restart
3. **Python service** — called only on cache miss

Batch API calls (`/generate-odds-batch`) minimize round trips when loading the matches list.

---

## Project Structure

```
sports-odds-platform/
├── docker-compose.yml
├── README.md
│
├── python-service/
│   ├── app.py              # Flask API
│   ├── model.py            # OddsModel + AgentReasoner
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── server.js           # Express entry point
│   │   ├── routes/index.js     # All routes
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── matchesController.js
│   │   │   ├── favoritesController.js
│   │   │   └── agentController.js
│   │   ├── middleware/auth.js   # JWT middleware
│   │   ├── services/
│   │   │   └── oddsService.js  # Python integration + caching
│   │   └── config/
│   │       ├── db.js           # PostgreSQL pool
│   │       ├── redis.js        # Redis cache
│   │       └── init.sql        # Schema + seed data
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── MatchCard.jsx
    │   │   └── SkeletonCard.jsx
    │   └── pages/
    │       ├── MatchesPage.jsx
    │       ├── MatchDetailPage.jsx
    │       ├── FavoritesPage.jsx
    │       ├── AgentPage.jsx
    │       ├── LoginPage.jsx
    │       └── RegisterPage.jsx
    ├── index.html
    ├── vite.config.js
    ├── nginx.conf
    ├── package.json
    └── Dockerfile
```

---

## Features Checklist

| Feature | Status |
|---------|--------|
| JWT Auth (register/login/profile) | ✅ |
| Match listing with filters | ✅ |
| AI-generated odds (Python model) | ✅ |
| Probability bars in UI | ✅ |
| Batch API calls to Python | ✅ (bonus) |
| Redis + DB odds caching | ✅ (bonus) |
| AI Agent with intent detection | ✅ |
| Tool-calling agent architecture | ✅ (bonus) |
| Favorites with odds included | ✅ |
| Match detail page | ✅ |
| Loading skeletons | ✅ |
| Docker Compose setup | ✅ (bonus) |
| Clean REST API design | ✅ |
| Sport-aware draw probability | ✅ |
| Confidence scoring | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Vite |
| Backend | Node.js 20, Express 4 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| AI Service | Python 3.11, Flask 3, NumPy |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Container | Docker + Docker Compose |
| Web Server | Nginx (frontend) |

---

*Built for the Full-Stack + AI Intern Assessment — OddsIQ v1.0.0*
