const { getLeaderboard } = require('../config/db');

class GameController {
  constructor(db) {
    this.db = db;
  }

  async getLeaderboard(req, res) {
    try {
      const entries = await getLeaderboard(this.db, 10);
      res.json(entries);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }

  healthCheck(req, res) {
    res.status(200).send('OK');
  }
}

module.exports = GameController;
