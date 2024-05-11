
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');



const AppController = {
    getStatus: async(req, res) => {
        try {
            const isRedisAlive = await redisClient.isAlive();
            const isDBAlive = await dbClient.isAlive();
            console.log(`${isRedisAlive }`);
            console.log(`${isDBAlive }`);
            if (isRedisAlive && isDBAlive) {
                console.log('yes');
                res.status(200).send({ redis: isRedisAlive, db: isDBAlive });
            } else {
                res.status(500).send('Internal server Error');
            }
        } catch (error) {
            console.error('Error checking status:', error);
            res.status(500).send('Internal Server Error');
        }
  
    },
    getStats: async (req, res) => {
        if  (dbClient.isAlive()) {
            try {
                const usersCount = await dbClient.nbUsers();
                const filesCount = await dbClient.nbFiles();
                res.send({ users: usersCount, files: filesCount });
            } catch (error) {
                console.error('Error fetching stats:', error);
                res.status(500).send('Internal Server Error');
            }

        }
    }
};

module.exports = AppController;