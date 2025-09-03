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
import { 
  Student, 
  Lecturer, 
  Course, 
  FileEntity, 
  Message, 
  NotificationEntity 
} from '@/services/localStorage';
import { User } from '@/types';

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
  // Initialize data if collections are empty
  static async initializeData(): Promise<void> {
    console.log('🔄 Initializing Firestore data...');
    
    try {
      // Check if students collection is empty or has incomplete data
      const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      const filesSnapshot = await getDocs(collection(db, COLLECTIONS.FILES));
      
      if (studentsSnapshot.empty) {
        console.log('📚 No data found - importing from localStorage or generating...');
        await this.migrateFromLocalStorage();
      } else {
        // ודא שיש מספיק נתונים ושיש קבצים בכל הסטטוסים
        await this.ensureDataCompleteness();
      }
      
      console.log('✅ Firestore data initialization complete');
    } catch (error) {
      console.error('❌ Error initializing Firestore data:', error);
      // Fallback to generating mock data if migration fails
      await this.generateMockData();
    }
  }

  // ודא שיש מספיק נתונים ושהם מחולקים נכון
  private static async ensureDataCompleteness(): Promise<void> {
    console.log('🔍 Checking data completeness...');
    
    const files = await this.getFiles();
    const students = await this.getStudents();
    const courses = await this.getCourses();
    const lecturers = await this.getLecturers();

    // ספירת קבצים לפי סטטוס
    const statusCounts = {
      pending: files.filter(f => f.status === 'pending').length,
      approved: files.filter(f => f.status === 'approved').length,
      rejected: files.filter(f => f.status === 'rejected').length
    };

    console.log(`📊 Current data: ${students.length} students, ${lecturers.length} lecturers, ${courses.length} courses`);
    console.log(`📋 Files by status: ${statusCounts.pending} pending, ${statusCounts.approved} approved, ${statusCounts.rejected} rejected`);

    // אם אין מספיק קבצים או שהחלוקה לא טובה, הוסף עוד
    const totalFiles = files.length;
    const needsMoreFiles = totalFiles < 50 || statusCounts.pending < 10 || statusCounts.approved < 15 || statusCounts.rejected < 5;

    if (needsMoreFiles) {
      console.log('📝 Adding more files to ensure good distribution...');
      await this.addMoreFiles(courses, students, statusCounts);
    }
  }

  // הוסף עוד קבצים אם צריך
  private static async addMoreFiles(courses: any[], students: any[], currentCounts: any): Promise<void> {
    const localStorageModule = await import('@/services/localStorage');
    const MockDataGenerator = (localStorageModule as any).MockDataGenerator;
    
    // יצירת קבצים נוספים
    const additionalFiles = MockDataGenerator.generateFiles(60, courses, students);
    
    // ודא חלוקה טובה של הקבצים החדשים
    this.ensureFileStatusDistribution(additionalFiles);
    
    // הוסף לFirestore
    const batch = writeBatch(db);
    additionalFiles.forEach((file: any) => {
      const docRef = doc(db, COLLECTIONS.FILES, file.id);
      batch.set(docRef, file);
    });
    
    await batch.commit();
    console.log(`✅ Added ${additionalFiles.length} additional files to ensure completeness`);
  }

  // Migration from localStorage
  static async migrateFromLocalStorage(): Promise<void> {
    console.log('🔄 Starting migration from localStorage to Firestore...');
    
    try {
      // Get data from localStorage
      const students = JSON.parse(localStorage.getItem('app_students') || '[]');
      const lecturers = JSON.parse(localStorage.getItem('app_lecturers') || '[]');
      const courses = JSON.parse(localStorage.getItem('app_courses') || '[]');
      const files = JSON.parse(localStorage.getItem('app_files') || '[]');
      const messages = JSON.parse(localStorage.getItem('app_messages') || '[]');
      const notifications = JSON.parse(localStorage.getItem('app_notifications') || '[]');

      // Use batch operations for better performance
      const batch = writeBatch(db);

      // Migrate students
      students.forEach((student: Student) => {
        const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
        batch.set(docRef, student);
      });

      // Migrate lecturers
      lecturers.forEach((lecturer: Lecturer) => {
        const docRef = doc(db, COLLECTIONS.LECTURERS, lecturer.id);
        batch.set(docRef, lecturer);
      });

      // Migrate courses
      courses.forEach((course: Course) => {
        const docRef = doc(db, COLLECTIONS.COURSES, course.id);
        batch.set(docRef, course);
      });

      // Migrate files
      files.forEach((file: FileEntity) => {
        const docRef = doc(db, COLLECTIONS.FILES, file.id);
        batch.set(docRef, file);
      });

      // Migrate messages
      messages.forEach((message: Message) => {
        const docRef = doc(db, COLLECTIONS.MESSAGES, message.id);
        batch.set(docRef, message);
      });

      // Migrate notifications
      notifications.forEach((notification: NotificationEntity) => {
        const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
        batch.set(docRef, notification);
      });

      // Commit the batch
      await batch.commit();
      
      console.log(`✅ Migration completed successfully! Migrated ${students.length} students, ${lecturers.length} lecturers, ${courses.length} courses, ${files.length} files, ${messages.length} messages, ${notifications.length} notifications`);
    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  }

  // Generate mock data if no localStorage data exists
  static async generateMockData(): Promise<void> {
    console.log('🔄 Generating mock data for Firestore...');
    
    // Import mock data generator from localStorage service
    const localStorageModule = await import('@/services/localStorage');
    const MockDataGenerator = (localStorageModule as any).MockDataGenerator;
    
    const students = MockDataGenerator.generateStudents(15);
    const lecturers = MockDataGenerator.generateLecturers(12);
    const courses = MockDataGenerator.generateCourses(20, lecturers);
    const files = MockDataGenerator.generateFiles(150, courses, students); // יותר קבצים
    const messages = MockDataGenerator.generateMessages(30);
    const notifications = MockDataGenerator.generateNotifications(25);

    // ודא שיש קבצים בכל הסטטוסים
    this.ensureFileStatusDistribution(files);

    // Use batch operations
    const batch = writeBatch(db);

    students.forEach((student: Student) => {
      const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
      batch.set(docRef, student);
    });

    lecturers.forEach((lecturer: Lecturer) => {
      const docRef = doc(db, COLLECTIONS.LECTURERS, lecturer.id);
      batch.set(docRef, lecturer);
    });

    courses.forEach((course: Course) => {
      const docRef = doc(db, COLLECTIONS.COURSES, course.id);
      batch.set(docRef, course);
    });

    files.forEach((file: FileEntity) => {
      const docRef = doc(db, COLLECTIONS.FILES, file.id);
      batch.set(docRef, file);
    });

    messages.forEach((message: Message) => {
      const docRef = doc(db, COLLECTIONS.MESSAGES, message.id);
      batch.set(docRef, message);
    });

    notifications.forEach((notification: NotificationEntity) => {
      const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
      batch.set(docRef, notification);
    });

    await batch.commit();
    console.log('✅ Mock data generated successfully in Firestore');
    console.log(`📊 Generated: ${students.length} students, ${lecturers.length} lecturers, ${courses.length} courses, ${files.length} files (with varied statuses), ${messages.length} messages, ${notifications.length} notifications`);
  }

  // ודא חלוקה טובה של סטטוסי קבצים
  private static ensureFileStatusDistribution(files: any[]): void {
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    
    files.forEach((file, index) => {
      // חלוקה של סטטוסים: 40% pending, 45% approved, 15% rejected
      if (index % 20 < 8) {
        file.status = 'pending';
        statusCounts.pending++;
      } else if (index % 20 < 17) {
        file.status = 'approved';
        file.approval_date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
        file.approved_by = `lecturer-${String(Math.floor(Math.random() * 12) + 1).padStart(3, '0')}`;
        statusCounts.approved++;
      } else {
        file.status = 'rejected';
        file.rejection_reason = this.getRandomRejectionReason();
        file.approval_date = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString();
        file.approved_by = `lecturer-${String(Math.floor(Math.random() * 12) + 1).padStart(3, '0')}`;
        statusCounts.rejected++;
      }
    });
    
    console.log(`📋 File status distribution: ${statusCounts.pending} pending, ${statusCounts.approved} approved, ${statusCounts.rejected} rejected`);
  }

  private static getRandomRejectionReason(): string {
    const reasons = [
      'הקובץ אינו רלוונטי לקורס',
      'איכות הקובץ אינה מספקת',
      'הקובץ כבר קיים במערכת',
      'תוכן הקובץ אינו מתאים',
      'הקובץ פגום או לא ניתן לקריאה',
      'זכויות יוצרים - הקובץ מוגן',
      'הקובץ לא עומד בדרישות הקורס',
      'מידע שגוי או לא מעודכן'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
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

  // קבלת נתונים אחרונים לדשבורד
  static async getRecentNotifications(userId?: string, limit: number = 5): Promise<NotificationEntity[]> {
    try {
      const allNotifications = await this.getNotifications();
      
      let filteredNotifications = allNotifications;
      
      // סינון לפי משתמש אם צוין
      if (userId) {
        filteredNotifications = allNotifications.filter(n => n.user_id === userId);
      }
      
      // מיון לפי תאריך יצירה ולקיחת הכמות המבוקשת
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
      
      // סינון לפי משתמש ותפקיד
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
      
      // מיון לפי תאריך יצירה ולקיחת הכמות המבוקשת
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
      
      // סינון לפי פרמטרים
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
      
      // מיון לפי תאריך יצירה ולקיחת הכמות המבוקשת
      return filteredFiles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  }

  // פונקציות מיוחדות לדשבורד לפי תפקיד
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
            recentNotifications: await this.getRecentNotifications(undefined, 8), // כל ההתראות
            recentMessages: await this.getRecentMessages(undefined, 8), // כל הפניות
            recentFiles: await this.getRecentFiles({ status: 'pending' }, 10), // קבצים ממתינים
            pendingFiles: (await this.getFiles()).filter(f => f.status === 'pending').length,
            approvedFiles: (await this.getFiles()).filter(f => f.status === 'approved').length,
            rejectedFiles: (await this.getFiles()).filter(f => f.status === 'rejected').length
          };

        case 'lecturer':
          return {
            ...commonData,
            recentNotifications: await this.getRecentNotifications(userId, 5),
            recentMessages: await this.getRecentMessages({ userType: 'student' }, 5), // פניות מסטודנטים
            recentFiles: await this.getRecentFiles({ status: 'pending' }, 8), // קבצים לאישור
            pendingFiles: (await this.getFiles()).filter(f => f.status === 'pending').length,
            myApprovedFiles: (await this.getFiles()).filter(f => f.status === 'approved' && f.approved_by === userId).length
          };

        case 'student':
          return {
            ...commonData,
            recentNotifications: await this.getRecentNotifications(userId, 5),
            myRecentMessages: await this.getRecentMessages({ userId }, 5), // הפניות שלי
            myRecentFiles: await this.getRecentFiles({ uploaderId: userId }, 5), // הקבצים שלי
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

  static async resetAllData(): Promise<void> {
    console.log('🔄 Resetting all Firestore data...');
    await this.clearAllData();
    await this.generateMockData();
    console.log('✅ All Firestore data has been reset and reinitialized');
  }

  static async refreshAllData(): Promise<void> {
    console.log('🔄 Refreshing all Firestore data with new mock data...');
    await this.clearAllData();
    await this.generateMockData();
    console.log('✅ All Firestore data refreshed successfully!');
  }

  // פונקציה מיוחדת לוודא שיש קבצים בכל הסטטוסים (לקריאה מהקונסול)
  static async ensureFileVariety(): Promise<void> {
    console.log('🎯 Ensuring file status variety...');
    
    const files = await this.getFiles();
    const statusCounts = {
      pending: files.filter(f => f.status === 'pending').length,
      approved: files.filter(f => f.status === 'approved').length,
      rejected: files.filter(f => f.status === 'rejected').length
    };

    console.log(`📋 Current distribution: ${statusCounts.pending} pending, ${statusCounts.approved} approved, ${statusCounts.rejected} rejected`);

    // אם החלוקה לא טובה, הוסף קבצים
    if (statusCounts.pending < 10 || statusCounts.approved < 15 || statusCounts.rejected < 5) {
      const courses = await this.getCourses();
      const students = await this.getStudents();
      await this.addMoreFiles(courses, students, statusCounts);
      
      // הדפס את החלוקה החדשה
      const newFiles = await this.getFiles();
      const newCounts = {
        pending: newFiles.filter(f => f.status === 'pending').length,
        approved: newFiles.filter(f => f.status === 'approved').length,
        rejected: newFiles.filter(f => f.status === 'rejected').length
      };
      console.log(`📋 New distribution: ${newCounts.pending} pending, ${newCounts.approved} approved, ${newCounts.rejected} rejected`);
    } else {
      console.log('✅ File distribution is already good!');
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
    resetAllData: () => FirestoreService.resetAllData(),
    clearAllData: () => FirestoreService.clearAllData(),
    refreshAllData: () => FirestoreService.refreshAllData(),
    getStudents: () => FirestoreService.getStudents(),
    getFiles: () => FirestoreService.getFiles(),
    getCourses: () => FirestoreService.getCourses(),
    getLecturers: () => FirestoreService.getLecturers(),
    migrateFromLocalStorage: () => FirestoreService.migrateFromLocalStorage(),
    ensureFileVariety: () => FirestoreService.ensureFileVariety(),
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
    generateMoreContent: async () => {
      console.log('🎯 Generating more varied content for all entity types...');
      
      const localStorageModule = await import('@/services/localStorage');
      const MockDataGenerator = (localStorageModule as any).MockDataGenerator;
      
      // צור עוד נתונים מגוונים
      const additionalStudents = MockDataGenerator.generateStudents(10);
      const additionalLecturers = MockDataGenerator.generateLecturers(5);
      const additionalCourses = MockDataGenerator.generateCourses(15, additionalLecturers);
      const additionalFiles = MockDataGenerator.generateFiles(80, additionalCourses, additionalStudents);
      const additionalMessages = MockDataGenerator.generateMessages(40);
      const additionalNotifications = MockDataGenerator.generateNotifications(35);
      
             // ודא חלוקה טובה של הקבצים - חלוקה פנימית
       additionalFiles.forEach((file: any, index: number) => {
         if (index % 20 < 8) {
           file.status = 'pending';
         } else if (index % 20 < 17) {
           file.status = 'approved';
           file.approval_date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
         } else {
           file.status = 'rejected';
           file.rejection_reason = 'הקובץ אינו מתאים לדרישות';
         }
       });
       
       // הוסף הכל לFirestore
       const batch = writeBatch(db);
       
       [...additionalStudents, ...additionalLecturers, ...additionalCourses, 
        ...additionalFiles, ...additionalMessages, ...additionalNotifications].forEach((item: any, index) => {
         const collection = item.id.startsWith('student') ? COLLECTIONS.STUDENTS :
                           item.id.startsWith('lecturer') ? COLLECTIONS.LECTURERS :
                           item.id.startsWith('course') ? COLLECTIONS.COURSES :
                           item.id.startsWith('file') ? COLLECTIONS.FILES :
                           item.id.startsWith('message') ? COLLECTIONS.MESSAGES :
                           COLLECTIONS.NOTIFICATIONS;
         
         const docRef = doc(db, collection, item.id);
         batch.set(docRef, item);
       });
       
       await batch.commit();
       console.log('✅ Generated additional varied content successfully!');
       
       // הצג סטטיסטיקות
       const files = await FirestoreService.getFiles();
       const counts = {
         pending: files.filter(f => f.status === 'pending').length,
         approved: files.filter(f => f.status === 'approved').length,
         rejected: files.filter(f => f.status === 'rejected').length,
         total: files.length
       };
       console.log('📊 Updated File Status Report:', counts);
    }
  };
  
  console.log('%c🔥 FirestoreUtils available in console:', 'color: #FF5722; font-weight: bold; font-size: 14px;');
  console.log('%c✨ New commands for dashboard and file management:', 'color: #4CAF50; font-weight: bold;');
  console.log('- FirestoreUtils.refreshAllData() - רענון נתונים עם נתונים מלאים חדשים!');
  console.log('- FirestoreUtils.ensureFileVariety() - ודא שיש קבצים בכל הסטטוסים');
  console.log('- FirestoreUtils.checkFileStatus() - בדוק חלוקת סטטוסי הקבצים');
  console.log('- FirestoreUtils.generateMoreContent() - צור עוד תוכן מגוון לכל הישויות');
  console.log('- FirestoreUtils.resetAllData() - מאפס את כל הנתונים');
  console.log('- FirestoreUtils.clearAllData() - מוחק את כל הנתונים');
  console.log('- FirestoreUtils.getStudents() - מציג רשימת סטודנטים');
  console.log('- FirestoreUtils.getCourses() - מציג רשימת קורסים');
  console.log('- FirestoreUtils.migrateFromLocalStorage() - מיגרציה מ-localStorage');
} 