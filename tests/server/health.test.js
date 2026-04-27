const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../server/app');

// Overall health check endpoint test - should be accessible without authentication
describe('GET /api/health', () => {
  it('should return 200 with status ok without authentication', async () => {
    const res = await request(app)
      .get('/api/health')

    expect(res.status).to.equal(200)
    expect(res.body.success).to.be.true
    expect(res.body.data.status).to.equal('ok')
  })
})