import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: 'localhost',
      port: 6379,
    });
    this.isConnected = false;

    this.client.on('error', (error) => {
      console.error('Redis Client Eroor:', error);
    });
    this.client.on('connect', () => {
      this.isConnected = true;
    })
  }

  async isAlive() {
    // Return a promise that resolves with the isConnected status after a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.isConnected); // Resolve the promise with the current isConnected status
      }, 10000); // Wait for 5 seconds before returning the connection status
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
}

const redisClient = new RedisClient();

export default redisClient;