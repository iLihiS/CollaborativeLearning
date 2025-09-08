import { FirestoreService } from '@/services/firestoreService'

// Debug utilities for Firestore operations
export const debugFirestore = {
  // Print all data to console
  logAll: async () => {
    console.group('🔍 Firestore Debug Data')
    
    try {
      const students = await FirestoreService.getStudents();
      const lecturers = await FirestoreService.getLecturers();
      const courses = await FirestoreService.getCourses();
      const files = await FirestoreService.getFiles();
      const messages = await FirestoreService.getMessages();
      const notifications = await FirestoreService.getNotifications();
      
      console.log('👥 Students:', students.length, 'items')
      console.log('🎓 Lecturers:', lecturers.length, 'items')
      console.log('📚 Courses:', courses.length, 'items')
      console.log('📁 Files:', files.length, 'items')
      console.log('💬 Messages:', messages.length, 'items')
      console.log('🔔 Notifications:', notifications.length, 'items')
    } catch (error) {
      console.error('❌ Error loading Firestore data:', error);
    }
    
    console.groupEnd()
  },
  
  // Add a test student and verify it's saved
  testAddStudent: async () => {
    try {
      const testStudent = {
        full_name: 'סטודנט בדיקה',
        email: 'test@ono.ac.il',
        student_id: '2024TEST',
        national_id: '123456789',
        academic_track: 'cs-undergrad',
        academic_track_ids: ['cs-undergrad'],
        year: 1,
        status: 'active' as const
      }
      
      const before = (await FirestoreService.getStudents()).length
      const newStudent = await FirestoreService.addStudent(testStudent)
      const after = (await FirestoreService.getStudents()).length
      
      console.log('✅ Test Add Student:')
      console.log('Before:', before, 'After:', after)
      console.log('New student:', newStudent)
      
      return newStudent
    } catch (error) {
      console.error('❌ Error adding test student:', error);
      return null;
    }
  },
  
  // Update a student and verify
  testUpdateStudent: async (studentId: string) => {
    try {
      const updates = { full_name: 'שם מעודכן' }
      const updated = await FirestoreService.updateStudent(studentId, updates)
      
      console.log('✅ Test Update Student:')
      console.log('Updated:', updated)
      
      return updated
    } catch (error) {
      console.error('❌ Error updating test student:', error);
      return null;
    }
  },
  
  // Delete a student and verify
  testDeleteStudent: async (studentId: string) => {
    try {
      const before = (await FirestoreService.getStudents()).length
      const deleted = await FirestoreService.deleteStudent(studentId)
      const after = (await FirestoreService.getStudents()).length
      
      console.log('✅ Test Delete Student:')
      console.log('Before:', before, 'After:', after, 'Success:', deleted)
      
      return deleted
    } catch (error) {
      console.error('❌ Error deleting test student:', error);
      return false;
    }
  },
  
  // Full CRUD test
  runFullTest: async () => {
    console.group('🧪 Full CRUD Test')
    
    try {
      const newStudent = await debugFirestore.testAddStudent()
      if (!newStudent) {
        console.error('❌ Failed to add student');
        return null;
      }
      
      const updated = await debugFirestore.testUpdateStudent(newStudent.id)
      const deleted = await debugFirestore.testDeleteStudent(newStudent.id)
      
      console.log('✅ Full test completed!')
      console.groupEnd()
      
      return { added: newStudent, updated, deleted }
    } catch (error) {
      console.error('❌ Error in full test:', error);
      console.groupEnd();
      return null;
    }
  },
  
  // Check Firestore collection sizes
  checkCollectionSizes: async () => {
    try {
      const students = await FirestoreService.getStudents();
      const lecturers = await FirestoreService.getLecturers();
      const courses = await FirestoreService.getCourses();
      const files = await FirestoreService.getFiles();
      const messages = await FirestoreService.getMessages();
      const notifications = await FirestoreService.getNotifications();

      console.log('📊 Firestore Collection Sizes:');
      console.log(`👥 Students: ${students.length}`);
      console.log(`🎓 Lecturers: ${lecturers.length}`);
      console.log(`📚 Courses: ${courses.length}`);
      console.log(`📁 Files: ${files.length}`);
      console.log(`💬 Messages: ${messages.length}`);
      console.log(`🔔 Notifications: ${notifications.length}`);
      
      return {
        students: students.length,
        lecturers: lecturers.length,
        courses: courses.length,
        files: files.length,
        messages: messages.length,
        notifications: notifications.length
      };
    } catch (error) {
      console.error('❌ Error checking collection sizes:', error);
      return null;
    }
  },

  // Clear all Firestore data (be careful!)
  clearAllData: async () => {
    try {
      console.log('🗑️ Clearing all Firestore data...')
      await FirestoreService.clearAllData()
      console.log('✅ All data cleared!')
      await debugFirestore.logAll()
    } catch (error) {
      console.error('❌ Error clearing data:', error);
    }
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugFirestore = debugFirestore
  
  console.log('%c🔥 Firestore Debug Utils available:', 'color: #FF5722; font-weight: bold;');
  console.log('- debugFirestore.logAll() - הצג את כל הנתונים');
  console.log('- debugFirestore.checkCollectionSizes() - בדוק גדלי קולקציות');
  console.log('- debugFirestore.testAddStudent() - בדוק הוספת סטודנט');
  console.log('- debugFirestore.runFullTest() - הרץ בדיקה מלאה');
  console.log('- debugFirestore.clearAllData() - נקה את כל הנתונים (זהירות!)');
} 