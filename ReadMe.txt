Auth Endpoints

POST /register → Register a new user

POST /login → Login and get token

👤 User Endpoints

GET /users → Get list of all users

GET /users/:id → Get a single user profile

PUT /users/:id → Update a user profile (optional, e.g. avatar, bio)

💬 Chat Endpoints

GET /chats → Get all chats for logged-in user

POST /chats → Create a new chat (direct or group)

GET /chats/:id → Get details of a specific chat

POST /chats/:id/add-user → Add a user to a group chat (optional)

✉️ Message Endpoints

GET /chats/:id/messages → Get all messages in a chat

POST /chats/:id/messages → Send a new message in a chat

DELETE /messages/:id → Delete a message (optional)