# CollaborativeLearning
### **פלטפורמה ללמידה שיתופית בקריה האקדמית אונו**

A comprehensive collaborative learning platform designed for Ono Academic College, built with modern web technologies to facilitate seamless interaction between students, lecturers, and administrators.

## What This Application Does

CollaborativeLearning is an educational platform that enables:

- **Students** to upload, share, and access study materials across different courses
- **Lecturers** to review and approve student submissions, manage course content, and track engagement
- **Administrators** to oversee the entire system, manage users, courses, and maintain platform integrity

The platform streamlines the academic workflow by providing role-based access control, secure file management, and intuitive interfaces for all user types.

## Project Structure

```
src/
├── api/              # API layer and data management
│   ├── apiClient.js  # Generic HTTP client
│   ├── entities.js   # Data models and entity definitions
│   └── integrations.js # External service integrations
├── components/       # Reusable UI components
│   ├── ui/           # Shadcn/ui component library
│   ├── AccessibilityWidget.jsx
│   └── NotificationService.jsx
├── pages/            # Application pages/views
│   ├── Dashboard.jsx # Main dashboard
│   ├── Course.jsx    # Individual course view
│   ├── AdminPanel.jsx # Admin management interface
│   └── ...           # Additional page components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
└── utils/            # Helper functions
```

## Key Features

- **Multi-Role Dashboard**: Adaptive interface that changes based on user role (student/lecturer/admin)
- **File Management System**: Secure upload, categorization, and approval workflow for educational materials
- **Course Management**: Comprehensive course creation, enrollment, and content management
- **Real-time Notifications**: Keep users informed about file approvals, course updates, and system announcements
- **Accessibility Support**: Built-in accessibility features for inclusive learning
- **Responsive Design**: Optimized for desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation and Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technology Stack

- **Frontend Framework**: React 18 + Vite
- **UI Library**: Radix UI primitives + Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Hooks and Context API
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom component system

## Development

The application follows modern React patterns with functional components, custom hooks, and a clean separation of concerns. The UI is built using Shadcn/ui components for consistency and accessibility.

For support and development questions, please contact the development team.