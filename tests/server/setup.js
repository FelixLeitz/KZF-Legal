const mongoose = require('mongoose');
const config = require('../../server/config/env');

// Connect to a separate test database before all tests run
before(async () => {
    // Use a different database for testing to avoid affecting development data
    const testDbUri = config.MONGODB_URI.replace(
        /\/([^/]*)$/,
        '/kzf_legal_test'
    )
    await mongoose.connect(testDbUri)
})

// Clear the database after each test to ensure test isolation
afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
    }
})

// Disconnect from the database after all tests are done
after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
})