import { vi } from 'vitest'

// Mock Student data
export const mockStudents = [
  {
    id: '1',
    full_name: 'יהונתן כהן',
    student_id: '123456789',
    national_id: '123456789',
    email: 'yonatan@example.com',
    academic_track_ids: ['track1', 'track2']
  },
  {
    id: '2',
    full_name: 'שרה לוי',
    student_id: '987654321',
    national_id: '987654321',
    email: 'sara@example.com',
    academic_track_ids: ['track1']
  }
]

// Mock Academic Tracks data
export const mockAcademicTracks = [
  {
    id: 'track1',
    name: 'מדעי המחשב',
    department: 'הנדסה',
    degree_type: 'תואר ראשון'
  },
  {
    id: 'track2',
    name: 'הנדסת תוכנה',
    department: 'הנדסה',
    degree_type: 'תואר ראשון'
  }
]

// Mock Courses data
export const mockCourses = [
  {
    id: 'course1',
    name: 'מבוא למדעי המחשב',
    code: 'CS101',
    lecturer_id: 'lecturer1',
    semester: '2024א',
    description: 'קורס יסוד במדעי המחשב'
  }
]

// Mock Files data
export const mockFiles = [
  {
    id: 'file1',
    original_name: 'הרצאה 1.pdf',
    file_type: 'note',
    created_at: '2024-01-01T10:00:00Z',
    download_count: 5,
    file_url: 'https://example.com/file1.pdf',
    file_size: 1024000,
    tags: ['הרצאה', 'חומר'],
    status: 'approved',
    uploader_type: 'lecturer',
    uploader_id: 'lecturer1',
    course_id: 'course1'
  }
]

// FirestoreService mock functions
export const createMockFirestoreService = () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  addStudent: vi.fn().mockImplementation((student) => 
    Promise.resolve({ ...student, id: `new-${Date.now()}` })
  ),
  updateStudent: vi.fn().mockImplementation((id, updates) => 
    Promise.resolve({ id, ...updates })
  ),
  deleteStudent: vi.fn().mockResolvedValue(true),
  getLecturers: vi.fn().mockResolvedValue([]),
  getCourses: vi.fn().mockResolvedValue(mockCourses),
  getFiles: vi.fn().mockResolvedValue(mockFiles),
  getMessages: vi.fn().mockResolvedValue([]),
  getNotifications: vi.fn().mockResolvedValue([]),
})

// Test utilities
export const mockFormEvent = (formData: Record<string, any> = {}) => ({
  preventDefault: vi.fn(),
  target: {
    elements: Object.keys(formData).reduce((acc, key) => {
      acc[key] = { value: formData[key] }
      return acc
    }, {} as any)
  }
} as any)

export const mockChangeEvent = (name: string, value: string) => ({
  target: { name, value }
} as React.ChangeEvent<HTMLInputElement>)
