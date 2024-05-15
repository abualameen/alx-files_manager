const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('../app'); // Ensure this path points to your Express app
const dbClient = require('../utils/db');
const expect = chai.expect;

chai.use(chaiHttp);

describe('postNew', () => {
  let dbCollectionStub;

  beforeEach(() => {
    dbCollectionStub = sinon.stub(dbClient.db, 'collection');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 400 if email and password are missing', async () => {
    const res = await chai.request(app).post('/path-to-postNew').send({});
    expect(res).to.have.status(400);
    expect(res.body).to.deep.equal({ error: 'Missing email and Missing password' });
  });

  it('should return 400 if email is missing', async () => {
    const res = await chai.request(app).post('/path-to-postNew').send({ password: 'password123' });
    expect(res).to.have.status(400);
    expect(res.body).to.deep.equal({ error: 'Missing email' });
  });

  it('should return 400 if password is missing', async () => {
    const res = await chai.request(app).post('/path-to-postNew').send({ email: 'email@example.com' });
    expect(res).to.have.status(400);
    expect(res.body).to.deep.equal({ error: 'Missing password' });
  });

  it('should return 400 if user already exists', async () => {
    dbCollectionStub.returns({
      findOne: sinon.stub().resolves({ email: 'email@example.com' })
    });
    const res = await chai.request(app).post('/path-to-postNew').send({ email: 'email@example.com', password: 'password123' });
    expect(res).to.have.status(400);
    expect(res.body).to.deep.equal({ error: 'Already exist' });
  });

  it('should return 201 and user details if user is successfully created', async () => {
    dbCollectionStub.returns({
      findOne: sinon.stub().resolves(null),
      insertOne: sinon.stub().resolves({ insertedId: '123' })
    });
    const res = await chai.request(app).post('/path-to-postNew').send({ email: 'email@example.com', password: 'password123' });
    expect(res).to.have.status(201);
    expect(res.body).to.deep.equal({ id: '123', email: 'email@example.com' });
  });

  // Additional tests can be added here for other scenarios
});