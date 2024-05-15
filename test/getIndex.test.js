const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app'); // Ensure this path points to your Express app
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const ObjectId = require('mongodb').ObjectId;

chai.use(chaiHttp);
const expect = chai.expect;

describe('getIndex', () => {
  let redisStub, dbFindOneStub, dbAggregateStub;

  beforeEach(() => {
    redisStub = sinon.stub(redisClient, 'get');
    dbFindOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne');
    dbAggregateStub = sinon.stub(dbClient.db.collection('files'), 'aggregate');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await chai.request(app).get('/path-to-getIndex');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if token is invalid', async () => {
    redisStub.resolves(null);
    const res = await chai.request(app).get('/path-to-getIndex').set('x-token', 'invalid-token');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 500 if there is an error retrieving the user', async () => {
    redisStub.resolves('123');
    dbFindOneStub.rejects(new Error('DB error'));
    const res = await chai.request(app).get('/path-to-getIndex').set('x-token', 'valid-token');
    expect(res).to.have.status(500);
    expect(res.body).to.deep.equal({ error: 'Internal Server Error' });
  });

  it('should return files if token and user are valid', async () => {
    redisStub.resolves('123');
    dbFindOneStub.resolves({ _id: new ObjectId('123') });
    dbAggregateStub.resolves([{ name: 'file1' }, { name: 'file2' }]);
    const res = await chai.request(app).get('/path-to-getIndex').set('x-token', 'valid-token').query({ parentId: '0', page: 0 });
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal([{ name: 'file1' }, { name: 'file2' }]);
  });

  // Additional tests can be added here for other scenarios
});