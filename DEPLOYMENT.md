# Deployment

The laptop does not need to stay on after deployment. Host the backend on Render and the frontend on Vercel (or equivalent services).

## Backend: Render

1. Create a Render Blueprint from this repository using `render.yaml`.
2. Render creates the API and PostgreSQL database.
3. Set `GEMINI_API_KEY` in the API service only if Gemini responses are needed.
4. Copy the deployed API URL, for example `https://ai-career-assistant-api.onrender.com`.

## Frontend: Vercel

1. Import the repository into Vercel.
2. Set the project root directory to `frontend`.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Add `VITE_API_URL` with the deployed Render API URL.
5. Copy the Vercel URL.

## Connect CORS

In Render, set `FRONTEND_URL` to the Vercel URL. Multiple frontend URLs can be comma-separated.

## Local development

Backend:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm run dev
```

For a hosted frontend, create `frontend/.env.local` from `.env.example` and set:

```env
VITE_API_URL=https://your-api-service.onrender.com
```

Never commit API keys or `.env` files.
