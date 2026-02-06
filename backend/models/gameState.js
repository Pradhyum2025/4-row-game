const { v4: uuidv4 } = require('uuid');
const { newBoard, PLAYER1, PLAYER2 } = require('../utils/boardUtils');

const GameStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished'
};

function createGame(player1Username, player2Username, isBotGame) {
  const gameID = uuidv4();
  
  const game = {
    id: gameID,
    player1: { username: player1Username, color: PLAYER1 },
    player2: { username: player2Username || 'Bot', color: PLAYER2 },
    currentTurn: PLAYER1,
    board: newBoard(),
    status: (isBotGame && !player2Username) ? GameStatus.WAITING : GameStatus.ACTIVE,
    winner: null,
    isDraw: false,
    startedAt: new Date(),
    endedAt: null,
    lastMoveAt: new Date(),
    isBotGame: isBotGame
  };
  
  return game;
}

function getGameStateForClient(game) {
  return {
    game_id: game.id,
    board: game.board,
    current_turn: game.currentTurn,
    status: game.status,
    winner: game.winner ? game.winner.username : '',
    is_draw: game.isDraw,
    player1: game.player1.username,
    player2: game.player2.username,
    is_bot_game: game.isBotGame
  };
}

module.exports = {
  GameStatus,
  createGame,
  getGameStateForClient
};
