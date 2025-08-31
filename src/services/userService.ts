import { User, UserRole, UserSession, Student, Lecturer, Admin } from '@/types';

export class UserService {
  private static readonly STORAGE_KEY = 'unified_users';
  private static readonly SESSION_KEY = 'user_session';

  // Initialize with sample data if empty
  static initializeUsers(): void {
    const existingUsers = this.getAllUsers();
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
      
      this.saveUsers(sampleUsers);
      console.log('✅ Initialized unified user system with sample data');
    }
  }

  // Core user management
  static getAllUsers(): User[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  static getUserById(id: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  static getUserByNationalId(nationalId: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.national_id === nationalId) || null;
  }

  static getUserByEmail(email: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.email === email) || null;
  }

  // Role-based queries
  static getUsersByRole(role: UserRole): User[] {
    const users = this.getAllUsers();
    return users.filter(user => user.roles.includes(role));
  }

  static getStudents(): Student[] {
    const users = this.getUsersByRole('student');
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

  static getLecturers(): Lecturer[] {
    const users = this.getUsersByRole('lecturer');
    return users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      national_id: user.national_id,
      employee_id: user.employee_id!,
      academic_track_ids: user.lecturer_academic_track_ids || []
    }));
  }

  static getAdmins(): Admin[] {
    const users = this.getUsersByRole('admin');
    return users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      national_id: user.national_id,
      admin_id: user.admin_id!
    }));
  }

  // User creation and updates
  static createUser(userData: Partial<User>): User {
    const users = this.getAllUsers();
    
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
      newUser.student_id = this.generateStudentId();
    }
    if (newUser.roles.includes('lecturer') && !newUser.employee_id) {
      newUser.employee_id = this.generateEmployeeId();
    }
    if (newUser.roles.includes('admin') && !newUser.admin_id) {
      newUser.admin_id = this.generateAdminId();
    }

    users.push(newUser);
    this.saveUsers(users);
    
    console.log(`✅ Created user: ${newUser.full_name} with roles: ${newUser.roles.join(', ')}`);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) return null;
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveUsers(users);
    return users[userIndex];
  }

  static deleteUser(id: string): boolean {
    const users = this.getAllUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) return false;
    
    this.saveUsers(filteredUsers);
    return true;
  }

  // Role switching
  static switchUserRole(userId: string, newRole: UserRole): boolean {
    console.log(`🔄 UserService: Switching user ${userId} to role ${newRole}`);
    
    const user = this.getUserById(userId);
    if (!user || !user.roles.includes(newRole)) {
      console.log(`❌ UserService: User not found or role not available`);
      return false;
    }
    
    const updated = this.updateUser(userId, { current_role: newRole });
    if (updated) {
      console.log(`✅ UserService: User updated successfully`);
      
      // Update session if this is the current user
      const session = this.getCurrentSession();
      if (session && session.user.id === userId) {
        const newSession = {
          user: updated,
          current_role: newRole,
          available_roles: updated.roles
        };
        this.setCurrentSession(newSession);
        console.log(`✅ UserService: Session updated`, newSession);
      }
    }
    
    return !!updated;
  }

  // Session management
  static getCurrentSession(): UserSession | null {
    const data = localStorage.getItem(this.SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }

  static setCurrentSession(session: UserSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  static clearCurrentSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // ID generators
  private static generateStudentId(): string {
    const students = this.getStudents();
    const existingIds = students.map(s => s.student_id).filter(id => id.startsWith('STU'));
    const numbers = existingIds.map(id => parseInt(id.replace('STU', '')) || 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `STU${nextNumber.toString().padStart(4, '0')}`;
  }

  private static generateEmployeeId(): string {
    const lecturers = this.getLecturers();
    const existingIds = lecturers.map(l => l.employee_id).filter(id => id.startsWith('EMP'));
    const numbers = existingIds.map(id => parseInt(id.replace('EMP', '')) || 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `EMP${nextNumber.toString().padStart(4, '0')}`;
  }

  private static generateAdminId(): string {
    const admins = this.getAdmins();
    const existingIds = admins.map(a => a.admin_id).filter(id => id.startsWith('ADM'));
    const numbers = existingIds.map(id => parseInt(id.replace('ADM', '')) || 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `ADM${nextNumber.toString().padStart(4, '0')}`;
  }

  // Validation
  static isNationalIdUnique(nationalId: string, excludeUserId?: string): boolean {
    const users = this.getAllUsers();
    return !users.some(user => 
      user.national_id === nationalId && user.id !== excludeUserId
    );
  }

  static isEmailUnique(email: string, excludeUserId?: string): boolean {
    const users = this.getAllUsers();
    return !users.some(user => 
      user.email === email && user.id !== excludeUserId
    );
  }

  // Migration helpers (for backward compatibility)
  static migrateFromLegacyData(): void {
    console.log('🔄 Starting migration from legacy data...');
    
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
    adminUsers.forEach((admin: any) => {
      const existingUser = migratedUsers.find(u => u.email === admin.email);
      if (existingUser) {
        // Add admin role to existing user
        if (!existingUser.roles.includes('admin')) {
          existingUser.roles.push('admin');
        }
        existingUser.admin_id = admin.admin_id || this.generateAdminId();
      } else {
        // Create new admin user
        migratedUsers.push({
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          national_id: admin.national_id || this.generateNationalId(),
          roles: ['admin'],
          current_role: 'admin',
          admin_id: admin.admin_id || this.generateAdminId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    
    if (migratedUsers.length > 0) {
      this.saveUsers(migratedUsers);
      console.log(`✅ Migrated ${migratedUsers.length} users to unified system`);
    }
  }

  private static generateNationalId(): string {
    // Generate a random 9-digit Israeli ID number
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }
} 