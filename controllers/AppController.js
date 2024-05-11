const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AppController = {
  getStatus: async (req, res) => {
    try {
      const isRedisAlive = await redisClient.isAlive();
      const isDBAlive = await dbClient.isAlive();

      if (isRedisAlive && isDBAlive) {
        res.status(200).json({ redis: true, db: true });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  getStats: async (req, res) => {
    if (dbClient.isAlive()) {
      try {
        const usersCount = await dbClient.nbUsers();
        const filesCount = await dbClient.nbFiles();
        res.status(200).json({ users: usersCount, files: filesCount });
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },
};

module.exports = AppController;
