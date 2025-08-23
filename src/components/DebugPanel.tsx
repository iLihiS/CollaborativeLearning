import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Paper,
  Chip
} from '@mui/material';
import { ExpandMore, Refresh, Delete } from '@mui/icons-material';
import { LocalStorageService } from '@/services/localStorage';

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>({});

  const loadData = () => {
    LocalStorageService.initializeData();
    setData({
      students: LocalStorageService.getStudents(),
      lecturers: LocalStorageService.getLecturers(),
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
          bottom: 20,
          right: 20,
          zIndex: 9999
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
        right: 20,
        width: 400,
        maxHeight: '70vh',
        overflow: 'auto',
        zIndex: 9999
      }}
    >
      <Paper elevation={8} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">🔍 Debug Panel</Typography>
          <Button size="small" onClick={() => setIsOpen(false)}>✕</Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<Refresh />} onClick={loadData}>
            רענן
          </Button>
          <Button size="small" onClick={exportData}>
            ייצא
          </Button>
          <Button size="small" startIcon={<Delete />} onClick={clearAllData} color="error">
            מחק הכל
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`👥 ${data.students?.length || 0} סטודנטים`} size="small" />
          <Chip label={`🎓 ${data.lecturers?.length || 0} מרצים`} size="small" />
          <Chip label={`📚 ${data.courses?.length || 0} קורסים`} size="small" />
          <Chip label={`📁 ${data.files?.length || 0} קבצים`} size="small" />
          <Chip label={`💬 ${data.messages?.length || 0} הודעות`} size="small" />
          <Chip label={`🔔 ${data.notifications?.length || 0} התראות`} size="small" />
        </Box>

        {Object.entries(data).map(([key, value]) => (
          <Accordion key={key}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2">
                {key === 'students' && '👥 סטודנטים'}
                {key === 'lecturers' && '🎓 מרצים'}
                {key === 'courses' && '📚 קורסים'}
                {key === 'files' && '📁 קבצים'}
                {key === 'messages' && '💬 הודעות'}
                {key === 'notifications' && '🔔 התראות'}
                {key === 'userSession' && '👤 סשן משתמש'}
                {' '}({Array.isArray(value) ? value.length : value ? 1 : 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                <pre style={{ fontSize: '10px', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
}; 