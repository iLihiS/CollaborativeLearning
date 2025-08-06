import { useState, useEffect } from 'react';
import { User, Lecturer, File, Course } from '@/api/entities';
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Button, IconButton, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { Check, X, FileText, CheckSquare, Download } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function LecturerPendingFiles() {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [fileToActOn, setFileToActOn] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      
      const [allFiles, allCourses] = await Promise.all([
          File.filter({ status: 'pending' }),
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

      setPendingFiles(filesToDisplay);

      const cMap = allCourses.reduce((acc, course) => {
          acc[course.id] = course.course_name;
          return acc;
      }, {});
      setCoursesMap(cMap);
    } catch (error) {
      console.error("Error loading lecturer dashboard:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (fileId) => {
    try {
      await File.update(fileId, { status: 'approved' });
      setPendingFiles(pendingFiles.filter(f => f.id !== fileId));
    } catch(error) {
      console.error(`Failed to approve file:`, error);
      alert(`שגיאה באישור הקובץ.`);
    }
  };

  const handleOpenRejectDialog = (file) => {
    setFileToActOn(file);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!fileToActOn) return;
    try {
      await File.update(fileToActOn.id, { 
        status: 'rejected',
        lecturer_notes: rejectionReason 
      });
      setPendingFiles(pendingFiles.filter(f => f.id !== fileToActOn.id));
      setIsRejectDialogOpen(false);
      setFileToActOn(null);
    } catch(error) {
      console.error(`Failed to reject file:`, error);
      alert(`שגיאה בדחיית הקובץ.`);
    }
  };
  
  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
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
                <TableCell>שם קובץ</TableCell>
                <TableCell>קורס</TableCell>
                <TableCell>הועלה בתאריך</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : pendingFiles.length > 0 ? (
                pendingFiles.map(file => (
                  <TableRow key={file.id} hover>
                    <TableCell>{file.title}</TableCell>
                    <TableCell>{coursesMap[file.course_id] || 'לא ידוע'}</TableCell>
                    <TableCell>{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                    <TableCell align="left">
                      <IconButton component="a" href={file.file_url} target="_blank" rel="noopener noreferrer"><Download /></IconButton>
                      <IconButton onClick={() => handleApprove(file.id)} color="success"><Check /></IconButton>
                      <IconButton onClick={() => handleOpenRejectDialog(file)} color="error"><X /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <FileText sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                      <Typography variant="h6">אין קבצים הממתינים לאישור</Typography>
                      <Typography color="text.secondary">כל הקבצים טופלו. עבודה טובה!</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isRejectDialogOpen} onClose={() => setIsRejectDialogOpen(false)}>
        <DialogTitle>דחיית קובץ</DialogTitle>
        <DialogContent>
          <Typography>
            הקובץ &quot;{fileToActOn?.title}&quot; יידחה. ניתן להוסיף סיבה לדחייה (אופציונלי).
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
          <Button onClick={() => setIsRejectDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleRejectSubmit} color="error">דחה קובץ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
