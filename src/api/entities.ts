import { apiClient } from './apiClient.ts';
import { FirestoreService } from '@/services/firestoreService';

// Import the correct Entity class from apiClient
import './apiClient.ts'; // This ensures Entity class is loaded

class FirestoreEntity {
  apiClient: any;
  entityName: string;

  constructor(apiClient: any, entityName: string) {
    this.apiClient = apiClient;
    this.entityName = entityName;
  }

  // Firestore Data Operations
  async list() {
    console.log(`Using Firestore for LIST ${this.entityName}`);
    
    if (this.entityName === 'academic-tracks') {
      try {
        console.log('Fetching academic tracks from JSON file...');
        const response = await fetch('/academic-tracks.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        console.log('Academic tracks loaded from JSON:', data.length, 'tracks');
        return data;
      } catch (error) {
        console.error('Failed to fetch academic tracks:', error);
        return [];
      }
    }
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.getStudents();
      case 'lecturers':
        return await FirestoreService.getLecturers();
      case 'courses':
        return await FirestoreService.getCourses();
      case 'files':
        return await FirestoreService.getFiles();
      case 'messages':
        return await FirestoreService.getMessages();
      case 'notifications':
        return await FirestoreService.getNotifications();
      default:
        console.warn(`Unknown entity type: ${this.entityName}`);
        return [];
    }
  }

  async get(id: string) {
    console.log(`Using Firestore for GET ${this.entityName}/${id}`);
    
    switch (this.entityName) {
      case 'students': {
        const students = await FirestoreService.getStudents();
        return students.find(s => s.id === id) || null;
      }
      case 'lecturers': {
        const lecturers = await FirestoreService.getLecturers();
        return lecturers.find(l => l.id === id) || null;
      }
      case 'courses': {
        const courses = await FirestoreService.getCourses();
        return courses.find(c => c.id === id) || null;
      }
      case 'files': {
        const files = await FirestoreService.getFiles();
        return files.find(f => f.id === id) || null;
      }
      case 'messages': {
        const messages = await FirestoreService.getMessages();
        return messages.find(m => m.id === id) || null;
      }
      case 'notifications': {
        const notifications = await FirestoreService.getNotifications();
        return notifications.find(n => n.id === id) || null;
      }
      default:
        console.warn(`Unknown entity type: ${this.entityName}`);
        return null;
    }
  }

  async create(data: any) {
    console.log(`Using Firestore for CREATE ${this.entityName}`);
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.addStudent(data);
      case 'lecturers':
        return await FirestoreService.addLecturer(data);
      case 'courses':
        return await FirestoreService.addCourse(data);
      case 'files':
        return await FirestoreService.addFile(data);
      case 'messages':
        return await FirestoreService.addMessage(data);
      case 'notifications':
        return await FirestoreService.addNotification(data);
      default:
        console.warn(`Create operation not supported for entity type: ${this.entityName}`);
        throw new Error(`Create operation not supported for entity type: ${this.entityName}`);
    }
  }

  async update(id: string, data: any) {
    console.log(`Using Firestore for UPDATE ${this.entityName}/${id}`);
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.updateStudent(id, data);
      case 'lecturers':
        return await FirestoreService.updateLecturer(id, data);
      case 'courses':
        return await FirestoreService.updateCourse(id, data);
      case 'files':
        return await FirestoreService.updateFile(id, data);
      case 'messages':
        return await FirestoreService.updateMessage(id, data);
      case 'notifications':
        return await FirestoreService.updateNotification(id, data);
      default:
        console.warn(`Update operation not supported for entity type: ${this.entityName}`);
        throw new Error(`Update operation not supported for entity type: ${this.entityName}`);
    }
  }

  async delete(id: string) {
    console.log(`Using Firestore for DELETE ${this.entityName}/${id}`);
    
    switch (this.entityName) {
      case 'students':
        const deletedStudent = await FirestoreService.deleteStudent(id);
        return { success: deletedStudent };
      case 'lecturers':
        const deletedLecturer = await FirestoreService.deleteLecturer(id);
        return { success: deletedLecturer };
      case 'courses':
        const deletedCourse = await FirestoreService.deleteCourse(id);
        return { success: deletedCourse };
      case 'files':
        const deletedFile = await FirestoreService.deleteFile(id);
        return { success: deletedFile };
      case 'messages':
        const deletedMessage = await FirestoreService.deleteMessage(id);
        return { success: deletedMessage };
      case 'notifications':
        const deletedNotification = await FirestoreService.deleteNotification(id);
        return { success: deletedNotification };
      default:
        console.warn(`Delete operation not supported for entity type: ${this.entityName}`);
        throw new Error(`Delete operation not supported for entity type: ${this.entityName}`);
    }
  }
  
  async filter(filters: any) {
    console.log(`Using Firestore for FILTER ${this.entityName}`);
    
    if (this.entityName === 'academic-tracks') {
      try {
        console.log('Filtering academic tracks from JSON file...');
        const response = await fetch('/academic-tracks.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        let data = await response.json();
        Object.keys(filters).forEach(key => {
            data = data.filter((item: any) => item[key] === filters[key]);
        });
        console.log('Academic tracks filtered:', data.length, 'tracks match filters');
        return data;
      } catch (error) {
        console.error('Failed to fetch academic tracks for filtering:', error);
        return [];
      }
    }
    
    // Get all data first, then filter locally
    // In a real implementation, you would use Firestore queries
    const allData = await this.list();
    
    let filteredData = allData;
    Object.keys(filters).forEach(key => {
      filteredData = filteredData.filter((item: any) => {
        if (Array.isArray(item[key])) {
          // Handle array fields (like academic_track_ids)
          return item[key].includes(filters[key]);
        } else {
          return item[key] === filters[key];
        }
      });
    });
    
    return filteredData;
  }

  // Legacy methods for compatibility
  me() {
    return this.apiClient.me();
  }

  async login(email: string, password: string) {
    return this.apiClient.login({ email, password });
  }

  updateMyUserData(data: any) {
    return this.apiClient.updateMyUserData(data);
  }

  async logout() {
    return this.apiClient.logout();
  }
}

export const User = new FirestoreEntity(apiClient, 'users');
export const Course = new FirestoreEntity(apiClient, 'courses');
export const File = new FirestoreEntity(apiClient, 'files');
export const Student = new FirestoreEntity(apiClient, 'students');
export const Lecturer = new FirestoreEntity(apiClient, 'lecturers');
export const AcademicTrack = new FirestoreEntity(apiClient, 'academic-tracks');
export const Message = new FirestoreEntity(apiClient, 'messages');
export const Notification = new FirestoreEntity(apiClient, 'notifications');

export type User = {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
    current_role: string;
    theme_preference: string;
};