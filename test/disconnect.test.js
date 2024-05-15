const request = require('supertest');
const app = require('../app'); // Ensure this path points to your Express app
const redisClient = require('../utils/redis');

jest.mock('../utils/redis');

describe('getDisconnect', () => {
  it('should return 401 if no token is provided', async () => {
    const response = await request(app).get('/path-to-getDisconnect');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if no user is associated with the provided token', async () => {
    redisClient.get.mockResolvedValue(null);
    const response = await request(app)
      .get('/path-to-getDisconnect')
      .set('x-token', 'invalid-token');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 204 and delete the token if it is valid', async () => {
    redisClient.get.mockResolvedValue('123'); // Assuming '123' is a valid userId
    redisClient.del.mockResolvedValue(true);

    const response = await request(app)
      .get('/path-to-getDisconnect')
      .set('x-token', 'valid-token');
    expect(response.status).toBe(204);
    expect(redisClient.del).toHaveBeenCalledWith('auth_valid-token');
  });

  it('should return 500 if there is an internal server error', async () => {
    redisClient.get.mockRejectedValue(new Error('Internal Server Error'));
    const response = await request(app)
      .get('/path-to-getDisconnect')
      .set('x-token', 'valid-token');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });

  // Additional tests can be added here for other scenarios
});
