import redis from 'redis';
class RedisClient {
    constructor() {
        this.client = redis.createClient({
            host: 'localhost',
            port: 6379,
            debug_mode: true,
        });

        this.client.on('error', (error) => {
            console.error('Redis Client Eroor:', error);
        });
    }
   
    async isAlive() {
        try {
            const val = await new Promise((resolve, reject) => {
                this.client.on('connect', (err, reply) => {
                    if (err) reject(err);
                    else resolve(reply);
                });
            });
            return true;
        }catch (err) {
            console.error('Error', err);
        }
    }
    

    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if (err) {
                    reject(err);
                }else {
                    resolve(reply);
                }
            });         
        }); 
    }

    async set(key, value, duration) {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, 'EX', duration,  (err, reply) => {
                if (err) {
                    reject(err);
                }else {
                    resolve(reply)
                }
            });
        });
    }

    async del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, reply) => {
                if (err) {
                    reject(err);
                }else {
                    resolve(reply > 0);
                }
            });
        });
    }
};


const redisClient = new RedisClient();
module.exports = redisClient;