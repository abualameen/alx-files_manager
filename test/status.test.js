const request = require('supertest');
const app = require('../app');

// Test suite for GET /status endpoint
describe('GET /status', () => {
    it('should return status 200 and JSON response', (done) => {
        request(app)
            .get('/status')
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, res) => {
                if (err) return done(err);
                done();
            });
    });
});