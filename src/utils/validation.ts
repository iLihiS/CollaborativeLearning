export interface ValidationResult {
  isValid: boolean
  error?: string
}

export class Validators {
  // Hebrew name validation
  static validateHebrewName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'שם הוא שדה חובה' }
    }

    const trimmedName = name.trim()
    
    if (trimmedName.length < 2) {
      return { isValid: false, error: 'שם חייב להכיל לפחות 2 תווים' }
    }

    if (trimmedName.length > 50) {
      return { isValid: false, error: 'שם ארוך מדי (מקסימום 50 תווים)' }
    }

    // Hebrew letters, spaces, apostrophes, hyphens, quotes
    const hebrewNamePattern = /^[\u0590-\u05FF\s'\-"\.]+$/
    
    if (!hebrewNamePattern.test(trimmedName)) {
      return { isValid: false, error: 'שם חייב להכיל רק אותיות עבריות, רווחים וסימני פיסוק בסיסיים' }
    }

    // Check for consecutive spaces or starting/ending with spaces
    if (trimmedName !== name || /\s{2,}/.test(trimmedName)) {
      return { isValid: false, error: 'שם לא יכול להתחיל או להסתיים ברווח, ולא יכול להכיל רווחים כפולים' }
    }

    return { isValid: true }
  }

  // Israeli ID validation with checksum
  static validateIsraeliId(id: string): ValidationResult {
    if (!id || id.trim().length === 0) {
      return { isValid: false, error: 'תעודת זהות היא שדה חובה' }
    }

    const trimmedId = id.trim()
    
    if (!/^\d{9}$/.test(trimmedId)) {
      return { isValid: false, error: 'תעודת זהות חייבת להכיל בדיוק 9 ספרות' }
    }

    // Israeli ID checksum validation (Luhn algorithm variant)
    const digits = trimmedId.split('').map(Number)
    let sum = 0
    
    for (let i = 0; i < 8; i++) {
      let digit = digits[i] * ((i % 2) + 1)
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10)
      }
      sum += digit
    }
    
    const checkDigit = (10 - (sum % 10)) % 10
    
    if (checkDigit !== digits[8]) {
      return { isValid: false, error: 'תעודת זהות לא תקינה (ספרת ביקורת שגויה)' }
    }

    return { isValid: true }
  }

  // Comprehensive email validation
  static validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'כתובת אימייל היא שדה חובה' }
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedEmail.length > 254) {
      return { isValid: false, error: 'כתובת אימייל ארוכה מדי (מקסימום 254 תווים)' }
    }

    if (trimmedEmail.length < 5) {
      return { isValid: false, error: 'כתובת אימייל קצרה מדי (מינימום 5 תווים)' }
    }

    const emailPattern = /^[a-zA-Z0-9]([a-zA-Z0-9._-])*[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9.-])*[a-zA-Z0-9]\.[a-zA-Z]{2,6}$/
    
    if (!emailPattern.test(trimmedEmail)) {
      return { isValid: false, error: 'כתובת אימייל לא תקינה - בדוק את הפורמט (example@domain.com)' }
    }

    // Check for consecutive dots or special characters
    if (/\.{2,}/.test(trimmedEmail) || /__{2,}/.test(trimmedEmail) || /--{2,}/.test(trimmedEmail)) {
      return { isValid: false, error: 'כתובת אימייל מכילה תווים עוקבים לא חוקיים' }
    }

    const [localPart, domainPart] = trimmedEmail.split('@')
    
    if (localPart.length > 64) {
      return { isValid: false, error: 'החלק המקומי של האימייל ארוך מדי (מקסימום 64 תווים)' }
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { isValid: false, error: 'החלק המקומי של האימייל לא יכול להתחיל או להסתיים בנקודה' }
    }

    if (domainPart.length > 253) {
      return { isValid: false, error: 'חלק הדומיין ארוך מדי (מקסימום 253 תווים)' }
    }

    const domainParts = domainPart.split('.')
    if (domainParts.some(part => part.length === 0 || part.length > 63)) {
      return { isValid: false, error: 'מבנה הדומיין לא תקין' }
    }

    return { isValid: true }
  }

  // Israeli phone number validation
  static validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
      return { isValid: true } // Phone is optional
    }

    const trimmedPhone = phone.trim()

    if (!/^[\d\s\-\(\)\+]+$/.test(trimmedPhone)) {
      return { isValid: false, error: 'מספר טלפון יכול להכיל רק ספרות, רווחים, מקפים וסוגריים' }
    }

    const cleanPhone = trimmedPhone.replace(/[\s\-\(\)\+]/g, '')
    
    if (cleanPhone.length === 0) {
      return { isValid: false, error: 'מספר טלפון חייב להכיל לפחות ספרה אחת' }
    }

    const mobilePattern = /^05[0-9]\d{7}$/
    const landlinePattern = /^0[2-4,8-9]\d{7,8}$/
    const internationalPattern = /^972[2-9]\d{7,8}$/
    
    if (!mobilePattern.test(cleanPhone) && !landlinePattern.test(cleanPhone) && !internationalPattern.test(cleanPhone)) {
      return { 
        isValid: false, 
        error: 'מספר טלפון לא תקין. פורמטים תקינים: 05x-xxxxxxx (נייד), 0x-xxxxxxx (קווי), או +972-x-xxxxxxx' 
      }
    }

    // Validate mobile prefixes
    if (mobilePattern.test(cleanPhone)) {
      const prefix = cleanPhone.substring(0, 3)
      const validMobilePrefixes = ['050', '051', '052', '053', '054', '055', '056', '057', '058', '059']
      if (!validMobilePrefixes.includes(prefix)) {
        return { isValid: false, error: 'קידומת הנייד לא תקינה (050-059)' }
      }
    }

    // Validate landline area codes
    if (landlinePattern.test(cleanPhone)) {
      const areaCode = cleanPhone.substring(0, 2)
      const validAreaCodes = ['02', '03', '04', '08', '09']
      if (!validAreaCodes.includes(areaCode)) {
        return { isValid: false, error: 'קוד אזור לא תקין (02, 03, 04, 08, 09)' }
      }
    }

    return { isValid: true }
  }

  // Student ID validation
  static validateStudentId(studentId: string): ValidationResult {
    if (!studentId || studentId.trim().length === 0) {
      return { isValid: false, error: 'מספר סטודנט הוא שדה חובה' }
    }

    const trimmedId = studentId.trim().toUpperCase()

    if (trimmedId.length < 4 || trimmedId.length > 15) {
      return { isValid: false, error: 'מספר סטודנט חייב להכיל 4-15 תווים' }
    }

    const studentIdPattern = /^[A-Z0-9]+$/
    if (!studentIdPattern.test(trimmedId)) {
      return { isValid: false, error: 'מספר סטודנט יכול להכיל רק אותיות אנגליות ומספרים' }
    }

    const hasLetter = /[A-Z]/.test(trimmedId)
    const hasNumber = /[0-9]/.test(trimmedId)
    
    if (!hasLetter && !hasNumber) {
      return { isValid: false, error: 'מספר סטודנט חייב להכיל לפחות תו אחד' }
    }

    if (/(.)\1{3,}/.test(trimmedId)) {
      return { isValid: false, error: 'מספר סטודנט לא יכול להכיל יותר מ-3 תווים זהים ברצף' }
    }

    const commonInvalidPatterns = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', 'AAAA', 'BBBB']
    if (commonInvalidPatterns.some(pattern => trimmedId.includes(pattern))) {
      return { isValid: false, error: 'מספר סטודנט לא יכול להכיל רצף של תווים זהים' }
    }

    return { isValid: true }
  }

  // Employee ID validation
  static validateEmployeeId(employeeId: string): ValidationResult {
    if (!employeeId || employeeId.trim().length === 0) {
      return { isValid: false, error: 'מספר עובד הוא שדה חובה' }
    }

    const trimmedId = employeeId.trim().toUpperCase()

    if (trimmedId.length < 7 || trimmedId.length > 10) {
      return { isValid: false, error: 'מספר עובד חייב להכיל 7-10 תווים' }
    }

    // Employee ID format: EMP + 4-6 digits
    const employeeIdPattern = /^EMP\d{4,6}$/
    if (!employeeIdPattern.test(trimmedId)) {
      return { isValid: false, error: 'מספר עובד חייב להיות בפורמט EMP + 4-6 ספרות (לדוגמה: EMP1001)' }
    }

    const numericPart = trimmedId.substring(3)
    const numericValue = parseInt(numericPart, 10)

    if (numericValue < 1000 || numericValue > 999999) {
      return { isValid: false, error: 'מספר העובד חייב להיות בין 1000 ל-999999' }
    }

    if (/0{4,}/.test(numericPart) || /1{4,}/.test(numericPart)) {
      return { isValid: false, error: 'מספר עובד לא יכול להכיל יותר מ-3 ספרות זהות ברצף' }
    }

    return { isValid: true }
  }

  // Course code validation
  static validateCourseCode(courseCode: string): ValidationResult {
    if (!courseCode || courseCode.trim().length === 0) {
      return { isValid: false, error: 'קוד קורס הוא שדה חובה' }
    }

    const trimmedCode = courseCode.trim().toUpperCase()

    if (trimmedCode.length < 5 || trimmedCode.length > 8) {
      return { isValid: false, error: 'קוד קורס חייב להכיל 5-8 תווים' }
    }

    // Course code format: 2-4 letters + 3-4 digits
    const courseCodePattern = /^[A-Z]{2,4}\d{3,4}$/
    if (!courseCodePattern.test(trimmedCode)) {
      return { isValid: false, error: 'קוד קורס חייב להיות בפורמט: 2-4 אותיות אנגליות + 3-4 ספרות (לדוגמה: CS101, MATH201)' }
    }

    const letterPart = trimmedCode.match(/^[A-Z]+/)?.[0] || ''
    const numberPart = trimmedCode.match(/\d+$/)?.[0] || ''

    const courseNumber = parseInt(numberPart, 10)
    if (courseNumber < 100 || courseNumber > 9999) {
      return { isValid: false, error: 'מספר הקורס חייב להיות בין 100 ל-9999' }
    }

    // Common subject abbreviations validation
    const commonSubjects = [
      'CS', 'CSE', 'IT', 'IS',
      'MATH', 'STAT', 'CALC',
      'PHYS', 'CHEM', 'BIO',
      'ENG', 'HEB', 'ARAB',
      'ECON', 'BUS', 'MGT', 'FIN',
      'PSY', 'SOC', 'PHIL', 'POL',
      'LAW', 'HIST', 'GEO',
      'ART', 'MUS', 'LIT', 'THR'
    ]

    if (!commonSubjects.includes(letterPart)) {
      console.warn(`Course code ${trimmedCode} uses uncommon subject abbreviation: ${letterPart}`)
    }

    return { isValid: true }
  }

  // Academic tracks validation
  static validateAcademicTracks(trackIds: string[]): ValidationResult {
    if (!trackIds || trackIds.length === 0) {
      return { isValid: false, error: 'חייב לבחור לפחות מסלול אקדמי אחד' }
    }

    if (trackIds.length > 3) {
      return { isValid: false, error: 'ניתן לבחור עד 3 מסלולים אקדמיים' }
    }

    return { isValid: true }
  }

  // Academic year validation
  static validateAcademicYear(year: string): ValidationResult {
    if (!year || year.trim().length === 0) {
      return { isValid: false, error: 'שנת לימודים היא שדה חובה' }
    }

    const trimmedYear = year.trim()
    const currentYear = new Date().getFullYear()
    
    const academicYearPattern = /^(\d{4})[-\/](\d{4})$/
    const match = trimmedYear.match(academicYearPattern)
    
    if (!match) {
      return { isValid: false, error: 'שנת לימודים חייבת להיות בפורמט: YYYY-YYYY או YYYY/YYYY (לדוגמה: 2023-2024)' }
    }

    const startYear = parseInt(match[1], 10)
    const endYear = parseInt(match[2], 10)

    if (startYear < 2000 || startYear > currentYear + 5) {
      return { isValid: false, error: 'שנת התחלה לא סבירה (בין 2000 לעוד 5 שנים)' }
    }

    if (endYear !== startYear + 1) {
      return { isValid: false, error: 'שנת הסיום חייבת להיות השנה שאחרי שנת ההתחלה' }
    }

    return { isValid: true }
  }

  // Academic level validation
  static validateAcademicLevel(level: string): ValidationResult {
    if (!level || level.trim().length === 0) {
      return { isValid: false, error: 'שלב אקדמי הוא שדה חובה' }
    }

    const validLevels = ['תואר ראשון', 'תואר שני', 'תואר שלישי', 'דיפלומה', 'תעודה']
    
    if (!validLevels.includes(level.trim())) {
      return { isValid: false, error: 'שלב אקדמי לא תקין. אפשרויות: תואר ראשון, תואר שני, תואר שלישי, דיפלומה, תעודה' }
    }

    return { isValid: true }
  }

  // Study year validation
  static validateStudyYear(year: number | string): ValidationResult {
    if (year === null || year === undefined || year === '') {
      return { isValid: false, error: 'שנת לימודים היא שדה חובה' }
    }

    const yearNumber = typeof year === 'string' ? parseInt(year, 10) : year
    
    if (isNaN(yearNumber)) {
      return { isValid: false, error: 'שנת לימודים חייבת להיות מספר' }
    }

    if (yearNumber < 1 || yearNumber > 7) {
      return { isValid: false, error: 'שנת לימודים חייבת להיות בין 1 ל-7' }
    }

    return { isValid: true }
  }

  // Semester validation
  static validateSemester(semester: string): ValidationResult {
    if (!semester || semester.trim().length === 0) {
      return { isValid: false, error: 'סמסטר הוא שדה חובה' }
    }

    const validSemesters = ['סמסטר א\'', 'סמסטר ב\'', 'סמסטר קיץ']
    
    if (!validSemesters.includes(semester.trim())) {
      return { isValid: false, error: 'סמסטר לא תקין. אפשרויות: סמסטר א\', סמסטר ב\', סמסטר קיץ' }
    }

    return { isValid: true }
  }

  // File name validation
  static validateFileName(fileName: string): ValidationResult {
    if (!fileName || fileName.trim().length === 0) {
      return { isValid: false, error: 'שם קובץ הוא שדה חובה' }
    }

    const trimmedFileName = fileName.trim()

    if (trimmedFileName.length > 255) {
      return { isValid: false, error: 'שם קובץ ארוך מדי (מקסימום 255 תווים)' }
    }

    const invalidChars = /[<>:"|?*\\\/]/
    if (invalidChars.test(trimmedFileName)) {
      return { isValid: false, error: 'שם קובץ מכיל תווים לא חוקיים: < > : " | ? * \\ /' }
    }

    if (trimmedFileName.startsWith(' ') || trimmedFileName.endsWith(' ') || 
        trimmedFileName.startsWith('.') || trimmedFileName.endsWith('.')) {
      return { isValid: false, error: 'שם קובץ לא יכול להתחיל או להסתיים ברווח או נקודה' }
    }

    return { isValid: true }
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    if (!password || password.trim().length === 0) {
      return { isValid: false, error: 'סיסמה היא שדה חובה' }
    }

    if (password.length < 8) {
      return { isValid: false, error: 'סיסמה חייבת להכיל לפחות 8 תווים' }
    }

    if (password.length > 128) {
      return { isValid: false, error: 'סיסמה ארוכה מדי (מקסימום 128 תווים)' }
    }

    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    if (!hasLetter) {
      return { isValid: false, error: 'סיסמה חייבת להכיל לפחות אות אחת' }
    }

    if (!hasNumber) {
      return { isValid: false, error: 'סיסמה חייבת להכיל לפחות ספרה אחת' }
    }

    if (!hasSpecial) {
      return { isValid: false, error: 'סיסמה חייבת להכיל לפחות תו מיוחד אחד' }
    }

    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111', '000000']
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      return { isValid: false, error: 'סיסמה מכילה דפוס נפוץ ולא בטוח' }
    }

    return { isValid: true }
  }
}

