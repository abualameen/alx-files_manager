import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: 'localhost',
      port: 6379,
    });
    this.isConnected = false;
    this.client.on('error', (error) => {
      console.error('Redis Client Error:', error);
    });
  }

  waitConnection() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkConnection = () => {
        if (attempts >= 10) {
          reject(new Error('Connection to Redis could not be established after 10 attempts'));
        } else if (!this.isConnected) {
          setTimeout(() => {
            attempts++;
            checkConnection();
          }, 1000);
        } else {
          resolve();
        }
      };
      checkConnection();
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply > 0);
        }
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
