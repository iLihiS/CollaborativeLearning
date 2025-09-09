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

  // Create demo data for development/testing
  static async createDemoData(): Promise<void> {
    console.log('🔄 Creating demo data for Firestore...');
    
    try {
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
          max_students: 30,
          enrolled_students: 15,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Create demo files
      const demoFiles: FileEntity[] = [
        {
          id: 'file-001',
          filename: 'lecture1.pdf',
          original_name: 'הרצאה 1 - מבוא.pdf',
          file_type: 'pdf',
          file_size: 1024000,
          file_code: 'CS101-L001',
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
          filename: 'assignment1.pdf',
          original_name: 'תרגיל 1.pdf',
          file_type: 'pdf',
          file_size: 512000,
          file_code: 'CS101-A001',
          course_id: 'course-001',
          uploader_id: 'student-002',
          uploader_type: 'student',
          status: 'approved',
          approval_date: new Date().toISOString(),
          approved_by: 'lecturer-001',
          download_count: 5,
          tags: ['תרגיל'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
      
      const commonData = {
        totalStudents: (await this.getStudents()).length,
        totalLecturers: (await this.getLecturers()).length,
        totalCourses: (await this.getCourses()).length,
        totalFiles: (await this.getFiles()).length
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
          return {
            ...commonData,
            recentNotifications: await this.getRecentNotifications(userId, 5),
            myRecentMessages: await this.getRecentMessages({ userId }, 5), // My inquiries
            myRecentFiles: await this.getRecentFiles({ uploaderId: userId }, 5), // My files
            myPendingFiles: (await this.getFiles()).filter(f => f.uploader_id === userId && f.status === 'pending').length,
            myApprovedFiles: (await this.getFiles()).filter(f => f.uploader_id === userId && f.status === 'approved').length,
            myRejectedFiles: (await this.getFiles()).filter(f => f.uploader_id === userId && f.status === 'rejected').length
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
  console.log('- FirestoreUtils.resetWithDemoData() - אפס ויצור נתוני דמו חדשים');
  console.log('- FirestoreUtils.checkFileStatus() - בדוק חלוקת סטטוסי הקבצים');
  console.log('- FirestoreUtils.clearAllData() - מוחק את כל הנתונים');
  console.log('- FirestoreUtils.getStudents() - מציג רשימת סטודנטים');
  console.log('- FirestoreUtils.getCourses() - מציג רשימת קורסים');
  console.log('- FirestoreUtils.getFiles() - מציג רשימת קבצים');
  console.log('- FirestoreUtils.getLecturers() - מציג רשימת מרצים');
} 