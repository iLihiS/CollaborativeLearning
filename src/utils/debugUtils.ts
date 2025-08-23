import { LocalStorageService } from '@/services/localStorage';

// Debug utilities for localStorage
export const debugLocalStorage = {
  // Print all data to console
  logAll: () => {
    console.group('🔍 LocalStorage Debug Data');
    
    console.log('👥 Students:', LocalStorageService.getStudents().length, 'items');
    console.log('🎓 Lecturers:', LocalStorageService.getLecturers().length, 'items');
    console.log('📚 Courses:', LocalStorageService.getCourses().length, 'items');
    console.log('📁 Files:', LocalStorageService.getFiles().length, 'items');
    console.log('💬 Messages:', LocalStorageService.getMessages().length, 'items');
    console.log('🔔 Notifications:', LocalStorageService.getNotifications().length, 'items');
    console.log('👤 User Session:', LocalStorageService.getUserSession());
    
    console.groupEnd();
  },
  
  // Add a test student and verify it's saved
  testAddStudent: () => {
    const testStudent = {
      full_name: 'סטודנט בדיקה',
      email: 'test@ono.ac.il',
      student_id: '2024TEST',
      academic_track: 'cs-undergrad',
      academic_track_ids: ['cs-undergrad'],
      year: 1,
      status: 'active' as const
    };
    
    const before = LocalStorageService.getStudents().length;
    const newStudent = LocalStorageService.addStudent(testStudent);
    const after = LocalStorageService.getStudents().length;
    
    console.log('✅ Test Add Student:');
    console.log('Before:', before, 'After:', after);
    console.log('New student:', newStudent);
    
    return newStudent;
  },
  
  // Update a student and verify
  testUpdateStudent: (studentId: string) => {
    const updates = { full_name: 'שם מעודכן' };
    const updated = LocalStorageService.updateStudent(studentId, updates);
    
    console.log('✅ Test Update Student:');
    console.log('Updated:', updated);
    
    return updated;
  },
  
  // Delete a student and verify
  testDeleteStudent: (studentId: string) => {
    const before = LocalStorageService.getStudents().length;
    const deleted = LocalStorageService.deleteStudent(studentId);
    const after = LocalStorageService.getStudents().length;
    
    console.log('✅ Test Delete Student:');
    console.log('Before:', before, 'After:', after, 'Success:', deleted);
    
    return deleted;
  },
  
  // Full CRUD test
  runFullTest: () => {
    console.group('🧪 Full CRUD Test');
    
    // Add
    const newStudent = debugLocalStorage.testAddStudent();
    
    // Update
    const updated = debugLocalStorage.testUpdateStudent(newStudent.id);
    
    // Delete
    const deleted = debugLocalStorage.testDeleteStudent(newStudent.id);
    
    console.log('✅ Full test completed!');
    console.groupEnd();
    
    return { added: newStudent, updated, deleted };
  },
  
  // Check localStorage size
  checkSize: () => {
    let total = 0;
    Object.keys(localStorage).forEach(key => {
      const size = localStorage.getItem(key)?.length || 0;
      total += size;
      if (key.startsWith('app_')) {
        console.log(`📦 ${key}: ${(size / 1024).toFixed(2)} KB`);
      }
    });
    
    console.log(`💾 Total localStorage size: ${(total / 1024).toFixed(2)} KB`);
    return total;
  },

  // Force refresh all data (useful after schema changes)
  forceRefresh: () => {
    console.log('🔄 Force refreshing all data...');
    LocalStorageService.clearAllData();
    LocalStorageService.initializeData();
    console.log('✅ Data refreshed!');
    debugLocalStorage.logAll();
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugLS = debugLocalStorage;
} 