
import { useState, useEffect } from 'react';
import { File, Course, Student, User } from '@/api/entities';
import {
    Card, CardContent, CardHeader, Typography, Box, Paper,
    CircularProgress, Chip, Avatar, List, ListItem, ListItemAvatar,
    ListItemText, Button
} from '@mui/material';
import { TrendingUp, Download, FileText, Crown, Trophy, Medal, Award } from 'lucide-react';

type FileData = {
  id: string;
  title?: string;
  original_name?: string;
  filename?: string;
  file_type: string;
  status: string;
  course_id: string;
  uploaded_by?: string;
  uploader_id?: string;
  download_count: number;
  file_url?: string;
};

type CourseData = {
  id: string;
  course_name?: string;
  name?: string;
  course_code?: string;
  code?: string;
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserFileCount, setCurrentUserFileCount] = useState<number>(0);

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

      setCurrentUser(currentUser);

      // Calculate current user's file count
      if (currentUser && Array.isArray(allFiles)) {
        const userFiles = allFiles.filter((file: FileData) => 
          file.uploader_id === currentUser.id || 
          file.uploaded_by === currentUser.id ||
          file.uploaded_by === currentUser.full_name ||
          file.uploaded_by === currentUser.email
        );
        const approvedUserFiles = userFiles.filter((file: FileData) => file.status === 'approved');
        setCurrentUserFileCount(approvedUserFiles.length);
        console.log('Current user files:', { total: userFiles.length, approved: approvedUserFiles.length });
      }

      console.log('Insights data:', { 
        filesCount: allFiles?.length, 
        coursesCount: allCourses?.length, 
        studentsCount: allStudents?.length,
        sampleFile: allFiles?.[0],
        sampleCourse: allCourses?.[0],
        sampleStudent: allStudents?.[0]
      });

      // Popular Files - only approved files, sorted by download count
      if (Array.isArray(allFiles) && allFiles.length > 0) {
        const approvedFiles = allFiles.filter((file: FileData) => file.status === 'approved');
        const sortedFiles = approvedFiles.sort((a: FileData, b: FileData) => (b.download_count || 0) - (a.download_count || 0));
        console.log('Popular files:', sortedFiles.slice(0, 10));
        setPopularFiles(sortedFiles.slice(0, 10));
      } else {
        console.log('No files data available');
        setPopularFiles([]);
      }

      // Popular Courses
      if (Array.isArray(allFiles) && allFiles.length > 0 && Array.isArray(allCourses)) {
        const approvedFiles = allFiles.filter((file: FileData) => file.status === 'approved');
        const courseFileCounts = approvedFiles.reduce((acc: { [key: string]: number }, file: FileData) => {
          acc[file.course_id] = (acc[file.course_id] || 0) + 1;
          return acc;
        }, {});
        
        const sortedCourseIds = Object.keys(courseFileCounts).sort((a, b) => courseFileCounts[b] - courseFileCounts[a]);
        
        const popularCoursesData = sortedCourseIds.slice(0, 10).map(courseId => {
          const course = allCourses.find((c: CourseData) => c.id === courseId);
          return {
            ...course,
            fileCount: courseFileCounts[courseId]
          };
        }).filter((course): course is CourseData => course && (course.course_name || course.name));

        console.log('Popular courses:', popularCoursesData);
        setPopularCourses(popularCoursesData);
      } else {
        console.log('No courses data available');
        setPopularCourses([]);
      }

      // Top 3 Students
      if (Array.isArray(allFiles) && allFiles.length > 0 && Array.isArray(allStudents)) {
        const uploadCounts = allFiles.reduce((acc: { [key: string]: number }, file: FileData) => {
          const uploaderId = file.uploader_id || file.uploaded_by;
          if (uploaderId) {
              acc[uploaderId] = (acc[uploaderId] || 0) + 1;
          }
          return acc;
        }, {});

        const studentsMap = allStudents.reduce((acc: { [key: string]: string }, student: StudentData) => {
            acc[student.id] = student.full_name;
            return acc;
        }, {});

        const sortedStudentIds = Object.keys(uploadCounts).sort((a, b) => uploadCounts[b] - uploadCounts[a]);
        
        const topStudentsData = sortedStudentIds.slice(0, 3).map(studentId => ({
            id: studentId,
            name: studentsMap[studentId] || 'סטודנט לא ידוע',
            count: uploadCounts[studentId]
        }));
        
        console.log('Top students:', topStudentsData);
        setTopStudents(topStudentsData);
      } else {
        console.log('No students data available');
        setTopStudents([]);
      }
      
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
    <Box sx={{ 
      p: { xs: 1.5, md: 1 }, 
              bgcolor: 'var(--bg-primary)', 
      height: { xs: 'auto', md: '100vh-64px' },
      minHeight: { xs: '100vh', md: 'auto' },
      overflow: { xs: 'visible', md: 'hidden' },
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 4, md: 3 } }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><TrendingUp /></Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" textAlign="left">תובנות המערכת</Typography>
          <Typography color="text.secondary" textAlign="left">גלה את החומרים והקורסים הפופולריים ביותר</Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: 'repeat(2, 1fr)' 
        },
        gridTemplateRows: { 
          xs: 'minmax(250px, 320px) minmax(250px, 320px) minmax(240px, 250px)', 
          md: 'minmax(250px, 320px) minmax(200px, 240px)' 
        },
        gridTemplateAreas: {
          xs: `"popular"
               "courses" 
               "students"`,
          md: `"popular courses"
               "students students"`
        },
        gap: 1.5,
        flex: 'none',
        mb: { xs: 1, md: 0 }
      }}>
                  <Card elevation={2} sx={{ gridArea: 'popular', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <CardHeader 
            titleTypographyProps={{ variant: 'h6', textAlign: 'left', fontWeight: 'bold' }} 
            title="הקבצים הפופולריים ביותר" 
            sx={{ pb: 0.5, pt: 1.5 }}
          />
          <CardContent sx={{ flex: 1, overflow: 'hidden', pt: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {loading ? <LoadingList /> : (
              <List sx={{ 
                py: 0, 
                overflow: 'auto', 
                maxHeight: '100%', 
                flex: 1,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}>
                {popularFiles.map((file, index) => (
                  <ListItem key={file.id} sx={{ py: 0.25, minHeight: 'auto' }} secondaryAction={
                    <Button variant="contained" size="small" startIcon={<Download size={14} />} onClick={() => handleDownload(file)} sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}>
                      {file.download_count || 0}
                    </Button>
                  }>
                    <ListItemAvatar><Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>{index + 1}</Avatar></ListItemAvatar>
                    <ListItemText primary={file.title || file.original_name || file.filename || 'קובץ ללא שם'} secondary={fileTypeToHebrew[file.file_type] || file.file_type} primaryTypographyProps={{ textAlign: 'left', fontSize: '0.8rem' }} secondaryTypographyProps={{ textAlign: 'left', fontSize: '0.7rem' }} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card elevation={2} sx={{ gridArea: 'courses', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <CardHeader 
            titleTypographyProps={{ variant: 'h6', textAlign: 'left', fontWeight: 'bold' }} 
            title="הקורסים הפעילים ביותר" 
            sx={{ pb: 0.5, pt: 1.5 }}
          />
          <CardContent sx={{ flex: 1, overflow: 'hidden', pt: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {loading ? <LoadingList /> : (
              <List sx={{ 
                py: 0, 
                overflow: 'auto', 
                maxHeight: '100%', 
                flex: 1,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}>
                {popularCourses.map((course, index) => (
                  <ListItem key={course.id} sx={{ py: 0.25, minHeight: 'auto' }} secondaryAction={
                    <Chip icon={<FileText size={14} />} label={course.fileCount} size="small" />
                  }>
                    <ListItemAvatar><Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>{index + 1}</Avatar></ListItemAvatar>
                    <ListItemText primary={course.course_name || course.name || 'קורס ללא שם'} secondary={course.course_code || course.code || 'ללא קוד'} primaryTypographyProps={{ textAlign: 'left', fontSize: '0.8rem' }} secondaryTypographyProps={{ textAlign: 'left', fontSize: '0.7rem' }} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card elevation={2} sx={{ gridArea: 'students', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <CardHeader 
            titleTypographyProps={{ variant: 'h6', textAlign: 'left', fontWeight: 'bold', sx: { fontSize: { xs: '1rem', md: '1.25rem' } } }} 
            title="הסטודנטים המשתפים ביותר" 
            sx={{ pb: 0.5, pt: 1.5 }}
          />
          <CardContent sx={{ flex: 1, overflow: 'hidden', pt: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'flex-end', 
                height: '100%',
                minHeight: 120,
                px: 2,
                py: 1
              }}>
                {/* 2nd Place */}
                <Box sx={{ 
                  textAlign: 'center', 
                  flex: 1, 
                  maxWidth: 180,
                  mx: 1
                }}>
                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <Medal size={16} color="#888888" style={{ marginLeft: 8 }} />
                                         <Typography variant="h6" sx={{ 
                      fontSize: { xs: '0.9rem', md: '1rem' }, 
                      fontWeight: 'bold', 
                      color: 'grey.600',
                      textAlign: 'center'
                    }}>
                      מקום 2
                    </Typography>
                   </Box>
                                     <Paper sx={{ 
                                         p: 2, 
                    background: 'linear-gradient(135deg, #bdbdbd 0%, #888888 100%)', 
                    minHeight: 65, 
                     fontSize: '0.95rem', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     borderRadius: 3,
                     boxShadow: 3,
                     border: '2px solid #888888',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    wordBreak: 'break-word'
                  }}>
                                                              {topStudents[1] ? (
                       <Box sx={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
                         <Typography variant="body1" textAlign="center" sx={{ fontWeight: 'bold', mb: 0.5, color: '#888888', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                           {topStudents[1].name}
                         </Typography>
                         <Typography variant="body2" textAlign="center" sx={{ color: '#888888', fontSize: { xs: '0.75rem', md: '0.875rem' } }}> 
                           {topStudents[1].count} קבצים
                         </Typography>
                       </Box>
                     ) : (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5, color: '#888888', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                            מהרו לשתף!
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#888888', fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                            תפסו את המקום השני
                          </Typography>
                        </Box>
                     )}
                  </Paper>
                </Box>

                {/* 1st Place */}
                <Box sx={{ 
                  textAlign: 'center', 
                  flex: 1, 
                  maxWidth: 200,
                  mx: 1,
                  transform: 'scale(1.1)',
                  zIndex: 2
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                     <Crown size={20} color="#84cc16" style={{ marginBottom: 4 }} />
                     <Typography variant="h6" sx={{ 
                       fontSize: { xs: '1rem', md: '1.2rem' }, 
                       fontWeight: 'bold', 
                       color: 'primary.main',
                       textAlign: 'center'
                     }}>
                       מקום 1
                     </Typography>
                   </Box>
                                     <Paper sx={{ 
                                         p: 2, 
                    background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', 
                    color: 'white', 
                    minHeight: 80, 
                     fontSize: '1.1rem', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     borderRadius: 3,
                     boxShadow: 4,
                     border: '3px solid #84cc16',
                     fontWeight: 'bold',
                     textAlign: 'center',
                     wordBreak: 'break-word',
                     position: 'relative',
                     overflow: 'hidden',
                     '&::before': {
                       content: '""',
                       position: 'absolute',
                       top: 0,
                       left: '-100%',
                       width: '100%',
                       height: '100%',
                       background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                       animation: 'shimmer-winner 2.5s infinite',
                     },
                     '@keyframes shimmer-winner': {
                       '0%': { left: '-100%' },
                       '100%': { left: '100%' }
                     }
                   }}>
                                                              {topStudents[0] ? (
                       <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                         <Crown size={20} color="white" style={{ marginBottom: 6 }} />
                         <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                           {topStudents[0].name}
                         </Typography>
                         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                           {topStudents[0].count} קבצים
                         </Typography>
                       </Box>
                     ) : (
                        <Box sx={{ textAlign: 'center' }}>
                          <Crown size={20} color="white" style={{ marginBottom: 6 }} />
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                            מהרו לשתף!
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
                            תפסו את המקום הראשון
                          </Typography>
                        </Box>
                     )}
                  </Paper>
                </Box>

                {/* 3rd Place */}
                <Box sx={{ 
                  textAlign: 'center', 
                  flex: 1, 
                  maxWidth: 180,
                  mx: 1
                }}>
                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <Award size={16} color="#c0c0c0" style={{ marginLeft: 8 }} />
                                                                                 <Typography variant="h6" sx={{ 
                     fontSize: { xs: '0.9rem', md: '1rem' }, 
                     fontWeight: 'bold', 
                     color: '#c0c0c0',
                     textAlign: 'center'
                   }}>
                     מקום 3
                   </Typography>
                   </Box>
                                     <Paper sx={{ 
                                         p: 2, 
                    background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)', 
                    color: 'black',
                    minHeight: 60, 
                     fontSize: '0.95rem', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     borderRadius: 3,
                     boxShadow: 3,
                     border: '2px solid #c0c0c0',
                     fontWeight: 'bold',
                     textAlign: 'center',
                     wordBreak: 'break-word'
                   }}>
                                                              {topStudents[2] ? (
                       <Box>
                         <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5, color: '#c0c0c0', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                           {topStudents[2].name}
                         </Typography>
                         <Typography variant="body2" sx={{ color: '#c0c0c0', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                           {topStudents[2].count} קבצים
                         </Typography>
                       </Box>
                     ) : (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5, color: '#c0c0c0', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                            מהרו לשתף!
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#c0c0c0', fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                            תפסו את המקום השלישי
                          </Typography>
                        </Box>
                     )}
                  </Paper>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Encouragement Box */}
      <Box sx={{ 
        mt: { xs: 2, md: 1.5 },
        background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        borderRadius: 3,
        p: 1.5,
        minHeight: { xs: 50, md: 40 },
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(132, 204, 22, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          animation: 'shimmer 3s infinite',
        },
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' }
        }
      }}>
                          <Box sx={{ 
            textAlign: 'center',
            fontSize: { xs: '0.7rem', md: '1rem' },
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%'
          }}>
           {(() => {
                         if (!topStudents[0]) {
               return (
                 <>
                   <span style={{ fontWeight: 'bold' }}>תמשיכו לשתף ולהתקדם!</span>
                   {' '}השתפו קבצים ותהיו הראשונים בדירוג! כל קובץ שאתם משתפים עוזר לכל הקהילה 📚
                 </>
               );
            }
            
                         // Check if current user is in top 3
                         if (!currentUser) {
               return (
                 <>
                   <span style={{ fontWeight: 'bold' }}>תמשיכו לשתף ולהתקדם!</span>
                   {' '}השתפו {topStudents[0].count + 1} קבצים ותהיו במקום הראשון! 🏆
                 </>
               );
             }
             
             // Use actual current user's file count
             const currentUserFiles = currentUserFileCount;
             
             // Check if current user is in top 3
             const isInTop3 = topStudents.some(student => 
               student.name === currentUser.full_name || 
               student.name === currentUser.email ||
               student.id === currentUser.id
             );
             
             if (currentUserFiles === 0) {
               return (
                 <>
                   <span style={{ fontWeight: 'bold' }}>תמשיכו לשתף ולהתקדם!</span>
                   {' '}התחילו לשתף! העלו קובץ ראשון והתחילו לטפס בדירוג 🎯
                 </>
               );
             } else if (isInTop3) {
               const userPosition = topStudents.findIndex(student => 
                 student.name === currentUser.full_name || 
                 student.name === currentUser.email ||
                 student.id === currentUser.id
               ) + 1;
               
               if (userPosition === 1) {
                 return (
                   <>
                     <span style={{ fontWeight: 'bold' }}>תמשיכו לשתף ולהתקדם!</span>
                     {' '}מזל טוב! אתם במקום הראשון! תמשיכו לשתף כדי לשמור על המקום 👑
                   </>
                 );
               } else {
                 const needed = Math.max(1, topStudents[0].count + 1 - currentUserFiles);
                 return (
                   <>
                     <span style={{ fontWeight: 'bold' }}>תמשיכו לשתף ולהתקדם!</span>
                     {' '}אתם במקום {userPosition}! נותרו לכם {needed} קבצים נוספים למקום הראשון 🚀
                   </>
                 );
               }
             } else {
               const needed = Math.max(1, topStudents[0].count + 1 - currentUserFiles);
               return (
                 <>
                   <span style={{ fontWeight: 'bold' }}>תמשיכו לשתף ולהתקדם!</span>
                   {' '}יש לכם {currentUserFiles} קבצים! נותרו {needed} נוספים למקום הראשון 💪
                 </>
               );
             }
                     })()}
         </Box>
      </Box>
    </Box>
  );
}
