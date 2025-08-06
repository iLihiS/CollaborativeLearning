
import { useState, useEffect } from "react";
import { User, Student, File, Course, Lecturer } from "@/api/entities";
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Button, IconButton, Chip,
    Card, CardContent, CardActions, ToggleButtonGroup, ToggleButton, Avatar
} from '@mui/material';
import { FileText, Trash2, Clock, CheckCircle, XCircle, Plus, Filter, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const fileTypeToHebrew = {
  note: "הרצאות וסיכומים",
  exam: "מבחני תרגול",
  formulas: "דף נוסחאות",
  assignment: "מטלות",
  other: "אחר"
};

export default function MyFiles() {
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadMyFiles();
  }, []);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusFromUrl = urlParams.get('status');
    if (statusFromUrl && ['pending', 'approved', 'rejected'].includes(statusFromUrl)) {
      setFilter(statusFromUrl);
    } else {
        setFilter('all');
    }
  }, [location.search]);

  const loadMyFiles = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      let uploaderId = null;

      if (currentUser.current_role === 'student') {
          const students = await Student.filter({ email: currentUser.email });
          if (students.length > 0) {
              uploaderId = students[0].id;
          }
      } else if (currentUser.current_role === 'lecturer') {
          const lecturers = await Lecturer.filter({ email: currentUser.email });
          if (lecturers.length > 0) {
              uploaderId = lecturers[0].id;
          }
      }

      if (uploaderId) {
        const [userFiles, allCourses] = await Promise.all([
          File.filter({ uploader_id: uploaderId }, "-created_date"),
          Course.list()
        ]);
        
        const coursesMap = allCourses.reduce((acc, course) => {
          acc[course.id] = course;
          return acc;
        }, {});
        
        setFiles(userFiles);
        setCourses(coursesMap);
      } else {
        setFiles([]);
        setCourses({});
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
    setLoading(false);
  };
  
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      const url = newFilter === 'all' ? createPageUrl("MyFiles") : createPageUrl(`MyFiles?status=${newFilter}`);
      navigate(url, { replace: true });
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק קובץ זה?")) {
      try {
        await File.delete(fileId);
        setFiles(files.filter(f => f.id !== fileId));
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert("שגיאה במחיקת הקובץ.");
      }
    }
  };

  const getStatusComponent = (status) => {
    switch (status) {
      case 'approved': return <Chip icon={<CheckCircle />} label="אושר" color="success" size="small" />;
      case 'rejected': return <Chip icon={<XCircle />} label="נדחה" color="error" size="small" />;
      default: return <Chip icon={<Clock />} label="ממתין" color="warning" size="small" />;
    }
  };

  const filteredFiles = files.filter(file => filter === 'all' || file.status === filter);
  
  const emptyStateMessages = {
      all: 'עדיין לא העליתם קבצים.',
      pending: 'אין קבצים הממתינים לאישור.',
      approved: 'אין קבצים שאושרו.',
      rejected: 'אין קבצים שנדחו.'
  };

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><FileText /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">הקבצים שלי</Typography>
            <Typography color="text.secondary">נהלו את הקבצים שהעליתם למערכת</Typography>
          </Box>
        </Box>
        <Button component={Link} to={createPageUrl("UploadFile")} variant="contained" startIcon={<Plus />}>
          העלאת קובץ חדש
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Filter />
        <Typography>סנן לפי סטטוס:</Typography>
        <ToggleButtonGroup value={filter} exclusive onChange={handleFilterChange}>
          <ToggleButton value="all">הכל</ToggleButton>
          <ToggleButton value="pending">ממתין</ToggleButton>
          <ToggleButton value="approved">אושר</ToggleButton>
          <ToggleButton value="rejected">נדחה</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? <CircularProgress /> : (
        <>
          {/* Desktop Table View */}
          <Paper elevation={2} sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>שם הקובץ</TableCell>
                    <TableCell>קורס</TableCell>
                    <TableCell>סוג</TableCell>
                    <TableCell>תאריך העלאה</TableCell>
                    <TableCell>סטטוס</TableCell>
                    <TableCell align="left">פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>{file.title}</TableCell>
                      <TableCell>{courses[file.course_id]?.course_name || 'לא ידוע'}</TableCell>
                      <TableCell>{fileTypeToHebrew[file.file_type] || file.file_type}</TableCell>
                      <TableCell>{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                      <TableCell>{getStatusComponent(file.status)}</TableCell>
                      <TableCell align="left">
                        {file.status === 'pending' && (
                          <IconButton onClick={() => handleDelete(file.id)} color="error"><Trash2 /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">{emptyStateMessages[filter]}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, spaceY: 2 }}>
            {filteredFiles.length > 0 ? filteredFiles.map((file) => (
              <Card key={file.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{file.title}</Typography>
                    {getStatusComponent(file.status)}
                  </Box>
                  <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}><BookOpen size={16} /> {courses[file.course_id]?.course_name || 'לא ידוע'}</Typography>
                  <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FileText size={16} /> {fileTypeToHebrew[file.file_type] || file.file_type}</Typography>
                  <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Calendar size={16} /> {format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</Typography>
                </CardContent>
                {file.status === 'pending' && (
                  <CardActions>
                    <Button onClick={() => handleDelete(file.id)} color="error" startIcon={<Trash2 />}>מחיקה</Button>
                  </CardActions>
                )}
              </Card>
            )) : (
              <Typography sx={{ textAlign: 'center', py: 8 }}>{emptyStateMessages[filter]}</Typography>
            )}
          </Box>
        </>
      )}

      <Box sx={{ mt: 6, textAlign: 'right', direction: 'ltr' }}>
        <Typography variant="body2" color="text.secondary">הערה:</Typography>
        <Typography variant="body2" color="text.secondary">ניתן לערוך או למחוק קבצים רק כל עוד הם במצב &quot;ממתין לאישור&quot;.</Typography>
        <Typography variant="body2" color="text.secondary">קבצים שנדחו יציגו את הערת המרצה (אם קיימת) בדף הקובץ.</Typography>
      </Box>
    </Box>
  );
}
