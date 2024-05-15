const request = require('supertest');
const app = require('../app'); // Ensure this path points to your Express app
const dbClient = require('../utils/db');

jest.mock('../utils/db');

describe('getStats', () => {
  it('should return 200 and stats if the database is alive', async () => {
    dbClient.isAlive.mockReturnValue(true);
    dbClient.nbUsers.mockResolvedValue(10);
    dbClient.nbFiles.mockResolvedValue(5);

    const response = await request(app).get('/path-to-getStats');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ users: 10, files: 5 });
  });

  it('should return 500 if the database is not alive', async () => {
    dbClient.isAlive.mockReturnValue(false);

    const response = await request(app).get('/path-to-getStats');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('should return 500 if there is an exception', async () => {
    dbClient.isAlive.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const response = await request(app).get('/path-to-getStats');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  // Additional tests can be added here for other scenarios
});