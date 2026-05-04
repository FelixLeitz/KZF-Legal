const Anthropic = require("@anthropic-ai/sdk");

const MODEL = process.env.LLM_MODEL || "claude-haiku-4.5";

let client = null;

function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

async function generateAnswer({ question, contextText }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are a legal assistant helping immigrants understand Australian visa requirements. " +
      "Answer using only the provided context. Cite sources inline with [N] notation.",
    messages: [
      {
        role: "user",
        content: `Context:\n${contextText}\n\nQuestion: ${question}`,
      },
    ],
  });
  return response.content[0].text;
}

module.exports = { generateAnswer, MODEL };
