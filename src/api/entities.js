import { apiClient, Entity, auth } from './apiClient';

// Create entity instances using the new API client
export const Student = new Entity(apiClient, 'students');
export const Course = new Entity(apiClient, 'courses');
export const File = new Entity(apiClient, 'files');
export const Lecturer = new Entity(apiClient, 'lecturers');
export const Message = new Entity(apiClient, 'messages');
export const Notification = new Entity(apiClient, 'notifications');
export const AcademicTrack = new Entity(apiClient, 'academic-tracks');

// Export auth instance for user management
export const User = auth;