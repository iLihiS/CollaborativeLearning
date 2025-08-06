import { apiClient } from "./apiClient.ts";

class Entity {
    apiClient: any;
    entityName: string;
    constructor(apiClient: any, entityName: string) {
        this.apiClient = apiClient;
        this.entityName = entityName;
        // ...
    }

    me() {
        return this.apiClient.me();
    }

    logout() {
        return this.apiClient.logout();
    }

    login(email: string, password: string) {
        return this.apiClient.login({ email, password });
    }

    get(id: string) {
        return this.apiClient.getEntity(this.entityName, id);
    }

    async filter(filters: any, sortBy?: string, limit?: number) {
        console.log(`Always using mock data for FILTER ${this.entityName}`);
        if (this.entityName === 'academic-tracks') {
            try {
                const response = await fetch(`https://api.example.com/academic-tracks?${Object.keys(filters).map(key => `${key}=${filters[key]}`).join('&')}`);
                if (!response.ok) throw new Error('Network response was not ok');
                let data = await response.json();
                Object.keys(filters).forEach(key => {
                    data = data.filter((item: any) => item[key] === filters[key]);
                });
                if (sortBy) {
                    const sortOrder = sortBy.startsWith('-') ? -1 : 1;
                    const sortKey = sortBy.replace('-', '');
                    data.sort((a: any, b: any) => {
                        if (a[sortKey] < b[sortKey]) return -1 * sortOrder;
                        if (a[sortKey] > b[sortKey]) return 1 * sortOrder;
                        return 0;
                    });
                }
                if (limit) {
                    data = data.slice(0, limit);
                }
                return Promise.resolve(data);
            } catch (error) {
                console.error(`Error filtering ${this.entityName}:`, error);
                return Promise.reject(error);
            }
        }

        let data = JSON.parse(localStorage.getItem(this.entityName) || '[]');

        Object.keys(filters).forEach(key => {
            data = data.filter((item: any) => item[key] === filters[key]);
        });

        if (sortBy) {
            const sortOrder = sortBy.startsWith('-') ? -1 : 1;
            const sortKey = sortBy.replace('-', '');
            data.sort((a: any, b: any) => {
                if (a[sortKey] < b[sortKey]) return -1 * sortOrder;
                if (a[sortKey] > b[sortKey]) return 1 * sortOrder;
                return 0;
            });
        }

        if (limit) {
            data = data.slice(0, limit);
        }

        return Promise.resolve(data);
    }

    update(id: string, data: any) {
        return this.apiClient.update(this.entityName, id, data);
    }

    create(data: any) {
        return this.apiClient.create(this.entityName, data);
    }

    updateMyUserData(data: any) {
        return this.apiClient.updateMyUserData(data);
    }

    list() {
        return this.apiClient.list(this.entityName);
    }

    delete(id: string) {
        return this.apiClient.delete(this.entityName, id);
    }
}

export const User = new Entity(apiClient, 'users');
export const Course = new Entity(apiClient, 'courses');
export const File = new Entity(apiClient, 'files');
export const Student = new Entity(apiClient, 'students');
export const Lecturer = new Entity(apiClient, 'lecturers');
export const AcademicTrack = new Entity(apiClient, 'academic_tracks');
export const Message = new Entity(apiClient, 'messages');
export const Notification = new Entity(apiClient, 'notifications');

export type User = {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
    current_role: string;
    theme_preference: string;
};