// Generic API client for the CollaborativeLearning application
class APIClient {
  baseURL: string;
  token: string | null;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint: string, options: any = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: any = {
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
  get(endpoint: string, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint: string, data: any, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  put(endpoint: string, data: any, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  patch(endpoint: string, data: any, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  delete(endpoint: string, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  login(email: string, password: string) {
    return auth.login({ email, password });
  }

  me() {
    return auth.me();
  }

  logout() {
    return auth.logout();
  }

  create(entityName: string, data: any) {
    return this.post(`${entityName}`, data);
  }

  update(entityName: string, id: string, data: any) {
    return this.put(`${entityName}/${id}`, data);
  }

  getEntity(entityName: string, id: string) {
    return this.request(`${entityName}/${id}`);
  }

  list(entityName: string) {
    return this.get(entityName);
  }

  updateMyUserData(data: any) {
    return auth.updateMyUserData(data);
  }
}

// Mock Data Management
const initializeMockData = (key: string, initialData: any[]) => {
  const existingData = localStorage.getItem(key);
  // Seed if data doesn't exist OR if it's an empty array.
  // This helps recover from a state where an empty array was saved during development.
  if (!existingData || JSON.parse(existingData).length === 0) {
    localStorage.setItem(key, JSON.stringify(initialData));
  }
};

// This function will be called once when the app loads to seed mock data
const seedMockData = () => {
  const initialCourses = [
    { id: 'course-001', course_name: 'מבוא למדעי המחשב', course_code: 'CS101', lecturer_id: 'lecturer-001', academic_track_ids: ['cs-undergrad', 'swe-undergrad'], description: 'קורס יסודות המציג עקרונות בסיסיים בתכנות, אלגוריתמיקה ומבנה המחשב.' },
    { id: 'course-002', course_name: 'מבני נתונים', course_code: 'CS201', lecturer_id: 'lecturer-002', academic_track_ids: ['cs-undergrad', 'swe-undergrad'], description: 'קורס מתקדם הבוחן דרכים יעילות לארגון וניהול נתונים.' },
    { id: 'course-003', course_name: 'אלגברה לינארית', course_code: 'MA101', lecturer_id: 'lecturer-003', academic_track_ids: ['math-undergrad', 'cs-undergrad', 'swe-undergrad'], description: 'עקרונות מתמטיים חיוניים למדעי המחשב וההנדסה.' },
    { id: 'course-004', course_name: 'מבוא למשפט חוקתי', course_code: 'LAW101', lecturer_id: 'lecturer-004', academic_track_ids: ['law-undergrad'], description: 'יסודות המשפט הציבורי והחוקתי בישראל.' },
    { id: 'course-005', course_name: 'מיקרו כלכלה', course_code: 'ECO101', lecturer_id: 'lecturer-005', academic_track_ids: ['business-undergrad'], description: 'ניתוח התנהגות צרכנים ופירמות בשוק.' },
    { id: 'course-006', course_name: 'אסטרטגיה עסקית', course_code: 'BUS700', lecturer_id: 'lecturer-005', academic_track_ids: ['business-grad'], description: 'קורס מתקדם בפיתוח ויישום אסטרטגיות עסקיות.' },
    { id: 'course-007', course_name: 'פסיכולוגיה קוגניטיבית', course_code: 'PSY202', lecturer_id: 'lecturer-006', academic_track_ids: ['psychology-undergrad', 'cs-grad'], description: 'חקר תהליכי עיבוד המידע במוח האנושי.' },
    { id: 'course-008', course_name: 'למידת מכונה', course_code: 'CS550', lecturer_id: 'lecturer-001', academic_track_ids: ['cs-grad'], description: 'אלגוריתמים המאפשרים למערכות ללמוד מנתונים.' }
  ];
  const initialLecturers = [
    { id: 'lecturer-001', full_name: 'ד"ר שרה לוי', email: 'sarah.levy@ono.ac.il', academic_track_ids: ['cs-undergrad', 'swe-undergrad', 'cs-grad'] },
    { id: 'lecturer-002', full_name: 'פרופ׳ מיכאל כהן', email: 'michael.cohen@ono.ac.il', academic_track_ids: [] }, // No tracks
    { id: 'lecturer-003', full_name: 'ד"ר רחל אברמס', email: 'rachel.abrams@ono.ac.il', academic_track_ids: ['math-undergrad'] },
    { id: 'lecturer-004', full_name: 'עו"ד דוד רוזנברג', email: 'david.rosenberg@ono.ac.il', academic_track_ids: ['law-undergrad'] },
    { id: 'lecturer-005', full_name: 'ד"ר מיכל גולדשטיין', email: 'michal.goldstein@ono.ac.il', academic_track_ids: ['business-undergrad', 'business-grad'] },
    { id: 'lecturer-006', full_name: 'ד"ר יעל שחר', email: 'yael.shahar@ono.ac.il', academic_track_ids: ['psychology-undergrad', 'education-grad'] }
  ];
  const initialStudents = [
    { id: 'student-001', full_name: 'אליהו כהן', student_id: 'STU001', email: 'eli.cohen@mail.com', academic_track_ids: ['cs-undergrad'] },
    { id: 'student-002', full_name: 'שרה ישראלי', student_id: 'STU002', email: 'sara.israeli@mail.com', academic_track_ids: ['law-undergrad', 'business-undergrad'] },
    { id: 'student-003', full_name: 'יוסי חיים', student_id: 'STU003', email: 'yossi.haim@mail.com', academic_track_ids: [] }, // No tracks
    { id: 'student-004', full_name: 'רונית גולד', student_id: 'STU004', email: 'ronit.gold@mail.com', academic_track_ids: ['business-grad'] },
    { id: 'student-005', full_name: 'דניאל לוי', student_id: 'STU005', email: 'daniel.levi@mail.com', academic_track_ids: ['psychology-undergrad'] },
  ];
  const initialFiles = [
    { id: 'file-001', title: 'סיכום הרצאה 1 - מבוא למדמ"ח', description: 'סיכום מעולה של ההרצאה הראשונה, כולל דוגמאות קוד.', course_id: 'course-001', uploader_id: 'student-001', created_date: '2023-10-15T10:00:00Z', status: 'approved', download_count: 120 },
    { id: 'file-002', title: 'תרגול למבחן במבני נתונים', description: 'כולל פתרונות מלאים לשאלות קשות.', course_id: 'course-002', uploader_id: 'student-001', created_date: '2023-11-20T14:30:00Z', status: 'pending', download_count: 35 },
    { id: 'file-003', title: 'מצגת שיעור - אלגברה', description: 'מצגת מהרצאה של ד"ר אברמס.', course_id: 'course-003', uploader_id: 'lecturer-003', created_date: '2023-10-22T09:00:00Z', status: 'approved', download_count: 250 },
    { id: 'file-004', title: 'סיכום פסיקה - חוקתי', description: 'סיכום של פסקי הדין המרכזיים שנלמדו בסמסטר.', course_id: 'course-004', uploader_id: 'student-002', created_date: '2023-12-05T18:00:00Z', status: 'rejected', download_count: 10 },
    { id: 'file-005', title: 'דוגמאות למבחן בכלכלה', description: 'מבחנים משנים קודמות עם פתרונות חלקיים.', course_id: 'course-005', uploader_id: 'student-002', created_date: '2024-01-10T12:00:00Z', status: 'approved', download_count: 180 },
    { id: 'file-006', title: 'ניתוח אירוע - אסטרטגיה עסקית', description: 'קובץ עם ניתוח אירוע לדוגמא.', course_id: 'course-006', uploader_id: 'lecturer-005', created_date: '2024-02-01T11:00:00Z', status: 'approved', download_count: 95 },
    { id: 'file-007', title: 'מחברת קורס למידת מכונה', description: 'מחברת ג\'ופייטר עם כל הקוד מהשיעורים.', course_id: 'course-008', uploader_id: 'lecturer-001', created_date: '2024-03-01T16:00:00Z', status: 'pending', download_count: 55 },
    { id: 'file-008', title: 'סיכום שלי - פסיכולוגיה', description: 'סיכום אישי, לא בטוח כמה זה עוזר.', course_id: 'course-007', uploader_id: 'student-005', created_date: '2023-11-15T20:00:00Z', status: 'approved', download_count: 42 },
  ];

  initializeMockData('mock_courses', initialCourses);
  initializeMockData('mock_lecturers', initialLecturers);
  initializeMockData('mock_students', initialStudents);
  initializeMockData('mock_files', initialFiles);
};

seedMockData(); // Run on script load

class Entity {
  api: APIClient;
  entityName: string;
  storageKey: string;

  constructor(apiClient: APIClient, entityName: string) {
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
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return Promise.resolve(data);
  }

  async get(id: string) {
    console.log(`Always using mock data for GET ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const item = data.find((i: any) => i.id === id);
    if (item) {
      return Promise.resolve(item);
    } else {
      return Promise.reject(new Error("Item not found"));
    }
  }

  async create(newItemData: any) {
    console.log(`Always using mock data for CREATE ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const newItem = { ...newItemData, id: `${this.entityName.slice(0, -1)}-${Date.now()}` };
    data.push(newItem);
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    return Promise.resolve(newItem);
  }

  async update(id: string, updatedItemData: any) {
    console.log(`Always using mock data for UPDATE ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const itemIndex = data.findIndex((i: any) => i.id === id);
    if (itemIndex > -1) {
      data[itemIndex] = { ...data[itemIndex], ...updatedItemData };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return Promise.resolve(data[itemIndex]);
    }
    return Promise.reject(new Error("Item not found"));
  }

  async delete(id: string) {
    console.log(`Always using mock data for DELETE ${this.entityName}`);
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const newData = data.filter((i: any) => i.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(newData));
    return Promise.resolve({ success: true });
  }
  
  async filter(filters: any) {
    console.log(`Always using mock data for FILTER ${this.entityName}`);
    if (this.entityName === 'academic-tracks') {
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
}

// Auth class for user management
class Auth {
  api: APIClient;

  constructor(apiClient: APIClient) {
    this.api = apiClient;
  }

  async me() {
    console.log('me() function started');
    
    try {
      // Always use mock data since we don't have a real backend
      const mockUser = localStorage.getItem('mock_user');
      const token = this.api.token || localStorage.getItem('auth_token');
      
      console.log('me() called - mockUser exists:', !!mockUser);
      console.log('me() called - mockUser content:', mockUser);
      console.log('me() called - api.token:', this.api.token);
      console.log('me() called - token from storage:', localStorage.getItem('auth_token'));
      console.log('me() called - final token:', token);
      
      // Update api token if it was loaded from storage
      if (!this.api.token && localStorage.getItem('auth_token')) {
        console.log('me() - updating api token from storage');
        this.api.setAuthToken(localStorage.getItem('auth_token'));
      }
      
      if (mockUser && token) {
        console.log('me() - parsing mockUser...');
        const user = JSON.parse(mockUser);
        console.log('me() returning user:', user);
        return user;
      }
      
      console.log('me() - User not authenticated, throwing error');
      console.log('me() - mockUser:', !!mockUser, 'token:', !!token);
      throw new Error('User not authenticated');
      
    } catch (error) {
      console.log('me() - Error occurred:', error);
      throw error;
    }
  }

  async updateMyUserData(data: any) {
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

  async changePassword(oldPassword: string, newPassword: string) {
    const mockUser = localStorage.getItem('mock_user');
    if (mockUser && this.api.token) {
        const user = JSON.parse(mockUser);
        const storedPassword = user.password || '123456';

        if (oldPassword !== storedPassword) {
            throw new Error('הסיסמה הישנה אינה נכונה');
        }

        const updatedUser = { ...user, password: newPassword };
        localStorage.setItem('mock_user', JSON.stringify(updatedUser));

        return { success: true, message: 'הסיסמה עודכנה בהצלחה' };
    }
    throw new Error('User not authenticated');
  }

  async login(credentials: any) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      if (response.token) {
        this.api.setAuthToken(response.token);
      }
      return response;
    } catch (error) {
      // If backend is not available, use mock authentication
      console.log('Backend login unavailable, using mock authentication');
      console.log('Received credentials:', credentials);
      
      // Handle different credential formats
      let email, password;
      
      if (typeof credentials === 'string') {
        email = credentials;
        password = '123456'; // default password
      } else if (credentials && credentials.email && typeof credentials.email === 'string') {
        // Normal case: {email: 'user@domain.com', password: '123456'}
        email = credentials.email;
        password = credentials.password;
      } else if (credentials && credentials.email && typeof credentials.email === 'object') {
        // Nested case: {email: {email: 'user@domain.com', password: '123456'}, password: undefined}
        email = credentials.email.email;
        password = credentials.email.password;
      } else {
        email = credentials;
        password = '123456';
      }
      
      console.log('Extracted email:', email);
      console.log('Extracted password:', password);
      
      // Mock user database with different role combinations
      const mockUsers = {
        'student@ono.ac.il': {
          id: 'user-001',
          email: 'student@ono.ac.il',
          full_name: 'אליהו כהן',
          roles: ['student'],
          current_role: 'student',
          student_id: 'STU001',
          academic_track_ids: ['cs-undergrad']
        },
        'lecturer@ono.ac.il': {
          id: 'user-002', 
          email: 'lecturer@ono.ac.il',
          full_name: 'פרופ׳ מיכאל כהן',
          roles: ['lecturer'],
          current_role: 'lecturer',
          academic_track_ids: []
        },
        'admin@ono.ac.il': {
          id: 'user-003',
          email: 'admin@ono.ac.il', 
          full_name: 'משה אדמיניסטרטור',
          roles: ['admin'],
          current_role: 'admin'
        },
        'student.lecturer@ono.ac.il': {
          id: 'user-004',
          email: 'student.lecturer@ono.ac.il',
          full_name: 'מיכל דוקטורנטית',
          roles: ['student', 'lecturer'],
          current_role: 'student',
          student_id: 'PhD002',
          lecturer_track_ids: ['cs-undergrad'], // As a lecturer
          academic_track_ids: ['cs-grad'] // As a student
        },
        'lecturer.admin@ono.ac.il': {
          id: 'user-005',
          email: 'lecturer.admin@ono.ac.il',
          full_name: 'פרופ׳ דוד ראש המחלקה',
          roles: ['lecturer', 'admin'],
          current_role: 'lecturer',
          academic_track_ids: ['law-undergrad', 'business-undergrad', 'business-grad']
        },
        'all.roles@ono.ac.il': {
          id: 'user-006',
          email: 'all.roles@ono.ac.il',
          full_name: 'ד"ר רונה סופר יוזר',
          roles: ['student', 'lecturer', 'admin'],
          current_role: 'admin', // Set admin as default for all-roles user
          student_id: 'MBA003',
          academic_track_ids: ['business-grad'], // For student role
          lecturer_track_ids: [] // For lecturer role
        }
      };

      console.log('Login attempt with email:', email);
      console.log('Available emails in mockUsers:', Object.keys(mockUsers));

      const mockUser = Object.values(mockUsers).find(user => user.email === email);
      console.log('Found mockUser:', mockUser);
      
      if (!mockUser) {
        console.log('User not found! Email received:', email);
        console.log('Available users:', Object.keys(mockUsers));
        throw new Error('משתמש לא נמצא במערכת');
      }
      
      // Check if user data already exists in localStorage (with previous updates)
      const existingUserData = localStorage.getItem('mock_user');
      let userToStore = mockUser;
      let correctPassword = '123456';
      
      if (existingUserData) {
        try {
          const parsedExistingData = JSON.parse(existingUserData);
          // If the existing user matches the email, merge the data to preserve updates
          if (parsedExistingData.email === email) {
            userToStore = { ...mockUser, ...parsedExistingData };
            if (parsedExistingData.password) {
              correctPassword = parsedExistingData.password;
            }
          }
        } catch {
          console.log('Failed to parse existing user data, using fresh data');
        }
      }
      
      // Check credentials
      if (password !== correctPassword) {
        throw new Error('סיסמה שגויה');
      }
      
      // Set default role based on priority: admin > lecturer > student
      if (!userToStore.current_role || !userToStore.roles.includes(userToStore.current_role)) {
        if (userToStore.roles && userToStore.roles.length > 0) {
          if (userToStore.roles.includes('admin')) {
            userToStore.current_role = 'admin';
          } else if (userToStore.roles.includes('lecturer')) {
            userToStore.current_role = 'lecturer';
          } else if (userToStore.roles.includes('student')) {
            userToStore.current_role = 'student';
          } else {
            userToStore.current_role = userToStore.roles[0]; // fallback to first role
          }
        }
      }
      
      console.log('Final user with role:', userToStore);
      
      // Create a mock token and store it
      const mockToken = 'mock-token-' + Date.now();
      this.api.setAuthToken(mockToken);
      
      // Store user data (either fresh or merged with existing updates)
      localStorage.setItem('mock_user', JSON.stringify(userToStore));
      
      return { user: userToStore, token: mockToken };
    }
  }

  async logout() {
    try {
      // Try to call the backend logout endpoint (if available)
      await this.api.post('/auth/logout', {});
    } catch {
      // If backend is not available, continue with local cleanup
      console.log('Backend logout unavailable, performing local cleanup');
    }
    // Clear auth token to log out, but preserve user data for future logins
    this.api.setAuthToken(null);
    localStorage.removeItem('auth_token');
    // Note: We don't remove 'mock_user' to preserve user preferences like theme
  }

  async register(userData: any) {
    return this.api.post('/auth/register', userData);
  }
}

// File upload service
class FileUploadService {
  api: APIClient;

  constructor(apiClient: APIClient) {
    this.api = apiClient;
  }

  async uploadFile(file: File) {
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
  api: APIClient;

  constructor(apiClient: APIClient) {
    this.api = apiClient;
  }

  async invoke(prompt: string, options = {}) {
    return this.api.post('/llm/invoke', {
      prompt,
      ...options,
    });
  }
}

// Email service
class EmailService {
  api: APIClient;

  constructor(apiClient: APIClient) {
    this.api = apiClient;
  }

  async sendEmail(to: string, subject: string, content: string, options = {}) {
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