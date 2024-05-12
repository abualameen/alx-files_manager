import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: 'localhost',
      port: 6379,
      debug_mode: true,
    });
    this.isConnected = false;

    this.client.on('error', (error) => {
      console.error('Redis Client Eroor:', error);
    });
    this.client.on('connect', () => {
      this.isConnected = true;
    })
  }

  isAlive() {
    return !this.client?.connecting && this.client?.ready;
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