
import { useState, useEffect } from 'react';
import { File as FileEntity, Course, Student, Lecturer, User } from '@/api/entities';
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Button, Avatar
} from '@mui/material';
import { Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type File = {
    id: string;
    title: string;
    description: string;
    course_id: string;
    status: 'approved' | 'pending' | 'rejected';
    created_date: string;
    updated_date: string;
    file_type: string;
    uploader_id: string;
    file_url: string;
};

type Course = {
    id: string;
    course_name: string;
};

type Student = {
    id: string;
    full_name: string;
};

export default function LecturerApprovedFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<{ [key: string]: Course }>({});
  const [students, setStudents] = useState<{ [key: string]: Student }>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      console.log('Current user:', user);
      setCurrentUser(user);

      const allFiles = await FileEntity.filter({ status: 'approved' });
      console.log('All approved files:', allFiles);
      let relevantFiles = allFiles;

      if (user.current_role !== 'admin') {
        // Find lecturer by email instead of user_id
        const lecturerRecord = await Lecturer.filter({ email: user.email });
        console.log('Lecturer record:', lecturerRecord);
        if (lecturerRecord.length > 0) {
          const lecturerFullName = lecturerRecord[0].full_name;
          // Find courses by lecturer name
          const lecturerCourses = await Course.filter({ lecturer: lecturerFullName });
          console.log('Lecturer courses:', lecturerCourses);
          const lecturerCourseIds = lecturerCourses.map((c: Course) => c.id);
          relevantFiles = allFiles.filter((file: File) => lecturerCourseIds.includes(file.course_id));
        } else {
          relevantFiles = [];
        }
      }
      
      console.log('Relevant files:', relevantFiles);
      setFiles(relevantFiles);
      
      const [courseList, studentList] = await Promise.all([Course.list(), Student.list()]);
      
      const courseMap = courseList.reduce((acc: { [key: string]: Course }, course: Course) => ({...acc, [course.id]: course }), {});
      const studentMap = studentList.reduce((acc: { [key: string]: Student }, student: Student) => ({...acc, [student.id]: student }), {});
      
      setCourses(courseMap);
      setStudents(studentMap);

    } catch (error) {
      console.error("Failed to load data:", error);
      setFiles([]);
      setCourses({});
      setStudents({});
    }
    setLoading(false);
  };
  
  const handleDownload = async (file: File) => {
    try {
      const currentDownloadCount = (file as any).download_count || 0;
      await FileEntity.update(file.id, { download_count: currentDownloadCount + 1 });
      
      // For demo purposes, just show an alert instead of opening a file
      alert(`הורדת הקובץ: ${file.title}`);
      // window.open(file.file_url, '_blank');
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("שגיאה בהורדת הקובץ");
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}><CheckCircle /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">קבצים שאושרו</Typography>
            <Typography color="text.secondary">רשימת כל חומרי הלימוד שאושרו</Typography>
          </Box>
        </Box>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם קובץ</TableCell>
                <TableCell>קורס</TableCell>
                <TableCell>תאריך אישור</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.length > 0 ? (
                files.map(file => (
                  <TableRow key={file.id} hover>
                    <TableCell>{file.title}</TableCell>
                    <TableCell>{courses[file.course_id]?.course_name || 'לא ידוע'}</TableCell>
                    <TableCell>{format(new Date(file.updated_date), 'd MMM yyyy', { locale: he })}</TableCell>
                    <TableCell align="left">
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleDownload(file)}
                      >
                        הורדה
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <CheckCircle size={60} color="grey.300" />
                      <Typography variant="h6">אין קבצים מאושרים</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
