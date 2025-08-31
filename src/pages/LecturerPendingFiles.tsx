import { useState, useEffect } from 'react';
import { File as FileEntity, Course, Student, Lecturer, User } from '@/api/entities';
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Button, IconButton, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, TextareaAutosize
} from '@mui/material';
import { Check, X, FileText, CheckSquare, Download } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type File = {
    id: string;
    title: string;
    description: string;
    course_id: string;
    status: 'approved' | 'pending' | 'rejected';
    created_date: string;
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

export default function LecturerPendingFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<{ [key: string]: Course }>({});
  const [students, setStudents] = useState<{ [key: string]: Student }>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rejectingFile, setRejectingFile] = useState<File | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const allFiles = await FileEntity.filter({ status: 'pending' });
      let relevantFiles = allFiles;

      if (user.current_role !== 'admin') {
        const lecturerRecord = await Lecturer.filter({ user_id: user.id });
        if (lecturerRecord.length > 0) {
          const lecturerCourseIds = (await Course.filter({ lecturer_id: lecturerRecord[0].id })).map((c: Course) => c.id);
          relevantFiles = allFiles.filter((file: File) => lecturerCourseIds.includes(file.course_id));
        } else {
          relevantFiles = [];
        }
      }
      
      setFiles(relevantFiles);
      
      const [courseList, studentList] = await Promise.all([Course.list(), Student.list()]);
      
      const courseMap = courseList.reduce((acc: { [key: string]: Course }, course: Course) => ({...acc, [course.id]: course }), {});
      const studentMap = studentList.reduce((acc: { [key: string]: Student }, student: Student) => ({...acc, [student.id]: student }), {});
      
      setCourses(courseMap);
      setStudents(studentMap);

    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (fileId: string) => {
    try {
      await FileEntity.update(fileId, { status: 'approved' });
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      console.error("Failed to approve file:", error);
    }
  };

  const handleOpenRejectDialog = (file: File) => {
    setRejectingFile(file);
  };

  const handleCloseRejectDialog = () => {
    setRejectingFile(null);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectingFile) return;
    try {
      await FileEntity.update(rejectingFile.id, { status: 'rejected', rejection_reason: rejectionReason });
      setFiles(files.filter(f => f.id !== rejectingFile.id));
      handleCloseRejectDialog();
    } catch (error) {
      console.error("Failed to reject file:", error);
    }
  };
  
  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><CheckSquare /></Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">קבצים ממתינים לאישור</Typography>
          <Typography color="text.secondary">ניהול ואישור קבצים הממתינים לבדיקה</Typography>
        </Box>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">שם קובץ</TableCell>
                <TableCell align="left">קורס</TableCell>
                <TableCell align="left">הועלה בתאריך</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : files.length > 0 ? (
                files.map(file => (
                  <TableRow key={file.id} hover>
                    <TableCell align="left">{file.title}</TableCell>
                    <TableCell align="left">{courses[file.course_id]?.course_name || 'לא ידוע'}</TableCell>
                    <TableCell align="left">
                      {file.created_date && !isNaN(new Date(file.created_date).getTime()) 
                        ? format(new Date(file.created_date), 'd MMM yyyy', { locale: he })
                        : 'תאריך לא תקין'
                      }
                    </TableCell>
                    <TableCell align="left">
                      <IconButton component="a" href={file.file_url} target="_blank" rel="noopener noreferrer"><Download /></IconButton>
                      <IconButton onClick={() => handleApprove(file.id)} color="success"><Check /></IconButton>
                      <IconButton onClick={() => handleOpenRejectDialog(file)} color="error"><X /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <FileText size={48} />
                          <Typography variant="h6">אין קבצים ממתינים לאישור</Typography>
                          <Typography color="text.secondary">קבצים חדשים שיועלו על ידי סטודנטים יופיעו כאן.</Typography>
                      </Box>
                  </TableCell>
              </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!rejectingFile} onClose={handleCloseRejectDialog}>
        <DialogTitle>דחיית קובץ</DialogTitle>
        <DialogContent>
          <Typography>
            הקובץ &quot;{rejectingFile?.title}&quot; יידחה. ניתן להוסיף סיבה לדחייה (אופציונלי).
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="סיבת הדחייה"
            type="text"
            fullWidth
            variant="standard"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>ביטול</Button>
          <Button onClick={handleReject} color="error">דחה קובץ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
