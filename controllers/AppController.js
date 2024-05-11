const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');


const AppController = {
    getStatus: async(res) => {
        try {
            const isRedisAlive = await redisClient.isAlive();
            const isDBAlive = await dbClient.isAlive();

            if (isRedisAlive && isDBAlive) {
                res.status(200).send({ "redis": true, "db": true });
            } else {
                res.status(500).send('Internal server Error');
            }
        } catch (error) {
            console.error('Error checking status:', error);
            res.status(500).send('Internal Server Error');
        }
  
    },
    getStats: async(res) => {
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