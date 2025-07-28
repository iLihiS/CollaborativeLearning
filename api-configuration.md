# API Configuration Guide

## Overview

Your application uses a custom API client to communicate with your backend. You need to set up your own backend API to handle the following endpoints.

## Required API Endpoints

### Authentication Endpoints

```
GET    /api/auth/me              - Get current user information
PATCH  /api/auth/me              - Update current user data
POST   /api/auth/login           - User login
POST   /api/auth/logout          - User logout
POST   /api/auth/register        - User registration
```

### Entity Endpoints

Each entity follows RESTful conventions:

#### Students
```
GET    /api/students                    - List all students
GET    /api/students?{filters}          - Filter students
GET    /api/students/{id}               - Get specific student
POST   /api/students                    - Create new student
PUT    /api/students/{id}               - Update student
DELETE /api/students/{id}               - Delete student
```

#### Courses
```
GET    /api/courses                     - List all courses
GET    /api/courses?sort={field}        - List courses with sorting
GET    /api/courses?{filters}           - Filter courses
GET    /api/courses/{id}                - Get specific course
POST   /api/courses                     - Create new course
PUT    /api/courses/{id}                - Update course
DELETE /api/courses/{id}                - Delete course
```

#### Files
```
GET    /api/files                       - List all files
GET    /api/files?{filters}             - Filter files (e.g., ?course_id=123&status=approved)
GET    /api/files/{id}                  - Get specific file
POST   /api/files                       - Create new file record
PUT    /api/files/{id}                  - Update file
DELETE /api/files/{id}                  - Delete file
```

#### Lecturers
```
GET    /api/lecturers                   - List all lecturers
GET    /api/lecturers?{filters}         - Filter lecturers
GET    /api/lecturers/{id}              - Get specific lecturer
POST   /api/lecturers                   - Create new lecturer
PUT    /api/lecturers/{id}              - Update lecturer
DELETE /api/lecturers/{id}              - Delete lecturer
```

#### Messages
```
GET    /api/messages                    - List all messages
GET    /api/messages?{filters}          - Filter messages (e.g., ?sender_email=user@email.com)
GET    /api/messages/{id}               - Get specific message
POST   /api/messages                    - Create new message
PUT    /api/messages/{id}               - Update message
DELETE /api/messages/{id}               - Delete message
```

#### Notifications
```
GET    /api/notifications               - List all notifications
GET    /api/notifications?{filters}     - Filter notifications
GET    /api/notifications/{id}          - Get specific notification
POST   /api/notifications               - Create new notification
PUT    /api/notifications/{id}          - Update notification
DELETE /api/notifications/{id}          - Delete notification
```

#### Academic Tracks
```
GET    /api/academic-tracks             - List all academic tracks
GET    /api/academic-tracks?{filters}   - Filter tracks (e.g., ?active=true)
GET    /api/academic-tracks/{id}        - Get specific track
POST   /api/academic-tracks             - Create new track
PUT    /api/academic-tracks/{id}        - Update track
DELETE /api/academic-tracks/{id}        - Delete track
```

### File Upload Endpoint

```
POST   /api/files/upload                - Upload file
```

Expected request: `multipart/form-data` with file field
Expected response: `{ "file_url": "https://your-storage.com/path/to/file" }`

### AI/LLM Integration Endpoint

```
POST   /api/llm/invoke                  - Invoke LLM for various tasks
```

Expected request body:
```json
{
  "prompt": "Your prompt here",
  "type": "text|image|extraction",
  "options": {}
}
```

### Email Service Endpoint

```
POST   /api/email/send                  - Send email
```

Expected request body:
```json
{
  "to": "recipient@email.com",
  "subject": "Email subject",
  "content": "Email content",
  "template": "optional_template_name"
}
```

## Authentication

All API requests (except login/register) should expect a Bearer token in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

The token is automatically managed by the API client and stored in localStorage as 'auth_token'.

## Backend Technology Recommendations

### Option 1: Node.js/Express
- **Database**: PostgreSQL with Prisma or Sequelize
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3, Cloudinary, or local storage
- **Email**: SendGrid, Nodemailer, or AWS SES
- **AI Integration**: OpenAI API, Anthropic Claude API

### Option 2: Python/FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT with PassLib
- **File Storage**: AWS S3, Google Cloud Storage
- **Email**: SendGrid, Mailgun
- **AI Integration**: OpenAI API, Hugging Face

### Option 3: Laravel (PHP)
- **Database**: MySQL/PostgreSQL with Eloquent ORM
- **Authentication**: Laravel Sanctum
- **File Storage**: Laravel filesystem (supports S3, local)
- **Email**: Laravel Mail with various drivers
- **AI Integration**: HTTP client for API calls

### Option 4: Firebase/Supabase (No-Code Backend)
- **Database**: Firestore or Supabase PostgreSQL
- **Authentication**: Firebase Auth or Supabase Auth
- **File Storage**: Firebase Storage or Supabase Storage
- **Email**: Cloud Functions + SendGrid
- **AI Integration**: Cloud Functions for API calls

## Configuration

Update the API base URL in `src/api/apiClient.js`:

```javascript
// Change this line to match your backend URL
const apiClient = new APIClient('https://your-backend-url.com/api');
```

## Example Implementation (Node.js/Express)

Here's a basic example of how to implement the student endpoint:

```javascript
// routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET /api/students
router.get('/', async (req, res) => {
  try {
    const { sort, ...filters } = req.query;
    const students = await Student.findAll({
      where: filters,
      order: sort ? [[sort.replace('-', ''), sort.startsWith('-') ? 'DESC' : 'ASC']] : []
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

## Migration Steps

1. **Set up your backend**: Choose one of the recommended technologies
2. **Implement the API endpoints**: Start with authentication and core entities
3. **Configure file storage**: Set up cloud storage for file uploads
4. **Test the integration**: Update the API base URL and test your endpoints
5. **Deploy**: Deploy your backend and update the frontend configuration

## Testing Your API

You can test your API endpoints using tools like:
- **Postman**: For manual API testing
- **curl**: For command-line testing
- **Insomnia**: Alternative to Postman
- **Thunder Client**: VS Code extension for API testing

## Need Help?

If you need assistance implementing any of these endpoints or choosing the right backend technology for your needs, feel free to ask for specific implementation examples or architectural guidance. 