// File validation service
export class FileValidator {
  static validateFileSize(file: File, maxSizeInMB: number = 50): ValidationResult {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    
    if (file.size > maxSizeInBytes) {
      return { 
        isValid: false, 
        error: `גודל הקובץ גדול מדי (${(file.size / 1024 / 1024).toFixed(2)} MB). מקסימום מותר: ${maxSizeInMB} MB` 
      }
    }

    if (file.size === 0) {
      return { isValid: false, error: 'הקובץ ריק' }
    }

    return { isValid: true }
  }

  static validateFileType(file: File, allowedTypes: string[]): ValidationResult {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!fileExtension) {
      return { isValid: false, error: 'קובץ חייב להיות עם סיומת' }
    }

    const normalizedAllowedTypes = allowedTypes.map(type => type.toLowerCase().replace('.', ''))
    
    if (!normalizedAllowedTypes.includes(fileExtension)) {
      return { 
        isValid: false, 
        error: `סוג קובץ לא נתמך. סוגים מותרים: ${allowedTypes.join(', ')}` 
      }
    }

    return { isValid: true }
  }

  static validateFileNameAdvanced(fileName: string): ValidationResult {
    const basicValidation = Validators.validateFileName(fileName)
    if (!basicValidation.isValid) {
      return basicValidation
    }

    const trimmedFileName = fileName.trim()

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    const nameWithoutExtension = trimmedFileName.split('.')[0].toUpperCase()
    
    if (reservedNames.includes(nameWithoutExtension)) {
      return { isValid: false, error: 'שם קובץ שמור במערכת ההפעלה' }
    }

    const extension = trimmedFileName.split('.').pop()?.toLowerCase()
    const commonExtensions = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', 'ppt', 'pptx', 'xls', 'xlsx']
    
    if (extension && !commonExtensions.includes(extension)) {
      console.warn(`Uncommon file extension: ${extension}`)
    }

    return { isValid: true }
  }

  static validateFileUpload(
    file: File, 
    allowedTypes: string[] = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'], 
    maxSizeInMB: number = 50
  ): ValidationResult {
    const nameValidation = this.validateFileNameAdvanced(file.name)
    if (!nameValidation.isValid) {
      return nameValidation
    }

    const typeValidation = this.validateFileType(file, allowedTypes)
    if (!typeValidation.isValid) {
      return typeValidation
    }

    const sizeValidation = this.validateFileSize(file, maxSizeInMB)
    if (!sizeValidation.isValid) {
      return sizeValidation
    }

    return { isValid: true }
  }
}

