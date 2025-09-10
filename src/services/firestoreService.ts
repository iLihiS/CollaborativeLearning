import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
  writeBatch,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types';

// Define entity interfaces locally (previously imported from localStorage)
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Student extends BaseEntity {
  full_name: string;
  email: string;
  student_id: string;
  national_id?: string;
  academic_track: string;
  academic_track_ids: string[];
  year: number;
  phone?: string;
  status: 'active' | 'inactive' | 'graduated';
}

export interface Lecturer extends BaseEntity {
  full_name: string;
  email: string;
  employee_id: string;
  national_id?: string;
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
  academic_track_ids?: string[];  // Array of academic track IDs for multi-track support
  max_students: number;
  enrolled_students: number;
  status: 'active' | 'inactive';
}

export interface FileEntity extends BaseEntity {
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_code?: string;
  course_id: string;
  uploader_id: string;
  uploader_type: 'student' | 'lecturer' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  approval_date?: string;
  approved_by?: string;
  rejection_reason?: string;
  download_count: number;
  tags: string[];
  download_url?: string;
  storage_path?: string;
  file_url?: string;  // URL for externally linked files
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

// Collection names
const COLLECTIONS = {
  STUDENTS: 'students',
  LECTURERS: 'lecturers',
  COURSES: 'courses',
  FILES: 'files',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  USERS: 'users',
  USER_SESSIONS: 'user_sessions'
} as const;

export class FirestoreService {
  // Initialize Firestore connection and ensure demo data exists
  static async initializeConnection(): Promise<void> {
    console.log('🔥 Initializing Firestore connection...');
    
    try {
      // Just verify connection is working
      const testSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      console.log('✅ Firestore connection established');
      
      // Check if we have data, if not create demo data
      if (testSnapshot.empty) {
        console.log('📚 No data found - creating demo data...');
        await this.createDemoData();
      }
    } catch (error) {
      console.error('❌ Error connecting to Firestore:', error);
      throw error;
    }
  }

