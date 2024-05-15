import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus: async (req, res) => {

    const isRedisAlive = redisClient.isAlive();
    const isDBAlive = dbClient.isAlive();

    return res.status(200).json({ redis: isRedisAlive, db: isDBAlive });
  },
  getStats: async (req, res) => {
   
    
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    return res.status(200).json({ users: usersCount, files: filesCount });
  },
};

export default AppController;
