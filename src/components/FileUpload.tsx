import React, { useState, useRef } from 'react';
import { FileStorageService } from '@/services/fileStorageService';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
  courseId: string;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  courseId,
  onUploadComplete,
  onUploadError
}) => {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: null
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // בדיקת תקינות הקובץ
    const validation = FileStorageService.validateFile(file);
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        error: validation.error || 'קובץ לא תקין',
        success: null
      }));
      return;
    }

    setSelectedFile(file);
    setUploadState(prev => ({
      ...prev,
      error: null,
      success: null
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !session) {
      setUploadState(prev => ({
        ...prev,
        error: 'לא נבחר קובץ או אין משתמש מחובר'
      }));
      return;
    }

    try {
      setUploadState(prev => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: null,
        success: null
      }));

      // סימולציה של התקדמות (Firebase לא נותן התקדמות אמיתית)
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      // העלאת הקובץ
      const result = await FileStorageService.uploadFile(
        selectedFile,
        courseId,
        session.user.id,
        session.current_role as 'student' | 'lecturer' | 'admin'
      );

      clearInterval(progressInterval);

      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        success: `קובץ "${selectedFile.name}" הועלה בהצלחה!`
      });

      // איפוס בחירת הקובץ
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // קריאה לcallback
      onUploadComplete?.(result.id);

    } catch (error) {
      console.error('שגיאה בהעלאת קובץ:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'שגיאה לא ידועה בהעלאת קובץ';
      
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        success: null
      });

      onUploadError?.(errorMessage);
    }
  };

  const clearMessages = () => {
    setUploadState(prev => ({
      ...prev,
      error: null,
      success: null
    }));
  };

  return (
    <div style={{ 
      padding: '16px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      margin: '16px 0'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="file-upload" style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontWeight: 'bold' 
        }}>
          העלאת קובץ
        </label>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          onChange={handleFileSelect}
          disabled={uploadState.uploading}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        {selectedFile && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            נבחר: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {uploadState.uploading && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>מעלה קובץ...</p>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadState.progress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {uploadState.error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#d32f2f' }}>{uploadState.error}</span>
          <button 
            onClick={clearMessages}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#d32f2f'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {uploadState.success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e8f5e8',
          border: '1px solid #c8e6c9',
          borderRadius: '4px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#2e7d32' }}>{uploadState.success}</span>
          <button 
            onClick={clearMessages}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#2e7d32'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadState.uploading}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: (!selectedFile || uploadState.uploading) ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (!selectedFile || uploadState.uploading) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {uploadState.uploading ? 'מעלה...' : 'העלה קובץ'}
        </button>
        
        {selectedFile && (
          <button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              clearMessages();
            }}
            disabled={uploadState.uploading}
            style={{
              padding: '10px 16px',
              backgroundColor: uploadState.uploading ? '#ccc' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploadState.uploading ? 'not-allowed' : 'pointer'
            }}
          >
            ביטול
          </button>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>סוגי קבצים נתמכים: PDF, Word, PowerPoint, Excel, טקסט, תמונות</p>
        <p>גודל מקסימלי: 50MB</p>
      </div>
    </div>
  );
};

export default FileUpload; 