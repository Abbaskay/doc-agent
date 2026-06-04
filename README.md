# doc-agent

Doc Agent — AI-powered document generation.

## Overview

Creates resumes, invoices, proposals, emails, reports, and more from natural language descriptions. Uses Dify (DeepSeek) for AI content generation.

### Tech Stack
- **Backend**: Laravel (PHP)
- **Frontend**: Vue 3 + Vite
- **AI Integration**: Dify (DeepSeek model)
- **Auth**: JWT-based SSO via Super Agent
- **Database**: SQLite

### Project Structure
```
doc-agent/
├── doc-agent-backend/       # Laravel backend
├── doc-agent-frontend/      # Vue 3 frontend
├── shared/                  # Shared components
└── README.md
```

## Setup

### Backend
```bash
cd doc-agent-backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8002
```

### Frontend
```bash
cd doc-agent-frontend
npm install
npm run dev
```

## Auth

JWT-based SSO via Super Agent. Login at http://localhost:5173 with admin@superagent.com / admin123.

## Ports
- Backend: 8002
- Frontend: 5174
