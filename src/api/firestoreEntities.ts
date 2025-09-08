import { FirestoreService } from '@/services/firestoreService'

// Firestore-based Entity class
class FirestoreEntity {
  apiClient: any
  entityName: string

  constructor(apiClient: any, entityName: string) {
    this.apiClient = apiClient
    this.entityName = entityName
  }

  // Firestore Data Operations
  async list() {
    console.log(`Using Firestore for LIST ${this.entityName}`)
    
    // Initialize data if not exists
    await FirestoreService.initializeData()
    
    if (this.entityName === 'academic-tracks') {
      try {
        console.log('Fetching academic tracks from JSON file...')
        const response = await fetch('/academic-tracks.json')
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        const data = await response.json()
        console.log('Academic tracks loaded from JSON:', data.length, 'tracks')
        return data
      } catch (error) {
        console.error('Failed to fetch academic tracks:', error)
        return []
      }
    }
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.getStudents()
      case 'lecturers':
        return await FirestoreService.getLecturers()
      case 'courses':
        return await FirestoreService.getCourses()
      case 'files':
        return await FirestoreService.getFiles()
      case 'messages':
        return await FirestoreService.getMessages()
      case 'notifications':
        return await FirestoreService.getNotifications()
      default:
        console.warn(`Unknown entity type: ${this.entityName}`)
        return []
    }
  }

  async get(id: string) {
    console.log(`Using Firestore for GET ${this.entityName}/${id}`)
    
    // Initialize data if not exists
    await FirestoreService.initializeData()
    
    switch (this.entityName) {
      case 'students': {
        const students = await FirestoreService.getStudents()
        return students.find(s => s.id === id) || null
      }
      case 'lecturers': {
        const lecturers = await FirestoreService.getLecturers()
        return lecturers.find(l => l.id === id) || null
      }
      case 'courses': {
        const courses = await FirestoreService.getCourses()
        return courses.find(c => c.id === id) || null
      }
      case 'files': {
        const files = await FirestoreService.getFiles()
        return files.find(f => f.id === id) || null
      }
      case 'messages': {
        const messages = await FirestoreService.getMessages()
        return messages.find(m => m.id === id) || null
      }
      case 'notifications': {
        const notifications = await FirestoreService.getNotifications()
        return notifications.find(n => n.id === id) || null
      }
      default:
        console.warn(`Unknown entity type: ${this.entityName}`)
        return null
    }
  }

  async create(data: any) {
    console.log(`Using Firestore for CREATE ${this.entityName}`)
    
    // Initialize data if not exists
    await FirestoreService.initializeData()
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.addStudent(data)
      case 'lecturers':
        return await FirestoreService.addLecturer(data)
      case 'courses':
        return await FirestoreService.addCourse(data)
      case 'files':
        return await FirestoreService.addFile(data)
      case 'messages':
        return await FirestoreService.addMessage(data)
      case 'notifications':
        return await FirestoreService.addNotification(data)
      default:
        console.warn(`Create operation not supported for entity type: ${this.entityName}`)
        throw new Error(`Create operation not supported for entity type: ${this.entityName}`)
    }
  }

  async update(id: string, data: any) {
    console.log(`Using Firestore for UPDATE ${this.entityName}/${id}`)
    
    // Initialize data if not exists
    await FirestoreService.initializeData()
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.updateStudent(id, data)
      case 'lecturers':
        return await FirestoreService.updateLecturer(id, data)
      case 'courses':
        return await FirestoreService.updateCourse(id, data)
      case 'files':
        return await FirestoreService.updateFile(id, data)
      case 'messages':
        return await FirestoreService.updateMessage(id, data)
      case 'notifications':
        return await FirestoreService.updateNotification(id, data)
      default:
        console.warn(`Update operation not supported for entity type: ${this.entityName}`)
        throw new Error(`Update operation not supported for entity type: ${this.entityName}`)
    }
  }

  async delete(id: string) {
    console.log(`Using Firestore for DELETE ${this.entityName}/${id}`)
    
    // Initialize data if not exists
    await FirestoreService.initializeData()
    
    switch (this.entityName) {
      case 'students':
        return await FirestoreService.deleteStudent(id)
      case 'lecturers':
        return await FirestoreService.deleteLecturer(id)
      case 'courses':
        return await FirestoreService.deleteCourse(id)
      case 'files':
        return await FirestoreService.deleteFile(id)
      case 'messages':
        return await FirestoreService.deleteMessage(id)
      case 'notifications':
        return await FirestoreService.deleteNotification(id)
      default:
        console.warn(`Delete operation not supported for entity type: ${this.entityName}`)
        throw new Error(`Delete operation not supported for entity type: ${this.entityName}`)
    }
  }

  async query(params: any) {
    console.log(`Using Firestore for QUERY ${this.entityName} with params:`, params)
    
    // For now, get all data and filter locally
    // In a real implementation, you would use Firestore queries
    const allData = await this.list()
    
    if (!params || Object.keys(params).length === 0) {
      return allData
    }
    
    // Apply filters
    let filteredData = allData
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filteredData = filteredData.filter((item: any) => {
          if (Array.isArray(item[key])) {
            // Handle array fields (like academic_track_ids)
            return item[key].includes(value)
          } else {
            return item[key] === value
          }
        })
      }
    })
    
    return filteredData
  }
}

export { FirestoreEntity } 