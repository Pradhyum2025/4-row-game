const WebSocket = require('ws');
const GameService = require('../services/gameService');
const KafkaProducer = require('../analytics');

class SocketHandler {
  constructor(gameService, kafkaProducer, db) {
    this.gameService = gameService;
    this.kafkaProducer = kafkaProducer;
    this.db = db;
    this.clients = new Map();
  }

  setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      perMessageDeflate: false
    });

    wss.on('connection', (ws, req) => {
      console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
      
      const client = {
        username: '',
        gameID: '',
        ws: ws
      };
      
      this.clients.set(ws, client);
      
      ws.on('message', (message) => {
        if (message.length > 512) {
          ws.close(1009, 'Message too large');
          return;
        }
        this.handleMessage(client, message);
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
      
      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.clients.delete(ws);
      });
      
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 54000);
      
      ws.on('close', () => {
        clearInterval(pingInterval);
      });
    });
  }

  handleMessage(client, message) {
    try {
      const msg = JSON.parse(message.toString());
      
      switch (msg.type) {
        case 'JOIN_GAME':
          this.handleJoinGame(client, msg.payload);
          break;
        case 'MOVE':
          this.handleMove(client, msg.payload);
          break;
        case 'RECONNECT':
          this.handleReconnect(client, msg.payload);
          break;
        default:
          this.sendError(client, 'Unknown message type');
      }
    } catch (err) {
      this.sendError(client, 'Invalid message format');
    }
  }

  handleJoinGame(client, payload) {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      if (!data || !data.username) {
        this.sendError(client, 'Invalid join game data');
        return;
      }
      
      client.username = data.username;
      
      const result = this.gameService.joinQueue(data.username);
      if (!result || !result.game) {
        this.sendError(client, 'Failed to join game queue');
        return;
      }
      
      const { game, started } = result;
      client.gameID = game.id;
      
      if (started) {
        this.publishGameStartedEvent(game);
        this.sendGameStarted(client, game);
      } else {
        this.sendWaiting(client);
      }
    } catch (err) {
      console.error('Error in handleJoinGame:', err);
      this.sendError(client, 'Failed to join game queue');
    }
  }

  async handleMove(client, payload) {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      if (!data || typeof data.column !== 'number') {
        this.sendError(client, 'Invalid move data');
        return;
      }
      
      const game = this.gameService.getGame(client.gameID);
      if (!game) {
        this.sendError(client, 'Game not found');
        return;
      }
      
      let player = game.player1.color;
      if (client.username === game.player2.username) {
        player = game.player2.color;
      }
      
      await this.gameService.processMove(client.gameID, player, data.column);
      
      const updatedGame = this.gameService.getGame(client.gameID);
      
      if (updatedGame.status === 'finished') {
        if (updatedGame.winner && !updatedGame.isDraw && this.db) {
          const winner = updatedGame.winner.username;
          const { incrementPlayerWins } = require('../config/db');
          incrementPlayerWins(this.db, winner).catch(err => {
            console.error('Failed to update player wins:', err);
          });
        }
        this.publishGameEndedEvent(updatedGame);
      } else {
        this.publishMoveEvent(client.gameID, player, data.column);
      }
      
      this.broadcastGameState(client.gameID);
      
      if (updatedGame && updatedGame.isBotGame && 
          updatedGame.currentTurn === updatedGame.player2.color && 
          updatedGame.status === 'active') {
        setTimeout(async () => {
          try {
            await this.gameService.getBotMove(client.gameID);
            this.broadcastGameState(client.gameID);
          } catch (err) {
            console.error('Error making bot move:', err);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error in handleMove:', err);
      this.sendError(client, err.message || 'Invalid move');
    }
  }

  handleReconnect(client, payload) {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      if (!data || !data.username) {
        this.sendError(client, 'Invalid reconnect data');
        return;
      }
      
      client.username = data.username;
      
      if (data.game_id) {
        const game = this.gameService.getGame(data.game_id);
        if (game && (game.player1.username === data.username || game.player2.username === data.username)) {
          client.gameID = game.id;
          this.sendGameState(client, game);
          return;
        }
      }
      
      this.sendError(client, 'No active game found');
    } catch (err) {
      console.error('Error in handleReconnect:', err);
      this.sendError(client, 'Failed to reconnect');
    }
  }

  broadcastGameState(gameID) {
    const gameState = this.gameService.getGameStateForClient(gameID);
    if (!gameState) {
      return;
    }
    
    const state = {
      type: 'GAME_STATE_UPDATE',
      payload: JSON.stringify(gameState)
    };
    
    const stateJSON = JSON.stringify(state);
    
    for (const [ws, client] of this.clients) {
      if (client.gameID === gameID && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(stateJSON);
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
    }
  }

  sendGameState(client, game) {
    const gameState = this.gameService.getGameStateForClient(game.id);
    if (!gameState) {
      return;
    }
    
    const state = {
      type: 'GAME_STATE_UPDATE',
      payload: JSON.stringify(gameState)
    };
    
    this.sendToClient(client.username, JSON.stringify(state));
  }

  sendGameStarted(client, game) {
    const gameState = this.gameService.getGameStateForClient(game.id);
    if (!gameState) {
      return;
    }
    
    const payload = {
      game_id: game.id,
      player1: game.player1.username,
      player2: game.player2.username,
      is_bot_game: game.isBotGame,
      board: game.board,
      current_turn: game.currentTurn,
      status: game.status
    };
    
    const msg = {
      type: 'GAME_STARTED',
      payload: JSON.stringify(payload)
    };
    
    this.sendToClient(client.username, JSON.stringify(msg));
    this.sendGameState(client, game);
  }

  sendWaiting(client) {
    const msg = {
      type: 'WAITING_FOR_OPPONENT'
    };
    
    this.sendToClient(client.username, JSON.stringify(msg));
  }

  sendError(client, errorMsg) {
    const msg = {
      type: 'ERROR',
      payload: JSON.stringify({ message: errorMsg })
    };
    
    this.sendToClient(client.username, JSON.stringify(msg));
  }

  sendToClient(username, message) {
    for (const [ws, client] of this.clients) {
      if (client.username === username && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
    }
  }

  getClientByUsername(username) {
    for (const [ws, client] of this.clients) {
      if (client.username === username) {
        return client;
      }
    }
    return null;
  }

  publishGameStartedEvent(game) {
    if (this.kafkaProducer) {
      const event = {
        type: 'GAME_STARTED',
        gameID: game.id,
        timestamp: new Date(),
        data: {
          player1: game.player1.username,
          player2: game.player2.username,
          isBotGame: game.isBotGame
        }
      };
      this.kafkaProducer.publishEvent(event).catch(() => {});
    }
  }

  publishMoveEvent(gameID, player, column) {
    if (this.kafkaProducer) {
      const game = this.gameService.getGame(gameID);
      if (!game) return;
      
      const event = {
        type: 'MOVE_PLAYED',
        gameID: gameID,
        timestamp: new Date(),
        data: { player, column }
      };
      this.kafkaProducer.publishEvent(event).catch(() => {});
    }
  }

  publishGameEndedEvent(game) {
    if (this.kafkaProducer) {
      const winner = game.winner ? game.winner.username : '';
      const event = {
        type: 'GAME_ENDED',
        gameID: game.id,
        timestamp: new Date(),
        data: {
          winner: winner,
          isDraw: game.isDraw,
          player1: game.player1.username,
          player2: game.player2.username
        }
      };
      this.kafkaProducer.publishEvent(event).catch(() => {});
    }
  }
}

module.exports = SocketHandler;
