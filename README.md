# KFZ-Legal
KZF Legal — an AI powered legal guidance platform
helping immigrants navigate the Australian immigration system.

## Docker Setup

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- A `.env` file in the project root as shown below

---

### Environment Variables

Before running the application, you need to create a `.env` file in the root of the project.

A `.env.example` file has been provided as a template. Copy it and fill in the required variables contained in the OnTrack submission:

Note that only the AI keys and the allowed origins here are essential values that cannot be modified from the instructions without the application potentially breaking.

```env
JWT_SECRET=
JWT_EXPIRES_IN=
ALLOWED_ORIGINS=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
EMBED_MODEL=
LLM_MODEL=
```
---

### Setup & Running the App

#### 1. Build the Docker images

```bash
docker compose build
```

#### 2. Start the application

```bash
docker compose up -d
```

The app will now be running in the background. You can access it at:
**`http://localhost:3000`** 

#### 3. View live logs

```bash
docker compose logs -f app
```

Press `Ctrl+C` to stop following logs — the app will keep running.

#### 4. Test the app

The app will be running on port 3000. Access of the student endpoint (either manually or using curl as shown below) should yield the following json response body:

```bash
  curl http://localhost:3000/api/student
```

```json
{
  "success": true,
  "data": {
    "name": "Felix Leitz",
    "studentId": "s226145527"
  }
}
```

Testing the core application functionality using the database:
- Visit http://localhost:3000/ 
- Register an account and Log in
- Type Hello World on the home page and click on the Send button
- Wait for the AI response
- Use the button in the bottom left to upload the Subclass_500.pdf document from the main repository page as information for the RAG sevice to use
- Ask a specific question about Subclass 500 immigration (e.g. "What are the health requirements for obtaining a subclass 500 visa?")
- Wait for the AI response
- Navigate to the History Tab on the left hand side menu
- Click on `Resume` for the Chat you just had to retrieve it from the database and displaying it in the Chat window or `Delete`

---

### Stopping the Application

#### Stop and remove containers (keeps your data)

```bash
docker compose down
```

#### Stop, remove containers AND wipe the database

```bash
docker compose down -v
```

---

### Removing the Docker Image

To remove the Docker image from your machine entirely (e.g. to free up disk space or force a clean rebuild):

```bash
docker rmi $(docker compose images -q)
```

Or to remove all unused images system-wide:

```bash
docker image prune -a
```

---

### Quick Reference

| Command | Description |
|---|---|
| `docker compose build` | Build the Docker images |
| `docker compose up -d` | Start the app in the background |
| `docker compose logs -f app` | Follow live app logs |
| `docker compose down` | Stop and remove containers (data preserved) |
| `docker compose down -v` | Stop, remove containers **and wipe database** |
| `docker rmi $(docker compose images -q)` | Remove the Docker image |


## Expected Folder Structure

This is the current baseline structure and will evolve over time as features are added.

```text
public/
    index.html
  css/
    styles.css
  js/
    app.js
    chat.js
    upload.js
    socket.js

server/
  app.js
  server.js
  config/
    env.js
    database.js
    passport.js
  models/
    User.js
    Chat.js
    Message.js
    Document.js
  controllers/
    authController.js
    chatController.js
    documentController.js
  services/
    authService.js
    chatService.js
    documentService.js
  routes/
    index.js
    adminRoutes.js
    authRoutes.js
    chatRoutes.js
    documentRoutes.js
    healthRoutes.js
  middleware/
    authenticateSocket.js
    validateRequest.js
    errorHandler.js
    notFound.js
    requireAuth.js
    requireAdmin.js
    upload.js
  validators/
    authValidator.js
    chatValidator.js
    docValidator.js
  utils/
    logger.js
    seed.js

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
    auth.test.js
    health.test.js
    middleware.test.js
    notFound.test.js
    helpers/
      mockAuth.js
```

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** Passport
- **Database:** MongoDB (Mongoose)

## Getting Started

### Prerequisites

- Node.js v20 or higher
- npm v10 or higher
- MongoDB instance

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kryscodeless/KZF-Legal.git
   cd KFZ-Legal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the .env.example to .env

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Verify the server is running:
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

### Socket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Server → Client | `chat:response` | `{ messageId, answer, citations?, sessionId? }` |
| Server → Client | `chat:error` | `{ messageId, message, sessionId? }` |
| Server → Client | `document:updated` | `{ documentId, status, filename?, chatId? }` |

### API Endpoints (Frontend → Backend)

| Method | Endpoint | Used by |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Login form (`app.js`) |
| `POST` | `/api/auth/register` | Register form (`app.js`) |
| `POST` | `/api/auth/logout` | Logout (`app.js`) |

| `POST` | `/api/chat` | Send message (`chat.js`) |

| `POST` | `/api/documents/upload` | Upload file (`upload.js`) |
| `GET` | `/api/documents` | Load documents page (`app.js`) |
| `DELETE` | `/api/documents/:id` | Delete document (`app.js` + upload chip removal) |

| `GET` | `/api/history` | Load chat history (`app.js`) |
| `GET` | `/api/history/:chatId` | Load single conversation (`resumeSession`) |
| `DELETE` | `/api/history/:chatId` | Delete conversation (`app.js`) |