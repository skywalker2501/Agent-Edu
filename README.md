# AgentEdu

AgentEdu is an agentic, adaptive learning platform powered by multi-agent cognitive architecture, Google Gemini Socratic AI tutoring, and real-time conceptual mastery tracking.

---

## 🌟 Key Features

- **6 Autonomous Cognitive Agents**:
  - **Diagnostic Assessment Agent**: Evaluates student knowledge states and detects misconception patterns.
  - **Observer Agent**: Monitors interaction telemetry, cognitive friction, and latency anomalies.
  - **Learner Modeling Agent (Digital Twin)**: Bayesian mastery estimation across a 4-tier Knowledge DAG.
  - **Intervention Planner Agent**: Synthesizes and ranks candidate remediation strategies.
  - **Teacher Review Agent (Decoupled Governance)**: Validates alternative student approaches while preserving teacher authority.
  - **Socratic AI Tutor**: Powered by **Google Gemini API** (`gemini-3.5-flash-lite` / `gemini-3.8-flash`) for real-time hint scaffolding, step-by-step guidance, and code walkthroughs.

- **Interactive Portals**:
  - **Student Portal**: Real-time Knowledge Map (interactive DAG), Misconception Center, Targeted Interventions, Live Socratic AI Tutor, and Code Sandbox.
  - **Teacher Portal**: Class Analytics, Cognitive Review Queue, Method Approval Simulator, and Decoupled Architecture Outcomes.
  - **Admin Portal**: System Health, Cognitive Audit Log, and Role Management.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, Python 3.12, SQLAlchemy (Async), SQLite / PostgreSQL.
- **AI & Reasoning**: Google Gemini API (`gemini-3.5-flash-lite`, `gemini-3.8-flash`) with multi-provider fallback.
- **Deployment**: Vercel (Production Frontend), Cloudflare Tunnels (Secure API Gateway).

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🔒 Security & Privacy

- All sensitive keys, secrets, and database files are protected via `.gitignore`.
- Teachers retain final decision authority on all AI recommendations through Decoupled Human-in-the-Loop Governance.

---

## 📄 License

MIT License. Developed for advanced agentic cognitive education.
