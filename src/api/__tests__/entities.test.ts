import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Student } from '../entities'
import { FirestoreService } from '@/services/firestoreService'
import { mockStudents, createMockFirestoreService } from '@/test/mocks'

// Mock the FirestoreService
vi.mock('@/services/firestoreService')

describe('Student Entity', () => {
  const mockFirestore = createMockFirestoreService()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementations
    Object.assign(FirestoreService, mockFirestore)
  })

  describe('list()', () => {
    it('should return all students', async () => {
      const students = await Student.list()
      
      expect(FirestoreService.getStudents).toHaveBeenCalledOnce()
      expect(students).toEqual(mockStudents)
    })

    it('should handle empty student list', async () => {
      mockFirestore.getStudents.mockResolvedValueOnce([])
      Object.assign(FirestoreService, mockFirestore)
      
      const students = await Student.list()
      
      expect(students).toEqual([])
    })
  })

  describe('get()', () => {
    it('should return specific student by id', async () => {
      const student = await Student.get('1')
      
      expect(FirestoreService.getStudents).toHaveBeenCalledOnce()
      expect(student).toEqual(mockStudents[0])
    })

    it('should return null for non-existent student', async () => {
      const student = await Student.get('non-existent')
      
      expect(student).toBeNull()
    })
  })

  describe('create()', () => {
    it('should create a new student', async () => {
      const newStudentData = {
        full_name: 'דניאל רוזן',
        student_id: '555666777',
        national_id: '555666777',
        email: 'daniel@example.com',
        academic_track_ids: ['track1']
      }

      const createdStudent = await Student.create(newStudentData)
      
      expect(FirestoreService.addStudent).toHaveBeenCalledWith(newStudentData)
      expect(createdStudent).toEqual({
        ...newStudentData,
        id: expect.stringMatching(/^new-\d+$/)
      })
    })

    it('should handle creation with minimal data', async () => {
      const minimalData = {
        full_name: 'רונן גל',
        student_id: '111222333',
        email: 'ronan@example.com',
        academic_track_ids: []
      }

      await Student.create(minimalData)
      
      expect(FirestoreService.addStudent).toHaveBeenCalledWith(minimalData)
    })
  })

  describe('update()', () => {
    it('should update existing student', async () => {
      const updateData = {
        full_name: 'יהונתן כהן מעודכן',
        email: 'yonatan.updated@example.com'
      }

      const updatedStudent = await Student.update('1', updateData)
      
      expect(FirestoreService.updateStudent).toHaveBeenCalledWith('1', updateData)
      expect(updatedStudent).toEqual({
        id: '1',
        ...updateData
      })
    })

    it('should handle partial updates', async () => {
      const updateData = { email: 'newemail@example.com' }

      await Student.update('1', updateData)
      
      expect(FirestoreService.updateStudent).toHaveBeenCalledWith('1', updateData)
    })
  })

  describe('delete()', () => {
    it('should delete existing student', async () => {
      const result = await Student.delete('1')
      
      expect(FirestoreService.deleteStudent).toHaveBeenCalledWith('1')
      expect(result).toEqual({ success: true })
    })

    it('should handle deletion failure', async () => {
      mockFirestore.deleteStudent.mockResolvedValueOnce(false)
      Object.assign(FirestoreService, mockFirestore)
      
      const result = await Student.delete('non-existent')
      
      expect(result).toEqual({ success: false })
    })
  })

  describe('filter()', () => {
    it('should filter students by academic track', async () => {
      const filters = { academic_track_ids: 'track1' }
      
      const filteredStudents = await Student.filter(filters)
      
      expect(filteredStudents).toHaveLength(2) // Both mock students have track1
      expect(filteredStudents.every(s => s.academic_track_ids.includes('track1'))).toBe(true)
    })

    it('should filter students by multiple criteria', async () => {
      const filters = { 
        academic_track_ids: 'track2',
        full_name: 'יהונתן כהן'
      }
      
      const filteredStudents = await Student.filter(filters)
      
      expect(filteredStudents).toHaveLength(1)
      expect(filteredStudents[0]).toEqual(mockStudents[0])
    })

    it('should return empty array when no matches', async () => {
      const filters = { academic_track_ids: 'non-existent-track' }
      
      const filteredStudents = await Student.filter(filters)
      
      expect(filteredStudents).toEqual([])
    })

    it('should handle filtering by non-array fields', async () => {
      const filters = { email: 'sara@example.com' }
      
      const filteredStudents = await Student.filter(filters)
      
      expect(filteredStudents).toHaveLength(1)
      expect(filteredStudents[0].email).toBe('sara@example.com')
    })
  })

  describe('Error handling', () => {
    it('should handle network errors in list()', async () => {
      mockFirestore.getStudents.mockRejectedValueOnce(new Error('Network error'))
      Object.assign(FirestoreService, mockFirestore)
      
      await expect(Student.list()).rejects.toThrow('Network error')
    })

    it('should handle network errors in create()', async () => {
      mockFirestore.addStudent.mockRejectedValueOnce(new Error('Creation failed'))
      Object.assign(FirestoreService, mockFirestore)
      
      const studentData = {
        full_name: 'Test Student',
        student_id: '123',
        email: 'test@example.com',
        academic_track_ids: []
      }
      
      await expect(Student.create(studentData)).rejects.toThrow('Creation failed')
    })
  })
})
