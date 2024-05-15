const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app'); // Ensure this path points to your Express app
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { ObjectId } = require('mongodb');

chai.use(chaiHttp);
const { expect } = chai;

describe('getMe', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(redisClient, 'get');
    sandbox.stub(dbClient.db.collection('users'), 'findOne');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await chai.request(app).get('/path-to-getMe');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if token is invalid', async () => {
    redisClient.get.resolves(null);
    const res = await chai.request(app)
      .get('/path-to-getMe')
      .set('x-token', 'invalid-token');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if user does not exist', async () => {
    redisClient.get.resolves('123');
    dbClient.db.collection('users').findOne.resolves(null);
    const res = await chai.request(app)
      .get('/path-to-getMe')
      .set('x-token', 'valid-token');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 200 and user data if token and user are valid', async () => {
    const userId = '123';
    const user = { _id: ObjectId(userId), email: 'email@example.com' };
    redisClient.get.resolves(userId);
    dbClient.db.collection('users').findOne.resolves(user);
    const res = await chai.request(app)
      .get('/path-to-getMe')
      .set('x-token', 'valid-token');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal({ id: user._id, email: user.email });
  });

  // Additional tests can be added here for other scenarios
});