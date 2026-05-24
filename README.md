# ReviewLens

ReviewLens is a focused Reddit review sentiment MVP that searches public Reddit posts and comments to surface honest product feedback.

## Architecture

- Frontend: Next.js App Router, TailwindCSS, premium dark UI
- Backend: FastAPI async service with Reddit public JSON endpoints and sentiment aggregation

## Local Startup

1. Backend:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend rewrites `/api/*` to the backend on `http://localhost:8000` by default.

## API

GET `/reviews?product=iphone15`

Response:
```json
{
  "product": "iPhone 15",
  "total_posts": 12,
  "positive_percent": 58,
  "negative_percent": 25,
  "neutral_percent": 17,
  "top_positive_reviews": [],
  "top_negative_reviews": [],
  "summary": "...",
  "input_type": "text",
  "extracted_value": ""
}
```
