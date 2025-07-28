// Generic API client for the CollaborativeLearning application
class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Entity base class for CRUD operations
class Entity {
  constructor(apiClient, entityName) {
    this.api = apiClient;
    this.entityName = entityName;
  }

  async list(sort = '') {
    const endpoint = sort ? `/${this.entityName}?sort=${sort}` : `/${this.entityName}`;
    return this.api.get(endpoint);
  }

  async get(id) {
    return this.api.get(`/${this.entityName}/${id}`);
  }

  async create(data) {
    return this.api.post(`/${this.entityName}`, data);
  }

  async update(id, data) {
    return this.api.put(`/${this.entityName}/${id}`, data);
  }

  async delete(id) {
    return this.api.delete(`/${this.entityName}/${id}`);
  }

  async filter(filters, sort = '') {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      params.append(key, value);
    });
    if (sort) {
      params.append('sort', sort);
    }
    return this.api.get(`/${this.entityName}?${params.toString()}`);
  }
}

// Auth class for user management
class Auth {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async me() {
    // Always use mock data since we don't have a real backend
    const mockUser = localStorage.getItem('mock_user');
    if (mockUser && this.api.token) {
      return JSON.parse(mockUser);
    }
    throw new Error('User not authenticated');
  }

  async updateMyUserData(data) {
    // Always use mock data since we don't have a real backend
    const mockUser = localStorage.getItem('mock_user');
    if (mockUser && this.api.token) {
      const user = JSON.parse(mockUser);
      const updatedUser = { ...user, ...data };
      localStorage.setItem('mock_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    throw new Error('User not authenticated');
  }

  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      if (response.token) {
        this.api.setAuthToken(response.token);
      }
      return response;
    } catch {
      // If backend is not available, use mock authentication
      console.log('Backend login unavailable, using mock authentication');
      
      const { email, password } = credentials;
      
      // Mock user database with different role combinations
      const mockUsers = {
        'student@ono.ac.il': {
          id: 'user-001',
          email: 'student@ono.ac.il',
          full_name: 'אליה כהן',
          roles: ['student'],
          current_role: 'student',
          theme_preference: 'light',
          student_id: 'STU2024001',
          academic_track: 'מדעי המחשב'
        },
        'lecturer@ono.ac.il': {
          id: 'user-002', 
          email: 'lecturer@ono.ac.il',
          full_name: 'ד"ר שרה לוי',
          roles: ['lecturer'],
          current_role: 'lecturer',
          theme_preference: 'light',
          department: 'מדעי המחשב',
          title: 'ד״ר'
        },
        'admin@ono.ac.il': {
          id: 'user-003',
          email: 'admin@ono.ac.il', 
          full_name: 'משה אדמיניסטרטור',
          roles: ['admin'],
          current_role: 'admin',
          theme_preference: 'dark',
          department: 'מנהל מערכת'
        },
        'student.lecturer@ono.ac.il': {
          id: 'user-004',
          email: 'student.lecturer@ono.ac.il',
          full_name: 'מיכל דוקטורנטית',
          roles: ['student', 'lecturer'],
          current_role: 'student',
          theme_preference: 'light',
          student_id: 'PhD2024002',
          academic_track: 'מדעי המחשב - דוקטורט',
          department: 'מדעי המחשב',
          title: 'מרצה חיצונית'
        },
        'lecturer.admin@ono.ac.il': {
          id: 'user-005',
          email: 'lecturer.admin@ono.ac.il',
          full_name: 'פרופ׳ דוד ראש המחלקה',
          roles: ['lecturer', 'admin'],
          current_role: 'lecturer',
          theme_preference: 'light',
          department: 'מדעי המחשב',
          title: 'פרופ׳',
          admin_permissions: ['manage_department', 'approve_courses']
        },
        'all.roles@ono.ac.il': {
          id: 'user-006',
          email: 'all.roles@ono.ac.il',
          full_name: 'ד"ר רונה סופר יוזר',
          roles: ['student', 'lecturer', 'admin'],
          current_role: 'admin',
          theme_preference: 'dark',
          student_id: 'MBA2024003',
          academic_track: 'מנהל עסקים - תואר שני',
          department: 'מנהל עסקים וכלכלה',
          title: 'ד״ר',
          admin_permissions: ['full_access']
        }
      };

      // Check credentials
      if (password !== '123456') {
        throw new Error('סיסמה שגויה');
      }

      const mockUser = mockUsers[email];
      if (!mockUser) {
        throw new Error('משתמש לא נמצא במערכת');
      }
      
      // Create a mock token and store it
      const mockToken = 'mock-token-' + Date.now();
      this.api.setAuthToken(mockToken);
      
      // Store mock user data for User.me() to return
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      
      return { user: mockUser, token: mockToken };
    }
  }

  async logout() {
    try {
      // Try to call the backend logout endpoint (if available)
      await this.api.post('/auth/logout');
    } catch {
      // If backend is not available, continue with local cleanup
      console.log('Backend logout unavailable, performing local cleanup');
    }
    // Always clear local token and localStorage
    this.api.setAuthToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_user'); // Clear mock user data
  }

  async register(userData) {
    return this.api.post('/auth/register', userData);
  }
}

// File upload service
class FileUploadService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.api.request('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }
}

// LLM service
class LLMService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async invoke(prompt, options = {}) {
    return this.api.post('/llm/invoke', {
      prompt,
      ...options,
    });
  }
}

// Email service
class EmailService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async sendEmail(to, subject, content, options = {}) {
    return this.api.post('/email/send', {
      to,
      subject,
      content,
      ...options,
    });
  }
}

// Create and export the main API client instance
export const apiClient = new APIClient();

// Create and export auth instance
export const auth = new Auth(apiClient);

// Create and export file upload service
export const fileUploadService = new FileUploadService(apiClient);

// Create and export LLM service
export const llmService = new LLMService(apiClient);

// Create and export email service
export const emailService = new EmailService(apiClient);

// Export Entity class for creating specific entities
export { Entity, APIClient }; 