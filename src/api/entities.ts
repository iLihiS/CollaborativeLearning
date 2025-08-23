import { apiClient } from './apiClient.ts';
import { LocalStorageService } from '@/services/localStorage';

// Import the correct Entity class from apiClient
import './apiClient.ts'; // This ensures Entity class is loaded

class MockEntity {
  apiClient: any;
  entityName: string;
  storageKey: string;

  constructor(apiClient: any, entityName: string) {
    this.apiClient = apiClient;
    this.entityName = entityName;
    this.storageKey = `mock_${entityName}`;
  }

  // Mock Data Operations that read directly from localStorage
  async list() {
    console.log(`Using localStorage for LIST ${this.entityName}`);
    
    // Initialize data if not exists
    LocalStorageService.initializeData();
    
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
        return Promise.resolve([]);
      }
    }
    
    switch (this.entityName) {
      case 'students':
        return Promise.resolve(LocalStorageService.getStudents());
      case 'lecturers':
        return Promise.resolve(LocalStorageService.getLecturers());
      case 'courses':
        return Promise.resolve(LocalStorageService.getCourses());
      case 'files':
        return Promise.resolve(LocalStorageService.getFiles());
      case 'messages':
        return Promise.resolve(LocalStorageService.getMessages());
      case 'notifications':
        return Promise.resolve(LocalStorageService.getNotifications());
      default:
        // Fallback to old localStorage method for other entities
        const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        return Promise.resolve(data);
    }
  }

  async get(id: string) {
    console.log(`Using localStorage for GET ${this.entityName}`);
    LocalStorageService.initializeData();
    
    switch (this.entityName) {
      case 'students':
        const student = LocalStorageService.getStudents().find(s => s.id === id);
        return Promise.resolve(student);
      case 'lecturers':
        const lecturer = LocalStorageService.getLecturers().find(l => l.id === id);
        return Promise.resolve(lecturer);
      case 'courses':
        const course = LocalStorageService.getCourses().find(c => c.id === id);
        return Promise.resolve(course);
      case 'files':
        const file = LocalStorageService.getFiles().find(f => f.id === id);
        return Promise.resolve(file);
      case 'messages':
        const message = LocalStorageService.getMessages().find(m => m.id === id);
        return Promise.resolve(message);
      case 'notifications':
        const notification = LocalStorageService.getNotifications().find(n => n.id === id);
        return Promise.resolve(notification);
      default:
        // Fallback to old localStorage method
        const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const item = data.find((item: any) => item.id === id);
        return Promise.resolve(item);
    }
  }

  async create(data: any) {
    console.log(`Using localStorage for CREATE ${this.entityName}`);
    LocalStorageService.initializeData();
    
    switch (this.entityName) {
      case 'students':
        const newStudent = LocalStorageService.addStudent(data);
        return Promise.resolve(newStudent);
      case 'lecturers':
        const newLecturer = LocalStorageService.addLecturer(data);
        return Promise.resolve(newLecturer);
      case 'courses':
        const newCourse = LocalStorageService.addCourse(data);
        return Promise.resolve(newCourse);
      default:
        // Fallback to old localStorage method
        const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const newItem = { ...data, id: data.id || `${this.entityName}-${Date.now()}` };
        existingData.push(newItem);
        localStorage.setItem(this.storageKey, JSON.stringify(existingData));
        return Promise.resolve(newItem);
    }
  }

  async update(id: string, data: any) {
    console.log(`Using localStorage for UPDATE ${this.entityName}`);
    LocalStorageService.initializeData();
    
    switch (this.entityName) {
      case 'students':
        const updatedStudent = LocalStorageService.updateStudent(id, data);
        return Promise.resolve(updatedStudent);
      case 'lecturers':
        const updatedLecturer = LocalStorageService.updateLecturer(id, data);
        return Promise.resolve(updatedLecturer);
      case 'courses':
        const updatedCourse = LocalStorageService.updateCourse(id, data);
        return Promise.resolve(updatedCourse);
      default:
        // Fallback to old localStorage method
        const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const index = existingData.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          existingData[index] = { ...existingData[index], ...data };
          localStorage.setItem(this.storageKey, JSON.stringify(existingData));
        }
        return Promise.resolve(existingData[index]);
    }
  }

  async delete(id: string) {
    console.log(`Using localStorage for DELETE ${this.entityName}`);
    LocalStorageService.initializeData();
    
    switch (this.entityName) {
      case 'students':
        const deletedStudent = LocalStorageService.deleteStudent(id);
        return Promise.resolve({ success: deletedStudent });
      case 'lecturers':
        const deletedLecturer = LocalStorageService.deleteLecturer(id);
        return Promise.resolve({ success: deletedLecturer });
      case 'courses':
        const deletedCourse = LocalStorageService.deleteCourse(id);
        return Promise.resolve({ success: deletedCourse });
      default:
        // Fallback to old localStorage method
        const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const filteredData = existingData.filter((item: any) => item.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filteredData));
        return Promise.resolve({ success: true });
    }
  }
  
  async filter(filters: any) {
    console.log(`Using localStorage for FILTER ${this.entityName}`);
    LocalStorageService.initializeData();
    
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
        return Promise.resolve(data);
      } catch (error) {
        console.error('Failed to fetch academic tracks for filtering:', error);
        return Promise.resolve([]);
      }
    }
    
    let data: any[] = [];
    
    switch (this.entityName) {
      case 'students':
        data = LocalStorageService.getStudents();
        break;
      case 'lecturers':
        data = LocalStorageService.getLecturers();
        break;
      case 'courses':
        data = LocalStorageService.getCourses();
        break;
      case 'files':
        data = LocalStorageService.getFiles();
        break;
      case 'messages':
        data = LocalStorageService.getMessages();
        break;
      case 'notifications':
        data = LocalStorageService.getNotifications();
        break;
      default:
        data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }
    
    Object.keys(filters).forEach(key => {
        data = data.filter((item: any) => item[key] === filters[key]);
    });
    
    return Promise.resolve(data);
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

export const User = new MockEntity(apiClient, 'users');
export const Course = new MockEntity(apiClient, 'courses');
export const File = new MockEntity(apiClient, 'files');
export const Student = new MockEntity(apiClient, 'students');
export const Lecturer = new MockEntity(apiClient, 'lecturers');
export const AcademicTrack = new MockEntity(apiClient, 'academic-tracks');
export const Message = new MockEntity(apiClient, 'messages');
export const Notification = new MockEntity(apiClient, 'notifications');

export type User = {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
    current_role: string;
    theme_preference: string;
};