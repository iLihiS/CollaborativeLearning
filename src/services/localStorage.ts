import { User } from '@/types';

// Base interface for all entities
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Entity interfaces
export interface Student extends BaseEntity {
  full_name: string;
  email: string;
  student_id: string;
  national_id?: string; // תעודת זהות
  academic_track: string;
  academic_track_ids: string[]; // Add this for compatibility with existing code
  year: number;
  phone?: string;
  status: 'active' | 'inactive' | 'graduated';
}

export interface Lecturer extends BaseEntity {
  full_name: string;
  email: string;
  employee_id: string;
  national_id?: string; // תעודת זהות
  department: string;
  specialization: string;
  phone?: string;
  status: 'active' | 'inactive';
  academic_tracks: string[];
}

export interface Course extends BaseEntity {
  name: string;
  code: string;
  description: string;
  credits: number;
  semester: 'א' | 'ב' | 'קיץ';
  year: number;
  lecturer_id: string;
  academic_track: string;
  max_students: number;
  enrolled_students: number;
  status: 'active' | 'inactive';
}

export interface FileEntity extends BaseEntity {
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  course_id: string;
  uploader_id: string;
  uploader_type: 'student' | 'lecturer';
  status: 'pending' | 'approved' | 'rejected';
  approval_date?: string;
  approved_by?: string;
  rejection_reason?: string;
  download_count: number;
  tags: string[];
}

export interface Message extends BaseEntity {
  sender_id: string;
  sender_type: 'student' | 'lecturer' | 'admin';
  recipient_id?: string;
  subject: string;
  content: string;
  message_type: 'inquiry' | 'support' | 'general';
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface NotificationEntity extends BaseEntity {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  action_url?: string;
  action_text?: string;
}

// Mock data generators
class MockDataGenerator {
  private static getRandomId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static getRandomDate(daysBack: number = 365): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
  }

  private static hebrewNames = [
    'דוד כהן', 'שרה לוי', 'משה אברהם', 'רות דוד', 'יוסף מזרחי',
    'מירי שלום', 'אבי גולד', 'נועה ברק', 'עמית כץ', 'הדר רוזן',
    'טל שמיר', 'גל נחמן', 'רונן דהן', 'יעל פרץ', 'איתן מור'
  ];

  private static academicTracks = [
    'מדעי המחשב', 'הנדסת תוכנה', 'מערכות מידע', 'כלכלה', 'ניהול',
    'פסיכולוגיה', 'חינוך', 'משפטים', 'קוממיוניקציה', 'עיצוב'
  ];

  private static departments = [
    'מדעי המחשב', 'הנדסה', 'כלכלה ועסקים', 'מדעי החברה',
    'משפטים', 'עיצוב ואמנות'
  ];

  private static specializations = [
    'בינה מלאכותית', 'אבטחת מידע', 'פיתוח אפליקציות', 'מסדי נתונים',
    'כלכלה מיקרו', 'שיווק דיגיטלי', 'פסיכולוגיה קלינית', 'חינוך מיוחד'
  ];

  // Generate valid Israeli ID
  private static generateIsraeliId(): string {
    const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    
    // Calculate checksum
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      let digit = digits[i] * ((i % 2) + 1);
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    digits.push(checkDigit);
    
    return digits.join('');
  }

