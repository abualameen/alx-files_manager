const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app'); // Ensure this path points to your Express app
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { ObjectId } = require('mongodb');

chai.use(chaiHttp);
const { expect } = chai;

describe('getShow', () => {
  let redisGetStub, dbFindOneStub;

  beforeEach(() => {
    redisGetStub = sinon.stub(redisClient, 'get');
    dbFindOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await chai.request(app).get('/path-to-getShow');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if token is invalid', async () => {
    redisGetStub.resolves(null);
    const res = await chai.request(app)
      .get('/path-to-getShow')
      .set('x-token', 'invalid-token');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if user not found', async () => {
    redisGetStub.resolves('123');
    dbFindOneStub.resolves(null);
    const res = await chai.request(app)
      .get('/path-to-getShow')
      .set('x-token', 'valid-token');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 500 on internal server error', async () => {
    redisGetStub.rejects(new Error('Internal server error'));
    const res = await chai.request(app)
      .get('/path-to-getShow')
      .set('x-token', 'valid-token');
    expect(res).to.have.status(500);
    expect(res.body).to.deep.equal({ error: 'Internal Server Error' });
  });

  it('should return the file if everything is valid', async () => {
    const userId = '123';
    const user = { _id: ObjectId(userId) };
    const file = { _id: ObjectId('456'), userId: userId.toString() };
    redisGetStub.resolves(userId);
    dbFindOneStub.onFirstCall().resolves(user);
    dbFindOneStub.onSecondCall().resolves(file);

    const res = await chai.request(app)
      .get('/path-to-getShow')
      .set('x-token', 'valid-token');
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal(file);
  });

  // Additional tests can be added here for other scenarios
});