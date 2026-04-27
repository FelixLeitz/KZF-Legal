const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../server/app');

// Registration endpoint tests - covers successful registration and various validation errors
describe('POST /api/auth/register', () => {

    const validUser = {
        email: 'maria.santos@example.com',
        password: 'SecurePass123!'
    }

    // Standard successful registration test - should create a new user and return a safe profile
    it('should register a new user and return 201 with a safe user profile', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(validUser)

        expect(res.status).to.equal(201)
        expect(res.body.success).to.be.true
        expect(res.body.data).to.have.property('userId')
        expect(res.body.data).to.have.property('email', validUser.email)
        expect(res.body.data).to.not.have.property('password')
    })

    // Attempting to register with an email that already exists should return a 409 conflict error
    it('should return 409 USER_ALREADY_EXISTS when email is already registered', async () => {
        await request(app).post('/api/auth/register').send(validUser)

        const res = await request(app)
            .post('/api/auth/register')
            .send(validUser)

        expect(res.status).to.equal(409)
        expect(res.body.success).to.be.false
        expect(res.body.error.code).to.equal('USER_ALREADY_EXISTS')
    })

    // Validation error tests - missing email, short password and ensuring password is never returned
    it('should return 400 VALIDATION_ERROR when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validUser, email: undefined })

        expect(res.status).to.equal(400)
        expect(res.body.error.code).to.equal('VALIDATION_ERROR')
    })

    it('should return 400 VALIDATION_ERROR when password is under 8 characters', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validUser, password: 'abc' })

        expect(res.status).to.equal(400)
        expect(res.body.error.code).to.equal('VALIDATION_ERROR')
    })

    it('should never return the password in the response body', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(validUser)

        expect(res.body.data).to.not.have.property('password')
        expect(JSON.stringify(res.body)).to.not.include(validUser.password)
    })
})

// Login endpoint tests - covers successful login, invalid credentials, and validation errors
describe('POST /api/auth/login', () => {

    const validUser = {
        email: 'maria.santos@example.com',
        password: 'SecurePass123!'
    }

    // Register the user before each login test
    beforeEach(async () => {
        await request(app).post('/api/auth/register').send(validUser)
    })

    // Standard successful login test - should return a JWT token and user profile without password
    it('should return 200 with a JWT token and user profile on valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: validUser.email, password: validUser.password })

        expect(res.status).to.equal(200)
        expect(res.body.success).to.be.true
        expect(res.body.data).to.have.property('token')
        expect(res.body.data).to.have.property('user')
        expect(res.body.data.user).to.not.have.property('password')
    })

    // Invalid credentials tests - wrong password and non-existent email should both return 401 with appropriate error codes
    it('should return 401 AUTH_INVALID_CREDENTIALS on wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: validUser.email, password: 'WrongPass123!' })

        expect(res.status).to.equal(401)
        expect(res.body.error.code).to.equal('AUTH_INVALID_CREDENTIALS')
    })

    it('should return 401 AUTH_INVALID_CREDENTIALS on non existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@example.com', password: validUser.password })

        expect(res.status).to.equal(401)
        expect(res.body.error.code).to.equal('AUTH_INVALID_CREDENTIALS')
    })

    // Validation error tests - missing email and missing password should both return 400 with VALIDATION_ERROR code
    it('should return 400 VALIDATION_ERROR when password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: validUser.email })

        expect(res.status).to.equal(400)
        expect(res.body.error.code).to.equal('VALIDATION_ERROR')
    })

    it('should return 400 VALIDATION_ERROR when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: validUser.password })

        expect(res.status).to.equal(400)
        expect(res.body.error.code).to.equal('VALIDATION_ERROR')
    })
})

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
describe('POST /api/auth/logout', () => {

    let token

    beforeEach(async () => {
        await request(app).post('/api/auth/register').send({
            email: 'maria.santos@example.com',
            password: 'SecurePass123!',
            firstName: 'Maria',
            lastName: 'Santos'
        })

        const res = await request(app).post('/api/auth/login').send({
            email: 'maria.santos@example.com',
            password: 'SecurePass123!'
        })

        token = res.body.data.token
    })

    // Standard successful logout test - should return a success message for authenticated users
    it('should return 200 with a success message for authenticated users', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).to.equal(200)
        expect(res.body.success).to.be.true
        expect(res.body.data.message).to.equal('Successfully logged out')
    })

    // Unauthenticated logout attempts should return a 401 error with AUTH_INVALID_TOKEN code
    it('should return 401 AUTH_INVALID_TOKEN for unauthenticated requests', async () => {
        const res = await request(app)
            .post('/api/auth/logout')

        expect(res.status).to.equal(401)
        expect(res.body.error.code).to.equal('AUTH_INVALID_TOKEN')
    })
})
