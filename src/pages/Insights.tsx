
import { useState, useEffect } from 'react';
import { File, Course, Student, User } from '@/api/entities';
import {
    Card, CardContent, CardHeader, Typography, Box, Paper,
    CircularProgress, Chip, Avatar, List, ListItem, ListItemAvatar,
    ListItemText, Button
} from '@mui/material';
import { TrendingUp, Download, FileText, Crown } from 'lucide-react';

type FileData = {
  id: string;
  title: string;
  file_type: string;
  status: string;
  course_id: string;
  uploaded_by: string;
  download_count: number;
  file_url: string;
};

type CourseData = {
  id: string;
  course_name: string;
  course_code: string;
  fileCount?: number;
};

type StudentData = {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
};

type TopStudent = {
  id: string;
  name: string;
  count: number;
};

const fileTypeToHebrew: { [key: string]: string } = {
  note: "סיכומים",
  exam: "מבחני תרגול",
  formulas: "דף נוסחאות",
  assignment: "מטלות",
  other: "אחר"
};

export default function Insights() {
  const [popularFiles, setPopularFiles] = useState<FileData[]>([]);
  const [popularCourses, setPopularCourses] = useState<CourseData[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const [allFiles, allCourses, allStudents, currentUser] = await Promise.all([
        File.list(),
        Course.list(),
        Student.list(),
        User.me(),
      ]);

      // Popular Files - only approved files
      const approvedFiles = allFiles.filter((file: FileData) => file.status === 'approved');
      setPopularFiles(approvedFiles.slice(0, 8));

      // Popular Courses
      const courseFileCounts = approvedFiles.reduce((acc: { [key: string]: number }, file: FileData) => {
        acc[file.course_id] = (acc[file.course_id] || 0) + 1;
        return acc;
      }, {});
      
      const sortedCourseIds = Object.keys(courseFileCounts).sort((a, b) => courseFileCounts[b] - courseFileCounts[a]);
      
      const popularCoursesData = sortedCourseIds.slice(0, 8).map(courseId => {
        const course = allCourses.find((c: CourseData) => c.id === courseId);
        return {
          ...course,
          fileCount: courseFileCounts[courseId]
        };
      }).filter((course): course is CourseData => course && course.course_name);

      setPopularCourses(popularCoursesData);

      // Top 3 Students
      const uploadCounts = allFiles.reduce((acc: { [key: string]: number }, file: FileData) => {
        if (file.uploaded_by) {
            acc[file.uploaded_by] = (acc[file.uploaded_by] || 0) + 1;
        }
        return acc;
      }, {});

      const studentsMap = allStudents.reduce((acc: { [key: string]: string }, student: StudentData) => {
          acc[student.student_id] = student.full_name;
          return acc;
      }, {});

      const sortedStudentIds = Object.keys(uploadCounts).sort((a, b) => uploadCounts[b] - uploadCounts[a]);
      
      const topStudentsData = sortedStudentIds.slice(0, 3).map(studentId => ({
          id: studentId,
          name: studentsMap[studentId] || 'סטודנט לא ידוע',
          count: uploadCounts[studentId]
      }));
      setTopStudents(topStudentsData);
      
      // Current user stats
      const currentStudent = allStudents.find((s: StudentData) => s.email === currentUser.email);
      if(currentStudent) {
          // const count = uploadCounts[currentStudent.student_id] || 0;
      }

    } catch (error) {
      console.error("Error loading insights:", error);
    }
    setLoading(false);
  };

  const handleDownload = async (file: FileData) => {
    // Increment download count
    await File.update(file.id, { download_count: (file.download_count || 0) + 1 });
    // Open file url
    window.open(file.file_url, '_blank');
    // Reload data to show updated download count
    loadInsights();
  };

  const LoadingList = () => (
    <List>
      {Array(5).fill(0).map((_, i) => (
        <ListItem key={i}>
          <ListItemAvatar><CircularProgress size={24} /></ListItemAvatar>
          <ListItemText primary={<Box sx={{ height: 20, bgcolor: 'grey.300', borderRadius: 1 }} />} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><TrendingUp /></Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">תובנות המערכת</Typography>
          <Typography color="text.secondary">גלה את החומרים והקורסים הפופולריים ביותר</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <Card elevation={2}>
          <CardHeader titleTypographyProps={{ variant: 'h6' }} title="הקבצים הפופולריים ביותר" />
          <CardContent>
            {loading ? <LoadingList /> : (
              <List>
                {popularFiles.map((file, index) => (
                  <ListItem key={file.id} secondaryAction={
                    <Button variant="contained" size="small" startIcon={<Download />} onClick={() => handleDownload(file)}>
                      {file.download_count || 0}
                    </Button>
                  }>
                    <ListItemAvatar><Avatar>{index + 1}</Avatar></ListItemAvatar>
                    <ListItemText primary={file.title} secondary={fileTypeToHebrew[file.file_type] || file.file_type} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardHeader titleTypographyProps={{ variant: 'h6' }} title="הקורסים הפעילים ביותר" />
          <CardContent>
            {loading ? <LoadingList /> : (
              <List>
                {popularCourses.map((course, index) => (
                  <ListItem key={course.id} secondaryAction={
                    <Chip icon={<FileText />} label={course.fileCount} />
                  }>
                    <ListItemAvatar><Avatar>{index + 1}</Avatar></ListItemAvatar>
                    <ListItemText primary={course.course_name} secondary={course.course_code} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card elevation={2} sx={{ gridColumn: { lg: 'span 2' } }}>
          <CardHeader titleTypographyProps={{ variant: 'h6' }} title="הסטודנטים המשתפים ביותר" />
          <CardContent>
            {loading ? <CircularProgress /> : (
              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', minHeight: 150 }}>
                {/* 2nd Place */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">מקום 2</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.300', minHeight: 80 }}>
                    {topStudents[1] ? `${topStudents[1].name} (${topStudents[1].count})` : '-'}
                  </Paper>
                </Box>
                {/* 1st Place */}
                <Box sx={{ textAlign: 'center' }}>
                  <Crown />
                  <Typography variant="h5">מקום 1</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white', minHeight: 120 }}>
                    {topStudents[0] ? `${topStudents[0].name} (${topStudents[0].count})` : '-'}
                  </Paper>
                </Box>
                {/* 3rd Place */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">מקום 3</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.400', minHeight: 60 }}>
                    {topStudents[2] ? `${topStudents[2].name} (${topStudents[2].count})` : '-'}
                  </Paper>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
