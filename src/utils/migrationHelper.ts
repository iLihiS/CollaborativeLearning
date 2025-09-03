import { FirestoreService } from '@/services/firestoreService';
import { FirestoreUserService } from '@/services/firestoreUserService';

// Also import the migration helper
import '@/utils/migrationHelper';

export class MigrationHelper {
  
  /**
   * Complete migration from localStorage to Firestore
   */
  static async migrateAll(): Promise<void> {
    console.log('🚀 Starting complete migration from localStorage to Firestore...');
    
    try {
      // Step 1: Initialize Firestore services
      console.log('📋 Step 1: Initializing Firestore services...');
      await FirestoreService.initializeData();
      await FirestoreUserService.initializeUsers();
      
      // Step 2: Migrate main data
      console.log('📋 Step 2: Migrating main application data...');
      await FirestoreService.migrateFromLocalStorage();
      
      // Step 3: Migrate user data
      console.log('📋 Step 3: Migrating user data...');
      await FirestoreUserService.migrateFromLocalStorage();
      
      console.log('✅ Migration completed successfully!');
      console.log('🔍 You can now verify your data using FirestoreUtils in the console');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if localStorage has data to migrate
   */
  static hasLocalStorageData(): boolean {
    const keys = [
      'app_students',
      'app_lecturers', 
      'app_courses',
      'app_files',
      'app_messages',
      'app_notifications',
      'unified_users',
      'user_session'
    ];
    
    return keys.some(key => {
      const data = localStorage.getItem(key);
      return data && data !== '[]' && data !== 'null';
    });
  }
  
  /**
   * Backup localStorage data before migration
   */
  static backupLocalStorageData(): Record<string, string> {
    console.log('💾 Creating localStorage backup...');
    
    const backup: Record<string, string> = {};
    const keys = [
      'app_students',
      'app_lecturers', 
      'app_courses',
      'app_files',
      'app_messages',
      'app_notifications',
      'unified_users',
      'user_session'
    ];
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        backup[key] = data;
      }
    });
    
    console.log(`✅ Backed up ${Object.keys(backup).length} localStorage keys`);
    return backup;
  }
  
  /**
   * Restore localStorage data from backup
   */
  static restoreLocalStorageData(backup: Record<string, string>): void {
    console.log('🔄 Restoring localStorage from backup...');
    
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log(`✅ Restored ${Object.keys(backup).length} localStorage keys`);
  }
  
  /**
   * Verify migration by comparing data counts
   */
  static async verifyMigration(): Promise<void> {
    console.log('🔍 Verifying migration...');
    
    try {
      // Check Firestore data
      const students = await FirestoreService.getStudents();
      const lecturers = await FirestoreService.getLecturers();
      const courses = await FirestoreService.getCourses();
      const files = await FirestoreService.getFiles();
      const users = await FirestoreUserService.getAllUsers();
      
      console.log('📊 Firestore Data Summary:');
      console.log(`- Students: ${students.length}`);
      console.log(`- Lecturers: ${lecturers.length}`);
      console.log(`- Courses: ${courses.length}`);
      console.log(`- Files: ${files.length}`);
      console.log(`- Users: ${users.length}`);
      
      // Check localStorage data for comparison
      const localStudents = JSON.parse(localStorage.getItem('app_students') || '[]');
      const localLecturers = JSON.parse(localStorage.getItem('app_lecturers') || '[]');
      const localCourses = JSON.parse(localStorage.getItem('app_courses') || '[]');
      const localFiles = JSON.parse(localStorage.getItem('app_files') || '[]');
      
      console.log('📊 LocalStorage Data Summary:');
      console.log(`- Students: ${localStudents.length}`);
      console.log(`- Lecturers: ${localLecturers.length}`);
      console.log(`- Courses: ${localCourses.length}`);
      console.log(`- Files: ${localFiles.length}`);
      
      // Check if data matches
      const matches = 
        students.length >= localStudents.length &&
        lecturers.length >= localLecturers.length &&
        courses.length >= localCourses.length &&
        files.length >= localFiles.length;
      
      if (matches) {
        console.log('✅ Migration verification successful - data counts match or exceed localStorage');
      } else {
        console.warn('⚠️ Migration verification warning - some data counts are lower than localStorage');
      }
      
    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Clean up localStorage after successful migration
   */
  static cleanupLocalStorage(): void {
    console.log('🧹 Cleaning up localStorage after migration...');
    
    const keysToRemove = [
      'app_students',
      'app_lecturers', 
      'app_courses',
      'app_files',
      'app_messages',
      'app_notifications'
      // Keep user session keys for now
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`✅ Cleaned up ${keysToRemove.length} localStorage keys`);
    console.log('💡 User session keys were preserved for compatibility');
  }
  
  /**
   * Complete migration workflow with safety checks
   */
  static async safeMigration(): Promise<void> {
    console.log('🛡️ Starting safe migration workflow...');
    
    // Step 1: Check if there's data to migrate
    if (!this.hasLocalStorageData()) {
      console.log('ℹ️ No localStorage data found to migrate');
      await FirestoreService.initializeData();
      await FirestoreUserService.initializeUsers();
      return;
    }
    
    // Step 2: Create backup
    const backup = this.backupLocalStorageData();
    
    try {
      // Step 3: Perform migration
      await this.migrateAll();
      
      // Step 4: Verify migration
      await this.verifyMigration();
      
      // Step 5: Optional cleanup (commented out for safety)
      // this.cleanupLocalStorage();
      
      console.log('🎉 Safe migration completed successfully!');
      console.log('💡 localStorage data was preserved for safety. You can clean it up manually later.');
      
    } catch (error) {
      console.error('❌ Migration failed, restoring backup...');
      this.restoreLocalStorageData(backup);
      throw error;
    }
  }
}

// Expose to window for easy access
if (typeof window !== 'undefined') {
  (window as any).MigrationHelper = MigrationHelper;
  
  console.log('%c🔄 MigrationHelper available in console:', 'color: #2196F3; font-weight: bold; font-size: 14px;');
  console.log('- MigrationHelper.safeMigration() - Complete safe migration');
  console.log('- MigrationHelper.migrateAll() - Migrate all data');
  console.log('- MigrationHelper.verifyMigration() - Verify migration results');
  console.log('- MigrationHelper.hasLocalStorageData() - Check for existing data');
} 