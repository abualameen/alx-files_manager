const request = require('supertest');
const app = require('../app'); // Ensure this path points to your Express app
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

jest.mock('../utils/db');
jest.mock('../utils/redis');

describe('getConnect', () => {
  it('should return 401 if no authorization header is present', async () => {
    const response = await request(app).get('/path-to-getConnect');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if authorization header does not start with Basic', async () => {
    const response = await request(app)
      .get('/path-to-getConnect')
      .set('Authorization', 'Bearer token');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if credentials are not provided', async () => {
    const credentials = Buffer.from(':').toString('base64');
    const response = await request(app)
      .get('/path-to-getConnect')
      .set('Authorization', `Basic ${credentials}`);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if user is not found', async () => {
    dbClient.db.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null)
    });
    const credentials = Buffer.from('email@example.com:password').toString('base64');
    const response = await request(app)
      .get('/path-to-getConnect')
      .set('Authorization', `Basic ${credentials}`);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 200 and a token if credentials are correct', async () => {
    const hashedPassword = crypto.createHash('sha1').update('password').digest('hex');
    dbClient.db.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ email: 'email@example.com', password: hashedPassword }),
      insertOne: jest.fn().mockResolvedValue({ insertedId: '123' })
    });
    redisClient.set.mockResolvedValue(true);

    const credentials = Buffer.from('email@example.com:password').toString('base64');
    const response = await request(app)
      .get('/path-to-getConnect')
      .set('Authorization', `Basic ${credentials}`);
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  // Additional tests can be added here for other scenarios
});