require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');

const { getDatabaseConnectionString, connectDB, initSchema } = require('./config/db');
const KafkaProducer = require('./analytics');
const GameService = require('./services/gameService');
const SocketHandler = require('./socket/socketHandler');
const GameController = require('./controllers/gameController');

const DB_CONN_STR = getDatabaseConnectionString();
const KAFKA_BROKER = process.env.KAFKA_BROKER ?? 'localhost:9092';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC ?? 'game-events';
const PORT = process.env.PORT ?? '8080';

let db;
let kafkaProducer;
let gameService;
let socketHandler;

async function main() {
  db = await connectDB(DB_CONN_STR);
  await initSchema(db);
  
  kafkaProducer = new KafkaProducer(KAFKA_BROKER, KAFKA_TOPIC);
  try {
    await kafkaProducer.connect();
  } catch (err) {
    console.warn('Kafka connection failed (analytics will be disabled)');
  }
  
  gameService = new GameService();
  
  gameService.setBotGameActivatedCallback((username, game) => {
    socketHandler.publishGameStartedEvent(game);
    const client = socketHandler.getClientByUsername(username);
    if (client && client.gameID === game.id) {
      socketHandler.sendGameStarted(client, game);
    }
  });
  
  socketHandler = new SocketHandler(gameService, kafkaProducer, db);
  
  const app = express();
  app.use(express.json());
  
  const gameController = new GameController(db);
  
  app.get('/health', (req, res) => gameController.healthCheck(req, res));
  app.get('/leaderboard', (req, res) => gameController.getLeaderboard(req, res));
  
  const server = http.createServer(app);
  
  socketHandler.setupWebSocketServer(server);
  
  const frontendPath = path.join(__dirname, '../frontend/dist');
  try {
    const fs = require('fs');
    if (fs.existsSync(frontendPath)) {
      app.use(express.static(frontendPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
    }
  } catch (err) {
    console.log('Frontend dist not found, skipping static file serving');
  }
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server starting on port ${PORT}`);
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    try {
      if (kafkaProducer) {
        await kafkaProducer.close();
      }
    } catch (err) {}
    await db.end();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
