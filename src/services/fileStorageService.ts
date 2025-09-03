import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  getMetadata,
  listAll
} from 'firebase/storage';
import { storage } from '@/config/firebase';
import { FirestoreService } from './firestoreService';

export interface FileUploadResult {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  download_url: string;
  storage_path: string;
  uploader_id: string;
  uploader_type: 'student' | 'lecturer' | 'admin';
  course_id: string;
  created_at: string;
}

export class FileStorageService {
  
  /**
   * העלאת קובץ ל-Firebase Storage ושמירת המידע ב-Firestore
   */
  static async uploadFile(
    file: File,
    courseId: string,
    uploaderId: string,
    uploaderType: 'student' | 'lecturer' | 'admin'
  ): Promise<FileUploadResult> {
    try {
      console.log(`📤 מעלה קובץ: ${file.name} (${file.size} bytes)`);
      
      // יצירת שם ייחודי לקובץ
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop();
      const filename = `${timestamp}_${randomId}.${fileExtension}`;
      
      // יצירת נתיב בStorage
      const storagePath = `courses/${courseId}/files/${filename}`;
      const storageRef = ref(storage, storagePath);
      
      // העלאת הקובץ
      console.log(`☁️ מעלה ל-Storage: ${storagePath}`);
      const uploadResult = await uploadBytes(storageRef, file);
      
      // קבלת URL להורדה
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log(`✅ קובץ הועלה בהצלחה: ${downloadURL}`);
      
      // יצירת מידע הקובץ לFirestore
      const fileData = {
        filename: filename,
        original_name: file.name,
        file_type: file.type || this.getFileTypeFromExtension(fileExtension || ''),
        file_size: file.size,
        download_url: downloadURL,
        storage_path: storagePath,
        course_id: courseId,
        uploader_id: uploaderId,
        uploader_type: uploaderType,
        status: 'pending' as const, // כל קובץ חדש מתחיל במצב pending
        download_count: 0,
        tags: [] as string[]
      };
      
      // שמירה ב-Firestore
      console.log(`💾 שומר מידע ב-Firestore...`);
      const savedFile = await FirestoreService.addFile(fileData);
      
      const result: FileUploadResult = {
        id: savedFile.id,
        filename: savedFile.filename,
        original_name: savedFile.original_name,
        file_type: savedFile.file_type,
        file_size: savedFile.file_size,
        download_url: downloadURL,
        storage_path: storagePath,
        uploader_id: uploaderId,
        uploader_type: uploaderType,
        course_id: courseId,
        created_at: savedFile.created_at
      };
      
      console.log(`🎉 קובץ נשמר בהצלחה עם ID: ${result.id}`);
      return result;
      
    } catch (error) {
      console.error('❌ שגיאה בהעלאת קובץ:', error);
      throw error;
    }
  }
  
  /**
   * מחיקת קובץ מ-Storage ומ-Firestore
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      console.log(`🗑️ מוחק קובץ: ${fileId}`);
      
      // קבלת מידע הקובץ מFirestore
      const files = await FirestoreService.getFiles();
      const fileInfo = files.find(f => f.id === fileId);
      
      if (!fileInfo) {
        console.error(`❌ קובץ לא נמצא: ${fileId}`);
        return false;
      }
      
      // מחיקה מStorage (אם יש storage_path)
      if (fileInfo.storage_path) {
        try {
          const storageRef = ref(storage, fileInfo.storage_path);
          await deleteObject(storageRef);
          console.log(`✅ קובץ נמחק מ-Storage: ${fileInfo.storage_path}`);
        } catch (storageError) {
          console.warn(`⚠️ לא ניתן למחוק מ-Storage (ייתכן שכבר נמחק): ${storageError}`);
        }
      }
      
      // מחיקה מFirestore
      const deleted = await FirestoreService.deleteFile(fileId);
      
      if (deleted) {
        console.log(`✅ קובץ נמחק בהצלחה: ${fileId}`);
        return true;
      } else {
        console.error(`❌ כשלון במחיקת קובץ מFirestore: ${fileId}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ שגיאה במחיקת קובץ:', error);
      return false;
    }
  }
  
  /**
   * קבלת URL להורדה של קובץ (refresh אם נדרש)
   */
  static async getFileDownloadUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('❌ שגיאה בקבלת URL להורדה:', error);
      throw error;
    }
  }
  
  /**
   * קבלת מידע על קובץ ב-Storage
   */
  static async getFileMetadata(storagePath: string) {
    try {
      const storageRef = ref(storage, storagePath);
      const metadata = await getMetadata(storageRef);
      return metadata;
    } catch (error) {
      console.error('❌ שגיאה בקבלת metadata:', error);
      throw error;
    }
  }
  
  /**
   * רשימת כל הקבצים בתיקיית קורס
   */
  static async listCourseFiles(courseId: string) {
    try {
      const courseFolderRef = ref(storage, `courses/${courseId}/files/`);
      const listResult = await listAll(courseFolderRef);
      
      const filePromises = listResult.items.map(async (itemRef) => {
        const metadata = await getMetadata(itemRef);
        const downloadURL = await getDownloadURL(itemRef);
        
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          downloadURL,
          metadata
        };
      });
      
      return await Promise.all(filePromises);
    } catch (error) {
      console.error('❌ שגיאה ברשימת קבצי קורס:', error);
      throw error;
    }
  }
  
  /**
   * ולידציה של קובץ לפני העלאה
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // בדיקת גודל (מקסימום 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `קובץ גדול מדי. מקסימום: 50MB`
      };
    }
    
    // בדיקת סוג קובץ מותר
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `סוג קובץ לא נתמך: ${file.type}`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * זיהוי סוג קובץ לפי סיומת
   */
  private static getFileTypeFromExtension(extension: string): string {
    const typeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    
    return typeMap[extension.toLowerCase()] || 'application/octet-stream';
  }
}

// חשיפה לקונסול לצורכי debug
if (typeof window !== 'undefined') {
  (window as any).FileStorageService = FileStorageService;
  
  console.log('%c📁 FileStorageService available in console:', 'color: #FF9800; font-weight: bold; font-size: 14px;');
  console.log('- FileStorageService.uploadFile(file, courseId, uploaderId, uploaderType)');
  console.log('- FileStorageService.deleteFile(fileId)');
  console.log('- FileStorageService.validateFile(file)');
} 