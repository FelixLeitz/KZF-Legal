"use strict";
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/env");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Document = require("../models/Document");

// Force flag for production seeding (must be explicitly passed as --force)
const args = process.argv.slice(2);
const FORCE = args.includes("--force"); 
const CLEAR = args.includes("--clear"); 

// Production safety check: refuse to run if in production without --force
if (config.NODE_ENV === "production" && !FORCE) {
    console.error(
        "    Seed script refused to run in production.\n" +
        "    Pass --force if you explicitly intend to seed a production database.\n"
    );
    process.exit(1);
}

// Seed data
const SEED_USERS = [
    {
        email: "admin@legalplatform.dev",
        password: "AdminPassword123!",
        role: "admin",
    },
    {
        email: "alice@example.com",
        password: "UserPassword123!",
        role: "user",
    },
    {
        email: "bob@example.com",
        password: "UserPassword123!",
        role: "user",
    },
];

// Builds chats with nested messages and documents for a given user ID
const buildUserData = (userId) => {
    // Chat 1: Visa Application Query 
    const visaChatId = new mongoose.Types.ObjectId();
    const visaDocId = new mongoose.Types.ObjectId();
    const visaMessageId = new mongoose.Types.ObjectId();

    const visaChat = {
        _id: visaChatId,
        user: userId,
        title: "Skilled Worker Visa Requirements",
        lastMessageAt: new Date("2026-05-06T10:30:00Z"),
    };

    const visaDocument = {
        _id: visaDocId,
        chat: visaChatId,
        user: userId,
        filename: "passport_scan.pdf",
        mimeType: "application/pdf",
        size: 204800, // 200 KB
        storageUrl: `/uploads/${userId}/passport_scan.pdf`,
        extractedSummary:
            "UK passport issued 2021, valid until 2031. Holder: Alice Johnson. " +
            "No existing visa endorsements relevant to skilled worker route.",
        checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status: "ingested",
    };

    const visaMessage = {
        _id: visaMessageId,
        chat: visaChatId,
        user: userId,
        query:
            "What are the English language requirements for a UK Skilled Worker visa " +
            "and which tests are accepted by the Home Office?",
        response: {
            answer:
                "To meet the English language requirement for a UK Skilled Worker visa, " +
                "you must demonstrate English at level B1 or above on the Common European " +
                "Framework of Reference (CEFR). Accepted evidence includes: a recognised " +
                "Secure English Language Test (SELT) such as IELTS for UKVI, Trinity ISE, " +
                "or LanguageCert; a degree taught in English; or nationality of a " +
                "majority English-speaking country as defined by the Home Office [[1]]. " +
                "The test must have been taken at an approved test centre and results " +
                "are typically valid for two years [[2]].",
            citations: [
                {
                    id: 1,
                    title: "Skilled Worker visa: Knowledge of English — GOV.UK",
                    source: "web",
                    url: "https://www.gov.uk/skilled-worker-visa/knowledge-of-english",
                    snippet:
                        "You must prove your knowledge of English to get a Skilled Worker visa. " +
                        "You'll need to prove your knowledge of English is at level B1 or above.",
                },
                {
                    id: 2,
                    title: "Approved English language tests — GOV.UK",
                    source: "web",
                    url: "https://www.gov.uk/guidance/prove-your-english-language-abilities-with-a-secure-english-language-test-selt",
                    snippet:
                        "You must take your test at an approved test centre. " +
                        "Your test results are usually valid for 2 years.",
                },
            ],
        },
        documents: [visaDocId],
        status: "completed",
        meta: {
            model: "gpt-4o",
            tokensUsed: 812,
            latencyMs: 1340,
        },
    };

    // Chat 2: Skills Assessment Query 
    const skillsChatId = new mongoose.Types.ObjectId();
    const skillsMessageId = new mongoose.Types.ObjectId();

    const skillsChat = {
        _id: skillsChatId,
        user: userId,
        title: "Engineers Australia Skills Assessment",
        lastMessageAt: new Date("2026-05-05T14:15:00Z"),
    };

    const skillsMessage = {
        _id: skillsMessageId,
        chat: skillsChatId,
        user: userId,
        query:
            "I have a Bachelor of Civil Engineering from a UK university. " +
            "Do I need a skills assessment from Engineers Australia to apply " +
            "for Australian permanent residency?",
        response: {
            answer:
                "Yes. For most engineering occupations on the Medium and Long-term " +
                "Strategic Skills List (MLTSSL), a positive skills assessment from " +
                "Engineers Australia (EA) is a mandatory requirement before you can " +
                "lodge an Expression of Interest through SkillSelect [[1]]. " +
                "For a Civil Engineer (ANZSCO 233211), EA assesses your qualifications " +
                "and work experience against Australian standards. A UK accredited " +
                "degree from a Washington Accord signatory institution is generally " +
                "recognised, which may simplify your assessment [[2]].",
            citations: [
                {
                    id: 1,
                    title: "Skills assessment for migration — Engineers Australia",
                    source: "web",
                    url: "https://www.engineersaustralia.org.au/skills-assessment",
                    snippet:
                        "A skills assessment from Engineers Australia is required for " +
                        "engineers seeking to migrate to Australia through the General " +
                        "Skilled Migration program.",
                },
                {
                    id: 2,
                    title: "Washington Accord — International Engineering Alliance",
                    source: "web",
                    url: "https://www.ieagreements.org/accords/washington/",
                    snippet:
                        "The Washington Accord recognises the substantial equivalence of " +
                        "accredited engineering degree programmes among signatory countries.",
                },
            ],
        },
        documents: [],
        status: "completed",
        meta: {
            model: "gpt-4o",
            tokensUsed: 654,
            latencyMs: 1105,
        },
    };

    // Chat 3: Pending message 
    const employmentChatId = new mongoose.Types.ObjectId();
    const employmentMessageId = new mongoose.Types.ObjectId();

    const employmentChat = {
        _id: employmentChatId,
        user: userId,
        title: "Unfair Dismissal Eligibility",
        lastMessageAt: new Date("2026-05-07T03:55:00Z"),
    };

    const employmentMessage = {
        _id: employmentMessageId,
        chat: employmentChatId,
        user: userId,
        query:
            "I was dismissed after 18 months of employment in the UK. " +
            "Am I eligible to bring an unfair dismissal claim?",
        response: {
            answer: "",
            citations: [],
        },
        documents: [],
        status: "pending",
        meta: {},
    };

    return {
        chats: [visaChat, skillsChat, employmentChat],
        documents: [visaDocument],
        messages: [visaMessage, skillsMessage, employmentMessage],
    };
};

