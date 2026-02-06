const { checkWin, checkDraw, getOpponent, validateMove, makeMove, PLAYER1, PLAYER2 } = require('../utils/boardUtils');
const { GameStatus, createGame, getGameStateForClient } = require('../models/gameState');
const Bot = require('../bot');

class GameService {
  constructor() {
    this.games = new Map();
    this.queue = [];
    this.timers = new Map();
    this.onBotGameActivated = null;
  }

  setBotGameActivatedCallback(callback) {
    this.onBotGameActivated = callback;
  }

  createGame(player1Username, player2Username, isBotGame) {
    const game = createGame(player1Username, player2Username, isBotGame);
    this.games.set(game.id, game);
    return game;
  }

  getGame(gameID) {
    return this.games.get(gameID);
  }

  joinQueue(username) {
    const existingIndex = this.queue.findIndex(qp => qp.username === username);
    if (existingIndex !== -1) {
      const qp = this.queue[existingIndex];
      this.queue.splice(existingIndex, 1);
      if (this.timers.has(username)) {
        clearTimeout(this.timers.get(username));
        this.timers.delete(username);
      }
      const game = this.getGame(qp.gameID);
      if (game) {
        return { game, started: game.status === GameStatus.ACTIVE };
      }
    }
    
    if (this.queue.length === 0) {
      const game = this.createGame(username, '', true);
      const qp = {
        username: username,
        gameID: game.id,
        joinedAt: new Date()
      };
      this.queue.push(qp);
      
      const timer = setTimeout(() => {
        const index = this.queue.findIndex(qp => qp.username === username);
        if (index !== -1) {
          const qp = this.queue[index];
          const game = this.getGame(qp.gameID);
          if (game && game.status === GameStatus.WAITING) {
            game.status = GameStatus.ACTIVE;
            if (this.onBotGameActivated) {
              this.onBotGameActivated(username, game);
            }
          }
          this.queue.splice(index, 1);
          this.timers.delete(username);
        }
      }, 10000);
      
      this.timers.set(username, timer);
      
      return { game, started: false };
    }
    
    const firstPlayer = this.queue[0];
    this.queue.shift();
    
    if (this.timers.has(firstPlayer.username)) {
      clearTimeout(this.timers.get(firstPlayer.username));
      this.timers.delete(firstPlayer.username);
    }
    
    const game = this.createGame(firstPlayer.username, username, false);
    
    return { game, started: true };
  }

  async processMove(gameID, player, column) {
    const game = this.games.get(gameID);
    if (!game) {
      throw new Error('game not found');
    }
    
    if (game.status !== GameStatus.ACTIVE) {
      throw new Error('game is not active');
    }
    
    if (game.currentTurn !== player) {
      throw new Error('not your turn');
    }
    
    if (!validateMove(game.board, column, player)) {
      throw new Error('invalid move');
    }
    
    const row = makeMove(game.board, column, player);
    if (row === -1) {
      throw new Error('invalid move');
    }
    
    game.lastMoveAt = new Date();
    
    if (checkWin(game.board, column, row, player)) {
      if (player === PLAYER1) {
        game.winner = game.player1;
      } else {
        game.winner = game.player2;
      }
      game.status = GameStatus.FINISHED;
      game.endedAt = new Date();
    } else if (checkDraw(game.board)) {
      game.isDraw = true;
      game.status = GameStatus.FINISHED;
      game.endedAt = new Date();
    } else {
      game.currentTurn = getOpponent(player);
    }
    
    return { column, row };
  }

  async getBotMove(gameID) {
    const game = this.games.get(gameID);
    if (!game) {
      throw new Error('game not found');
    }
    
    if (!game.isBotGame) {
      throw new Error('not a bot game');
    }
    
    if (game.currentTurn !== PLAYER2) {
      throw new Error('not your turn');
    }
    
    const bot = new Bot(PLAYER2);
    const column = bot.getBestMove(game.board);
    if (column === -1) {
      throw new Error('invalid move');
    }
    
    return await this.processMove(gameID, PLAYER2, column);
  }

  getGameStateForClient(gameID) {
    const game = this.getGame(gameID);
    if (!game) {
      return null;
    }
    return getGameStateForClient(game);
  }
}

module.exports = GameService;
