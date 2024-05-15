const request = require('supertest');
const app = require('../app'); // Ensure this path points to your Express app
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

jest.mock('../utils/db');
jest.mock('../utils/redis');

describe('getStatus', () => {
  it('should return 200 and status of Redis and DB when both are alive', async () => {
    redisClient.isAlive.mockResolvedValue(true);
    dbClient.isAlive.mockResolvedValue(true);

    const response = await request(app).get('/path-to-getStatus');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ redis: true, db: true });
  });

  it('should return 500 if either Redis or DB is not alive', async () => {
    redisClient.isAlive.mockResolvedValue(false);
    dbClient.isAlive.mockResolvedValue(true);

    const response = await request(app).get('/path-to-getStatus');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });

    redisClient.isAlive.mockResolvedValue(true);
    dbClient.isAlive.mockResolvedValue(false);

    const response2 = await request(app).get('/path-to-getStatus');
    expect(response2.status).toBe(500);
    expect(response2.body).toEqual({ error: 'Internal server error' });
  });

  it('should return 500 and log an error if an exception occurs', async () => {
    const error = new Error('Unexpected error');
    redisClient.isAlive.mockRejectedValue(error);
    dbClient.isAlive.mockResolvedValue(true);

    const response = await request(app).get('/path-to-getStatus');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
    expect(console.error).toHaveBeenCalledWith('Error checking status:', error);
  });

  // Additional tests can be added here for other scenarios
});