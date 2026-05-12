async function retrieveWebContext(query) {
  // Tavily (or equivalent) web search was deferred for this iteration (time-limited scope).
  return { query, sources: [] };
}

module.exports = { retrieveWebContext };