  static generateStudents(count: number = 10): Student[] {
    // Academic track IDs that match the JSON file
    const academicTrackIds = [
      'cs-undergrad', 'swe-undergrad', 'math-undergrad', 'physics-undergrad',
      'law-undergrad', 'business-undergrad', 'psychology-undergrad'
    ];

    const students = Array.from({ length: count }, (_, i) => ({
      id: `student-${this.getRandomId()}`,
      full_name: this.hebrewNames[i % this.hebrewNames.length],
      email: `student${i + 1}@ono.ac.il`,
      student_id: `STU${String(i + 1).padStart(4, '0')}`, // Changed format
      national_id: this.generateIsraeliId(), // Add national ID
      academic_track: academicTrackIds[i % academicTrackIds.length],
      academic_track_ids: [academicTrackIds[i % academicTrackIds.length]], 
      year: Math.floor(Math.random() * 4) + 1,
      phone: `05${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      status: (Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'inactive' : 'graduated')) as 'active' | 'inactive' | 'graduated',
      created_at: this.getRandomDate(365),
      updated_at: this.getRandomDate(30)
    }));

    // Sort alphabetically by name
    return students.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }

  static generateLecturers(count: number = 10): Lecturer[] {
    const lecturers = Array.from({ length: count }, (_, i) => ({
      id: `lecturer-${this.getRandomId()}`,
      full_name: `ד"ר ${this.hebrewNames[(i + 5) % this.hebrewNames.length]}`,
      email: `lecturer${i + 1}@ono.ac.il`,
      employee_id: `EMP${String(i + 1001).padStart(4, '0')}`,
      national_id: this.generateIsraeliId(), // Add national ID
      department: this.departments[i % this.departments.length],
      specialization: this.specializations[i % this.specializations.length],
      phone: `03${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      status: (Math.random() > 0.05 ? 'active' : 'inactive') as 'active' | 'inactive',
      academic_tracks: [this.academicTracks[i % this.academicTracks.length]],
      created_at: this.getRandomDate(365),
      updated_at: this.getRandomDate(30)
    }));

    // Sort alphabetically by name
    return lecturers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }

  static generateCourses(count: number = 10): Course[] {
    const courseNames = [
      'מבוא למדעי המחשב', 'מבני נתונים', 'אלגוריתמים', 'מסדי נתונים',
      'הנדסת תוכנה', 'רשתות מחשבים', 'בינה מלאכותית', 'אבטחת מידע',
      'מתמטיקה לתכנות', 'סטטיסטיקה'
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `course-${this.getRandomId()}`,
      name: courseNames[i % courseNames.length],
      code: `CS${String(i + 101).padStart(3, '0')}`,
      description: `תיאור מפורט של הקורס ${courseNames[i % courseNames.length]}`,
      credits: Math.floor(Math.random() * 3) + 2,
      semester: ['א', 'ב', 'קיץ'][Math.floor(Math.random() * 3)] as 'א' | 'ב' | 'קיץ',
      year: 2024,
      lecturer_id: `lecturer-${this.getRandomId()}`,
      academic_track: this.academicTracks[i % this.academicTracks.length],
      max_students: 30 + Math.floor(Math.random() * 20),
      enrolled_students: Math.floor(Math.random() * 35),
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      created_at: this.getRandomDate(365),
      updated_at: this.getRandomDate(30)
    }));
  }

  static generateFiles(count: number = 10): FileEntity[] {
    const fileTypes = ['pdf', 'docx', 'pptx', 'xlsx', 'txt'];
    const fileNames = [
      'הרצאה 1 - מבוא', 'תרגיל בית 2', 'מצגת שיעור', 'חומר עזר',
      'דוגמאות קוד', 'סיכום נושא', 'מבחן דוגמא', 'פתרון תרגיל',
      'הנחיות פרויקט', 'רשימת ביבליוגרפיה'
    ];

    return Array.from({ length: count }, (_, i) => {
      const fileType = fileTypes[i % fileTypes.length];
      const fileName = fileNames[i % fileNames.length];
      
      return {
        id: `file-${this.getRandomId()}`,
        filename: `${fileName.replace(/\s+/g, '_')}.${fileType}`,
        original_name: `${fileName}.${fileType}`,
        file_type: fileType,
        file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
        course_id: `course-${this.getRandomId()}`,
        uploader_id: `student-${this.getRandomId()}`,
        uploader_type: Math.random() > 0.7 ? 'lecturer' : 'student',
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'approved' | 'rejected',
        approval_date: Math.random() > 0.5 ? this.getRandomDate(30) : undefined,
        approved_by: Math.random() > 0.5 ? `lecturer-${this.getRandomId()}` : undefined,
        rejection_reason: Math.random() > 0.8 ? 'הקובץ אינו רלוונטי לקורס' : undefined,
        download_count: Math.floor(Math.random() * 50),
        tags: ['חומר לימוד', 'תרגיל', 'מבחן'].slice(0, Math.floor(Math.random() * 3) + 1),
        created_at: this.getRandomDate(365),
        updated_at: this.getRandomDate(30)
      };
    });
  }

  static generateMessages(count: number = 10): Message[] {
    const subjects = [
      'בקשה לעזרה בתרגיל', 'שאלה לגבי הרצאה', 'בעיה טכנית', 'בקשה לארכה',
      'הצעה לפרויקט', 'שאלה לגבי ציון', 'תלונה על מערכת', 'בקשה לפגישה',
      'שאלה כללית', 'עדכון חשוב'
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `message-${this.getRandomId()}`,
      sender_id: `student-${this.getRandomId()}`,
      sender_type: Math.random() > 0.7 ? 'lecturer' : 'student' as 'student' | 'lecturer' | 'admin',
      recipient_id: Math.random() > 0.3 ? `lecturer-${this.getRandomId()}` : undefined,
      subject: subjects[i % subjects.length],
      content: `תוכן הודעה מפורט לגבי ${subjects[i % subjects.length]}. זהו טקסט דוגמא ארוך יותר.`,
      message_type: ['inquiry', 'support', 'general'][Math.floor(Math.random() * 3)] as 'inquiry' | 'support' | 'general',
      status: ['open', 'in_progress', 'closed'][Math.floor(Math.random() * 3)] as 'open' | 'in_progress' | 'closed',
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      category: ['טכני', 'אקדמי', 'מנהלי'][Math.floor(Math.random() * 3)],
      created_at: this.getRandomDate(365),
      updated_at: this.getRandomDate(30)
    }));
  }

  static generateNotifications(count: number = 10): NotificationEntity[] {
    const notifications = [
      { title: 'קובץ חדש הועלה', message: 'הועלה קובץ חדש לקורס מבוא למדעי המחשב', type: 'info' as const },
      { title: 'ציון חדש', message: 'התקבל ציון חדש למטלה בקורס אלגוריתמים', type: 'success' as const },
      { title: 'תזכורת הגשה', message: 'נותרו 3 ימים להגשת התרגיל', type: 'warning' as const },
      { title: 'שגיאה במערכת', message: 'זוהתה בעיה זמנית במערכת', type: 'error' as const },
      { title: 'עדכון מערכת', message: 'המערכת עודכנה לגירסה חדשה', type: 'info' as const }
    ];

    return Array.from({ length: count }, (_, i) => {
      const notification = notifications[i % notifications.length];
      return {
        id: `notification-${this.getRandomId()}`,
        user_id: `student-${this.getRandomId()}`,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: Math.random() > 0.4,
        action_url: Math.random() > 0.5 ? '/courses' : undefined,
        action_text: Math.random() > 0.5 ? 'צפה בפרטים' : undefined,
        created_at: this.getRandomDate(30),
        updated_at: this.getRandomDate(30)
      };
    });
  }
}

// LocalStorage Service
export class LocalStorageService {
  private static readonly KEYS = {
    STUDENTS: 'app_students',
    LECTURERS: 'app_lecturers', 
    COURSES: 'app_courses',
    FILES: 'app_files',
    MESSAGES: 'app_messages',
    NOTIFICATIONS: 'app_notifications',
    USER_SESSION: 'app_user_session'
  };

  // Initialize data if not exists
  static initializeData(): void {
    // Force refresh if students don't have academic_track_ids
    const existingStudents = this.getData<Student>(this.KEYS.STUDENTS);
    if (!localStorage.getItem(this.KEYS.STUDENTS) || 
        existingStudents.length === 0 || 
        !existingStudents[0].academic_track_ids) {
      this.setStudents(MockDataGenerator.generateStudents(15));
    } else {
      // Clean up duplicates in existing data
      this.removeDuplicateStudents();
    }
    if (!localStorage.getItem(this.KEYS.LECTURERS)) {
      this.setLecturers(MockDataGenerator.generateLecturers(12));
    }
    if (!localStorage.getItem(this.KEYS.COURSES)) {
      this.setCourses(MockDataGenerator.generateCourses(20));
    }
    if (!localStorage.getItem(this.KEYS.FILES)) {
      this.setFiles(MockDataGenerator.generateFiles(50));
    }
    if (!localStorage.getItem(this.KEYS.MESSAGES)) {
      this.setMessages(MockDataGenerator.generateMessages(30));
    }
    if (!localStorage.getItem(this.KEYS.NOTIFICATIONS)) {
      this.setNotifications(MockDataGenerator.generateNotifications(25));
    }
  }

  // Generic CRUD operations
  private static getData<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.error(`Error parsing data for key ${key}:`, error);
      return [];
    }
  }

  private static setData<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
    }
  }

  // Students
  static getStudents(): Student[] { 
    const students = this.getData<Student>(this.KEYS.STUDENTS);
    return students.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }
  static setStudents(data: Student[]): void { this.setData(this.KEYS.STUDENTS, data); }
  static addStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Student {
    const students = this.getStudents();
    
    // Check for duplicates by email
    const existingByEmail = students.find(s => s.email === student.email);
    if (existingByEmail) {
      console.warn(`Student with email ${student.email} already exists`);
      return existingByEmail;
    }
    
    // Check for duplicates by student_id
    if (student.student_id) {
      const existingByStudentId = students.find(s => s.student_id === student.student_id);
      if (existingByStudentId) {
        console.warn(`Student with student_id ${student.student_id} already exists`);
        return existingByStudentId;
      }
    }
    
    // Check for duplicates by national_id
    if (student.national_id) {
      const existingByNationalId = students.find(s => s.national_id === student.national_id);
      if (existingByNationalId) {
        console.warn(`Student with national_id ${student.national_id} already exists`);
        return existingByNationalId;
      }
    }
    
    const newStudent: Student = {
      ...student,
      // Ensure academic_track_ids exists and matches academic_track if needed
      academic_track_ids: student.academic_track_ids || (student.academic_track ? [student.academic_track] : []),
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    students.push(newStudent);
    this.setStudents(students);
    return newStudent;
  }
  static updateStudent(id: string, updates: Partial<Student>): Student | null {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    students[index] = { ...students[index], ...updates, updated_at: new Date().toISOString() };
    this.setStudents(students);
    return students[index];
  }
  static deleteStudent(id: string): boolean {
    const students = this.getStudents();
    const filtered = students.filter(s => s.id !== id);
    if (filtered.length === students.length) return false;
    this.setStudents(filtered);
    return true;
  }

  // Remove duplicate students based on email, student_id, and national_id
  static removeDuplicateStudents(): void {
    const students = this.getStudents();
    const seen = new Set<string>();
    const seenStudentIds = new Set<string>();
    const seenNationalIds = new Set<string>();
    const uniqueStudents: Student[] = [];

    for (const student of students) {
      let isDuplicate = false;
      
      // Check email duplicates
      if (seen.has(student.email)) {
        console.log(`Removing duplicate student by email: ${student.full_name} (${student.email})`);
        isDuplicate = true;
      }
      
      // Check student_id duplicates
      if (student.student_id && seenStudentIds.has(student.student_id)) {
        console.log(`Removing duplicate student by student_id: ${student.full_name} (${student.student_id})`);
        isDuplicate = true;
      }
      
      // Check national_id duplicates  
      if (student.national_id && seenNationalIds.has(student.national_id)) {
        console.log(`Removing duplicate student by national_id: ${student.full_name} (${student.national_id})`);
        isDuplicate = true;
      }
      
      if (!isDuplicate) {
        seen.add(student.email);
        if (student.student_id) seenStudentIds.add(student.student_id);
        if (student.national_id) seenNationalIds.add(student.national_id);
        uniqueStudents.push(student);
      }
    }

    if (uniqueStudents.length !== students.length) {
      console.log(`Removed ${students.length - uniqueStudents.length} duplicate students`);
      this.setStudents(uniqueStudents);
    }
  }

  // Lecturers
  static getLecturers(): Lecturer[] { 
    const lecturers = this.getData<Lecturer>(this.KEYS.LECTURERS);
    return lecturers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }
  static setLecturers(data: Lecturer[]): void { this.setData(this.KEYS.LECTURERS, data); }
  static addLecturer(lecturer: Omit<Lecturer, 'id' | 'created_at' | 'updated_at'>): Lecturer {
    const newLecturer: Lecturer = {
      ...lecturer,
      id: `lecturer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const lecturers = this.getLecturers();
    lecturers.push(newLecturer);
    this.setLecturers(lecturers);
    return newLecturer;
  }
  static updateLecturer(id: string, updates: Partial<Lecturer>): Lecturer | null {
    const lecturers = this.getLecturers();
    const index = lecturers.findIndex(l => l.id === id);
    if (index === -1) return null;
    
    lecturers[index] = { ...lecturers[index], ...updates, updated_at: new Date().toISOString() };
    this.setLecturers(lecturers);
    return lecturers[index];
  }
  static deleteLecturer(id: string): boolean {
    const lecturers = this.getLecturers();
    const filtered = lecturers.filter(l => l.id !== id);
    if (filtered.length === lecturers.length) return false;
    this.setLecturers(filtered);
    return true;
  }

  // Courses (similar pattern for other entities)
  static getCourses(): Course[] { return this.getData<Course>(this.KEYS.COURSES); }
  static setCourses(data: Course[]): void { this.setData(this.KEYS.COURSES, data); }
  static addCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Course {
    const newCourse: Course = {
      ...course,
      id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const courses = this.getCourses();
    courses.push(newCourse);
    this.setCourses(courses);
    return newCourse;
  }
  static updateCourse(id: string, updates: Partial<Course>): Course | null {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    courses[index] = { ...courses[index], ...updates, updated_at: new Date().toISOString() };
    this.setCourses(courses);
    return courses[index];
  }
  static deleteCourse(id: string): boolean {
    const courses = this.getCourses();
    const filtered = courses.filter(c => c.id !== id);
    if (filtered.length === courses.length) return false;
    this.setCourses(filtered);
    return true;
  }

  // Files, Messages, Notifications
  static getFiles(): FileEntity[] { return this.getData<FileEntity>(this.KEYS.FILES); }
  static setFiles(data: FileEntity[]): void { this.setData(this.KEYS.FILES, data); }
  static getMessages(): Message[] { return this.getData<Message>(this.KEYS.MESSAGES); }
  static setMessages(data: Message[]): void { this.setData(this.KEYS.MESSAGES, data); }
  static getNotifications(): NotificationEntity[] { return this.getData<NotificationEntity>(this.KEYS.NOTIFICATIONS); }
  static setNotifications(data: NotificationEntity[]): void { this.setData(this.KEYS.NOTIFICATIONS, data); }

  // User session
  static setUserSession(user: User): void {
    localStorage.setItem(this.KEYS.USER_SESSION, JSON.stringify(user));
  }
  static getUserSession(): User | null {
    try {
      const userData = localStorage.getItem(this.KEYS.USER_SESSION);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
  static clearUserSession(): void {
    localStorage.removeItem(this.KEYS.USER_SESSION);
  }

  // Clear all data
  static clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Force clean all data and reinitialize
  static resetAllData(): void {
    console.log('Resetting all data...');
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeData();
    console.log('All data has been reset and reinitialized');
  }

  // Clean specific duplicates manually
  static cleanAllDuplicates(): void {
    console.log('Cleaning all duplicates...');
    this.removeDuplicateStudents();
    // Could add similar functions for lecturers if needed
    console.log('Duplicates cleaned');
  }
}

// Expose utility functions to window for debug/admin use
if (typeof window !== 'undefined') {
  (window as any).LocalStorageUtils = {
    resetAllData: () => LocalStorageService.resetAllData(),
    cleanDuplicates: () => LocalStorageService.cleanAllDuplicates(),
    removeDuplicateStudents: () => LocalStorageService.removeDuplicateStudents(),
    getStudents: () => LocalStorageService.getStudents(),
    clearAllData: () => LocalStorageService.clearAllData()
  };
  
  console.log('LocalStorageUtils available in console:');
  console.log('- LocalStorageUtils.resetAllData() - מאפס את כל הנתונים');
  console.log('- LocalStorageUtils.cleanDuplicates() - מנקה כפילויות');
  console.log('- LocalStorageUtils.removeDuplicateStudents() - מנקה כפילויות סטודנטים');
  console.log('- LocalStorageUtils.getStudents() - מציג רשימת סטודנטים');
  console.log('- LocalStorageUtils.clearAllData() - מוחק את כל הנתונים');
} 