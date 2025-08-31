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

  private static academicTrackIds = [
    'cs-undergrad', 'swe-undergrad', 'math-undergrad', 'physics-undergrad',
    'law-undergrad', 'business-undergrad', 'business-grad', 'psychology-undergrad',
    'education-grad', 'cs-grad'
  ];

  private static departments = [
    'מדעי המחשב', 'הנדסה', 'כלכלה ועסקים', 'מדעי החברה',
    'משפטים', 'עיצוב ואמנות'
  ];

  private static specializations = [
    'בינה מלאכותית', 'אבטחת מידע', 'פיתוח אפליקציות', 'מסדי נתונים',
    'כלכלה מיקרו', 'שיווק דיגיטלי', 'פסיכולוגיה קלינית', 'חינוך מיוחד'
  ];

  private static cities = [
    'תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 
    'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'אשקלון', 'רחובות', 'בת ים',
    'כפר סבא', 'חדרה', 'הרצליה', 'קריית גת', 'לוד', 'רמלה'
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

    const students = Array.from({ length: count }, (_, i) => {
      const trackId = academicTrackIds[i % academicTrackIds.length];
      const year = Math.floor(Math.random() * 4) + 1;
      
      return {
        id: `student-${String(i + 1).padStart(3, '0')}`,
        full_name: this.hebrewNames[i % this.hebrewNames.length],
        email: `student${i + 1}@ono.ac.il`,
        student_id: `STU${String(i + 2024).padStart(4, '0')}${String(i + 1).padStart(3, '0')}`,
        national_id: this.generateIsraeliId(),
        academic_track: trackId,
        academic_track_ids: [trackId],
        year: year,
        semester: year * 2 - (Math.random() > 0.5 ? 1 : 0), // Current semester
        gpa: Math.round((Math.random() * 40 + 60) * 100) / 100, // GPA between 60-100
        total_credits: year * 15 + Math.floor(Math.random() * 10), // Credits accumulated
        phone: `05${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        address: `${this.cities[i % this.cities.length]}, רחוב ${Math.floor(Math.random() * 200) + 1}`,
        birth_date: this.getRandomDate(365 * 6), // Random birth date in last 6 years from 1998
        enrollment_date: this.getRandomDate(year * 365), // Random enrollment date
        advisor_id: `lecturer-${String((i % 12) + 1).padStart(3, '0')}`,
        status: (Math.random() > 0.05 ? 'active' : (Math.random() > 0.7 ? 'inactive' : 'graduated')) as 'active' | 'inactive' | 'graduated',
        created_at: this.getRandomDate(365),
        updated_at: this.getRandomDate(30)
      };
    });

    // Sort alphabetically by name
    return students.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }

  static generateLecturers(count: number = 10): Lecturer[] {
    const titles = ['ד"ר', 'פרופ\'', 'מר', 'גב\'', 'מר'];
    const degrees = ['Ph.D', 'M.Sc', 'M.A', 'LL.M', 'M.B.A'];
    
    const lecturers = Array.from({ length: count }, (_, i) => {
      const title = titles[i % titles.length];
      const name = this.hebrewNames[(i + 5) % this.hebrewNames.length];
      const department = this.departments[i % this.departments.length];
      
      return {
        id: `lecturer-${String(i + 1).padStart(3, '0')}`,
        full_name: `${title} ${name}`,
        title: title,
        first_name: name.split(' ')[0],
        last_name: name.split(' ')[1] || '',
        email: `lecturer${i + 1}@ono.ac.il`,
        employee_id: `EMP${String(i + 1001).padStart(4, '0')}`,
        national_id: this.generateIsraeliId(),
        department: department,
        specialization: this.specializations[i % this.specializations.length],
        degree: degrees[i % degrees.length],
        office_number: `${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 50) + 10}`,
        office_hours: 'ב\' 10:00-12:00, ה\' 14:00-16:00',
        phone: `03${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        extension: (1000 + i).toString(),
        bio: `מרצה בכיר במחלקת ${department} עם התמחות ב${this.specializations[i % this.specializations.length]}. בעל ניסיון רב בהוראה ובמחקר.`,
        research_interests: [this.specializations[i % this.specializations.length], this.specializations[(i + 1) % this.specializations.length]],
        courses_taught: [], // Will be filled when courses are created
        academic_tracks: [this.academicTrackIds[i % this.academicTrackIds.length]],
        status: (Math.random() > 0.02 ? 'active' : 'inactive') as 'active' | 'inactive',
        hire_date: this.getRandomDate(365 * 10), // Hired in last 10 years
        academic_rank: ['מרצה', 'מרצה בכיר', 'פרופ\' חבר', 'פרופ\' מן המניין'][Math.floor(Math.random() * 4)],
        salary_grade: Math.floor(Math.random() * 10) + 10,
        created_at: this.getRandomDate(365),
        updated_at: this.getRandomDate(30)
      };
    });

    // Sort alphabetically by name
    return lecturers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }

  static generateCourses(count: number = 10, lecturers: Lecturer[] = []): Course[] {
    const courseData = [
      { name: 'מבוא למדעי המחשב', code: 'CS101', credits: 4, tracks: ['cs-undergrad', 'swe-undergrad'], department: 'מדעים והנדסה' },
      { name: 'מבני נתונים ואלגוריתמים', code: 'CS201', credits: 5, tracks: ['cs-undergrad', 'swe-undergrad'], department: 'מדעים והנדסה' },
      { name: 'מסדי נתונים', code: 'CS301', credits: 4, tracks: ['cs-undergrad', 'swe-undergrad'], department: 'מדעים והנדסה' },
      { name: 'הנדסת תוכנה', code: 'SE301', credits: 4, tracks: ['swe-undergrad'], department: 'מדעים והנדסה' },
      { name: 'רשתות מחשבים', code: 'CS401', credits: 3, tracks: ['cs-undergrad', 'cs-grad'], department: 'מדעים והנדסה' },
      { name: 'בינה מלאכותית', code: 'CS501', credits: 4, tracks: ['cs-grad'], department: 'מדעים והנדסה' },
      { name: 'אבטחת מידע', code: 'CS451', credits: 3, tracks: ['cs-undergrad', 'cs-grad'], department: 'מדעים והנדסה' },
      { name: 'מתמטיקה דיסקרטית', code: 'MATH101', credits: 4, tracks: ['math-undergrad', 'cs-undergrad'], department: 'מדעים מדויקים' },
      { name: 'סטטיסטיקה', code: 'MATH201', credits: 3, tracks: ['math-undergrad', 'psychology-undergrad'], department: 'מדעים מדויקים' },
      { name: 'פיזיקה כללית', code: 'PHYS101', credits: 5, tracks: ['physics-undergrad'], department: 'מדעים מדויקים' },
      { name: 'חוקי חוזים', code: 'LAW201', credits: 4, tracks: ['law-undergrad'], department: 'משפטים' },
      { name: 'דיני חברות', code: 'LAW301', credits: 3, tracks: ['law-undergrad'], department: 'משפטים' },
      { name: 'ניהול ואסטרטגיה', code: 'BUS101', credits: 4, tracks: ['business-undergrad', 'business-grad'], department: 'ניהול וכלכלה' },
      { name: 'שיווק דיגיטלי', code: 'BUS301', credits: 3, tracks: ['business-undergrad', 'business-grad'], department: 'ניהול וכלכלה' },
      { name: 'חשבונאות פיננסית', code: 'ACC101', credits: 4, tracks: ['business-undergrad'], department: 'ניהול וכלכלה' },
      { name: 'פסיכולוגיה כללית', code: 'PSY101', credits: 4, tracks: ['psychology-undergrad'], department: 'מדעי החברה' },
      { name: 'פסיכולוגיה התפתחותית', code: 'PSY201', credits: 3, tracks: ['psychology-undergrad'], department: 'מדעי החברה' },
      { name: 'ייעוץ והדרכה', code: 'EDU501', credits: 4, tracks: ['education-grad'], department: 'מדעי החברה' },
      { name: 'מחקר כמותי', code: 'RES401', credits: 3, tracks: ['psychology-undergrad', 'education-grad'], department: 'מדעי החברה' },
      { name: 'כלכלה מיקרו', code: 'ECON101', credits: 4, tracks: ['business-undergrad'], department: 'ניהול וכלכלה' }
    ];

    // Get lecturer IDs for proper linking
    const lecturerIds = lecturers.length > 0 
      ? lecturers.map(l => l.id) 
      : Array.from({ length: 12 }, (_, i) => `lecturer-${String(i + 1).padStart(3, '0')}`);

    return Array.from({ length: count }, (_, i) => {
      const courseInfo = courseData[i % courseData.length];
      
      return {
        id: `course-${String(i + 1).padStart(3, '0')}`,
        course_name: courseInfo.name,
        course_code: courseInfo.code,
        name: courseInfo.name, // Legacy field
        code: courseInfo.code, // Legacy field
        description: `${courseInfo.name} - קורס מקצועי המועבר במחלקת ${courseInfo.department}. הקורס כולל הרצאות, תרגילים ופרויקטים מעשיים.`,
        credits: courseInfo.credits,
        semester: ['א', 'ב', 'קיץ'][Math.floor(Math.random() * 3)] as 'א' | 'ב' | 'קיץ',
        year: 2024,
        lecturer_id: lecturerIds[i % lecturerIds.length],
        lecturer: lecturers.length > 0 ? lecturers[i % lecturers.length].full_name : `מרצה ${i + 1}`,
        department: courseInfo.department,
        academic_track_ids: courseInfo.tracks,
        academic_track: courseInfo.tracks[0], // Primary track
        max_students: 25 + Math.floor(Math.random() * 25),
        enrolled_students: Math.floor(Math.random() * 30),
        status: Math.random() > 0.05 ? 'active' : 'inactive',
        prerequisites: i > 2 ? [`course-${String(Math.floor(Math.random() * i) + 1).padStart(3, '0')}`] : [],
        syllabus_url: `https://example.com/syllabus/${courseInfo.code.toLowerCase()}.pdf`,
        created_at: this.getRandomDate(365),
        updated_at: this.getRandomDate(30)
      };
    });
  }

  static generateFiles(count: number = 10, courses: Course[] = [], students: Student[] = []): FileEntity[] {
    const fileTypes = ['pdf', 'docx', 'pptx', 'xlsx', 'txt'];
    const fileNames = [
      'הרצאה 1 - מבוא', 'תרגיל בית 2', 'מצגת שיעור', 'חומר עזר',
      'דוגמאות קוד', 'סיכום נושא', 'מבחן דוגמא', 'פתרון תרגיל',
      'הנחיות פרויקט', 'רשימת ביבליוגרפיה', 'נושאי מחקר', 'דוח פרויקט',
      'סיכום הרצאה', 'תרגיל מעשי', 'חומר הכנה למבחן'
    ];

    // If no courses provided, create some default course IDs
    const courseIds = courses.length > 0 ? courses.map(c => c.id) : [
      'course-001', 'course-002', 'course-003', 'course-004', 'course-005'
    ];
    
    // If no students provided, create some default student IDs
    const studentIds = students.length > 0 ? students.map(s => s.id) : [
      'student-001', 'student-002', 'student-003', 'student-004', 'student-005'
    ];

    return Array.from({ length: count }, (_, i) => {
      const fileType = fileTypes[i % fileTypes.length];
      const fileName = fileNames[i % fileNames.length];
      const createdDate = this.getRandomDate(90); // Last 90 days
      
      return {
        id: `file-${String(i + 1).padStart(3, '0')}`,
        filename: `${fileName.replace(/\s+/g, '_')}.${fileType}`,
        original_name: `${fileName}.${fileType}`,
        file_type: fileType,
        file_size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
        course_id: courseIds[i % courseIds.length], // Link to existing courses
        uploader_id: studentIds[i % studentIds.length], // Link to existing students
        uploader_type: Math.random() > 0.7 ? 'lecturer' : 'student',
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'approved' | 'rejected',
        approval_date: Math.random() > 0.5 ? this.getRandomDate(30) : undefined,
        approved_by: Math.random() > 0.5 ? `lecturer-001` : undefined,
        rejection_reason: Math.random() > 0.8 ? 'הקובץ אינו רלוונטי לקורס' : undefined,
        download_count: Math.floor(Math.random() * 50),
        tags: ['חומר לימוד', 'תרגיל', 'מבחן'].slice(0, Math.floor(Math.random() * 3) + 1),
        created_at: createdDate,
        updated_at: createdDate
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
      const lecturers = this.getLecturers();
      this.setCourses(MockDataGenerator.generateCourses(20, lecturers));
    }
    if (!localStorage.getItem(this.KEYS.FILES)) {
      const courses = this.getCourses();
      const students = this.getStudents();
      this.setFiles(MockDataGenerator.generateFiles(50, courses, students));
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
    
    // Validate that national_id is provided and not empty
    if (!student.national_id || student.national_id.trim() === '') {
      throw new Error('תעודת זהות היא שדה חובה ולא ניתן ליצור סטודנט בלעדיה');
    }
    
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
    const existingByNationalId = students.find(s => s.national_id === student.national_id);
    if (existingByNationalId) {
      console.warn(`Student with national_id ${student.national_id} already exists`);
      return existingByNationalId;
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
  // Also remove students without national_id
  static removeDuplicateStudents(): void {
    const students = this.getStudents();
    const seen = new Set<string>();
    const seenStudentIds = new Set<string>();
    const seenNationalIds = new Set<string>();
    const validStudents: Student[] = [];

    for (const student of students) {
      let shouldRemove = false;
      
      // Check if student has national_id - this is now required
      if (!student.national_id || student.national_id.trim() === '') {
        console.log(`Removing student without national_id: ${student.full_name} (${student.email})`);
        shouldRemove = true;
      }
      
      // Check email duplicates
      if (!shouldRemove && seen.has(student.email)) {
        console.log(`Removing duplicate student by email: ${student.full_name} (${student.email})`);
        shouldRemove = true;
      }
      
      // Check student_id duplicates
      if (!shouldRemove && student.student_id && seenStudentIds.has(student.student_id)) {
        console.log(`Removing duplicate student by student_id: ${student.full_name} (${student.student_id})`);
        shouldRemove = true;
      }
      
      // Check national_id duplicates  
      if (!shouldRemove && student.national_id && seenNationalIds.has(student.national_id)) {
        console.log(`Removing duplicate student by national_id: ${student.full_name} (${student.national_id})`);
        shouldRemove = true;
      }
      
      if (!shouldRemove) {
        seen.add(student.email);
        if (student.student_id) seenStudentIds.add(student.student_id);
        if (student.national_id) seenNationalIds.add(student.national_id);
        validStudents.push(student);
      }
    }

    if (validStudents.length !== students.length) {
      console.log(`Removed ${students.length - validStudents.length} invalid/duplicate students`);
      this.setStudents(validStudents);
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

  static refreshAllData(): void {
    console.log('🔄 מרענן את כל הנתונים עם IDs נכונים של מסלולים...');
    this.clearAllData();
    this.initializeData();
    console.log('✅ הנתונים עודכנו עם מסלולים נכונים! רוענן את הדף...');
    setTimeout(() => window.location.reload(), 500);
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

  // Remove students without national_id
  static removeStudentsWithoutNationalId(): void {
    const students = this.getStudents();
    const validStudents = students.filter(student => {
      if (!student.national_id || student.national_id.trim() === '') {
        console.log(`Removing student without national_id: ${student.full_name} (${student.email})`);
        return false;
      }
      return true;
    });

    if (validStudents.length !== students.length) {
      console.log(`Removed ${students.length - validStudents.length} students without national_id`);
      this.setStudents(validStudents);
    }
  }

  // Clean specific duplicates manually
  static cleanAllDuplicates(): void {
    console.log('Cleaning all duplicates and invalid students...');
    this.removeDuplicateStudents();
    // Could add similar functions for lecturers if needed
    console.log('Duplicates and invalid students cleaned');
  }
}

// Expose utility functions to window for debug/admin use
if (typeof window !== 'undefined') {
  (window as any).LocalStorageUtils = {
    resetAllData: () => LocalStorageService.resetAllData(),
          cleanDuplicates: () => LocalStorageService.cleanAllDuplicates(),
      removeDuplicateStudents: () => LocalStorageService.removeDuplicateStudents(),
      removeStudentsWithoutNationalId: () => LocalStorageService.removeStudentsWithoutNationalId(),
      getStudents: () => LocalStorageService.getStudents(),
      clearAllData: () => LocalStorageService.clearAllData(),
      refreshAllData: () => LocalStorageService.refreshAllData(),
      getFiles: () => LocalStorageService.getFiles(),
      getCourses: () => LocalStorageService.getCourses(),
      getLecturers: () => LocalStorageService.getLecturers()
  };
  
      console.log('%c🛠️ LocalStorageUtils available in console:', 'color: #2196F3; font-weight: bold; font-size: 14px;');
    console.log('%c✨ LocalStorageUtils.refreshAllData() - רענון נתונים עם נתונים מלאים חדשים!', 'color: #4CAF50; font-weight: bold;');
    console.log('- LocalStorageUtils.resetAllData() - מאפס את כל הנתונים');
    console.log('- LocalStorageUtils.cleanDuplicates() - מנקה כפילויות וסטודנטים לא תקינים');
    console.log('- LocalStorageUtils.removeDuplicateStudents() - מנקה כפילויות סטודנטים');
    console.log('- LocalStorageUtils.removeStudentsWithoutNationalId() - מסיר סטודנטים ללא תעודת זהות');
    console.log('- LocalStorageUtils.getStudents() - מציג רשימת סטודנטים');
    console.log('- LocalStorageUtils.getCourses() - מציג רשימת קורסים');
    console.log('- LocalStorageUtils.clearAllData() - מוחק את כל הנתונים');
} 