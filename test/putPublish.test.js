const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app'); // Ensure this path points to your Express app
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { ObjectId } = require('mongodb');

chai.use(chaiHttp);
const { expect } = chai;

describe('putPublish', () => {
  let redisGetStub, dbFindOneStub, dbUpdateOneStub;

  beforeEach(() => {
    redisGetStub = sinon.stub(redisClient, 'get');
    dbFindOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne');
    dbUpdateOneStub = sinon.stub(dbClient.db.collection('files'), 'updateOne');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await chai.request(app).put('/path-to-putPublish/123');
    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 401 if user is not found', async () => {
    redisGetStub.resolves('123');
    dbFindOneStub.resolves(null);

    const res = await chai.request(app)
      .put('/path-to-putPublish/123')
      .set('x-token', 'valid-token');

    expect(res).to.have.status(401);
    expect(res.body).to.deep.equal({ error: 'Unauthorized' });
  });

  it('should return 404 if file is not found', async () => {
    redisGetStub.resolves('123');
    dbFindOneStub.resolves({ _id: '123' });
    dbFindOneStub.withArgs('files').resolves(null);

    const res = await chai.request(app)
      .put('/path-to-putPublish/123')
      .set('x-token', 'valid-token');

    expect(res).to.have.status(404);
    expect(res.body).to.deep.equal({ error: 'Not found' });
  });

  it('should return 200 and update the file document', async () => {
    const userId = new ObjectId();
    const fileId = new ObjectId();
    redisGetStub.resolves(userId.toString());
    dbFindOneStub.onFirstCall().resolves({ _id: userId });
    dbFindOneStub.onSecondCall().resolves({ _id: fileId, userId: userId.toString() });
    dbUpdateOneStub.resolves({ modifiedCount: 1 });

    const res = await chai.request(app)
      .put(`/path-to-putPublish/${fileId.toString()}`)
      .set('x-token', 'valid-token');

    expect(res).to.have.status(200);
    expect(res.body.isPublic).to.be.true;
  });

  // Additional tests can be added here for other scenarios
});