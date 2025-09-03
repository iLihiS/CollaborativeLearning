import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, UserRole, UserSession, Student, Lecturer, Admin } from '@/types';

export class FirestoreUserService {
  private static readonly USERS_COLLECTION = 'users';
  private static readonly SESSION_COLLECTION = 'user_sessions';

  // Initialize with sample data if empty
  static async initializeUsers(): Promise<void> {
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length === 0) {
      const sampleUsers: User[] = [
        {
          id: 'user-001',
          full_name: 'ד"ר רונה סופר יוזר',
          email: 'all.roles@ono.ac.il',
          national_id: '123456789',
          roles: ['student', 'lecturer', 'admin'],
          current_role: 'admin',
          student_id: 'STU0001',
          academic_track_ids: ['cs-undergrad'],
          year: 3,
          status: 'active',
          employee_id: 'EMP0001',
          lecturer_academic_track_ids: ['cs-undergrad', 'cs-graduate'],
          admin_id: 'ADM0001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'user-002',
          full_name: 'יוסי כהן',
          email: 'yossi.cohen@student.ono.ac.il',
          national_id: '987654321',
          roles: ['student'],
          current_role: 'student',
          student_id: 'STU0002',
          academic_track_ids: ['cs-undergrad'],
          year: 2,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'user-003',
          full_name: 'ד"ר מיכל לוי',
          email: 'michal.levi@ono.ac.il',
          national_id: '555666777',
          roles: ['lecturer', 'admin'],
          current_role: 'lecturer',
          employee_id: 'EMP0002',
          lecturer_academic_track_ids: ['math-undergrad'],
          admin_id: 'ADM0002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      await this.saveUsers(sampleUsers);
      console.log('✅ Initialized unified Firestore user system with sample data');
    }
  }

  // Core user management
  static async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.USERS_COLLECTION));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  static async saveUsers(users: User[]): Promise<void> {
    try {
      // Save users individually
      for (const user of users) {
        await setDoc(doc(db, this.USERS_COLLECTION, user.id), user);
      }
      console.log(`✅ Saved ${users.length} users to Firestore`);
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const docSnapshot = await getDoc(doc(db, this.USERS_COLLECTION, id));
      if (docSnapshot.exists()) {
        return { id: docSnapshot.id, ...docSnapshot.data() } as User;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  }

  static async getUserByNationalId(nationalId: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('national_id', '==', nationalId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user by national_id ${nationalId}:`, error);
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error);
      return null;
    }
  }

  // Role-based queries
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('roles', 'array-contains', role)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error(`Error fetching users by role ${role}:`, error);
      return [];
    }
  }

  static async getStudents(): Promise<Student[]> {
    const users = await this.getUsersByRole('student');
    return users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      national_id: user.national_id,
      student_id: user.student_id!,
      academic_track_ids: user.academic_track_ids || [],
      year: user.year || 1,
      status: user.status || 'active'
    }));
  }

  static async getLecturers(): Promise<Lecturer[]> {
    const users = await this.getUsersByRole('lecturer');
    return users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      national_id: user.national_id,
      employee_id: user.employee_id!,
      academic_track_ids: user.lecturer_academic_track_ids || []
    }));
  }

  static async getAdmins(): Promise<Admin[]> {
    const users = await this.getUsersByRole('admin');
    return users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      national_id: user.national_id,
      admin_id: user.admin_id!
    }));
  }

  // User creation and updates
  static async createUser(userData: Partial<User>): Promise<User> {
    // Generate unique ID
    const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-generate role-specific IDs
    const newUser: User = {
      id: newId,
      full_name: userData.full_name || '',
      email: userData.email || '',
      national_id: userData.national_id || '',
      roles: userData.roles || [],
      current_role: userData.current_role || userData.roles?.[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData
    };

    // Auto-generate IDs for each role
    if (newUser.roles.includes('student') && !newUser.student_id) {
      newUser.student_id = await this.generateStudentId();
    }
    if (newUser.roles.includes('lecturer') && !newUser.employee_id) {
      newUser.employee_id = await this.generateEmployeeId();
    }
    if (newUser.roles.includes('admin') && !newUser.admin_id) {
      newUser.admin_id = await this.generateAdminId();
    }

    try {
      await setDoc(doc(db, this.USERS_COLLECTION, newUser.id), newUser);
      console.log(`✅ Created user: ${newUser.full_name} with roles: ${newUser.roles.join(', ')}`);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, id);
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(userRef, updateData);
      
      // Return updated user
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return null;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.USERS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }

  // Role switching
  static async switchUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    console.log(`🔄 FirestoreUserService: Switching user ${userId} to role ${newRole}`);
    
    const user = await this.getUserById(userId);
    if (!user || !user.roles.includes(newRole)) {
      console.log(`❌ FirestoreUserService: User not found or role not available`);
      return false;
    }
    
    const updated = await this.updateUser(userId, { current_role: newRole });
    if (updated) {
      console.log(`✅ FirestoreUserService: User updated successfully`);
      
      // Update session if this is the current user
      const session = await this.getCurrentSession();
      if (session && session.user.id === userId) {
        const newSession = {
          user: updated,
          current_role: newRole,
          available_roles: updated.roles
        };
        await this.setCurrentSession(newSession);
        console.log(`✅ FirestoreUserService: Session updated`, newSession);
      }
    }
    
    return !!updated;
  }

  // Session management
  static async getCurrentSession(): Promise<UserSession | null> {
    try {
      const docSnapshot = await getDoc(doc(db, this.SESSION_COLLECTION, 'current'));
      if (docSnapshot.exists()) {
        return docSnapshot.data() as UserSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  static async setCurrentSession(session: UserSession): Promise<void> {
    try {
      await setDoc(doc(db, this.SESSION_COLLECTION, 'current'), session);
    } catch (error) {
      console.error('Error setting current session:', error);
      throw error;
    }
  }

  static async clearCurrentSession(): Promise<void> {
    try {
      await deleteDoc(doc(db, this.SESSION_COLLECTION, 'current'));
    } catch (error) {
      console.error('Error clearing current session:', error);
      throw error;
    }
  }

  // ID generators
  private static async generateStudentId(): Promise<string> {
    const students = await this.getStudents();
    const existingIds = students.map(s => s.student_id).filter(id => id.startsWith('STU'));
    const numbers = existingIds.map(id => parseInt(id.replace('STU', '')) || 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `STU${nextNumber.toString().padStart(4, '0')}`;
  }

  private static async generateEmployeeId(): Promise<string> {
    const lecturers = await this.getLecturers();
    const existingIds = lecturers.map(l => l.employee_id).filter(id => id.startsWith('EMP'));
    const numbers = existingIds.map(id => parseInt(id.replace('EMP', '')) || 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `EMP${nextNumber.toString().padStart(4, '0')}`;
  }

  private static async generateAdminId(): Promise<string> {
    const admins = await this.getAdmins();
    const existingIds = admins.map(a => a.admin_id).filter(id => id.startsWith('ADM'));
    const numbers = existingIds.map(id => parseInt(id.replace('ADM', '')) || 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `ADM${nextNumber.toString().padStart(4, '0')}`;
  }

  // Validation
  static async isNationalIdUnique(nationalId: string, excludeUserId?: string): Promise<boolean> {
    const users = await this.getAllUsers();
    return !users.some(user => 
      user.national_id === nationalId && user.id !== excludeUserId
    );
  }

  static async isEmailUnique(email: string, excludeUserId?: string): Promise<boolean> {
    const users = await this.getAllUsers();
    return !users.some(user => 
      user.email === email && user.id !== excludeUserId
    );
  }

  // Migration helpers (for backward compatibility)
  static async migrateFromLocalStorage(): Promise<void> {
    console.log('🔄 Starting Firestore user migration from localStorage...');
    
    try {
      const legacyStudents = JSON.parse(localStorage.getItem('mock_students') || '[]');
      const legacyLecturers = JSON.parse(localStorage.getItem('mock_lecturers') || '[]');
      const legacyUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      
      const migratedUsers: User[] = [];
      
      // Migrate students
      legacyStudents.forEach((student: any) => {
        migratedUsers.push({
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          national_id: student.national_id || this.generateNationalId(),
          roles: ['student'],
          current_role: 'student',
          student_id: student.student_id,
          academic_track_ids: student.academic_track_ids || [],
          year: student.year || 1,
          status: student.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
      
      // Migrate lecturers
      legacyLecturers.forEach((lecturer: any) => {
        const existingUser = migratedUsers.find(u => u.national_id === lecturer.national_id);
        if (existingUser) {
          // Add lecturer role to existing user
          existingUser.roles.push('lecturer');
          existingUser.employee_id = lecturer.employee_id;
          existingUser.lecturer_academic_track_ids = lecturer.academic_track_ids || [];
        } else {
          // Create new user
          migratedUsers.push({
            id: lecturer.id,
            full_name: lecturer.full_name,
            email: lecturer.email,
            national_id: lecturer.national_id || this.generateNationalId(),
            roles: ['lecturer'],
            current_role: 'lecturer',
            employee_id: lecturer.employee_id,
            lecturer_academic_track_ids: lecturer.academic_track_ids || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      
      // Migrate admin users
      const adminUsers = legacyUsers.filter((user: any) => user.roles?.includes('admin'));
      for (const admin of adminUsers) {
        const existingUser = migratedUsers.find(u => u.email === admin.email);
        if (existingUser) {
          // Add admin role to existing user
          if (!existingUser.roles.includes('admin')) {
            existingUser.roles.push('admin');
          }
          existingUser.admin_id = admin.admin_id || `ADM${Date.now()}`;
        } else {
          // Create new admin user
          migratedUsers.push({
            id: admin.id,
            full_name: admin.full_name,
            email: admin.email,
            national_id: admin.national_id || this.generateNationalId(),
            roles: ['admin'],
            current_role: 'admin',
            admin_id: admin.admin_id || `ADM${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      
      if (migratedUsers.length > 0) {
        await this.saveUsers(migratedUsers);
        console.log(`✅ Migrated ${migratedUsers.length} users to Firestore unified system`);
      }
    } catch (error) {
      console.error('❌ Error during user migration:', error);
      throw error;
    }
  }

  private static generateNationalId(): string {
    // Generate a random 9-digit Israeli ID number
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }
} 