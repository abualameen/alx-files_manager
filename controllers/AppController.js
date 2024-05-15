import dbClient from '../utils/db';
import redisClient from '../utils/redis';


const AppController = {
  getStatus: async (req, res) => {
    try {
      const isRedisAlive = await redisClient.isAlive();
      const isDBAlive = await dbClient.isAlive();

      if (isRedisAlive && isDBAlive) {
        return res.status(200).json({ redis: isRedisAlive, db: isDBAlive });
      } else {
        return res.status(500).json({ error: 'Internal server error' });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  getStats: async (req, res) => {
    try {
      if (dbClient.isAlive()) {
        const usersCount = await dbClient.nbUsers();
        const filesCount = await dbClient.nbFiles();
        return res.status(200).json({ users: usersCount, files: filesCount });
      } else {
        return res.status(500).json({ error: 'Internal server error' });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default AppController;
