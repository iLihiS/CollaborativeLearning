
import { useState, useEffect, ChangeEvent } from 'react';
import { File as FileEntity, Course, Student } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, IconButton, CircularProgress, Chip, Avatar,
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { FileText, Trash2, Check, X, Download, Clock, ArrowRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type FileInfo = {
  id: string;
  title: string;
  course_id: string;
  file_url: string;
  created_date: string;
  uploader_id: string;
  download_count: number;
  status: 'approved' | 'rejected' | 'pending';
};

type CourseInfo = {
  id: string;
  course_name: string;
};

type StudentInfo = {
  id: string;
  full_name: string;
};

export default function AdminFileManagement() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [coursesMap, setCoursesMap] = useState<{ [key: string]: string }>({});
  const [studentsMap, setStudentsMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredFiles(files);
    } else {
      setFilteredFiles(files.filter(file => file.status === statusFilter));
    }
  }, [statusFilter, files]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fileList, courseList, studentList] = await Promise.all([
        FileEntity.list(), 
        Course.list(), 
        Student.list()
      ]);
      
      setFiles(Array.isArray(fileList) ? fileList : []);
      
      // Re-apply filter after files are loaded
      const validFiles = Array.isArray(fileList) ? fileList : [];
      if (statusFilter === 'all') {
        setFilteredFiles(validFiles);
      } else {
        setFilteredFiles(validFiles.filter((file: FileInfo) => file.status === statusFilter));
      }

      const cMap = (Array.isArray(courseList) ? courseList : []).reduce((acc: { [key: string]: string }, c: CourseInfo) => {
        if (c) acc[c.id] = c.course_name;
        return acc;
      }, {});
      setCoursesMap(cMap);

      const sMap = (Array.isArray(studentList) ? studentList : []).reduce((acc: { [key: string]: string }, s: StudentInfo) => {
        if (s) acc[s.id] = s.full_name;
        return acc;
      }, {});
      setStudentsMap(sMap);
    } catch (error) {
      console.error("Error loading data:", error);
      setFiles([]);
      setFilteredFiles([]);
      setCoursesMap({});
      setStudentsMap({});
    }
    setLoading(false);
  };
  
  const handleDelete = async (fileId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה?')) {
      try {
        await FileEntity.delete(fileId);
        loadData();
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert('שגיאה במחיקת הקובץ.');
      }
    }
  };

  const handleStatusChange = (event: any, newStatus: string) => {
    if (newStatus !== null) {
      setStatusFilter(newStatus);
    }
  };

  const getStatusComponent = (status: 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'approved':
        return <Chip label="מאושר" color="success" size="small" icon={<Check />} />;
      case 'rejected':
        return <Chip label="נדחה" color="error" size="small" icon={<X />} />;
      case 'pending':
        return <Chip label="ממתין" color="warning" size="small" icon={<Clock />} />;
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'לא ידוע';
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        בחזרה לפאנל הניהול
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><FileText /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול קבצים</Typography>
          </Box>
          <Typography color="text.secondary">צפייה, אישור ומחיקה של קבצים במערכת</Typography>
        </Box>
        
        <Button 
          component={Link} 
          to={createPageUrl("UploadFile")} 
          variant="contained" 
          startIcon={<Plus />}
        >
          הוסף קובץ חדש
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={handleStatusChange}
          aria-label="סינון לפי סטטוס"
          sx={{ 
            gap: 1,
            '& .MuiToggleButton-root': {
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              px: 3,
              py: 0.5,
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f3f4f6',
                borderColor: '#9ca3af'
              },
              '&.Mui-selected': {
                backgroundColor: '#84cc16',
                color: 'white',
                borderColor: '#65a30d',
                '&:hover': {
                  backgroundColor: '#65a30d'
                }
              }
            }
          }}
        >
          <ToggleButton value="all" aria-label="הכל">
            הכל
          </ToggleButton>
          <ToggleButton value="pending" aria-label="ממתין לאישור">
            ממתין לאישור
          </ToggleButton>
          <ToggleButton value="approved" aria-label="אושר">
            אושר
          </ToggleButton>
          <ToggleButton value="rejected" aria-label="נדחה">
            נדחה
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">שם קובץ</TableCell>
                <TableCell align="left">קורס</TableCell>
                <TableCell align="left">סוג</TableCell>
                <TableCell align="left">תאריך העלאה</TableCell>
                <TableCell align="left">מעלה הקובץ</TableCell>
                <TableCell align="left">הורדות</TableCell>
                <TableCell align="left">סטטוס</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredFiles) ? filteredFiles : []).map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell align="left">{file.title || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">{coursesMap[file.course_id] || 'קורס לא ידוע'}</TableCell>
                  <TableCell align="left">{getFileExtension(file.file_url)}</TableCell>
                  <TableCell>
                    {file.created_date ? 
                      format(new Date(file.created_date), 'd MMM yyyy', { locale: he }) : 
                      'תאריך לא ידוע'
                    }
                  </TableCell>
                  <TableCell align="left">{studentsMap[file.uploader_id] || 'מעלה לא ידוע'}</TableCell>
                  <TableCell align="left">{file.download_count || 0}</TableCell>
                  <TableCell align="left">{getStatusComponent(file.status)}</TableCell>
                  <TableCell align="left">
                    <IconButton component="a" href={file.file_url} target="_blank" rel="noopener noreferrer"><Download /></IconButton>
                    <IconButton onClick={() => handleDelete(file.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
