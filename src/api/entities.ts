import { apiClient } from './apiClient.ts';

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
    console.log(`Always using mock data for LIST ${this.entityName}`);
    if (this.entityName === 'academic_tracks') {
      try {
        const response = await fetch('/academic-tracks.json');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch academic tracks:', error);
        return Promise.resolve([]);
      }
    }
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return Promise.resolve(data);
  }

  async get(id: string) {
    console.log(`Always using mock data for GET ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const item = data.find((item: any) => item.id === id);
    return Promise.resolve(item);
  }

  async create(data: any) {
    console.log(`Always using mock data for CREATE ${this.entityName}`);
    const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const newItem = { ...data, id: data.id || `${this.entityName}-${Date.now()}` };
    existingData.push(newItem);
    localStorage.setItem(this.storageKey, JSON.stringify(existingData));
    return Promise.resolve(newItem);
  }

  async update(id: string, data: any) {
    console.log(`Always using mock data for UPDATE ${this.entityName}`);
    const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const index = existingData.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      existingData[index] = { ...existingData[index], ...data };
      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
    }
    return Promise.resolve(existingData[index]);
  }

  async delete(id: string) {
    console.log(`Always using mock data for DELETE ${this.entityName}`);
    const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const filteredData = existingData.filter((item: any) => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filteredData));
    return Promise.resolve({ success: true });
  }
  
  async filter(filters: any) {
    console.log(`Always using mock data for FILTER ${this.entityName}`);
    if (this.entityName === 'academic_tracks') {
      try {
        const response = await fetch('/academic-tracks.json');
        if (!response.ok) throw new Error('Network response was not ok');
        let data = await response.json();
        Object.keys(filters).forEach(key => {
            data = data.filter((item: any) => item[key] === filters[key]);
        });
        return Promise.resolve(data);
      } catch (error) {
        console.error('Failed to fetch academic tracks for filtering:', error);
        return Promise.resolve([]);
      }
    }
    
    let data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    
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