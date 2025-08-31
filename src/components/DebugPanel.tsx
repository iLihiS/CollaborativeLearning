import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { ExpandMore, Refresh, Delete, CleaningServices, DeleteForever } from '@mui/icons-material';
import { LocalStorageService } from '@/services/localStorage';

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>({});

  const loadData = () => {
    LocalStorageService.initializeData();
    
    // Get admins from users
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const admins = users.filter((user: any) => user.roles && user.roles.includes('admin'));
    
    setData({
      students: LocalStorageService.getStudents(),
      lecturers: LocalStorageService.getLecturers(),
      admins: admins,
      courses: LocalStorageService.getCourses(),
      files: LocalStorageService.getFiles(),
      messages: LocalStorageService.getMessages(),
      notifications: LocalStorageService.getNotifications(),
      userSession: LocalStorageService.getUserSession()
    });
  };

  const clearAllData = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים?')) {
      LocalStorageService.clearAllData();
      setData({});
      window.location.reload();
    }
  };

  const refreshAllData = () => {
    if (confirm('האם אתה בטוח שברצונך לרענן את כל הנתונים? זה יחליף את כל הנתונים הקיימים בנתונים חדשים.')) {
      LocalStorageService.refreshAllData();
      loadData();
      alert('כל הנתונים רוענו בהצלחה עם מידע חדש!');
    }
  };

  const emergencyRestore = () => {
    if (confirm('האם אתה בטוח שברצונך לשחזר את כל הנתונים? זה ישחזר נתונים בסיסיים במקרה שמשהו השתבש.')) {
      // Clear everything and reinitialize
      LocalStorageService.clearAllData();
      LocalStorageService.initializeData();
      loadData();
      alert('הנתונים שוחזרו בהצלחה! העמוד יתרענן כעת.');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

    const cleanEntity = (entityType: string) => {
    const entityNames = {
      students: 'סטודנטים',
      lecturers: 'מרצים',
      admins: 'מנהלים',
      courses: 'קורסים', 
      files: 'קבצים',
      messages: 'הודעות',
      notifications: 'התראות'
    };
    
    const entityName = entityNames[entityType as keyof typeof entityNames];
    if (confirm(`האם אתה בטוח שברצונך לנקות כפילויות ב${entityName}?`)) {
      if (entityType === 'students') {
        LocalStorageService.removeDuplicateStudents();
      }
      // Add other entity cleaning logic here when needed
      loadData();
      alert(`כפילויות ב${entityName} הוסרו בהצלחה!`);
    }
  };

  const removeInvalidRecords = (entityType: string) => {
    const entityNames = {
      students: 'סטודנטים',
      lecturers: 'מרצים',
      admins: 'מנהלים',
      courses: 'קורסים', 
      files: 'קבצים',
      messages: 'הודעות',
      notifications: 'התראות'
    };
    
    const entityName = entityNames[entityType as keyof typeof entityNames];
    if (confirm(`האם אתה בטוח שברצונך להסיר רשומות לא תקינות של ${entityName}?`)) {
      if (entityType === 'students') {
        LocalStorageService.removeStudentsWithoutNationalId();
      } else if (entityType === 'courses') {
        // Fix courses without proper academic_track_ids
        const courses = LocalStorageService.getCourses();
        const updatedCourses = courses.map((course: any) => {
          if (!course.academic_track_ids || course.academic_track_ids.length === 0) {
            let defaultTrack = 'cs-undergrad';
            if (course.course_code || course.code) {
              const code = course.course_code || course.code;
              if (code.startsWith('CS')) defaultTrack = 'cs-undergrad';
              else if (code.startsWith('SE')) defaultTrack = 'swe-undergrad';
              else if (code.startsWith('MATH')) defaultTrack = 'math-undergrad';
              else if (code.startsWith('PHYS')) defaultTrack = 'physics-undergrad';
              else if (code.startsWith('LAW')) defaultTrack = 'law-undergrad';
              else if (code.startsWith('BUS')) defaultTrack = 'business-undergrad';
              else if (code.startsWith('PSY')) defaultTrack = 'psychology-undergrad';
            }
            return { ...course, academic_track_ids: [defaultTrack] };
          }
          return course;
        });
        LocalStorageService.setCourses(updatedCourses);
      } else if (entityType === 'lecturers') {
        // Fix lecturers without academic tracks
        const lecturers = JSON.parse(localStorage.getItem('mock_lecturers') || '[]');
        const updatedLecturers = lecturers.map((lecturer: any) => {
          if (!lecturer.academic_track_ids || lecturer.academic_track_ids.length === 0) {
            // Assign default academic track
            const defaultTrack = 'cs-undergrad';
            console.log(`⚠️ Fixing lecturer ${lecturer.full_name} - assigning default track: ${defaultTrack}`);
            return { ...lecturer, academic_track_ids: [defaultTrack] };
          }
          return lecturer;
        });
        localStorage.setItem('mock_lecturers', JSON.stringify(updatedLecturers));
      } else if (entityType === 'admins') {
        // Fix admins without admin_id
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const admins = users.filter((user: any) => user.roles && user.roles.includes('admin'));
        let nextAdminNumber = 1;
        
        const updatedAdmins = admins.map((admin: any) => {
          if (!admin.admin_id) {
            const generatedId = `ADM${nextAdminNumber.toString().padStart(4, '0')}`;
            nextAdminNumber++;
            console.log(`⚠️ Fixing admin ${admin.full_name} - assigning admin ID: ${generatedId}`);
            return { ...admin, admin_id: generatedId };
          }
          return admin;
        });
        
        // Update the users array with fixed admins
        const updatedUsers = users.map((user: any) => {
          if (user.roles && user.roles.includes('admin')) {
            const fixedAdmin = updatedAdmins.find((a: any) => a.id === user.id);
            return fixedAdmin || user;
          }
          return user;
        });
        
        localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
      } else if (entityType === 'files') {
        // Remove files without file_code or other required fields
        const files = LocalStorageService.getFiles();
        console.log(`🔍 Checking ${files.length} files for validity...`);
        
        // Show statistics before filtering
        const filesWithoutCode = files.filter(f => !f.file_code || f.file_code.trim() === '').length;
        const filesWithoutCourse = files.filter(f => !f.course_id || f.course_id.trim() === '').length;
        const filesWithoutUploader = files.filter(f => !f.uploader_id || f.uploader_id.trim() === '').length;
        const filesWithoutType = files.filter(f => !f.uploader_type || !['student', 'lecturer', 'admin'].includes(f.uploader_type)).length;
        const filesWithoutStatus = files.filter(f => !f.status || !['pending', 'approved', 'rejected'].includes(f.status)).length;
        
        console.log(`📊 Files without file_code: ${filesWithoutCode}`);
        console.log(`📊 Files without course_id: ${filesWithoutCourse}`);
        console.log(`📊 Files without uploader_id: ${filesWithoutUploader}`);
        console.log(`📊 Files without valid uploader_type: ${filesWithoutType}`);
        console.log(`📊 Files without valid status: ${filesWithoutStatus}`);
        
        const validFiles = files.filter((file: any) => {
          let isValid = true;
          let invalidReasons = [];
          
          // Check if file has a name
          const fileName = file.original_name || file.filename || file.title;
          if (!fileName || fileName.trim() === '') {
            invalidReasons.push('no name');
            isValid = false;
          }
          
          // Only check file_code if it's really critical - many old files might not have it
          // if (!file.file_code || file.file_code.trim() === '') {
          //   invalidReasons.push('no file_code');
          //   isValid = false;
          // }
          
          // Check if file has required fields
          if (!file.course_id || file.course_id.trim() === '') {
            invalidReasons.push('no course_id');
            isValid = false;
          }
          
          if (!file.uploader_id || file.uploader_id.trim() === '') {
            invalidReasons.push('no uploader_id');
            isValid = false;
          }
          
          // Be more lenient with uploader_type - fix instead of remove
          if (!file.uploader_type || !['student', 'lecturer', 'admin'].includes(file.uploader_type)) {
            // Don't remove, just log for fixing
            console.log(`⚠️ File with invalid uploader_type (will be fixed): ${fileName || 'Unknown'} (type: ${file.uploader_type})`);
          }
          
          // Be more lenient with status - fix instead of remove
          if (!file.status || !['pending', 'approved', 'rejected'].includes(file.status)) {
            // Don't remove, just log for fixing
            console.log(`⚠️ File with invalid status (will be fixed): ${fileName || 'Unknown'} (status: ${file.status})`);
          }
          
          if (!isValid) {
            console.log(`⚠️ Removing file due to: ${invalidReasons.join(', ')}: ${fileName || file.id || 'Unknown'}`);
          }
          
          return isValid;
        });
        
        // Fix files with missing or invalid data instead of removing them
        const fixedFiles = validFiles.map((file: any) => {
          let fixedFile = { ...file };
          let wasFixed = false;
          
          // Fix missing file_code
          if (!file.file_code || file.file_code.trim() === '') {
            const fileName = file.original_name || file.filename || file.title || 'Unknown';
            const fileType = file.file_type || 'other';
            const typePrefixMap: { [key: string]: string } = {
              'note': 'N',
              'exam': 'E', 
              'formulas': 'F',
              'assignment': 'A',
              'other': 'O'
            };
            const typePrefix = typePrefixMap[fileType] || 'O';
            
            fixedFile.file_code = `FILE-${typePrefix}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            console.log(`🔧 Fixed file_code for: ${fileName} -> ${fixedFile.file_code}`);
            wasFixed = true;
          }
          
          // Fix missing uploader_type
          if (!file.uploader_type || !['student', 'lecturer', 'admin'].includes(file.uploader_type)) {
            fixedFile.uploader_type = 'student'; // Default to student
            console.log(`🔧 Fixed uploader_type for: ${file.original_name || file.filename || file.id} -> student`);
            wasFixed = true;
          }
          
          // Fix missing status
          if (!file.status || !['pending', 'approved', 'rejected'].includes(file.status)) {
            fixedFile.status = 'pending'; // Default to pending
            console.log(`🔧 Fixed status for: ${file.original_name || file.filename || file.id} -> pending`);
            wasFixed = true;
          }
          
          // Add missing timestamps if needed
          if (!file.created_at) {
            fixedFile.created_at = new Date().toISOString();
            wasFixed = true;
          }
          
          if (!file.updated_at) {
            fixedFile.updated_at = new Date().toISOString();
            wasFixed = true;
          }
          
          return fixedFile;
        });
        
        if (validFiles.length !== files.length) {
          console.log(`🗑️ Removed ${files.length - validFiles.length} truly invalid files out of ${files.length} total files`);
          console.log(`🔧 Fixed and kept ${validFiles.length} files`);
          LocalStorageService.setFiles(fixedFiles);
        } else {
          console.log('✅ No invalid files found - all files are valid');
          // Still save the fixed files in case some were repaired
          LocalStorageService.setFiles(fixedFiles);
        }
      } else if (entityType === 'messages') {
        // Remove messages without required fields
        const messages = LocalStorageService.getMessages();
        const validMessages = messages.filter((message: any) => {
          let isValid = true;
          
          if (!message.subject || message.subject.trim() === '') {
            console.log(`⚠️ Removing message without subject: ${message.id || 'Unknown'}`);
            isValid = false;
          }
          
          if (!message.content || message.content.trim() === '') {
            console.log(`⚠️ Removing message without content: ${message.id || 'Unknown'}`);
            isValid = false;
          }
          
          if (!message.sender_name || message.sender_name.trim() === '') {
            console.log(`⚠️ Removing message without sender_name: ${message.id || 'Unknown'}`);
            isValid = false;
          }
          
          return isValid;
        });
        
        if (validMessages.length !== messages.length) {
          console.log(`🗑️ Removed ${messages.length - validMessages.length} invalid messages`);
          LocalStorageService.setMessages(validMessages);
        } else {
          console.log('✅ No invalid messages found');
        }
      } else if (entityType === 'notifications') {
        // Remove notifications without required fields
        const notifications = LocalStorageService.getNotifications();
        const validNotifications = notifications.filter((notification: any) => {
          let isValid = true;
          
          if (!notification.message || notification.message.trim() === '') {
            console.log(`⚠️ Removing notification without message: ${notification.id || 'Unknown'}`);
            isValid = false;
          }
          
          if (!notification.user_id || notification.user_id.trim() === '') {
            console.log(`⚠️ Removing notification without user_id: ${notification.id || 'Unknown'}`);
            isValid = false;
          }
          
          return isValid;
        });
        
        if (validNotifications.length !== notifications.length) {
          console.log(`🗑️ Removed ${notifications.length - validNotifications.length} invalid notifications`);
          LocalStorageService.setNotifications(validNotifications);
        } else {
          console.log('✅ No invalid notifications found');
        }
      }
      // Add other entity validation logic here when needed
      loadData();
      alert(`רשומות לא תקינות של ${entityName} הוסרו בהצלחה!`);
    }
  };

  const clearEntityData = (entityType: string) => {
    const entityNames = {
      students: 'סטודנטים',
      lecturers: 'מרצים',
      admins: 'מנהלים',
      courses: 'קורסים',
      files: 'קבצים', 
      messages: 'הודעות',
      notifications: 'התראות'
    };
    
    const entityName = entityNames[entityType as keyof typeof entityNames];
    if (confirm(`האם אתה בטוח שברצונך למחוק את כל ה${entityName}?`)) {
      // Clear specific entity data
      const key = `app_${entityType}`;
      localStorage.removeItem(key);
      loadData();
      alert(`כל ה${entityName} נמחקו בהצלחה!`);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'localStorage-data.json';
    link.click();
  };

  React.useEffect(() => {
    loadData();
  }, []);

  if (!isOpen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 10,
          left: 20,
          zIndex: 999
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsOpen(true)}
          size="small"
        >
          🔍 Debug
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        width: 400,
        maxHeight: '70vh',
        overflow: 'auto',
        zIndex: 999
      }}
    >
      <Paper elevation={8} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">🔍 Debug Panel</Typography>
          <Button size="small" onClick={() => setIsOpen(false)}>✕</Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Tooltip title="טוען מחדש את כל הנתונים מה-localStorage">
            <Button size="small" startIcon={<Refresh />} onClick={loadData}>
              רענן
            </Button>
          </Tooltip>
          <Tooltip title="מייצא את כל הנתונים לקובץ JSON">
            <Button size="small" onClick={exportData}>
              ייצא
            </Button>
          </Tooltip>
          <Tooltip title="יוצר נתונים חדשים עם קבצים בכל הסטטוסים (ממתין/מאושר/נדחה)">
            <Button size="small" startIcon={<Refresh />} onClick={refreshAllData} color="success">
              רענן נתונים
            </Button>
          </Tooltip>
          <Tooltip title="שחזור חירום - משחזר נתונים בסיסיים במקרה של בעיה">
            <Button size="small" onClick={emergencyRestore} color="warning">
              שחזור חירום
            </Button>
          </Tooltip>
          <Tooltip title="מוחק את כל הנתונים מה-localStorage (פעולה בלתי הפיכה!)">
            <Button size="small" startIcon={<Delete />} onClick={clearAllData} color="error">
              מחק הכל
            </Button>
          </Tooltip>
        </Box>



        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`👥 ${data.students?.length || 0} סטודנטים`} size="small" />
          <Chip label={`🎓 ${data.lecturers?.length || 0} מרצים`} size="small" />
          <Chip label={`🛡️ ${data.admins?.length || 0} מנהלים`} size="small" />
          <Chip label={`📚 ${data.courses?.length || 0} קורסים`} size="small" />
          <Chip label={`📁 ${data.files?.length || 0} קבצים`} size="small" />
          <Chip label={`💬 ${data.messages?.length || 0} הודעות`} size="small" />
          <Chip label={`🔔 ${data.notifications?.length || 0} התראות`} size="small" />
        </Box>

        {Object.entries(data).map(([key, value]) => {
          const entityIcons = {
            students: '👥',
            lecturers: '🎓',
            admins: '🛡️',
            courses: '📚',
            files: '📁',
            messages: '💬',
            notifications: '🔔',
            userSession: '👤'
          };
          
          const entityNames = {
            students: 'סטודנטים',
            lecturers: 'מרצים',
            admins: 'מנהלים',
            courses: 'קורסים', 
            files: 'קבצים',
            messages: 'הודעות',
            notifications: 'התראות',
            userSession: 'סשן משתמש'
          };

          const icon = entityIcons[key as keyof typeof entityIcons] || '📄';
          const name = entityNames[key as keyof typeof entityNames] || key;
          const count = Array.isArray(value) ? value.length : value ? 1 : 0;
          const isManageable = key !== 'userSession'; // Don't show actions for user session

          return (
            <Accordion key={key}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Typography variant="body2">
                    {icon} {name} ({count})
                  </Typography>
                  {isManageable && (
                    <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="נקה כפילויות" sx={{ zIndex: 1000 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => cleanEntity(key)}
                          color="warning"
                        >
                          <CleaningServices fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="הסר רשומות לא תקינות" sx={{ zIndex: 1000 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => removeInvalidRecords(key)}
                          color="error"
                        >
                          <DeleteForever fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="מחק את כל רשומות הישות" sx={{ zIndex: 1000 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => clearEntityData(key)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ fontSize: '10px', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Paper>
    </Box>
  );
}; 