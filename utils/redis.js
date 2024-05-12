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
    this.client.on('connect', () => {
      this.isConnected = true;
    });
  }

  async connect() {
    try {
      // No need to explicitly connect, as it's done internally by the client
      this.isConnected = true;
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }

  async isAlive() {
    await this.waitConnection();
    return this.isConnected;
  }

  waitConnection() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
      } else {
        const timeout = setTimeout(() => {
          clearTimeout(timeout);
          reject(new Error('Connection timeout'));
        }, 10000); // Adjust the timeout as needed

        const checkConnection = () => {
          if (this.isConnected) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkConnection, 100); // Check again after a short delay
          }
        };

        checkConnection();
      }
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
// No need to call redisClient.connect() explicitly
module.exports = redisClient;
