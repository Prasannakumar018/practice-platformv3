# Practice Platform Microservices

A production-ready microservices application for generating and taking quizzes from documents, powered by Supabase and Google Gemini.

## Architecture

- **Frontend**: Next.js 15 (App Router)
- **API Gateway**: FastAPI
- **User Service**: FastAPI + Supabase Auth
- **File Service**: FastAPI + Supabase Storage + Text Extraction
- **Question Service**: FastAPI + Google Gemini + Supabase DB

## Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Supabase Project
- Google Gemini API Key

## Setup

1. **Environment Variables**
   Copy `.env.example` to `.env` in each service directory and fill in your credentials.

2. **Database Setup**
   Initialize the Supabase database and storage buckets:
   \`\`\`bash
   pip install -r scripts/requirements.txt
   python scripts/setup_db.py
   \`\`\`
   *Note: Ensure `POSTGRES_URL` is set in your environment for the script to work.*

3. **Run Locally**
   \`\`\`bash
   docker-compose up --build
   \`\`\`

4. **Frontend**
   The frontend runs on `http://localhost:3000`.
   The API Gateway runs on `http://localhost:8000`.

## Deployment

### Kubernetes
Manifests are available in the `k8s/` directory.
1. Create secrets: `kubectl apply -f k8s/secrets.yaml`
2. Apply config: `kubectl apply -f k8s/configmap.yaml`
3. Deploy services: `kubectl apply -f k8s/`

### Vercel (Frontend)
The `app/` directory contains the Next.js frontend.
1. Set `NEXT_PUBLIC_API_URL` to your deployed API Gateway URL.
2. Deploy using `vercel`.

## API Documentation
- Gateway: http://localhost:8000/docs
- User Service: http://localhost:8001/docs
- File Service: http://localhost:8002/docs
- Question Service: http://localhost:8003/docs
