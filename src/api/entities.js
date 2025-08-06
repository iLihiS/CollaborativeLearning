import { apiClient, Entity, auth } from './apiClient';

// Create entity instances using the new API client
export const Student = new Entity(apiClient, 'students');
export const Course = new Entity(apiClient, 'courses');
export const File = new Entity(apiClient, 'files');

// Custom create method for File entity to handle localStorage persistence
File.create = async function(newItemData) {
  console.log(`Always using mock data for CREATE ${this.entityName}`);
  const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
  const newItem = { ...newItemData, id: `${this.entityName.slice(0, -1)}-${Date.now()}` };
  data.push(newItem);
  localStorage.setItem(this.storageKey, JSON.stringify(data));
  return Promise.resolve(newItem);
};

export const Lecturer = new Entity(apiClient, 'lecturers');
export const Message = new Entity(apiClient, 'messages');
export const Notification = new Entity(apiClient, 'notifications');
export const AcademicTrack = new Entity(apiClient, 'academic-tracks');

// Export auth instance for user management
export const User = auth;