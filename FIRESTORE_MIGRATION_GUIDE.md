# Firestore Migration Guide

## Overview

This guide outlines the migration from localStorage to Firestore for the CollaborativeLearning application. I've created the core Firestore services and begun the migration process.

## ✅ Completed Steps

### 1. Firebase Setup
- ✅ Installed Firebase SDK (`npm install firebase`)
- ✅ Created Firebase configuration (`src/config/firebase.ts`)
- ✅ Set up Firestore database connection

### 2. Core Services Created
- ✅ **FirestoreService** (`src/services/firestoreService.ts`) - Replaces LocalStorageService
- ✅ **FirestoreUserService** (`src/services/firestoreUserService.ts`) - Replaces UserService
- ✅ **FirestoreEntity** (`src/api/firestoreEntities.ts`) - Replaces MockEntity

### 3. Migration Features
- ✅ Automatic data migration from localStorage to Firestore
- ✅ Mock data generation for new installations
- ✅ Batch operations for better performance
- ✅ Real-time listeners (optional)
- ✅ Debug utilities (FirestoreUtils in console)

## 🔧 Configuration Required

### Firebase Project Setup

1. **Create a Firebase Project:**
   ```bash
   # Go to https://console.firebase.google.com/
   # Create a new project
   # Enable Firestore Database
   ```

2. **Update Firebase Configuration:**
   Edit `src/config/firebase.ts` and replace the placeholder values:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-actual-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-actual-sender-id",
     appId: "your-actual-app-id"
   };
   ```

3. **Firestore Security Rules:**
   ```javascript
   // For development - make more restrictive for production
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

## 🚀 Remaining Migration Steps

### 1. Update Import Statements

Replace localStorage service imports throughout the codebase:

```typescript
// OLD
import { LocalStorageService } from '@/services/localStorage';
import { UserService } from '@/services/userService';

// NEW
import { FirestoreService } from '@/services/firestoreService';
import { FirestoreUserService } from '@/services/firestoreUserService';
```

### 2. Update Method Calls

Since Firestore operations are asynchronous, add `await` to all service calls:

```typescript
// OLD
const students = LocalStorageService.getStudents();
const user = UserService.getCurrentSession();

// NEW
const students = await FirestoreService.getStudents();
const user = await FirestoreUserService.getCurrentSession();
```

### 3. Update Components and Hooks

Make functions async where needed:

```typescript
// Example: useAuth hook
const loadUser = async () => {
  try {
    setLoading(true);
    
    await FirestoreUserService.initializeUsers();
    await FirestoreService.initializeData();
    
    let currentSession = await FirestoreUserService.getCurrentSession();
    // ... rest of the logic
  } catch (error) {
    console.error('Error loading user:', error);
  } finally {
    setLoading(false);
  }
};
```

### 4. Files That Need Updates

**High Priority:**
- `src/hooks/useAuth.ts` - User authentication logic
- `src/components/DebugPanel.tsx` - Debug utilities
- `src/pages/AdminStudentManagement.tsx` - Student management
- `src/utils/debugUtils.ts` - Debug functions
- `src/utils/validation.ts` - Validation functions

**Medium Priority:**
- All admin pages (`src/pages/Admin*.tsx`)
- API client (`src/api/apiClient.ts`) - Already partially updated
- Main app initialization (`src/main.tsx`) - Already updated

### 5. Testing the Migration

1. **Run the Migration:**
   ```typescript
   // In browser console
   await FirestoreUtils.migrateFromLocalStorage();
   ```

2. **Verify Data:**
   ```typescript
   // Check data in Firestore
   const students = await FirestoreUtils.getStudents();
   console.log('Students:', students);
   ```

3. **Reset if Needed:**
   ```typescript
   // Clear and regenerate data
   await FirestoreUtils.refreshAllData();
   ```

## 🔄 Migration Strategy

### Option 1: Gradual Migration (Recommended)
1. Keep both localStorage and Firestore services running
2. Migrate components one by one
3. Test each component thoroughly
4. Remove localStorage dependencies once all components are migrated

### Option 2: Complete Migration
1. Update all imports at once
2. Fix all async/await issues
3. Test the entire application
4. Remove localStorage services

## 🛠 Available Utilities

### Console Commands
```javascript
// Available in browser console after migration
FirestoreUtils.refreshAllData()     // Generate new mock data
FirestoreUtils.resetAllData()       // Clear and regenerate
FirestoreUtils.clearAllData()       // Clear all data
FirestoreUtils.getStudents()        // Get all students
FirestoreUtils.getCourses()         // Get all courses
FirestoreUtils.getLecturers()       // Get all lecturers
FirestoreUtils.migrateFromLocalStorage() // Migrate from localStorage
```

### Service Methods
```typescript
// FirestoreService methods
await FirestoreService.getStudents()
await FirestoreService.addStudent(studentData)
await FirestoreService.updateStudent(id, updates)
await FirestoreService.deleteStudent(id)
// Similar methods for lecturers, courses, files, messages, notifications

// FirestoreUserService methods
await FirestoreUserService.getAllUsers()
await FirestoreUserService.getUserByEmail(email)
await FirestoreUserService.switchUserRole(userId, newRole)
await FirestoreUserService.getCurrentSession()
await FirestoreUserService.setCurrentSession(session)
```

## 🚨 Important Notes

1. **Async/Await:** All Firestore operations are asynchronous. Make sure to use `await` or `.then()`.

2. **Error Handling:** Wrap Firestore calls in try-catch blocks for better error handling.

3. **Performance:** Firestore operations are network-based, so they're slower than localStorage. Consider caching frequently accessed data.

4. **Real-time Updates:** Firestore supports real-time listeners. Use `FirestoreService.subscribeToStudents()` for live updates.

5. **Offline Support:** Firestore has built-in offline support, but you may need to configure it for your use case.

## 🔍 Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**
   - Check your Firebase configuration in `src/config/firebase.ts`
   - Ensure your Firebase project is set up correctly

2. **"Permission denied"**
   - Update your Firestore security rules
   - For development, you can allow all reads/writes

3. **"Async function errors"**
   - Make sure all functions calling Firestore methods are marked as `async`
   - Use `await` before all Firestore service calls

4. **"Data not migrating"**
   - Check browser console for migration errors
   - Verify localStorage has data before migration
   - Use `FirestoreUtils.migrateFromLocalStorage()` manually

## 📝 Next Steps

1. **Configure Firebase Project** - Set up your actual Firebase project and update the config
2. **Update Components** - Migrate components one by one, starting with critical ones
3. **Test Thoroughly** - Test each migrated component
4. **Performance Optimization** - Add caching and optimize queries as needed
5. **Production Deployment** - Update security rules for production use

The foundation is in place - you now have a complete Firestore-based data layer that can replace localStorage entirely! 