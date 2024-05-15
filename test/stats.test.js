describe('GET /stats', () => {
    it('should return status 200 and JSON response', (done) => {
        request(app)
            .get('/stats')
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, res) => {
                if (err) return done(err);
                done();
            });
    });
});