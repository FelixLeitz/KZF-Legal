/* eslint-disable no-console */
const path = require("path");
const dotenv = require("dotenv");
const { submitQuery } = require("../index");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

function printUsage() {
  console.log('Usage: npm run rag:query -- "<question>" [--user <userId>]');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let userId = "demo-user";
  const questionParts = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--user") {
      userId = args[index + 1] || userId;
      index += 1;
      continue;
    }
    questionParts.push(token);
  }

  return {
    userId,
    question: questionParts.join(" ").trim(),
  };
}

function printResult({ answer, citations, meta }) {
  console.log("\nAnswer:\n");
  console.log(answer || "No answer generated.");

  console.log("\nCitations:\n");
  if (!citations.length) {
    console.log("No citations returned.");
  } else {
    for (const citation of citations) {
      const header = `[${citation.id}] ${citation.title} (${citation.source})`;
      console.log(header);
      if (citation.snippet) {
        console.log(`  Snippet: ${citation.snippet}`);
      }
      if (citation.url) {
        console.log(`  URL: ${citation.url}`);
      }
      if (citation.documentRef) {
        console.log(`  Document: ${citation.documentRef}`);
      }
      console.log("");
    }
  }

  console.log("Meta:");
  console.log(`  latencyMs: ${meta.latencyMs}`);
  console.log(`  model: ${meta.model}`);
  console.log(`  retrieval.vectorHits: ${meta.retrieval.vectorHits}`);
  console.log(`  retrieval.webHits: ${meta.retrieval.webHits}`);
}

async function run() {
  const { userId, question } = parseArgs(process.argv);
  if (!question) {
    printUsage();
    process.exit(1);
  }

  const response = await submitQuery({ userId, question });
  printResult(response);
}

run().catch((error) => {
  console.error("Query failed:", error.message);
  if (error.code) {
    console.error(`Error code: ${error.code}`);
  }
  process.exit(1);
});
