
import { useState, useEffect } from 'react';
import { File as FileEntity, Course, Student } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Select, MenuItem, InputLabel, FormControl, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar
} from '@mui/material';
import { FileText, Trash2, Check, X, Download, Clock, ArrowRight } from 'lucide-react';
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
      const [fileList, courseList, studentList] = await Promise.all([FileEntity.list(), Course.list(), Student.list()]);
      setFiles(fileList);
      // Re-apply filter after files are loaded, triggering the useEffect
      if (statusFilter === 'all') {
        setFilteredFiles(fileList);
      } else {
        setFilteredFiles(fileList.filter((file: FileInfo) => file.status === statusFilter));
      }

      const cMap = courseList.reduce((acc: { [key: string]: string }, c: CourseInfo) => ({ ...acc, [c.id]: c.course_name }), {});
      setCoursesMap(cMap);

      const sMap = studentList.reduce((acc: { [key: string]: string }, s: StudentInfo) => ({ ...acc, [s.id]: s.full_name }), {});
      setStudentsMap(sMap);
    } catch (error) {
      console.error("Error loading data:", error);
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

  const getStatusComponent = (status: 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'approved': return <Chip icon={<Check />} label="אושר" color="success" size="small" />;
      case 'rejected': return <Chip icon={<X />} label="נדחה" color="error" size="small" />;
      default: return <Chip icon={<Clock />} label="ממתין" color="warning" size="small" />;
    }
  };

  const getFileExtension = (url: string) => {
    if (!url) return '';
    const parts = url.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
  };

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        חזרה לפאנל הניהול
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><FileText /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול קבצים</Typography>
          </Box>
          <Typography color="text.secondary">צפייה וניהול של כל הקבצים שהועלו למערכת</Typography>
        </Box>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="status-filter-label">סנן לפי סטטוס</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="סנן לפי סטטוס"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">כל הסטטוסים</MenuItem>
            <MenuItem value="pending">ממתין</MenuItem>
            <MenuItem value="approved">מאושר</MenuItem>
            <MenuItem value="rejected">נדחה</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם קובץ</TableCell>
                <TableCell>קורס</TableCell>
                <TableCell>סוג</TableCell>
                <TableCell>תאריך העלאה</TableCell>
                <TableCell>מעלה הקובץ</TableCell>
                <TableCell>הורדות</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : filteredFiles.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>{file.title}</TableCell>
                  <TableCell>{coursesMap[file.course_id] || 'לא ידוע'}</TableCell>
                  <TableCell>{getFileExtension(file.file_url)}</TableCell>
                  <TableCell>{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                  <TableCell>{studentsMap[file.uploader_id] || 'לא ידוע'}</TableCell>
                  <TableCell>{file.download_count}</TableCell>
                  <TableCell>{getStatusComponent(file.status)}</TableCell>
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
