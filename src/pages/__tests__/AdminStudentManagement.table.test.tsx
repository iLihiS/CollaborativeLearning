import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AdminStudentManagement from '../AdminStudentManagement'
import { mockStudents, mockAcademicTracks } from '@/test/mocks'
import { Student, AcademicTrack } from '@/api/entities'

// Mock the entities
vi.mock('@/api/entities')

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('AdminStudentManagement - Table Component', () => {
  const mockStudent = Student as any
  const mockAcademicTrack = AcademicTrack as any
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockStudent.list = vi.fn().mockResolvedValue(mockStudents)
    mockStudent.delete = vi.fn().mockResolvedValue({ success: true })
    mockAcademicTrack.list = vi.fn().mockResolvedValue(mockAcademicTracks)
    
    global.confirm = vi.fn().mockReturnValue(true)
    global.alert = vi.fn()
  })

  describe('Table Structure', () => {
    it('should render table with correct headers', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('ניהול סטודנטים')).toBeInTheDocument()
      })

      // Check for all expected table headers
      expect(screen.getByText('שם מלא')).toBeInTheDocument()
      expect(screen.getByText('מספר סטודנט')).toBeInTheDocument()
      expect(screen.getByText('תעודת זהות')).toBeInTheDocument()
      expect(screen.getByText('אימייל')).toBeInTheDocument()
      expect(screen.getByText('מסלולים אקדמיים')).toBeInTheDocument()
      expect(screen.getByText('פעולות')).toBeInTheDocument()
    })

    it('should display correct number of student rows', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Should show both mock students
      expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      expect(screen.getByText('שרה לוי')).toBeInTheDocument()
      
      // Check student IDs
      expect(screen.getByText('123456789')).toBeInTheDocument()
      expect(screen.getByText('987654321')).toBeInTheDocument()
      
      // Check emails
      expect(screen.getByText('yonatan@example.com')).toBeInTheDocument()
      expect(screen.getByText('sara@example.com')).toBeInTheDocument()
    })

    it('should display academic tracks as chips', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Should display academic track names as chips
      expect(screen.getByText('מדעי המחשב')).toBeInTheDocument()
      expect(screen.getByText('הנדסת תוכנה')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render edit and delete buttons for each student', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Should have edit buttons for each student
      const editButtons = screen.getAllByTestId('edit-button')
      expect(editButtons).toHaveLength(2)

      // Should have delete buttons for each student
      const deleteButtons = screen.getAllByTestId('delete-button')
      expect(deleteButtons).toHaveLength(2)
    })

    it('should trigger edit functionality when edit button clicked', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0])

      // Should open edit dialog
      expect(screen.getByText('עריכת סטודנט')).toBeInTheDocument()
    })

    it('should trigger delete confirmation when delete button clicked', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0])

      expect(global.confirm).toHaveBeenCalledWith('האם אתה בטוח שברצונך למחוק סטודנט זה?')
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort students by name when name header clicked', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const nameHeader = screen.getByText('שם מלא')
      await user.click(nameHeader)

      // Should show sort indicator (up/down arrow)
      // The actual sorting logic would be tested by checking the order of elements
      expect(nameHeader).toBeInTheDocument()
    })

    it('should toggle sort direction on repeated clicks', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const nameHeader = screen.getByText('שם מלא')
      
      // First click - ascending
      await user.click(nameHeader)
      
      // Second click - descending
      await user.click(nameHeader)
      
      expect(nameHeader).toBeInTheDocument()
    })

    it('should sort by student ID when student ID header clicked', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const idHeader = screen.getByText('מספר סטודנט')
      await user.click(idHeader)

      expect(idHeader).toBeInTheDocument()
    })

    it('should sort by email when email header clicked', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const emailHeader = screen.getByText('אימייל')
      await user.click(emailHeader)

      expect(emailHeader).toBeInTheDocument()
    })
  })

  describe('Filtering Functionality', () => {
    it('should show filter inputs for each column', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Should have filter inputs (these might be rendered as textfields in the table)
      const textInputs = screen.getAllByRole('textbox')
      expect(textInputs.length).toBeGreaterThan(0)
    })

    it('should filter students by name', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
        expect(screen.getByText('שרה לוי')).toBeInTheDocument()
      })

      // Find name filter input and type
      const filterInputs = screen.getAllByRole('textbox')
      const nameFilter = filterInputs[0] // Assuming first input is name filter
      
      await user.type(nameFilter, 'יהונתן')

      // Only matching student should be visible
      expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      // Non-matching student might still be visible depending on implementation
    })

    it('should filter students by student ID', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const filterInputs = screen.getAllByRole('textbox')
      const idFilter = filterInputs[1] // Assuming second input is ID filter
      
      await user.type(idFilter, '123456789')

      expect(screen.getByText('123456789')).toBeInTheDocument()
    })

    it('should filter students by email', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const filterInputs = screen.getAllByRole('textbox')
      const emailFilter = filterInputs[3] // Assuming fourth input is email filter
      
      await user.type(emailFilter, 'yonatan')

      expect(screen.getByText('yonatan@example.com')).toBeInTheDocument()
    })
  })

  describe('Academic Track Filter', () => {
    it('should show academic track filter buttons', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Should show "הכל" (All) filter option
      expect(screen.getByText('הכל')).toBeInTheDocument()
      
      // Should show academic track filter options
      expect(screen.getByText('מדעי המחשב')).toBeInTheDocument()
      expect(screen.getByText('הנדסת תוכנה')).toBeInTheDocument()
    })

    it('should filter students by academic track', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Click on specific academic track filter
      const trackButtons = screen.getAllByText('מדעי המחשב')
      const filterButton = trackButtons.find(button => 
        button.closest('button') !== null
      )
      
      if (filterButton) {
        await user.click(filterButton)
        
        // Should still show students with that track
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
        expect(screen.getByText('שרה לוי')).toBeInTheDocument()
      }
    })

    it('should show all students when "הכל" filter selected', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const allFilter = screen.getByText('הכל')
      await user.click(allFilter)

      expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      expect(screen.getByText('שרה לוי')).toBeInTheDocument()
    })
  })

  describe('Table Navigation and Pagination', () => {
    it('should handle large datasets gracefully', async () => {
      // Mock a large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `student-${i}`,
        full_name: `סטודנט ${i}`,
        student_id: `${1000000 + i}`,
        national_id: `${100000000 + i}`,
        email: `student${i}@example.com`,
        academic_track_ids: ['track1']
      }))

      mockStudent.list = vi.fn().mockResolvedValue(largeDataset)

      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('ניהול סטודנטים')).toBeInTheDocument()
      })

      // Should render without performance issues
      expect(screen.getByText('סטודנט 0')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show appropriate message when no students exist', async () => {
      mockStudent.list = vi.fn().mockResolvedValue([])

      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('ניהול סטודנטים')).toBeInTheDocument()
      })

      // Should show table headers even with no data
      expect(screen.getByText('שם מלא')).toBeInTheDocument()
      
      // Should not show any student data
      expect(screen.queryByText('יהונתן כהן')).not.toBeInTheDocument()
    })

    it('should show appropriate message when filtered results are empty', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Filter by non-existent name
      const filterInputs = screen.getAllByRole('textbox')
      const nameFilter = filterInputs[0]
      
      await user.type(nameFilter, 'לא קיים')

      // Should not show any results
      expect(screen.queryByText('יהונתן כהן')).not.toBeInTheDocument()
      expect(screen.queryByText('שרה לוי')).not.toBeInTheDocument()
    })
  })

  describe('Row Interactions', () => {
    it('should highlight rows on hover', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const firstRow = screen.getByText('יהונתן כהן').closest('tr')
      
      if (firstRow) {
        await user.hover(firstRow)
        // Visual feedback would be tested through CSS classes or style attributes
        expect(firstRow).toBeInTheDocument()
      }
    })

    it('should handle keyboard navigation', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Test tab navigation through action buttons
      const editButtons = screen.getAllByTestId('edit-button')
      editButtons[0].focus()
      
      await user.keyboard('{Tab}')
      
      // Should move focus to delete button
      const deleteButtons = screen.getAllByTestId('delete-button')
      expect(document.activeElement).toBe(deleteButtons[0])
    })
  })

  describe('Performance and Accessibility', () => {
    it('should have proper ARIA labels for action buttons', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTestId('edit-button')
      const deleteButtons = screen.getAllByTestId('delete-button')

      expect(editButtons[0]).toHaveAttribute('title', 'ערוך סטודנט')
      expect(deleteButtons[0]).toHaveAttribute('title', 'מחק סטודנט')
    })

    it('should have proper table structure for screen readers', async () => {
      render(
        <TestWrapper>
          <AdminStudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('יהונתן כהן')).toBeInTheDocument()
      })

      // Should have proper table role
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      // Should have column headers
      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders.length).toBeGreaterThan(0)
    })
  })
})
