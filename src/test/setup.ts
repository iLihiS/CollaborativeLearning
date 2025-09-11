import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}))

// Mock Firestore Service
vi.mock('@/services/firestoreService', () => ({
  FirestoreService: {
    getStudents: vi.fn(),
    addStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    getLecturers: vi.fn(),
    getCourses: vi.fn(),
    getFiles: vi.fn(),
    getMessages: vi.fn(),
    getNotifications: vi.fn(),
    addLecturer: vi.fn(),
    addCourse: vi.fn(),
    addFile: vi.fn(),
    addMessage: vi.fn(),
    addNotification: vi.fn(),
    updateLecturer: vi.fn(),
    updateCourse: vi.fn(),
    updateFile: vi.fn(),
    updateMessage: vi.fn(),
    updateNotification: vi.fn(),
    deleteLecturer: vi.fn(),
    deleteCourse: vi.fn(),
    deleteFile: vi.fn(),
    deleteMessage: vi.fn(),
    deleteNotification: vi.fn(),
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ search: '', pathname: '' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}))

// Global test setup
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
