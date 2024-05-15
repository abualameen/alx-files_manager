const request = require('supertest');
const app = require('../app'); // Ensure this path points to your Express app
const crypto = require('crypto');
const dbClient = require('../utils/db');

jest.mock('../utils/db');

describe('postNew', () => {
  it('should return 400 if both email and password are missing', async () => {
    const response = await request(app).post('/path-to-postNew').send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing email and Missing password' });
  });

  it('should return 400 if email is missing', async () => {
    const response = await request(app).post('/path-to-postNew').send({ password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing email' });
  });

  it('should return 400 if password is missing', async () => {
    const response = await request(app).post('/path-to-postNew').send({ email: 'email@example.com' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing password' });
  });

  it('should return 400 if user already exists', async () => {
    dbClient.db.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ email: 'email@example.com' })
    });
    const response = await request(app).post('/path-to-postNew').send({ email: 'email@example.com', password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Already exist' });
  });

  it('should return 201 when a new user is created', async () => {
    dbClient.db.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: '123' })
    });
    const response = await request(app).post('/path-to-postNew').send({ email: 'newemail@example.com', password: 'password123' });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: '123', email: 'newemail@example.com' });
  });

  // Additional tests can be added here for other scenarios
});