# Backend Schema & API Reference
## CareerPath AI — Hack2Ignite 2026–27

---

## 1. Backend Architecture

```
server/
├── server.js                 # Express app entry, middleware setup
├── config/
│   └── db.js                 # MongoDB connection via Mongoose
├── models/
│   ├── User.js               # Student account + profile
│   ├── Career.js             # Career definitions + required skills
│   └── Roadmap.js            # Generated roadmaps + tasks
├── routes/
│   ├── auth.routes.js        # POST /register, /login
│   ├── user.routes.js        # GET/PUT /profile
│   ├── career.routes.js      # GET /careers
│   ├── match.routes.js       # POST /recommend
│   └── roadmap.routes.js     # POST /generate, PUT /task
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── match.controller.js
│   └── roadmap.controller.js
├── middleware/
│   ├── auth.middleware.js     # JWT verification
│   └── error.middleware.js    # Centralized error handler
└── data/
    └── seed.js                # Database seeding script
```

---

## 2. Mongoose Schemas

### 2.1 User Schema

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false  // Exclude from queries by default
  },
  education: {
    type: String,
    default: ''
    // e.g., "B.Tech CSE 2nd Year", "BCA 1st Year", "12th Science"
  },
  skills: [{
    skillName: { type: String, required: true },
    proficiency: { type: Number, required: true, min: 1, max: 5 }
  }],
  interests: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});
```

### 2.2 Career Schema

```javascript
const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String  // e.g., "Technology", "Design", "Data", "Business"
  },
  baseEducationScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
    // Higher = stricter education requirements
  },
  tags: [{
    type: String
    // Used for interest matching, e.g., ["coding", "web", "frontend"]
  }],
  requiredSkills: [{
    skillName: { type: String, required: true },
    minimumProficiency: { type: Number, required: true, min: 1, max: 5 },
    isCritical: { type: Boolean, default: false }
    // Critical skills apply a penalty if completely missing
  }],
  averageSalary: {
    type: String  // e.g., "₹6-12 LPA" — display only, not used in algorithm
  },
  icon: {
    type: String  // Emoji or icon class for UI
  }
}, {
  timestamps: true
});
```

### 2.3 Roadmap Schema (with embedded Tasks)

```javascript
const roadmapTaskSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  resourceLink: { type: String },
  isCompleted: { type: Boolean, default: false }
});

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetCareerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career',
    required: true
  },
  careerTitle: {
    type: String  // Denormalized for quick display
  },
  durationWeeks: {
    type: Number,
    enum: [4, 8, 12],
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tasks: [roadmapTaskSchema]
}, {
  timestamps: true
});
```

---

## 3. API Endpoints — Full Reference

### 3.1 Authentication

#### `POST /api/auth/register`
Register a new student account.

**Request Body:**
```json
{
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "password": "securePass123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Rohan Sharma",
    "email": "rohan@example.com"
  }
}
```

**Error Response (400):**
```json
{ "success": false, "error": "Email already in use" }
```

---

#### `POST /api/auth/login`
Authenticate and receive JWT.

**Request Body:**
```json
{
  "email": "rohan@example.com",
  "password": "securePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Rohan Sharma",
    "email": "rohan@example.com"
  }
}
```

**Error Response (401):**
```json
{ "success": false, "error": "Invalid credentials" }
```

---

### 3.2 User Profile

#### `GET /api/users/profile` 🔒
Get the logged-in user's full profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Rohan Sharma",
    "email": "rohan@example.com",
    "education": "B.Tech CSE 2nd Year",
    "skills": [
      { "skillName": "JavaScript", "proficiency": 3 },
      { "skillName": "Python", "proficiency": 2 }
    ],
    "interests": ["web development", "AI", "design"]
  }
}
```

---

#### `PUT /api/users/profile` 🔒
Update education, skills, and/or interests.

**Request Body (partial update supported):**
```json
{
  "education": "B.Tech CSE 2nd Year",
  "skills": [
    { "skillName": "JavaScript", "proficiency": 3 },
    { "skillName": "Python", "proficiency": 2 },
    { "skillName": "HTML/CSS", "proficiency": 4 }
  ],
  "interests": ["web development", "AI", "design"]
}
```

**Response (200):**
```json
{ "success": true, "user": { /* ...updated user object */ } }
```

---

### 3.3 Careers

#### `GET /api/careers`
List all available careers.

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "careers": [
    {
      "id": "...",
      "title": "Full-Stack Web Developer",
      "domain": "Technology",
      "icon": "🌐",
      "description": "Build complete web applications...",
      "tags": ["coding", "web", "frontend", "backend"],
      "requiredSkills": [ /* ... */ ]
    }
  ]
}
```

---

### 3.4 Career Matching

#### `POST /api/match/recommend` 🔒
Run the recommendation engine for the authenticated user.

**Request Body:** *(empty — uses the logged-in user's profile)*

**Response (200):**
```json
{
  "success": true,
  "recommendations": [
    {
      "career": { "id": "...", "title": "Full-Stack Web Developer", "icon": "🌐" },
      "totalScore": 78.5,
      "breakdown": {
        "skillScore": 72.0,
        "interestScore": 88.0,
        "educationScore": 80.0
      }
    },
    { /* 2nd career */ },
    { /* 3rd career */ }
  ]
}
```

---

### 3.5 Roadmap

#### `POST /api/roadmap/generate` 🔒
Generate a personalized learning roadmap.

**Request Body:**
```json
{
  "careerId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "durationWeeks": 8
}
```

**Response (201):**
```json
{
  "success": true,
  "roadmap": {
    "id": "...",
    "careerTitle": "Full-Stack Web Developer",
    "durationWeeks": 8,
    "progress": 0,
    "tasks": [
      {
        "_id": "...",
        "weekNumber": 1,
        "title": "Learn advanced JavaScript (ES6+)",
        "description": "Cover arrow functions, destructuring, async/await...",
        "resourceLink": "https://javascript.info/",
        "isCompleted": false
      }
    ]
  }
}
```

---

#### `PUT /api/roadmap/:roadmapId/task/:taskId` 🔒
Mark a task as completed (or uncomplete it).

**Request Body:**
```json
{ "isCompleted": true }
```

**Response (200):**
```json
{
  "success": true,
  "progress": 12.5,
  "task": {
    "_id": "...",
    "title": "Learn advanced JavaScript (ES6+)",
    "isCompleted": true
  }
}
```

---

## 4. Authentication & Authorization

| Mechanism | Detail |
|-----------|--------|
| Library | `jsonwebtoken` |
| Algorithm | HS256 |
| Payload | `{ userId: string }` |
| Expiry | 24 hours |
| Header Format | `Authorization: Bearer <token>` |
| Password Hashing | bcryptjs, 10 salt rounds |

### Auth Middleware Logic
```
1. Extract token from Authorization header
2. Verify token with JWT_SECRET
3. If valid → attach userId to req.user, call next()
4. If invalid/expired → return 401 { error: "Not authorized" }
```

---

## 5. Error Response Format

All error responses follow a consistent shape:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing/invalid token |
| 404 | Not Found — resource doesn't exist |
| 500 | Server Error — unexpected failure |

---

## 6. Database Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| users | `{ email: 1 }` unique | Fast login lookups, prevent duplicates |
| careers | `{ title: "text", tags: "text" }` | Text search for career browsing |
| roadmaps | `{ userId: 1 }` | Fetch user's roadmaps quickly |
