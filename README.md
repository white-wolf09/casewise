# Casewise - Fullstack Legal Case Management Platform

Casewise is a modern case-management application for legal aid attorneys and caseworkers, built with a React + Vite frontend and a Vercel-ready Express serverless backend featuring Groq AI integration.

## Key Features

- **Casewise Assist (AI Evidence Search)**: Ask natural language questions across case files and facts with exact citations and source-level provenance powered by Groq LLM (`llama-3.3-70b-versatile`).
- **AI Document Intake & Analysis**: Document upload automatically parses document types, populates case facts, updates intake checklists, and identifies potential critical conflicts.
- **Review Queue with Conflict Safety**: Enforces attorney review workflows and prevents approving deadline proposals when open critical conflicts exist.
- **Zero-Cost Vercel Hosting**: Built to deploy 100% free on Vercel's Hobby tier using Serverless Functions and optional free MongoDB Atlas M0 cluster.
- **Dual Mode Storage**: Works completely out-of-the-box with memory fallback if MongoDB URI is omitted, or connects to MongoDB Atlas seamlessly when provided.

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration:

```env
# Set to false to use the full backend and AI features
VITE_USE_MOCK=false

# Port for local backend server
PORT=5000

# JWT secret
JWT_SECRET=casewise_super_secret_jwt_key_2025

# Groq API Key placeholder (replace with your key from https://console.groq.com)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# MongoDB Atlas URI (optional - runs in-memory if left blank)
MONGODB_URI=
```

### 3. Running Locally

Run both the Vite frontend and the backend API concurrently:

```bash
npm run dev:all
```

Or run them individually:
- **Backend API**: `npm run server` (runs at `http://localhost:5000`)
- **Frontend**: `npm run dev` (runs at `http://localhost:5173`)

### 4. Running Tests

Run the complete 21-case backend and AI automated test suite:

```bash
npm test
```

---

## Demo Credentials

| Email | Password | Name | Role |
|-------|----------|------|------|
| `maya@communitylegal.org` | `Demo@12345` | Maya Brooks | Case Worker |
| `john@communitylegal.org` | `12345678` | John Abraham | Case Worker |

---

## Deploying to Vercel (100% Free)

This project is configured out of the box for free hosting on Vercel:

1. Push this repository to GitHub or GitLab.
2. In Vercel, click **Add New Project** and import the repository.
3. Framework Preset: **Vite** (detected automatically).
4. In **Environment Variables**, add:
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
   - `JWT_SECRET`: A secure random string for JWT signing
   - `VITE_USE_MOCK`: `false`
   - `MONGODB_URI` (optional): Free MongoDB Atlas M0 cluster connection string. If omitted, the app runs smoothly with the initialized data store.
5. Click **Deploy**. Vercel will build the Vite frontend to `dist` and deploy the `/api` routes as Serverless Functions (`api/index.js`).

---

## Architecture & API Contract

```
casewise/
├── api/
│   └── index.js             # Vercel Serverless Function entry point
├── backend/
│   ├── app.js               # Express app configuration & middlewares
│   ├── config/              # Environment & MongoDB caching setup
│   ├── controllers/         # Auth, Case, Review, AI, Dashboard, Reports
│   ├── data/                # Initial seed data for cases, reviews, deadlines
│   ├── middleware/          # JWT auth & validation error handling
│   ├── models/              # Mongoose models (Case, Review, User, Deadline)
│   ├── routes/              # Modular API routes mounted at /api/*
│   ├── services/            # Groq AI Service & unified store layer
│   └── utils/               # Validation rules
├── src/                     # React UI components, pages, styles
├── test/
│   └── backend.test.js      # Automated test suite
├── vercel.json              # Vercel routing and rewrite rules
└── server.js                # Local development server
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/health` | Health check & Groq AI configuration status |
| `POST` | `/api/auth/login` | Staff authentication & JWT generation |
| `GET`  | `/api/dashboard` | Caseload metrics, deadlines, and active cases |
| `GET`  | `/api/cases` | All cases with health & flags |
| `GET`  | `/api/cases/:caseId` | Case detail (facts, documents, timeline, checklist) |
| `POST` | `/api/cases` | Intake new case with tailored checklist |
| `POST` | `/api/cases/:caseId/flags/:flagId/resolve` | Resolve flag & update timeline |
| `POST` | `/api/cases/:caseId/checklist/toggle` | Toggle requirement done status |
| `POST` | `/api/cases/:caseId/documents` | Upload documents & trigger AI analysis |
| `POST` | `/api/cases/:caseId/ask` | Casewise Assist: AI evidence search |
| `GET`  | `/api/reviews` | Review queue of attorney outputs |
| `GET`  | `/api/reviews/:id` | Proposal details, evidence quotes & conflicts |
| `POST` | `/api/reviews/:id/decision` | Approve or return review (blocks on open conflict) |
| `GET`  | `/api/reports` | KPI impact, time-to-evidence, targets |
| `GET`  | `/api/search?q=...` | Global search across cases and clients |
| `GET`  | `/api/notifications` | Pending reviews and upcoming deadline alerts |
# casewise
