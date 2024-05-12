import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: 'localhost',
      port: 6379,
    });
    this.isConnected = false;

    // Listen for 'error' event and update isConnected status
    this.client.on('error', (error) => {
      console.error('Redis Client Error:', error.message);
      this.isConnected = false; // Update isConnected status on error
    });

    // Listen for 'connect' event and update isConnected status
    this.client.on('connect', () => {
      this.isConnected = true; // Update isConnected status on connection
    });
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
  isAlive() {
    return this.isConnected;
  }
}


const redisClient = new RedisClient();
module.exports = redisClient;