// Uniqueness validation service
export class UniquenessValidator {
  static async validateIdUniqueness(
    id: string, 
    entityType: 'students' | 'lecturers' | 'admins',
    excludeId?: string
  ): Promise<ValidationResult> {
    try {
      const { LocalStorageService } = await import('@/services/localStorage')
      
      let existingRecords: any[] = []
      
      switch (entityType) {
        case 'students':
          existingRecords = LocalStorageService.getStudents()
          break
        case 'lecturers':
          existingRecords = LocalStorageService.getLecturers()
          break
        default:
          return { isValid: true }
      }

      const isDuplicate = existingRecords.some(record => {
        const recordId = entityType === 'students' ? record.student_id : 
                        entityType === 'lecturers' ? record.employee_id : 
                        record.id
        
        return recordId === id && record.id !== excludeId
      })

      if (isDuplicate) {
        const entityName = entityType === 'students' ? 'סטודנט' : 
                          entityType === 'lecturers' ? 'מרצה' : 'מנהל'
        return { 
          isValid: false, 
          error: `כבר קיים ${entityName} עם מספר זה במערכת` 
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error checking uniqueness:', error)
      return { isValid: true }
    }
  }

  static async validateNationalIdUniqueness(
    nationalId: string, 
    entityType: 'students' | 'lecturers' | 'admins',
    excludeId?: string
  ): Promise<ValidationResult> {
    try {
      const { LocalStorageService } = await import('@/services/localStorage')
      
      let existingRecords: any[] = []
      
      switch (entityType) {
        case 'students':
          existingRecords = LocalStorageService.getStudents()
          break
        case 'lecturers':
          existingRecords = LocalStorageService.getLecturers()
          break
        default:
          return { isValid: true }
      }

      const isDuplicate = existingRecords.some(record => 
        record.national_id === nationalId && record.id !== excludeId
      )

      if (isDuplicate) {
        const entityName = entityType === 'students' ? 'סטודנט' : 
                          entityType === 'lecturers' ? 'מרצה' : 'מנהל'
        return { 
          isValid: false, 
          error: `כבר קיים ${entityName} עם תעודת זהות זו במערכת` 
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error checking national ID uniqueness:', error)
      return { isValid: true }
    }
  }

  static async validateEmailUniqueness(
    email: string,
    entityType: 'students' | 'lecturers' | 'admins',
    excludeId?: string
  ): Promise<ValidationResult> {
    try {
      const { LocalStorageService } = await import('@/services/localStorage')
      
      let existingRecords: any[] = []
      
      switch (entityType) {
        case 'students':
          existingRecords = LocalStorageService.getStudents()
          break
        case 'lecturers':
          existingRecords = LocalStorageService.getLecturers()
          break
        default:
          return { isValid: true }
      }

      const isDuplicate = existingRecords.some(record => 
        record.email.toLowerCase() === email.toLowerCase() && record.id !== excludeId
      )

      if (isDuplicate) {
        const entityName = entityType === 'students' ? 'סטודנט' : 
                          entityType === 'lecturers' ? 'מרצה' : 'מנהל'
        return { 
          isValid: false, 
          error: `כתובת אימייל זו כבר בשימוש אצל ${entityName} אחר` 
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Error checking email uniqueness:', error)
      return { isValid: true }
    }
  }
}

// Form validation helper
export class FormValidator {
  static async validateStudentForm(formData: {
    full_name: string
    student_id: string
    national_id?: string
    email: string
    academic_track_ids: string[]
  }, excludeId?: string): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    
    const errors: Record<string, string> = {}

    const nameResult = Validators.validateHebrewName(formData.full_name)
    if (!nameResult.isValid) {
      errors.full_name = nameResult.error!
    }

    const studentIdResult = Validators.validateStudentId(formData.student_id)
    if (!studentIdResult.isValid) {
      errors.student_id = studentIdResult.error!
    } else {
      const uniquenessResult = await UniquenessValidator.validateIdUniqueness(
        formData.student_id, 'students', excludeId
      )
      if (!uniquenessResult.isValid) {
        errors.student_id = uniquenessResult.error!
      }
    }

    if (!formData.national_id || formData.national_id.trim() === '') {
      errors.national_id = 'תעודת זהות היא שדה חובה'
    } else {
      const nationalIdResult = Validators.validateIsraeliId(formData.national_id)
      if (!nationalIdResult.isValid) {
        errors.national_id = nationalIdResult.error!
      } else {
        const nationalIdUniquenessResult = await UniquenessValidator.validateNationalIdUniqueness(
          formData.national_id, 'students', excludeId
        )
        if (!nationalIdUniquenessResult.isValid) {
          errors.national_id = nationalIdUniquenessResult.error!
        }
      }
    }

    const emailResult = Validators.validateEmail(formData.email)
    if (!emailResult.isValid) {
      errors.email = emailResult.error!
    } else {
      const emailUniquenessResult = await UniquenessValidator.validateEmailUniqueness(
        formData.email, 'students', excludeId
      )
      if (!emailUniquenessResult.isValid) {
        errors.email = emailUniquenessResult.error!
      }
    }

    const tracksResult = Validators.validateAcademicTracks(formData.academic_track_ids)
    if (!tracksResult.isValid) {
      errors.academic_track_ids = tracksResult.error!
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  static async validateLecturerForm(formData: {
    full_name: string
    employee_id: string
    national_id?: string
    email: string
    phone?: string
    academic_track_ids: string[]
  }, excludeId?: string): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    
    const errors: Record<string, string> = {}

    const nameResult = Validators.validateHebrewName(formData.full_name)
    if (!nameResult.isValid) {
      errors.full_name = nameResult.error!
    }

    const employeeIdResult = Validators.validateEmployeeId(formData.employee_id)
    if (!employeeIdResult.isValid) {
      errors.employee_id = employeeIdResult.error!
    } else {
      const uniquenessResult = await UniquenessValidator.validateIdUniqueness(
        formData.employee_id, 'lecturers', excludeId
      )
      if (!uniquenessResult.isValid) {
        errors.employee_id = uniquenessResult.error!
      }
    }

    if (formData.national_id) {
      const nationalIdResult = Validators.validateIsraeliId(formData.national_id)
      if (!nationalIdResult.isValid) {
        errors.national_id = nationalIdResult.error!
      } else {
        const nationalIdUniquenessResult = await UniquenessValidator.validateNationalIdUniqueness(
          formData.national_id, 'lecturers', excludeId
        )
        if (!nationalIdUniquenessResult.isValid) {
          errors.national_id = nationalIdUniquenessResult.error!
        }
      }
    }

    const emailResult = Validators.validateEmail(formData.email)
    if (!emailResult.isValid) {
      errors.email = emailResult.error!
    } else {
      const emailUniquenessResult = await UniquenessValidator.validateEmailUniqueness(
        formData.email, 'lecturers', excludeId
      )
      if (!emailUniquenessResult.isValid) {
        errors.email = emailUniquenessResult.error!
      }
    }

    if (formData.phone) {
      const phoneResult = Validators.validatePhone(formData.phone)
      if (!phoneResult.isValid) {
        errors.phone = phoneResult.error!
      }
    }

    const tracksResult = Validators.validateAcademicTracks(formData.academic_track_ids)
    if (!tracksResult.isValid) {
      errors.academic_track_ids = tracksResult.error!
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Real-time field validation for UI feedback
  static validateField(fieldName: string, value: any, additionalData?: any): ValidationResult {
    switch (fieldName) {
      case 'full_name':
      case 'firstName':
      case 'lastName':
      case 'courseName':
        return Validators.validateHebrewName(value)
      
      case 'email':
        return Validators.validateEmail(value)
      
      case 'phone':
        return Validators.validatePhone(value)
      
      case 'national_id':
      case 'id':
        return Validators.validateIsraeliId(value)
      
      case 'student_id':
      case 'studentId':
        return Validators.validateStudentId(value)
      
      case 'employee_id':
      case 'employeeId':
        return Validators.validateEmployeeId(value)
      
      case 'courseCode':
        return Validators.validateCourseCode(value)
      
      case 'academicYear':
        return Validators.validateAcademicYear(value)
      
      case 'academicLevel':
        return Validators.validateAcademicLevel(value)
      
      case 'semester':
        return Validators.validateSemester(value)
      
      case 'studyYear':
        return Validators.validateStudyYear(value)
      
      case 'password':
        return Validators.validatePassword(value)
      
      case 'fileName':
        return Validators.validateFileName(value)
      
      case 'academic_track_ids':
      case 'academicTracks':
        return Validators.validateAcademicTracks(value)
      
      default:
        return { isValid: true }
    }
  }

  static validateLogin(data: {
    email: string
    password: string
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    const emailResult = Validators.validateEmail(data.email)
    if (!emailResult.isValid) errors.email = emailResult.error!

    if (!data.password || data.password.trim().length === 0) {
      errors.password = 'סיסמה היא שדה חובה'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  static validateFileUpload(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    const fileValidation = FileValidator.validateFileUpload(file)
    if (!fileValidation.isValid && fileValidation.error) {
      errors.push(fileValidation.error)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
} 