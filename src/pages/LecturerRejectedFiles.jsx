import { useState, useEffect } from 'react';
import { User, Lecturer, File, Course } from '@/api/entities';
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Avatar
} from '@mui/material';
import { XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function LecturerRejectedFiles() {
    const [rejectedFiles, setRejectedFiles] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();

      const [allFiles, allCourses] = await Promise.all([
          File.filter({ status: 'rejected' }),
          Course.list()
      ]);

      let filesToDisplay = allFiles;

      if (currentUser.current_role !== 'admin') {
        const lecturerRecords = await Lecturer.filter({ email: currentUser.email });
        const currentLecturer = lecturerRecords[0];

        if (currentLecturer) {
          const lecturerCourseIds = allCourses
            .filter(c => c.lecturer_id === currentLecturer.id)
            .map(c => c.id);
          filesToDisplay = allFiles.filter(f => lecturerCourseIds.includes(f.course_id));
        } else {
          filesToDisplay = [];
        }
      }

      setRejectedFiles(filesToDisplay);

      const cMap = allCourses.reduce((acc, course) => {
          acc[course.id] = course.course_name;
          return acc;
      }, {});
      setCoursesMap(cMap);
    } catch (error) {
      console.error("Error loading rejected files:", error);
    }
    setLoading(false);
  };

    return (
        <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}><XCircle /></Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">קבצים שנדחו</Typography>
                        <Typography color="text.secondary">רשימת כל חומרי הלימוד שנדחו</Typography>
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
                                <TableCell>תאריך דחייה</TableCell>
                                <TableCell>סיבת הדחייה</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                                </TableRow>
                            ) : rejectedFiles.length > 0 ? (
                                rejectedFiles.map(file => (
                                    <TableRow key={file.id} hover>
                                        <TableCell>{file.title}</TableCell>
                                        <TableCell>{coursesMap[file.course_id] || 'לא ידוע'}</TableCell>
                                        <TableCell>{format(new Date(file.updated_date), 'd MMM yyyy', { locale: he })}</TableCell>
                                        <TableCell>
                                            {file.lecturer_notes ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MessageSquare size={16} />
                                                    {file.lecturer_notes}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    לא צוינה סיבה
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <XCircle sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                                            <Typography variant="h6">אין קבצים שנדחו</Typography>
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
