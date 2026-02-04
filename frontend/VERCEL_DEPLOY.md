# Deploying Frontend to Vercel

This frontend is configured to deploy on Vercel and connect to the backend at `https://4-row-game-backend.vercel.app`.

## Prerequisites

1. A Vercel account
2. The backend deployed at `https://4-row-game-backend.vercel.app` (or update the URL)

## Deployment Steps

### 1. Connect to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link your project: `vercel link` (from the frontend directory)

### 2. Set Environment Variables (Optional)

In Vercel dashboard, go to your project settings and add (if you want to override defaults):

- `VITE_BACKEND_URL`: Backend URL (defaults to `https://4-row-game-backend.vercel.app`)
- `VITE_WS_URL`: WebSocket URL (auto-generated from BACKEND_URL if not set)
- `VITE_API_URL`: API URL (defaults to BACKEND_URL if not set)

**Note**: The frontend is pre-configured to use `https://4-row-game-backend.vercel.app` as the default backend URL, so you don't need to set these unless you want to use a different backend.

### 3. Deploy

```bash
vercel --prod
```

Or push to your connected Git repository and Vercel will auto-deploy.

## Configuration

The frontend automatically:
- Uses `VITE_BACKEND_URL` environment variable if set
- Defaults to `https://4-row-game-backend.vercel.app` if not set
- Converts the backend URL to WebSocket URL (`wss://` for HTTPS, `ws://` for HTTP)
- Uses the same backend URL for API calls

## How It Works

- **WebSocket URL**: Automatically converts `https://4-row-game-backend.vercel.app` to `wss://4-row-game-backend.vercel.app/ws`
- **API URL**: Uses `https://4-row-game-backend.vercel.app` for HTTP requests (e.g., `/leaderboard`)

## Local Development

For local development, the Vite proxy in `vite.config.ts` will proxy requests to `localhost:8080`. The environment variables are only used in production builds.

## Troubleshooting

- **WebSocket connection fails**: Make sure the backend is deployed and accessible at the configured URL
- **API calls fail**: Check that the backend URL is correct and the backend is running
- **CORS errors**: The backend should allow requests from your frontend domain
