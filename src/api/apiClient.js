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

// Mock Data Management
const initializeMockData = (key, initialData) => {
  const existingData = localStorage.getItem(key);
  // Seed if data doesn't exist OR if it's an empty array.
  // This helps recover from a state where an empty array was saved during development.
  if (!existingData || JSON.parse(existingData).length === 0) {
    localStorage.setItem(key, JSON.stringify(initialData));
  }
};

// Force refresh function to reset mock data (useful for development)
const forceRefreshMockData = () => {
  const initialCourses = [
      { id: 'course-001', course_name: 'מבוא למדעי המחשב', course_code: 'CS101', lecturer_id: 'lecturer-001', academic_tracks: ['computer-science', 'software-engineering'] },
      { id: 'course-002', course_name: 'מבני נתונים', course_code: 'CS201', lecturer_id: 'lecturer-002', academic_tracks: ['computer-science'] },
  ];
  const initialLecturers = [
      { id: 'lecturer-001', full_name: 'ד"ר שרה לוי', email: 'sarah.levy@ono.ac.il', academic_tracks: ['computer-science'] },
      { id: 'lecturer-002', full_name: 'פרופ׳ מיכאל כהן', email: 'michael.cohen@ono.ac.il', academic_tracks: ['computer-science', 'software-engineering'] },
      { id: 'lecturer-003', full_name: 'ד"ר רחל אברמס', email: 'rachel.abrams@ono.ac.il', academic_tracks: ['mathematics', 'computer-science'] },
      { id: 'lecturer-004', full_name: 'פרופ׳ דוד רוזנברג', email: 'david.rosenberg@ono.ac.il', academic_tracks: ['physics', 'engineering'] },
      { id: 'lecturer-005', full_name: 'ד"ר מיכל גולדשטיין', email: 'michal.goldstein@ono.ac.il', academic_tracks: ['psychology', 'education'] },
  ];
  const initialStudents = [
      { id: 'student-001', full_name: 'אליה כהן', student_id: 'STU2024001', email: 'student@ono.ac.il', academic_track: 'מדעי המחשב' },
      { id: 'student-002', full_name: 'שרה ישראלי', student_id: 'STU2024002', email: 'sarah.israeli@ono.ac.il', academic_track: 'הנדסת תוכנה' },
      { id: 'student-003', full_name: 'יוסי חיים', student_id: 'STU2024003', email: 'yossi.haim@ono.ac.il', academic_track: 'מתמטיקה' },
      { id: 'student-004', full_name: 'רונית גולד', student_id: 'STU2024004', email: 'ronit.gold@ono.ac.il', academic_track: 'פיזיקה' },
  ];
  const initialFiles = [
      { id: 'file-001', title: 'סיכום הרצאה 1', description: 'סיכום מעולה', course_id: 'course-001', uploader_id: 'student-001', created_date: new Date().toISOString(), status: 'approved', download_count: 12, file_url: '#' },
      { id: 'file-002', title: 'תרגול למבחן', description: 'עם פתרונות', course_id: 'course-001', uploader_id: 'student-001', created_date: new Date().toISOString(), status: 'pending', download_count: 3, file_url: '#' },
  ];

  localStorage.setItem('mock_courses', JSON.stringify(initialCourses));
  localStorage.setItem('mock_lecturers', JSON.stringify(initialLecturers));
  localStorage.setItem('mock_students', JSON.stringify(initialStudents));
  localStorage.setItem('mock_files', JSON.stringify(initialFiles));
};

