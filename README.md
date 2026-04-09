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