  // Clean invalid records from all collections
  static async cleanInvalidRecords(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of invalid records...');

      // Clean invalid files
      const allFiles = await this.getFiles();
      const invalidFiles = allFiles.filter(file => 
        !file.original_name || 
        !file.file_type || 
        !file.created_at || 
        typeof file.download_count !== 'number' ||
        !file.status ||
        !file.uploader_type ||
        !file.uploader_id ||
        !file.file_size ||
        !file.tags ||
        !Array.isArray(file.tags)
        // Note: file_url is optional so we don't require it
      );

      console.log(`🧹 Found ${invalidFiles.length} invalid files to delete`);
      for (const file of invalidFiles) {
        console.log(`🗑️ Deleting invalid file: ${file.id}`, file);
        await deleteDoc(doc(db, COLLECTIONS.FILES, file.id));
      }

      // Clean invalid courses
      const allCourses = await this.getCourses();
      const invalidCourses = allCourses.filter(course => 
        !course.name || 
        !course.code || 
        !course.lecturer_id || 
        !course.semester ||
        !course.description ||
        typeof course.max_students !== 'number' ||
        typeof course.enrolled_students !== 'number'
      );

      console.log(`🧹 Found ${invalidCourses.length} invalid courses to delete`);
      for (const course of invalidCourses) {
        console.log(`🗑️ Deleting invalid course: ${course.id}`, course);
        await deleteDoc(doc(db, COLLECTIONS.COURSES, course.id));
      }

      // Clean invalid students
      const allStudents = await this.getStudents();
      const invalidStudents = allStudents.filter(student => 
        !student.full_name || 
        !student.email || 
        !student.student_id ||
        !student.academic_track_ids ||
        !Array.isArray(student.academic_track_ids)
      );

      console.log(`🧹 Found ${invalidStudents.length} invalid students to delete`);
      for (const student of invalidStudents) {
        console.log(`🗑️ Deleting invalid student: ${student.id}`, student);
        await deleteDoc(doc(db, COLLECTIONS.STUDENTS, student.id));
      }

      // Clean invalid lecturers
      const allLecturers = await this.getLecturers();
      const invalidLecturers = allLecturers.filter(lecturer => 
        !lecturer.full_name || 
        !lecturer.email ||
        !lecturer.department
      );

      console.log(`🧹 Found ${invalidLecturers.length} invalid lecturers to delete`);
      for (const lecturer of invalidLecturers) {
        console.log(`🗑️ Deleting invalid lecturer: ${lecturer.id}`, lecturer);
        await deleteDoc(doc(db, COLLECTIONS.LECTURERS, lecturer.id));
      }

      console.log('✅ Cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  // Create demo data for development/testing
  static async createDemoData(): Promise<void> {
    console.log('🔄 Creating demo data for Firestore...');
    
    try {
      // First clean invalid records
      await this.cleanInvalidRecords();
      
      const batch = writeBatch(db);

      // Create demo students
      const demoStudents: Student[] = [
        {
          id: 'student-001',
          full_name: 'יוסי כהן',
          email: 'yossi.cohen@student.ono.ac.il',
          student_id: 'STU001',
          national_id: '123456789',
          academic_track: 'cs-undergrad',
          academic_track_ids: ['cs-undergrad'],
          year: 2,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'student-002',
          full_name: 'שרה לוי',
          email: 'sarah.levi@student.ono.ac.il',
          student_id: 'STU002',
          national_id: '987654321',
          academic_track: 'business-undergrad',
          academic_track_ids: ['business-undergrad'],
          year: 3,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Create demo lecturers
      const demoLecturers: Lecturer[] = [
        {
          id: 'lecturer-001',
          full_name: 'ד"ר מיכל רוזן',
          email: 'michal.rosen@ono.ac.il',
          employee_id: 'EMP001',
          national_id: '555666777',
          department: 'מדעי המחשב',
          specialization: 'בינה מלאכותית',
          status: 'active',
          academic_tracks: ['cs-undergrad', 'cs-grad'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Create demo courses
      const demoCourses: Course[] = [
        {
          id: 'course-001',
          name: 'מבוא למדעי המחשב',
          code: 'CS101',
          description: 'קורס מבוא למדעי המחשב',
          credits: 4,
          semester: 'א',
          year: 2024,
          lecturer_id: 'lecturer-001',
          academic_track: 'cs-undergrad',
          academic_track_ids: ['cs-undergrad'],
          max_students: 30,
          enrolled_students: 15,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'course-002',
          name: 'מבני נתונים ואלגוריתמים',
          code: 'CS201',
          description: 'מבני נתונים בסיסיים ואלגוריתמים יעילים',
          credits: 4,
          semester: 'ב',
          year: 2024,
          lecturer_id: 'lecturer-001',
          academic_track: 'cs-undergrad',
          academic_track_ids: ['cs-undergrad'],
          max_students: 25,
          enrolled_students: 20,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'course-003',
          name: 'מתמטיקה דיסקרטית',
          code: 'MATH101',
          description: 'מתמטיקה דיסקרטית למדעי המחשב',
          credits: 3,
          semester: 'א',
          year: 2024,
          lecturer_id: 'lecturer-002',
          academic_track: 'math-undergrad',
          academic_track_ids: ['math-undergrad'],
          max_students: 40,
          enrolled_students: 35,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'course-004',
          name: 'פיתוח אפליקציות ווב',
          code: 'CS301',
          description: 'פיתוח אפליקציות ווב מודרניות',
          credits: 4,
          semester: 'ב',
          year: 2024,
          lecturer_id: 'lecturer-001',
          academic_track: 'cs-undergrad',
          academic_track_ids: ['cs-undergrad'],
          max_students: 20,
          enrolled_students: 18,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'course-005',
          name: 'בסיסי נתונים',
          code: 'CS202',
          description: 'מודלים ושפות לניהול בסיסי נתונים',
          credits: 3,
          semester: 'א',
          year: 2024,
          lecturer_id: 'lecturer-002',
          academic_track: 'cs-undergrad',
          academic_track_ids: ['cs-undergrad'],
          max_students: 30,
          enrolled_students: 22,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Create demo files
      const demoFiles: FileEntity[] = [
        // Pending files
        {
          id: 'file-001',
          filename: 'lecture1.pdf',
          original_name: 'הרצאה 1 - מבוא.pdf',
          file_type: 'note',
          file_size: 1024000,
          file_code: 'CS101-N001',
          course_id: 'course-001',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'pending',
          download_count: 0,
          tags: ['הרצאה', 'מבוא'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'file-002',
          filename: 'assignment2.pdf',
          original_name: 'תרגיל 2 - מבני נתונים.pdf',
          file_type: 'assignment',
          file_size: 756000,
          file_code: 'CS201-A002',
          course_id: 'course-002',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'pending',
          download_count: 0,
          tags: ['תרגיל', 'מבני נתונים'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'file-003',
          filename: 'math_formulas.pdf',
          original_name: 'נוסחאות מתמטיקה דיסקרטית.pdf',
          file_type: 'formulas',
          file_size: 320000,
          file_code: 'MATH101-F001',
          course_id: 'course-003',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'pending',
          download_count: 0,
          tags: ['נוסחאות', 'מתמטיקה'],
          created_at: new Date(Date.now() - 86400000).toISOString(), // יום אחד אחורה
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        // Approved files
        {
          id: 'file-004',
          filename: 'intro_to_cs.pdf',
          original_name: 'תרגיל 1 - מבוא למדעי המחשב.pdf',
          file_type: 'assignment',
          file_size: 512000,
          file_code: 'CS101-A001',
          course_id: 'course-001',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date().toISOString(),
          approved_by: 'lecturer-001',
          download_count: 15,
          tags: ['תרגיל', 'מבוא'],
          file_url: 'https://example.com/files/intro_to_cs.pdf',
          created_at: new Date(Date.now() - 172800000).toISOString(), // יומיים אחורה
          updated_at: new Date().toISOString()
        },
        {
          id: 'file-005',
          filename: 'data_structures_notes.pdf',
          original_name: 'סיכום הרצאות - מבני נתונים.pdf',
          file_type: 'note',
          file_size: 2048000,
          file_code: 'CS201-N002',
          course_id: 'course-002',
          uploader_id: 'lecturer-001',
          uploader_type: 'lecturer',
          status: 'approved',
          approval_date: new Date().toISOString(),
          approved_by: 'lecturer-001',
          download_count: 28,
          tags: ['הרצאות', 'מבני נתונים'],
          file_url: 'https://example.com/files/data_structures_notes.pdf',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 ימים אחורה
          updated_at: new Date().toISOString()
        },
        {
          id: 'file-006',
          filename: 'web_dev_exam.pdf',
          original_name: 'מבחן תרגול - פיתוח ווב.pdf',
          file_type: 'exam',
          file_size: 890000,
          file_code: 'CS301-E001',
          course_id: 'course-004',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date(Date.now() - 86400000).toISOString(),
          approved_by: 'lecturer-001',
          download_count: 42,
          tags: ['מבחן', 'פיתוח ווב'],
          file_url: 'https://drive.google.com/file/d/1example/view',
          created_at: new Date(Date.now() - 345600000).toISOString(), // 4 ימים אחורה
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'file-007',
          filename: 'database_summary.docx',
          original_name: 'סיכום קורס בסיסי נתונים.docx',
          file_type: 'note',
          file_size: 1456000,
          file_code: 'CS202-N003',
          course_id: 'course-005',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date(Date.now() - 172800000).toISOString(),
          approved_by: 'lecturer-002',
          download_count: 23,
          tags: ['סיכום', 'בסיסי נתונים'],
          file_url: 'https://onedrive.live.com/example-file',
          created_at: new Date(Date.now() - 432000000).toISOString(), // 5 ימים אחורה
          updated_at: new Date(Date.now() - 172800000).toISOString()
        },
        // Rejected files
        {
          id: 'file-008',
          filename: 'wrong_format.txt',
          original_name: 'קובץ לא מתאים.txt',
          file_type: 'other',
          file_size: 15000,
          file_code: 'CS101-O001',
          course_id: 'course-001',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'rejected',
          rejection_reason: 'פורמט קובץ לא מתאים - יש להעלות רק PDF או DOCX',
          download_count: 0,
          tags: ['דחוי'],
          created_at: new Date(Date.now() - 518400000).toISOString(), // 6 ימים אחורה
          updated_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'file-009',
          filename: 'incomplete_assignment.pdf',
          original_name: 'תרגיל חסר.pdf',
          file_type: 'assignment',
          file_size: 123000,
          file_code: 'CS201-A003',
          course_id: 'course-002',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'rejected',
          rejection_reason: 'התרגיל חסר - לא כולל את כל השאלות הנדרשות',
          download_count: 0,
          tags: ['תרגיל', 'דחוי'],
          created_at: new Date(Date.now() - 604800000).toISOString(), // שבוע אחורה
          updated_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: 'file-010',
          filename: 'copyrighted_material.pdf',
          original_name: 'חומר מוגן זכויות יוצרים.pdf',
          file_type: 'note',
          file_size: 3456000,
          file_code: 'MATH101-N002',
          course_id: 'course-003',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'rejected',
          rejection_reason: 'החומר מכיל תוכן מוגן זכויות יוצרים ולא ניתן לפרסמו',
          download_count: 0,
          tags: ['הרצאות', 'דחוי'],
          created_at: new Date(Date.now() - 691200000).toISOString(), // 8 ימים אחורה
          updated_at: new Date(Date.now() - 432000000).toISOString()
        },
        // Additional files for course-003 (Math)
        {
          id: 'file-011',
          filename: 'discrete_math_exercises.pdf',
          original_name: 'תרגילים - מתמטיקה דיסקרטית.pdf',
          file_type: 'assignment',
          file_size: 892000,
          file_code: 'MATH101-A001',
          course_id: 'course-003',
          uploader_id: 'lecturer-002',
          uploader_type: 'lecturer',
          status: 'approved',
          approval_date: new Date(Date.now() - 259200000).toISOString(),
          approved_by: 'lecturer-002',
          download_count: 31,
          tags: ['תרגילים', 'מתמטיקה דיסקרטית'],
          file_url: 'https://example.com/files/discrete_math_exercises.pdf',
          created_at: new Date(Date.now() - 777600000).toISOString(), // 9 ימים אחורה
          updated_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'file-012',
          filename: 'math_midterm.pdf',
          original_name: 'מבחן אמצע - מתמטיקה דיסקרטית.pdf',
          file_type: 'exam',
          file_size: 456000,
          file_code: 'MATH101-E001',
          course_id: 'course-003',
          uploader_id: 'student-003',
          uploader_type: 'student',
          status: 'pending',
          download_count: 0,
          tags: ['מבחן', 'אמצע סמסטר'],
          created_at: new Date(Date.now() - 604800000).toISOString(), // 7 ימים אחורה
          updated_at: new Date(Date.now() - 604800000).toISOString()
        },
        // Additional files for course-004 (Web Development)
        {
          id: 'file-013',
          filename: 'html_css_tutorial.pdf',
          original_name: 'מדריך HTML ו-CSS.pdf',
          file_type: 'note',
          file_size: 1234000,
          file_code: 'CS301-N001',
          course_id: 'course-004',
          uploader_id: 'lecturer-001',
          uploader_type: 'lecturer',
          status: 'approved',
          approval_date: new Date(Date.now() - 172800000).toISOString(),
          approved_by: 'lecturer-001',
          download_count: 67,
          tags: ['HTML', 'CSS', 'מדריך'],
          file_url: 'https://github.com/example/html-css-tutorial',
          created_at: new Date(Date.now() - 864000000).toISOString(), // 10 ימים אחורה
          updated_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'file-014',
          filename: 'javascript_basics.docx',
          original_name: 'יסודות JavaScript.docx',
          file_type: 'note',
          file_size: 678000,
          file_code: 'CS301-N002',
          course_id: 'course-004',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date(Date.now() - 86400000).toISOString(),
          approved_by: 'lecturer-001',
          download_count: 45,
          tags: ['JavaScript', 'יסודות'],
          file_url: 'https://docs.google.com/document/d/example',
          created_at: new Date(Date.now() - 950400000).toISOString(), // 11 ימים אחורה
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'file-015',
          filename: 'react_project.zip',
          original_name: 'פרויקט React - דוגמה.zip',
          file_type: 'project',
          file_size: 2345000,
          file_code: 'CS301-P001',
          course_id: 'course-004',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'rejected',
          rejection_reason: 'קבצי ZIP אינם מותרים. אנא העלה קבצים בפורמט PDF או DOCX',
          download_count: 0,
          tags: ['React', 'פרויקט'],
          created_at: new Date(Date.now() - 1036800000).toISOString(), // 12 ימים אחורה
          updated_at: new Date(Date.now() - 518400000).toISOString()
        },
        // Additional files for course-005 (Databases)
        {
          id: 'file-016',
          filename: 'sql_queries.pdf',
          original_name: 'שאילתות SQL מתקדמות.pdf',
          file_type: 'note',
          file_size: 987000,
          file_code: 'CS202-N004',
          course_id: 'course-005',
          uploader_id: 'lecturer-002',
          uploader_type: 'lecturer',
          status: 'approved',
          approval_date: new Date(Date.now() - 345600000).toISOString(),
          approved_by: 'lecturer-002',
          download_count: 52,
          tags: ['SQL', 'שאילתות', 'מתקדם'],
          file_url: 'https://example.com/files/sql_queries.pdf',
          created_at: new Date(Date.now() - 1123200000).toISOString(), // 13 ימים אחורה
          updated_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: 'file-017',
          filename: 'database_design.pdf',
          original_name: 'עיצוב מסדי נתונים.pdf',
          file_type: 'note',
          file_size: 1543000,
          file_code: 'CS202-N005',
          course_id: 'course-005',
          uploader_id: 'student-003',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date(Date.now() - 432000000).toISOString(),
          approved_by: 'lecturer-002',
          download_count: 38,
          tags: ['עיצוב', 'מסדי נתונים'],
          file_url: 'https://drive.google.com/file/d/database-design/view',
          created_at: new Date(Date.now() - 1209600000).toISOString(), // 14 ימים אחורה
          updated_at: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: 'file-018',
          filename: 'nosql_intro.docx',
          original_name: 'מבוא ל-NoSQL.docx',
          file_type: 'note',
          file_size: 789000,
          file_code: 'CS202-N006',
          course_id: 'course-005',
          uploader_id: 'student-001',
          uploader_type: 'student',
          status: 'pending',
          download_count: 0,
          tags: ['NoSQL', 'מבוא'],
          created_at: new Date(Date.now() - 1296000000).toISOString(), // 15 ימים אחורה
          updated_at: new Date(Date.now() - 1296000000).toISOString()
        },
        // Additional files for course-001 (Computer Science Introduction)
        {
          id: 'file-019',
          filename: 'programming_fundamentals.pdf',
          original_name: 'יסודות התכנות.pdf',
          file_type: 'note',
          file_size: 1876000,
          file_code: 'CS101-N003',
          course_id: 'course-001',
          uploader_id: 'lecturer-001',
          uploader_type: 'lecturer',
          status: 'approved',
          approval_date: new Date(Date.now() - 518400000).toISOString(),
          approved_by: 'lecturer-001',
          download_count: 89,
          tags: ['יסודות', 'התכנות'],
          file_url: 'https://example.com/files/programming_fundamentals.pdf',
          created_at: new Date(Date.now() - 1382400000).toISOString(), // 16 ימים אחורה
          updated_at: new Date(Date.now() - 518400000).toISOString()
        },
        {
          id: 'file-020',
          filename: 'cs_history.pdf',
          original_name: 'תולדות מדעי המחשב.pdf',
          file_type: 'note',
          file_size: 654000,
          file_code: 'CS101-N004',
          course_id: 'course-001',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date(Date.now() - 604800000).toISOString(),
          approved_by: 'lecturer-001',
          download_count: 23,
          tags: ['תולדות', 'היסטוריה'],
          file_url: 'https://en.wikipedia.org/wiki/History_of_computer_science',
          created_at: new Date(Date.now() - 1468800000).toISOString(), // 17 ימים אחורה
          updated_at: new Date(Date.now() - 604800000).toISOString()
        },
        // Additional files for course-002 (Data Structures)
        {
          id: 'file-021',
          filename: 'algorithms_complexity.pdf',
          original_name: 'מורכבות אלגוריתמים.pdf',
          file_type: 'note',
          file_size: 1345000,
          file_code: 'CS201-N006',
          course_id: 'course-002',
          uploader_id: 'lecturer-001',
          uploader_type: 'lecturer',
          status: 'approved',
          approval_date: new Date(Date.now() - 691200000).toISOString(),
          approved_by: 'lecturer-001',
          download_count: 76,
          tags: ['אלגוריתמים', 'מורכבות'],
          file_url: 'https://example.com/files/algorithms_complexity.pdf',
          created_at: new Date(Date.now() - 1555200000).toISOString(), // 18 ימים אחורה
          updated_at: new Date(Date.now() - 691200000).toISOString()
        },
        {
          id: 'file-022',
          filename: 'trees_graphs.docx',
          original_name: 'עצים וגרפים.docx',
          file_type: 'note',
          file_size: 1123000,
          file_code: 'CS201-N007',
          course_id: 'course-002',
          uploader_id: 'student-003',
          uploader_type: 'student',
          status: 'pending',
          download_count: 0,
          tags: ['עצים', 'גרפים'],
          created_at: new Date(Date.now() - 1641600000).toISOString(), // 19 ימים אחורה
          updated_at: new Date(Date.now() - 1641600000).toISOString()
        }
      ];

      // Create demo messages
      const demoMessages: Message[] = [
        {
          id: 'message-001',
          sender_id: 'student-001',
          sender_type: 'student',
          recipient_id: 'lecturer-001',
          subject: 'שאלה לגבי התרגיל',
          content: 'שלום, יש לי שאלה לגבי התרגיל הראשון...',
          message_type: 'inquiry',
          status: 'open',
          priority: 'medium',
          category: 'אקדמי',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Create demo notifications
      const demoNotifications: NotificationEntity[] = [
        {
          id: 'notification-001',
          user_id: 'student-001',
          title: 'קובץ אושר',
          message: 'הקובץ שלך אושר בהצלחה',
          type: 'success',
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Add all demo data to batch
      demoStudents.forEach(student => {
        const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
        batch.set(docRef, student);
      });

      demoLecturers.forEach(lecturer => {
        const docRef = doc(db, COLLECTIONS.LECTURERS, lecturer.id);
        batch.set(docRef, lecturer);
      });

      demoCourses.forEach(course => {
        const docRef = doc(db, COLLECTIONS.COURSES, course.id);
        batch.set(docRef, course);
      });

      demoFiles.forEach(file => {
        const docRef = doc(db, COLLECTIONS.FILES, file.id);
        batch.set(docRef, file);
      });

      demoMessages.forEach(message => {
        const docRef = doc(db, COLLECTIONS.MESSAGES, message.id);
        batch.set(docRef, message);
      });

      demoNotifications.forEach(notification => {
        const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
        batch.set(docRef, notification);
      });

      await batch.commit();
      console.log('✅ Demo data created successfully in Firestore');
      console.log(`📊 Created: ${demoStudents.length} students, ${demoLecturers.length} lecturers, ${demoCourses.length} courses, ${demoFiles.length} files, ${demoMessages.length} messages, ${demoNotifications.length} notifications`);
    } catch (error) {
      console.error('❌ Error creating demo data:', error);
      throw error;
    }
  }



  // Generic CRUD operations
  private static async getCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return [];
    }
  }

  private static async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docSnapshot = await getDoc(doc(db, collectionName, id));
      if (docSnapshot.exists()) {
        return { id: docSnapshot.id, ...docSnapshot.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching document ${id} from ${collectionName}:`, error);
      return null;
    }
  }

  private static async addDocument<T extends { id?: string, created_at?: string, updated_at?: string }>(
    collectionName: string, 
    data: T, 
    customId?: string
  ): Promise<T> {
    try {
      const timestamp = new Date().toISOString();
      const documentData = {
        ...data,
        created_at: data.created_at || timestamp,
        updated_at: timestamp
      };

      if (customId) {
        await setDoc(doc(db, collectionName, customId), documentData);
        return { id: customId, ...documentData } as T;
      } else {
        const docRef = await addDoc(collection(db, collectionName), documentData);
        return { id: docRef.id, ...documentData } as T;
      }
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  private static async updateDocument<T>(
    collectionName: string, 
    id: string, 
    updates: Partial<T>
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
      
      // Return updated document
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      return null;
    }
  }

  private static async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      return false;
    }
  }

  // Students
  static async getStudents(): Promise<Student[]> {
    const students = await this.getCollection<Student>(COLLECTIONS.STUDENTS);
    return students.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }

  static async addStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    // Validate that national_id is provided
    if (!student.national_id || student.national_id.trim() === '') {
      throw new Error('תעודת זהות היא שדה חובה ולא ניתן ליצור סטודנט בלעדיה');
    }

    // Check for duplicates
    const existingStudents = await this.getStudents();
    
    const existingByEmail = existingStudents.find(s => s.email === student.email);
    if (existingByEmail) {
      console.warn(`Student with email ${student.email} already exists`);
      return existingByEmail;
    }

    if (student.student_id) {
      const existingByStudentId = existingStudents.find(s => s.student_id === student.student_id);
      if (existingByStudentId) {
        console.warn(`Student with student_id ${student.student_id} already exists`);
        return existingByStudentId;
      }
    }

    const existingByNationalId = existingStudents.find(s => s.national_id === student.national_id);
    if (existingByNationalId) {
      console.warn(`Student with national_id ${student.national_id} already exists`);
      return existingByNationalId;
    }

    const timestamp = new Date().toISOString();
    const studentData: Student = {
      ...student,
      academic_track_ids: student.academic_track_ids || (student.academic_track ? [student.academic_track] : []),
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: timestamp,
      updated_at: timestamp
    };

    return await this.addDocument(COLLECTIONS.STUDENTS, studentData, studentData.id);
  }

  static async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    return await this.updateDocument<Student>(COLLECTIONS.STUDENTS, id, updates);
  }

  static async deleteStudent(id: string): Promise<boolean> {
    return await this.deleteDocument(COLLECTIONS.STUDENTS, id);
  }

  // Lecturers
  static async getLecturers(): Promise<Lecturer[]> {
    const lecturers = await this.getCollection<Lecturer>(COLLECTIONS.LECTURERS);
    return lecturers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'));
  }

  static async addLecturer(lecturer: Omit<Lecturer, 'id' | 'created_at' | 'updated_at'>): Promise<Lecturer> {
    const timestamp = new Date().toISOString();
    const lecturerData: Lecturer = {
      ...lecturer,
      id: `lecturer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: timestamp,
      updated_at: timestamp
    };

    return await this.addDocument(COLLECTIONS.LECTURERS, lecturerData, lecturerData.id);
  }

  static async updateLecturer(id: string, updates: Partial<Lecturer>): Promise<Lecturer | null> {
    return await this.updateDocument<Lecturer>(COLLECTIONS.LECTURERS, id, updates);
  }

  static async deleteLecturer(id: string): Promise<boolean> {
    return await this.deleteDocument(COLLECTIONS.LECTURERS, id);
  }

  // Courses
  static async getCourses(): Promise<Course[]> {
    return await this.getCollection<Course>(COLLECTIONS.COURSES);
  }

  static async addCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const timestamp = new Date().toISOString();
    const courseData: Course = {
      ...course,
      id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: timestamp,
      updated_at: timestamp
    };

    return await this.addDocument(COLLECTIONS.COURSES, courseData, courseData.id);
  }

  static async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    return await this.updateDocument<Course>(COLLECTIONS.COURSES, id, updates);
  }

  static async deleteCourse(id: string): Promise<boolean> {
    return await this.deleteDocument(COLLECTIONS.COURSES, id);
  }

  // Files
  static async getFiles(): Promise<FileEntity[]> {
    return await this.getCollection<FileEntity>(COLLECTIONS.FILES);
  }

  static async addFile(file: Omit<FileEntity, 'id' | 'created_at' | 'updated_at'>): Promise<FileEntity> {
    const timestamp = new Date().toISOString();
    const fileData: FileEntity = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: timestamp,
      updated_at: timestamp
    };

    return await this.addDocument(COLLECTIONS.FILES, fileData, fileData.id);
  }

  static async updateFile(id: string, updates: Partial<FileEntity>): Promise<FileEntity | null> {
    return await this.updateDocument<FileEntity>(COLLECTIONS.FILES, id, updates);
  }

  static async deleteFile(id: string): Promise<boolean> {
    return await this.deleteDocument(COLLECTIONS.FILES, id);
  }

  // Messages
  static async getMessages(): Promise<Message[]> {
    return await this.getCollection<Message>(COLLECTIONS.MESSAGES);
  }

  static async addMessage(message: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<Message> {
    const timestamp = new Date().toISOString();
    const messageData: Message = {
      ...message,
      id: `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: timestamp,
      updated_at: timestamp
    };

    return await this.addDocument(COLLECTIONS.MESSAGES, messageData, messageData.id);
  }

  static async updateMessage(id: string, updates: Partial<Message>): Promise<Message | null> {
    return await this.updateDocument<Message>(COLLECTIONS.MESSAGES, id, updates);
  }

  static async deleteMessage(id: string): Promise<boolean> {
    return await this.deleteDocument(COLLECTIONS.MESSAGES, id);
  }

  // Notifications
  static async getNotifications(): Promise<NotificationEntity[]> {
    return await this.getCollection<NotificationEntity>(COLLECTIONS.NOTIFICATIONS);
  }

  static async addNotification(notification: Omit<NotificationEntity, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationEntity> {
    const timestamp = new Date().toISOString();
    const notificationData: NotificationEntity = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: timestamp,
      updated_at: timestamp
    };

    return await this.addDocument(COLLECTIONS.NOTIFICATIONS, notificationData, notificationData.id);
  }

  static async updateNotification(id: string, updates: Partial<NotificationEntity>): Promise<NotificationEntity | null> {
    return await this.updateDocument<NotificationEntity>(COLLECTIONS.NOTIFICATIONS, id, updates);
  }

  static async deleteNotification(id: string): Promise<boolean> {
    return await this.deleteDocument(COLLECTIONS.NOTIFICATIONS, id);
  }

  // Get recent data for dashboard
  static async getRecentNotifications(userId?: string, limit: number = 5): Promise<NotificationEntity[]> {
    try {
      const allNotifications = await this.getNotifications();
      
      let filteredNotifications = allNotifications;
      
      // Filter by user if specified
      if (userId) {
        filteredNotifications = allNotifications.filter(n => n.user_id === userId);
              }
        
        // Sort by creation date and take requested amount
        return filteredNotifications
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      return [];
    }
  }

  static async getRecentMessages(userFilter?: { userId?: string, userType?: string }, limit: number = 5): Promise<Message[]> {
    try {
      const allMessages = await this.getMessages();
      
      let filteredMessages = allMessages;
      
      // Filter by user and role
      if (userFilter) {
        if (userFilter.userId) {
          filteredMessages = allMessages.filter(m => 
            m.sender_id === userFilter.userId || m.recipient_id === userFilter.userId
          );
        }
        if (userFilter.userType) {
          filteredMessages = filteredMessages.filter(m => 
            m.sender_type === userFilter.userType
          );
        }
              }
        
        // Sort by creation date and take requested amount
        return filteredMessages
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  static async getRecentFiles(filter?: { status?: string, uploaderId?: string, uploaderType?: string }, limit: number = 5): Promise<FileEntity[]> {
    try {
      const allFiles = await this.getFiles();
      
      let filteredFiles = allFiles;
      
      // Filter by parameters
      if (filter) {
        if (filter.status) {
          filteredFiles = filteredFiles.filter(f => f.status === filter.status);
        }
        if (filter.uploaderId) {
          filteredFiles = filteredFiles.filter(f => f.uploader_id === filter.uploaderId);
        }
        if (filter.uploaderType) {
          filteredFiles = filteredFiles.filter(f => f.uploader_type === filter.uploaderType);
        }
              }
        
        // Sort by creation date and take requested amount
        return filteredFiles
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  }

  // Special dashboard functions by role
  static async getDashboardData(userId: string, userRole: string) {
    try {
      console.log(`📊 Getting dashboard data for ${userRole}: ${userId}`);
      
      // Debug: Let's see all files in the system
      const allFiles = await this.getFiles();
      console.log('🔍 DEBUG DASHBOARD: All files in system:', allFiles);
      console.log('🔍 DEBUG DASHBOARD: Total files count:', allFiles.length);
      
      // Debug: Let's see all courses too
      const allCourses = await this.getCourses();
      console.log('🔍 DEBUG DASHBOARD: All courses in system:', allCourses);
      
      const commonData = {
        totalStudents: (await this.getStudents()).length,
        totalLecturers: (await this.getLecturers()).length,
        totalCourses: (await this.getCourses()).length,
        totalFiles: allFiles.length
      };

      switch (userRole) {
        case 'admin':
          return {
            ...commonData,
            recentNotifications: await this.getRecentNotifications(undefined, 8), // All notifications
            recentMessages: await this.getRecentMessages(undefined, 8), // All inquiries
            recentFiles: await this.getRecentFiles({ status: 'pending' }, 10), // Pending files
            pendingFiles: (await this.getFiles()).filter(f => f.status === 'pending').length,
            approvedFiles: (await this.getFiles()).filter(f => f.status === 'approved').length,
            rejectedFiles: (await this.getFiles()).filter(f => f.status === 'rejected').length
          };

        case 'lecturer':
          return {
            ...commonData,
            recentNotifications: await this.getRecentNotifications(userId, 5),
            recentMessages: await this.getRecentMessages({ userType: 'student' }, 5), // Student inquiries
            recentFiles: await this.getRecentFiles({ status: 'pending' }, 8), // Files for approval
            pendingFiles: (await this.getFiles()).filter(f => f.status === 'pending').length,
            myApprovedFiles: (await this.getFiles()).filter(f => f.status === 'approved' && f.approved_by === userId).length
          };

        case 'student':
          const myFiles = allFiles.filter(f => f.uploader_id === userId);
          console.log('🔍 DEBUG DASHBOARD: Student files for userId', userId, ':', myFiles);
          
          const myRecentFiles = await this.getRecentFiles({ uploaderId: userId }, 5);
          console.log('🔍 DEBUG DASHBOARD: Student recent files:', myRecentFiles);
          
          return {
            ...commonData,
            recentNotifications: await this.getRecentNotifications(userId, 5),
            myRecentMessages: await this.getRecentMessages({ userId }, 5), // My inquiries
            myRecentFiles: myRecentFiles, // My files
            myPendingFiles: myFiles.filter(f => f.status === 'pending').length,
            myApprovedFiles: myFiles.filter(f => f.status === 'approved').length,
            myRejectedFiles: myFiles.filter(f => f.status === 'rejected').length
          };

        default:
          return commonData;
      }
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {};
    }
  }

  // User session management (for UserService)
  static async setUserSession(user: User): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.USER_SESSIONS, 'current'), user);
    } catch (error) {
      console.error('Error saving user session:', error);
      throw error;
    }
  }

  static async getUserSession(): Promise<User | null> {
    try {
      const docSnapshot = await getDoc(doc(db, COLLECTIONS.USER_SESSIONS, 'current'));
      if (docSnapshot.exists()) {
        return docSnapshot.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  static async clearUserSession(): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USER_SESSIONS, 'current'));
    } catch (error) {
      console.error('Error clearing user session:', error);
      throw error;
    }
  }

  // Utility functions
  static async clearAllData(): Promise<void> {
    console.log('🗑️ Clearing all Firestore data...');
    
    try {
      const batch = writeBatch(db);
      
      // Get all collections and delete documents
      const collections = Object.values(COLLECTIONS);
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      await batch.commit();
      console.log('✅ All Firestore data cleared');
    } catch (error) {
      console.error('❌ Error clearing Firestore data:', error);
      throw error;
    }
  }



  // Real-time listeners (optional for future use)
  static subscribeToStudents(callback: (students: Student[]) => void): () => void {
    const unsubscribe = onSnapshot(
      query(collection(db, COLLECTIONS.STUDENTS), orderBy('full_name')),
      (snapshot) => {
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        callback(students);
      },
      (error) => {
        console.error('Error in students subscription:', error);
      }
    );
    
    return unsubscribe;
  }

  static subscribeToFiles(callback: (files: FileEntity[]) => void): () => void {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTIONS.FILES),
      (snapshot) => {
        const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileEntity));
        callback(files);
      },
      (error) => {
        console.error('Error in files subscription:', error);
      }
    );
    
    return unsubscribe;
  }
}

// Expose utility functions to window for debug/admin use (similar to localStorage service)
if (typeof window !== 'undefined') {
  (window as any).FirestoreUtils = {
    clearAllData: () => FirestoreService.clearAllData(),
    createDemoData: () => FirestoreService.createDemoData(),
    cleanInvalidRecords: () => FirestoreService.cleanInvalidRecords(),
    getStudents: () => FirestoreService.getStudents(),
    getFiles: () => FirestoreService.getFiles(),
    getCourses: () => FirestoreService.getCourses(),
    getLecturers: () => FirestoreService.getLecturers(),
    checkFileStatus: async () => {
      const files = await FirestoreService.getFiles();
      const counts = {
        pending: files.filter(f => f.status === 'pending').length,
        approved: files.filter(f => f.status === 'approved').length,
        rejected: files.filter(f => f.status === 'rejected').length,
        total: files.length
      };
      console.log('📊 File Status Report:', counts);
      return counts;
    },
    resetWithDemoData: async () => {
      console.log('🔄 Resetting Firestore with fresh demo data...');
      await FirestoreService.clearAllData();
      await FirestoreService.createDemoData();
      console.log('✅ Firestore reset with demo data complete!');
    }
  };
  
  console.log('%c🔥 FirestoreUtils available in console:', 'color: #FF5722; font-weight: bold; font-size: 14px;');
  console.log('%c✨ Available commands:', 'color: #4CAF50; font-weight: bold;');
  console.log('- FirestoreUtils.createDemoData() - צור נתוני דמו');
  console.log('- FirestoreUtils.cleanInvalidRecords() - נקה רשומות לא תקינות');
  console.log('- FirestoreUtils.resetWithDemoData() - אפס ויצור נתוני דמו חדשים');
  console.log('- FirestoreUtils.checkFileStatus() - בדוק חלוקת סטטוסי הקבצים');
  console.log('- FirestoreUtils.clearAllData() - מוחק את כל הנתונים');
  console.log('- FirestoreUtils.getStudents() - מציג רשימת סטודנטים');
  console.log('- FirestoreUtils.getCourses() - מציג רשימת קורסים');
  console.log('- FirestoreUtils.getFiles() - מציג רשימת קבצים');
  console.log('- FirestoreUtils.getLecturers() - מציג רשימת מרצים');
} 