// This function will be called once when the app loads
const seedInitialData = () => {
  const initialCourses = [
      { id: 'course-001', course_name: 'מבוא למדעי המחשב', course_code: 'CS101', lecturer_id: 'lecturer-001', academic_tracks: ['computer-science', 'software-engineering'] },
      { id: 'course-002', course_name: 'מבני נתונים', course_code: 'CS201', lecturer_id: 'lecturer-002', academic_tracks: ['computer-science'] },
  ];
  const initialLecturers = [
      { id: 'lecturer-001', full_name: 'ד"ר שרה לוי', email: 'sarah.levy@ono.ac.il', academic_tracks: ['computer-science'] },
      { id: 'lecturer-002', full_name: 'פרופ׳ מיכאל כהן', email: 'michael.cohen@ono.ac.il', academic_tracks: ['computer-science', 'software-engineering'] },
      { id: 'lecturer-003', full_name: 'ד"ר רחל אברמס', email: 'rachel.abrams@ono.ac.il', academic_tracks: ['mathematics', 'computer-science'] },
      { id: 'lecturer-004', full_name: 'פרופ׳ דוד רוזנברג', email: 'david.rosenberg@ono.ac.il', academic_tracks: ['physics', 'engineering'] },
      { id: 'lecturer-005', full_name: 'ד"ר מיכל גולדשטיין', email: 'michal.goldstein@ono.ac.il', academic_tracks: ['psychology', 'education'] },
  ];
  const initialStudents = [
      { id: 'student-001', full_name: 'אליה כהן', student_id: 'STU2024001', email: 'student@ono.ac.il', academic_track: 'מדעי המחשב' },
      { id: 'student-002', full_name: 'שרה ישראלי', student_id: 'STU2024002', email: 'sarah.israeli@ono.ac.il', academic_track: 'הנדסת תוכנה' },
      { id: 'student-003', full_name: 'יוסי חיים', student_id: 'STU2024003', email: 'yossi.haim@ono.ac.il', academic_track: 'מתמטיקה' },
      { id: 'student-004', full_name: 'רונית גולד', student_id: 'STU2024004', email: 'ronit.gold@ono.ac.il', academic_track: 'פיזיקה' },
  ];
  const initialFiles = [
      { id: 'file-001', title: 'סיכום הרצאה 1', description: 'סיכום מעולה', course_id: 'course-001', uploader_id: 'student-001', created_date: new Date().toISOString(), status: 'approved', download_count: 12, file_url: '#' },
      { id: 'file-002', title: 'תרגול למבחן', description: 'עם פתרונות', course_id: 'course-001', uploader_id: 'student-001', created_date: new Date().toISOString(), status: 'pending', download_count: 3, file_url: '#' },
  ];

  initializeMockData('mock_courses', initialCourses);
  initializeMockData('mock_lecturers', initialLecturers);
  initializeMockData('mock_students', initialStudents);
  initializeMockData('mock_files', initialFiles);
};

seedInitialData(); // Run on script load

// Call force refresh to ensure fresh data during development
forceRefreshMockData();

class Entity {
  constructor(apiClient, entityName) {
    this.api = apiClient;
    this.entityName = entityName;
    this.storageKey = `mock_${entityName}`;
  }

  // --- Mock Data Operations ---
  async list() {
    console.log(`Always using mock data for LIST ${this.entityName}`);
    if (this.entityName === 'academic-tracks') {
      try {
        const response = await fetch('/academic-tracks.json');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch academic tracks:', error);
        return Promise.resolve([]);
      }
    }
    const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    return Promise.resolve(data);
  }

  async get(id) {
    console.log(`Always using mock data for GET ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    const item = data.find(i => i.id === id);
    if (item) {
      return Promise.resolve(item);
    } else {
      return Promise.reject(new Error("Item not found"));
    }
  }

  async create(newItemData) {
    console.log(`Always using mock data for CREATE ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    const newItem = { ...newItemData, id: `${this.entityName.slice(0, -1)}-${Date.now()}` };
    data.push(newItem);
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    return Promise.resolve(newItem);
  }

  async update(id, updatedItemData) {
    console.log(`Always using mock data for UPDATE ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    const itemIndex = data.findIndex(i => i.id === id);
    if (itemIndex > -1) {
      data[itemIndex] = { ...data[itemIndex], ...updatedItemData };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return Promise.resolve(data[itemIndex]);
    }
    return Promise.reject(new Error("Item not found"));
  }

  async delete(id) {
    console.log(`Always using mock data for DELETE ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    const newData = data.filter(i => i.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(newData));
    return Promise.resolve({ success: true });
  }
  
  async filter(filters) {
    console.log(`Always using mock data for FILTER ${this.entityName}`);
    if (this.entityName === 'academic-tracks') {
      try {
        const response = await fetch('/academic-tracks.json');
        if (!response.ok) throw new Error('Network response was not ok');
        let data = await response.json();
        Object.keys(filters).forEach(key => {
            data = data.filter(item => item[key] === filters[key]);
        });
        return Promise.resolve(data);
      } catch (error) {
        console.error('Failed to fetch academic tracks for filtering:', error);
        return Promise.resolve([]);
      }
    }
    
    let data = JSON.parse(localStorage.getItem(this.storageKey)) || [];
    
    Object.keys(filters).forEach(key => {
        data = data.filter(item => item[key] === filters[key]);
    });
    
    return Promise.resolve(data);
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
      
      // Check if user data already exists in localStorage (with previous updates)
      const existingUserData = localStorage.getItem('mock_user');
      let userToStore = mockUser;
      
      if (existingUserData) {
        try {
          const parsedExistingData = JSON.parse(existingUserData);
          // If the existing user matches the email, merge the data to preserve updates
          if (parsedExistingData.email === email) {
            userToStore = { ...mockUser, ...parsedExistingData };
          }
        } catch {
          console.log('Failed to parse existing user data, using fresh data');
        }
      }
      
      // Store user data (either fresh or merged with existing updates)
      localStorage.setItem('mock_user', JSON.stringify(userToStore));
      
      return { user: userToStore, token: mockToken };
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
    // Clear auth token to log out, but preserve user data for future logins
    this.api.setAuthToken(null);
    localStorage.removeItem('auth_token');
    // Note: We don't remove 'mock_user' to preserve user preferences like theme
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