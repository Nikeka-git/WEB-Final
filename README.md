# Coding Tutorials Platform
## Overview
Platform for creating, sharing, and viewing programming tutorials with rich content (sections, quizzes).

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Auth**: JWT, bcrypt
- **Frontend**: Vanilla JavaScript + CSS
- **Validation**: Joi

## Setup
```bash
1. Clone repo
2. cp .env.example .env
3. Fill .env (MONGO_URI, JWT_SECRET)
4. npm install
5. npm start
```

API Documentation
Auth (Public)
```
POST /api/auth/register - Create user
POST /api/auth/login - Login user
```

Users (Private)
```
GET /api/users/profile - Get profile
PUT /api/users/profile - Update profile
```
Tutorials (Private)
```
POST /api/tutorials - Create
GET /api/tutorials - List mine
GET /api/tutorials/:id - Get one
PUT /api/tutorials/:id - Update  
DELETE /api/tutorials/:id - Delete
```
Public APIs
```
GET /api/tutorials/public - List public
GET /api/tutorials/public/:id - View public
```