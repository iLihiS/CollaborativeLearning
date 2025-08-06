
import { useState, useEffect } from "react";
import { File as FileEntity, Course, Student, Lecturer, User } from "@/api/entities";
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Button, IconButton, Chip,
    Card, CardContent, CardActions, ToggleButtonGroup, ToggleButton, Avatar
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    Description as FileTextIcon,
    CheckCircleOutline as CheckCircle,
    HourglassEmpty,
    Cancel
} from '@mui/icons-material';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

type File = {
    id: string;
    title: string;
    description: string;
    course_id: string;
    status: 'approved' | 'pending' | 'rejected';
    created_date: string;
    file_type: string;
    rejection_reason?: string;
};

type Course = {
    id:string;
    course_name: string;
}

const fileTypeToHebrew: { [key: string]: string } = {
  note: "סיכומים",
  exam: "מבחנים",
  formulas: "דפי נוסחאות",
  assignment: "מטלות",
  other: "שונות"
};

const filterToHebrew: { [key: string]: string } = {
    all: 'הכל',
    pending: 'ממתין לאישור',
    approved: 'אושר',
    rejected: 'נדחה'
};

export default function MyFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [courses, setCourses] = useState<{ [key: string]: Course }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, []);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusFromUrl = urlParams.get('status');
    if (statusFromUrl && ['pending', 'approved', 'rejected'].includes(statusFromUrl)) {
      setFilter(statusFromUrl);
    } else {
        setFilter('all');
    }
  }, [window.location.search]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      let uploaderId = null;

      if (currentUser.current_role === 'student') {
          const studentRecord = await Student.filter({ user_id: currentUser.id });
          if (studentRecord.length > 0) uploaderId = studentRecord[0].id;
      } else if (currentUser.current_role === 'lecturer') {
          const lecturerRecord = await Lecturer.filter({ user_id: currentUser.id });
          if (lecturerRecord.length > 0) uploaderId = lecturerRecord[0].id;
      } else {
           const studentRecord = await Student.filter({ user_id: currentUser.id });
          if (studentRecord.length > 0) uploaderId = studentRecord[0].id;
      }

      if (uploaderId) {
        const [userFiles, allCourses] = await Promise.all([
          FileEntity.filter({ uploader_id: uploaderId }),
          Course.list()
        ]);
        
        const coursesData = allCourses.reduce((acc: { [key: string]: Course }, course: Course) => {
          acc[course.id] = course;
          return acc;
        }, {});
        
        setFiles(userFiles);
        setCourses(coursesData);
      }
    } catch (error) {
      console.error("Failed to load files:", error);
    }
    setLoading(false);
  };
  
  const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: string | null) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      const url = newFilter === 'all' ? createPageUrl("MyFiles") : createPageUrl(`MyFiles?status=${newFilter}`);
      navigate(url, { replace: true });
    }
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק קובץ זה?")) {
      try {
        await FileEntity.delete(fileId);
        setFiles(files.filter(f => f.id !== fileId));
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert("שגיאה במחיקת הקובץ.");
      }
    }
  };

  const getStatusComponent = (status: 'approved' | 'pending' | 'rejected') => {
    switch (status) {
      case 'approved': return <Chip icon={<CheckCircle />} label="אושר" color="success" size="small" />;
      case 'pending': return <Chip icon={<HourglassEmpty />} label="ממתין" color="warning" size="small" />;
      case 'rejected': return <Chip icon={<Cancel />} label="נדחה" color="error" size="small" />;
      default: return <Chip label="לא ידוע" size="small" />;
    }
  };

  const filteredFiles = files.filter(file => filter === 'all' || file.status === filter);
  
  const emptyStateMessages = {
      all: 'עדיין לא העליתם קבצים.',
      pending: 'אין קבצים הממתינים לאישור.',
      approved: 'אין קבצים שאושרו.',
      rejected: 'אין קבצים שנדחו.'
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">הקבצים שלי</Typography>
          <Typography color="text.secondary">צפה ונהל את הקבצים שהעלית</Typography>
        </Box>
        <Button component={Link} to={createPageUrl('UploadFile')} variant="contained" startIcon={<AddIcon />}>
          העלה קובץ חדש
        </Button>
      </Box>

      <Card>
        <CardContent>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            aria-label="file filter"
            sx={{ mb: 2 }}
          >
            {Object.entries(filterToHebrew).map(([key, value]) => (
              <ToggleButton key={key} value={key}>{value}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Desktop View */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>שם הקובץ</TableCell>
                  <TableCell>קורס</TableCell>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>תאריך העלאה</TableCell>
                  <TableCell align="right">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileTextIcon />
                        {file.title}
                      </Box>
                    </TableCell>
                    <TableCell>{courses[file.course_id]?.course_name || 'N/A'}</TableCell>
                    <TableCell>{getStatusComponent(file.status)}</TableCell>
                    <TableCell>{format(new Date(file.created_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(createPageUrl(`UploadFile?edit=${file.id}`))}><EditIcon /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(file.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {filteredFiles.map((file) => (
              <Card key={file.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{file.title}</Typography>
                  <Chip label={fileTypeToHebrew[file.file_type]} size="small" sx={{ mt: 1, mb: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 0.5 }} />
                    {format(new Date(file.created_date), 'dd/MM/yyyy')}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
                    <FileTextIcon sx={{ mr: 0.5 }} />
                    {courses[file.course_id]?.course_name || 'N/A'}
                  </Box>
                  {getStatusComponent(file.status)}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(createPageUrl(`UploadFile?edit=${file.id}`))} startIcon={<EditIcon />}>ערוך</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(file.id)} startIcon={<DeleteIcon />}>מחק</Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
