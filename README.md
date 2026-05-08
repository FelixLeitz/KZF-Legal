# KFZ-Legal
KZF Legal — an AI powered legal guidance platform
helping immigrants navigate the Australian immigration system.

## Expected Folder Structure

This is the current baseline structure and will evolve over time as features are added.

```text
public/
  index.html
  css/
    styles.css
  js/
    chat.js
    upload.js
    socket.js

server/
  app.js
  server.js
  routes/
    .gitkeep
  models/
    .gitkeep
  controllers/
    .gitkeep
  config/
    .gitkeep
  services/
    .gitkeep

rag/
  chunker.js
  embedder.js
  vectorStore.js
  webRetriever.js
  contextBuilder.js
  pipeline.js

tests/
  public/
  rag/
  server/
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** Clerk
- **Database:** MongoDB (Mongoose)

## Getting Started

### Prerequisites

- Node.js v20 or higher
- npm v10 or higher
- MongoDB instance (local or Atlas)
- Clerk account (for auth keys)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kzf-legal-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Verify the server is running:
   ```bash
   curl http://localhost:3000/api/health
   ```

## Frontend

The frontend is a vanilla HTML/CSS/JavaScript application served from the `public/` folder.

### Pages

| Page | File | Description |
|------|------|-------------|
| Login / Register | `index.html` | Authentication screens for signing in or creating an account. Connects to `/api/login-page` and `/api/register-page`. |
| Home | `index.html` | Dashboard shown after login. Displays a greeting, quick ask box, recent conversations, and shortcuts to other pages. |
| Chat | `index.html` | Main AI conversation interface. Messages are sent to the backend via Socket.io and responses are rendered with citation badges. |
| Upload | `index.html` | Drag and drop document upload page. Accepts PDF, DOC, and DOCX files up to 10MB. Connects to `/api/upload-page`. |
| History | `index.html` | Lists all past conversation sessions with search and date filtering. Supports resume and delete actions. |

### Frontend Files 

| File | Description |
|------|-------------|
| `public/css/styles.css` | All styling design tokens, layout, components. |
| `public/js/chat.js` | Handles message rendering, typing indicator, suggestion chips, and session title updates. |
| `public/js/socket.js` | Manages the Socket.io connection. Authenticates with the session token from login and listens for `chat:response` events. |
| `public/js/upload.js` | Handles drag and drop, client-side file validation (type, size, duplicates), and upload progress UI. |
| `public/js/app.js` | Handles main functionality of the app flow states. |