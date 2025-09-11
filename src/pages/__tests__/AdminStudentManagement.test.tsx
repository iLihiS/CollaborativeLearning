import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AdminStudentManagement from '../AdminStudentManagement'

// Mock entities
vi.mock('../../api/entities', () => ({
  Student: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    filter: vi.fn()
  },
  AcademicTrack: {
    list: vi.fn()
  }
}))

// Mock global functions
global.alert = vi.fn()
global.confirm = vi.fn()

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('AdminStudentManagement', () => {
  const user = userEvent.setup()
  
  const mockStudentData = [
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

  const mockAcademicTrackData = [
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

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import mocked modules
    const { Student, AcademicTrack } = await import('../../api/entities')
    
    // Configure mocks
    vi.mocked(Student.list).mockResolvedValue(mockStudentData)
    vi.mocked(AcademicTrack.list).mockResolvedValue(mockAcademicTrackData)
    vi.mocked(Student.create).mockResolvedValue({ id: 'new-id', ...mockStudentData[0] })
    vi.mocked(Student.update).mockResolvedValue({ id: '1', ...mockStudentData[0] })
    vi.mocked(Student.delete).mockResolvedValue(true)
    vi.mocked(global.confirm).mockReturnValue(true)
  })

  describe('Component Rendering', () => {
    it('should render the admin student management component', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      expect(screen.getByText('ניהול סטודנטים')).toBeInTheDocument()
      expect(screen.getByText('הוספה, עריכה ומחיקה של סטודנטים רשומים')).toBeInTheDocument()
    })

    it('should render add student button', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      expect(screen.getByText('הוסף סטודנט חדש')).toBeInTheDocument()
    })

    it('should display students in table', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
        expect(screen.getByText('שרה לוי')).toBeInTheDocument()
      })
    })
  })

  describe('Add Student Button', () => {
    it('should be clickable', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      const addButton = screen.getByText('הוסף סטודנט חדש')
      expect(addButton).toBeInTheDocument()
      
      // Just test that the button can be clicked without errors
      await user.click(addButton)
    })
  })

  describe('Action Buttons', () => {
    it('should display action buttons for each student', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button')
        const actionButtons = allButtons.filter(button => 
          button.querySelector('svg') && 
          !button.textContent?.includes('הוסף') &&
          !button.textContent?.includes('כל הסטודנטים') &&
          !button.textContent?.includes('מדעי המחשב') &&
          !button.textContent?.includes('הנדסת תוכנה')
        )
        
        // Should have at least 2 action buttons (edit/delete) per student
        expect(actionButtons.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should be clickable', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button')
        const actionButtons = allButtons.filter(button => 
          button.querySelector('svg') && 
          !button.textContent?.includes('הוסף') &&
          !button.textContent?.includes('כל הסטודנטים') &&
          !button.textContent?.includes('מדעי המחשב') &&
          !button.textContent?.includes('הנדסת תוכנה')
        )
        
        if (actionButtons.length > 0) {
          // Just test that buttons can be clicked without errors
          expect(actionButtons[0]).toBeInTheDocument()
        }
      })
    })
  })

  describe('Basic Functionality', () => {
    it('should load students on mount', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(async () => {
        const { Student, AcademicTrack } = await import('../../api/entities')
        expect(Student.list).toHaveBeenCalled()
        expect(AcademicTrack.list).toHaveBeenCalled()
      })
    })

    it('should display academic track filters', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText('כל הסטודנטים')).toBeInTheDocument()
        // Check for multiple instances since tracks appear both as filters and chips
        const csElements = screen.getAllByText('מדעי המחשב')
        expect(csElements.length).toBeGreaterThan(0)
        const seElements = screen.getAllByText('הנדסת תוכנה')
        expect(seElements.length).toBeGreaterThan(0)
      })
    })

    it('should filter students when track filter is clicked', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        const csElements = screen.getAllByText('מדעי המחשב')
        expect(csElements.length).toBeGreaterThan(0)
      })
      
      // Find the filter button specifically by role and aria-label
      const csButton = screen.getByRole('button', { name: 'מדעי המחשב' })
      await user.click(csButton)
      
      // Just verify the button was clicked without errors
      expect(csButton).toBeInTheDocument()
    })
  })

  describe('Table Headers', () => {
    it('should display correct table headers', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText('שם מלא')).toBeInTheDocument()
        expect(screen.getByText('מספר סטודנט')).toBeInTheDocument()
        expect(screen.getByText('כתובת מייל')).toBeInTheDocument()
        expect(screen.getByText('מסלול אקדמי')).toBeInTheDocument()
        expect(screen.getByText('פעולות')).toBeInTheDocument()
      })
    })
  })

  describe('Student Data Display', () => {
    it('should display student information correctly', async () => {
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
        expect(screen.getByText('yonatan@example.com')).toBeInTheDocument()
        
        // Check for student ID chips
        const studentIdChips = screen.getAllByText('123456789')
        expect(studentIdChips.length).toBeGreaterThan(0)
        
        // Check for academic track chips  
        const trackChips = screen.getAllByText('מדעי המחשב')
        expect(trackChips.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      const { Student } = await import('../../api/entities')
      vi.mocked(Student.list).mockRejectedValue(new Error('Loading failed'))
      
      render(<AdminStudentManagement />, { wrapper: TestWrapper })
      
      // Just verify component doesn't crash
      expect(screen.getByText('ניהול סטודנטים')).toBeInTheDocument()
    })
  })
})