// Helpers 
const clearCollections = async () => {
    console.log("Clearing existing collections...");
    await Message.deleteMany({});
    await Document.deleteMany({});
    await Chat.deleteMany({});
    await User.deleteMany({});
    console.log("✓ All collections cleared");
};

/**
 * Logs a summary table of what was inserted.
 */
const logSummary = (users, chats, documents, messages) => {
    console.log("Seed Summary");
    console.log("─────────────────────────────────────");
    console.log(`    Users     : ${users.length}`);
    console.log(`    Chats     : ${chats.length}`);
    console.log(`    Documents : ${documents.length}`);
    console.log(`    Messages  : ${messages.length}`);
    console.log("─────────────────────────────────────");
    console.log("Test Credentials");
    console.log("─────────────────────────────────────");
    SEED_USERS.forEach((u) => {
        console.log(`    ${u.role.padEnd(6)} | ${u.email}`);
        console.log(`           | Password: ${u.password}`);
    });
    console.log("─────────────────────────────────────");
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const seed = async () => {
    console.log(`Legal Platform Seed Script`);
    console.log(`Environment: ${config.NODE_ENV}`);

    // 1. Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");

    // 2. Wipe collections
    await clearCollections();

    // 3. Create users
    //    We use insertMany with individual saves to trigger the pre-save
    //    bcrypt hook on the User model. insertMany bypasses middleware.
    if (!CLEAR) {
        console.log("Creating users...");
        const createdUsers = [];
        for (const userData of SEED_USERS) {
            const user = new User(userData);
            await user.save(); // triggers password hashing pre-save hook
            createdUsers.push(user);
            console.log(`    ✓ ${user.email} (${user.role})`);
        }

        // 4. Build and insert chats, documents, and messages for non-admin users
        const allChats = [];
        const allDocuments = [];
        const allMessages = [];

        const regularUsers = createdUsers.filter((u) => u.role === "user");

        for (const user of regularUsers) {
            const { chats, documents, messages } = buildUserData(user._id);
            allChats.push(...chats);
            allDocuments.push(...documents);
            allMessages.push(...messages);
        }

        console.log("Inserting chats...");
        await Chat.insertMany(allChats);
        console.log(`✓ ${allChats.length} chats inserted`);

        console.log("Inserting documents...");
        await Document.insertMany(allDocuments);
        console.log(`✓ ${allDocuments.length} documents inserted`);

        console.log("Inserting messages...");
        await Message.insertMany(allMessages);
        console.log(`✓ ${allMessages.length} messages inserted`);

        // 5. Print summary
        logSummary(createdUsers, allChats, allDocuments, allMessages);
    }
};

// ─── Run ──────────────────────────────────────────────────────────────────────

seed()
    .then(() => {
        console.log("✅  Seeding complete\n");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌  Seeding failed:", err.message);
        process.exit(1);
    })
    .finally(async () => {
        // Ensure the connection is always closed, even on failure
        await mongoose.connection.close();
    });
