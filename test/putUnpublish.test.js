const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const expect = chai.expect;
const app = require('../app'); // Ensure this path points to your Express app
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const ObjectId = require('mongodb').ObjectId;

chai.use(chaiHttp);

describe('putUnpublish', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(redisClient, 'get');
    sandbox.stub(dbClient.db.collection('users'), 'findOne');
    sandbox.stub(dbClient.db.collection('files'), 'findOne');
    sandbox.stub(dbClient.db.collection('files'), 'updateOne');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await chai.request(app).put('/path-to-putUnpublish/some-file-id');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if user is not found', async () => {
    redisClient.get.resolves('123');
    dbClient.db.collection('users').findOne.resolves(null);

    const res = await chai.request(app)
      .put('/path-to-putUnpublish/some-file-id')
      .set('x-token', 'valid-token');

    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 404 if file is not found', async () => {
    redisClient.get.resolves('123');
    dbClient.db.collection('users').findOne.resolves({ _id: ObjectId('123') });
    dbClient.db.collection('files').findOne.resolves(null);

    const res = await chai.request(app)
      .put('/path-to-putUnpublish/some-file-id')
      .set('x-token', 'valid-token');

    expect(res).to.have.status(404);
    expect(res.body).to.deep.equal({ error: 'Not found' });
  });

  it('should return 200 and update file document when all conditions are met', async () => {
    const userId = '123';
    const fileId = '456';
    const file = { _id: ObjectId(fileId), userId: userId.toString(), isPublic: true };

    redisClient.get.resolves(userId);
    dbClient.db.collection('users').findOne.resolves({ _id: ObjectId(userId) });
    dbClient.db.collection('files').findOne.resolves(file);
    dbClient.db.collection('files').updateOne.resolves({ modifiedCount: 1 });

    const res = await chai.request(app)
      .put(`/path-to-putUnpublish/${fileId}`)
      .set('x-token', 'valid-token');

    expect(res).to.have.status(200);
    expect(res.body).to.deep.include({ ...file, isPublic: false });
  });

  // Additional tests can be added here for other scenarios
});