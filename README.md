# 4 in a Row (Connect Four) - Full-Stack Multiplayer Game

A real-time multiplayer Connect Four game built with Node.js backend, React frontend, PostgreSQL, and Kafka.

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws), PostgreSQL, Kafka (optional)
- **Frontend**: React, JavaScript, Tailwind CSS
- **No Docker** - run everything locally

## Game Rules

- Board: 7 columns × 6 rows
- Players take turns dropping discs into columns
- Win condition: 4 discs connected horizontally, vertically, or diagonally
- Draw if board is full with no winner

## Features

1. **Real-time Multiplayer**: Player vs Player gameplay
2. **Competitive Bot**: Falls back to bot if no opponent joins within 10 seconds
3. **Reconnection Support**: 30-second grace period for reconnection
4. **Leaderboard**: Track wins and top players
5. **Analytics**: Kafka-based event tracking (decoupled service)

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (running locally)
- Apache Kafka (running locally)

## Setup Instructions

### 1. Start PostgreSQL

Make sure PostgreSQL is running on `localhost:5432` with:
- User: `postgres`
- Password: `PostGre@2025` (default, or update via environment variable)
- Database: `connectfour` (will be created automatically if it doesn't exist)

**Note:** If your password contains special characters like `@`, they must be URL-encoded in the connection string (`@` = `%40`).

The server will automatically create the `connectfour` database on first run if it doesn't exist.

### 2. Start Kafka (Optional)

Kafka is **optional** - the server will work without it, but analytics will be disabled.

If you want analytics:
- Make sure Kafka is running on `localhost:9092`
- Create topic `game-events` (or it will be auto-created if configured)

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set environment variables (optional, defaults shown)
# Windows PowerShell:
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/connectfour?sslmode=disable"
$env:KAFKA_BROKER="localhost:9092"
$env:KAFKA_TOPIC="game-events"
$env:PORT="8080"

# Linux/macOS:
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/connectfour?sslmode=disable"
export KAFKA_BROKER="localhost:9092"
export KAFKA_TOPIC="game-events"
export PORT="8080"

# Run server
npm start
```

Or use `npm run dev` for auto-reload during development.


### 4. Analytics Consumer (Optional)

In a separate terminal:

```bash
cd backend

# Windows PowerShell:
$env:KAFKA_BROKER="localhost:9092"
$env:KAFKA_TOPIC="game-events"
$env:KAFKA_GROUP_ID="analytics-consumer"

# Linux/macOS:
export KAFKA_BROKER="localhost:9092"
export KAFKA_TOPIC="game-events"
export KAFKA_GROUP_ID="analytics-consumer"

npm run analytics
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

### 6. Build Frontend for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` and can be served by the backend.

## WebSocket Event Flow

### Client → Server Events

1. **JOIN_GAME**
   ```json
   {
     "type": "JOIN_GAME",
     "payload": {
       "username": "player1"
     }
   }
   ```

2. **MOVE**
   ```json
   {
     "type": "MOVE",
     "payload": {
       "column": 3
     }
   }
   ```

3. **RECONNECT**
   ```json
   {
     "type": "RECONNECT",
     "payload": {
       "username": "player1",
       "game_id": "uuid"
     }
   }
   ```

### Server → Client Events

1. **GAME_STARTED**
   ```json
   {
     "type": "GAME_STARTED",
     "payload": {
       "game_id": "uuid",
       "player1": "player1",
       "player2": "player2",
       "is_bot_game": false,
       "board": [[0,0,0,...], ...],
       "current_turn": 1,
       "status": "active"
     }
   }
   ```

2. **GAME_STATE_UPDATE**
   ```json
   {
     "type": "GAME_STATE_UPDATE",
     "payload": {
       "game_id": "uuid",
       "board": [[0,0,0,...], ...],
       "current_turn": 1,
       "status": "active",
       "winner": "",
       "is_draw": false
     }
   }
   ```

3. **WAITING_FOR_OPPONENT**
   ```json
   {
     "type": "WAITING_FOR_OPPONENT"
   }
   ```

4. **ERROR**
   ```json
   {
     "type": "ERROR",
     "payload": {
       "message": "Invalid move"
     }
   }
   ```

## REST API

### GET /leaderboard
Returns top 10 players sorted by wins.

**Response:**
```json
[
  {
    "username": "player1",
    "wins": 10
  },
  {
    "username": "player2",
    "wins": 5
  }
]
```

### GET /health
Health check endpoint.

## Project Structure

```
4-row-game/
├── backend/
│   ├── index.js         # Main server (Express + WebSocket)
│   ├── game.js          # Game logic (board, win check, moves)
│   ├── bot.js           # Bot AI
│   ├── matchmaking.js   # Matchmaking queue
│   ├── db.js            # Database connection
│   ├── analytics.js     # Kafka producer/consumer
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Bot Strategy

The bot tries to:
1. Win if possible
2. Block opponent from winning
3. Play center columns when possible
4. Create opportunities (2-3 in a row)

## Reconnection

Players can reconnect using their username and game ID (if they have it).

## Notes

- Games are stored in memory while active
- Finished games are saved to PostgreSQL
- Kafka is optional - server works without it
- Matchmaking waits 10 seconds then starts bot game

## License

MIT
