const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const app = require('../app'); // Adjust this path to where your Express app is exported

chai.use(chaiHttp);
const { expect } = chai;

describe('getFile', () => {
  let dbClientStub, fsExistsStub;

  beforeEach(() => {
    // Stub the database and filesystem interactions
    dbClientStub = sinon.stub(dbClient.db.collection('files'), 'findOne');
    fsExistsStub = sinon.stub(fs, 'existsSync');
  });

  afterEach(() => {
    // Restore the original functions
    sinon.restore();
  });

  it('should return 404 if file is not found', async () => {
    dbClientStub.resolves(null);

    const res = await chai.request(app).get('/file/someFileId');
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal('Not found');
  });

  it('should return 404 if file is not public and user is unauthorized', async () => {
    dbClientStub.resolves({ isPublic: false, userId: '12345' });

    const res = await chai.request(app).get('/file/someFileId');
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal('Not found');
  });

  it('should return 400 if file type is a folder', async () => {
    dbClientStub.resolves({ type: 'folder' });

    const res = await chai.request(app).get('/file/someFileId');
    expect(res).to.have.status(400);
    expect(res.body.error).to.equal('A folder doesn\'t have content');
  });

  it('should return 404 if file is not present locally', async () => {
    dbClientStub.resolves({ localPath: '/path/to/file' });
    fsExistsStub.returns(false);

    const res = await chai.request(app).get('/file/someFileId');
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal('Not found');
  });

  it('should successfully return the file content if all checks pass', async () => {
    dbClientStub.resolves({ localPath: '/path/to/file', name: 'file.txt' });
    fsExistsStub.returns(true);
    sinon.stub(fs, 'createReadStream').returns({
      pipe: (res) => {
        res.send('file content');
      }
    });

    const res = await chai.request(app).get('/file/someFileId');
    expect(res).to.have.status(200);
    // Additional assertions for headers or content can be added here
  });
});