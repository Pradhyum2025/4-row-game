# Vercel Deployment Guide

This guide explains how to deploy both frontend and backend on Vercel.

## Architecture

- **Backend**: Deployed as Node.js serverless function (Vercel doesn't support Docker containers for serverless)
- **Frontend**: Deployed as static site with normal Vercel deployment

## ⚠️ Important Limitation

**WebSocket connections may not work reliably** on Vercel's serverless platform because:
- Serverless functions are stateless and short-lived
- WebSocket requires persistent connections
- Vercel's serverless architecture doesn't support long-running WebSocket connections

For production WebSocket support, consider deploying the backend on:
- **Railway** (supports Docker containers)
- **Render** (supports Docker containers)
- **Fly.io** (great for WebSocket apps)

## Backend Deployment

### 1. Connect Backend to Vercel

```bash
cd backend
vercel login
vercel link
```

### 2. Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

- `DATABASE_URL`: Your PostgreSQL connection string
  - Example: `postgresql://user:password@host:port/database?sslmode=require`
- `PORT`: `8080` (optional, Vercel sets this automatically)
- `KAFKA_BROKER`: (optional) Kafka broker address
- `KAFKA_TOPIC`: (optional) Kafka topic name

### 3. Deploy Backend

```bash
cd backend
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

### 4. Get Backend URL

After deployment, Vercel will provide a URL like:
- `https://4-row-game-backend.vercel.app`

Copy this URL for frontend configuration.

## Frontend Deployment

### 1. Connect Frontend to Vercel

```bash
cd frontend
vercel login
vercel link
```

### 2. Set Environment Variables (Optional)

In Vercel dashboard → Project Settings → Environment Variables:

- `VITE_BACKEND_URL`: Your backend URL (defaults to `https://4-row-game-backend.vercel.app`)
- `VITE_WS_URL`: (optional) WebSocket URL (auto-generated from BACKEND_URL)
- `VITE_API_URL`: (optional) API URL (defaults to BACKEND_URL)

**Note**: The frontend is pre-configured with the backend URL, so you may not need to set these.

### 3. Deploy Frontend

```bash
cd frontend
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

## Configuration Files

### Backend (`backend/vercel.json`)
- Uses `@vercel/node` builder
- Configured for serverless functions
- Routes set up for `/ws`, `/health`, `/leaderboard`

### Frontend (`frontend/vercel.json`)
- Uses Vite framework
- Static site deployment
- SPA routing configured
- Backend URL pre-configured

## Testing

1. **Test HTTP endpoints** (should work):
   - `https://your-backend.vercel.app/health`
   - `https://your-backend.vercel.app/leaderboard`

2. **Test WebSocket** (may not work):
   - `wss://your-backend.vercel.app/ws`

## Troubleshooting

### WebSocket Connection Fails

This is expected on Vercel's serverless platform. Options:
1. Deploy backend on Railway/Render/Fly.io for WebSocket support
2. Use polling instead of WebSocket (requires code changes)
3. Use a WebSocket proxy service

### CORS Errors

Make sure your backend allows requests from your frontend domain. Add CORS headers if needed.

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel's IP ranges
- Ensure SSL is enabled for cloud databases

## Alternative: Deploy Backend on Railway

For proper WebSocket support:

1. Deploy backend on Railway (supports Docker)
2. Update frontend's `VITE_BACKEND_URL` to Railway URL
3. Keep frontend on Vercel (works perfectly)

See `backend/RAILWAY_DEPLOY.md` for Railway deployment instructions.
