
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

import {
  Card, 
  CardContent, 
  Button, 
  Typography, 
  Box, 
  Grid,
  Chip, 
  Paper, 
  CircularProgress, 
  Alert, 
  Avatar
} from '@mui/material'
import { User, Calendar, Upload, Download, FileText as FileTextIcon, ArrowRight } from 'lucide-react'

import { Course as CourseEntity, File as FileEntity, Lecturer } from '@/api/entities'

type Course = {
  id: string
  course_name: string
  course_code: string
  lecturer_id: string
  semester: string
  description: string
}

type Lecturer = {
  id: string
  full_name: string
  email: string
}

type File = {
  id: string
  title: string
  description: string
  file_type: string
  created_date: string
  download_count: number
  file_url: string
}

const fileTypeToHebrew: { [key: string]: string } = {
  note: 'הרצאות וסיכומים',
  exam: 'מבחני תרגול',
  formulas: 'דף נוסחאות',
  assignment: 'מטלות',
  other: 'אחר'
}

export default function CoursePage() {
  const [course, setCourse] = useState<Course | null>(null)
  const [lecturer, setLecturer] = useState<Lecturer | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId: string }>()

  useEffect(() => {
    if (courseId) {
      loadCourseData(courseId)
    } else {
      navigate('/Courses')
    }
  }, [courseId, navigate])

  const loadCourseData = async (id: string) => {
    try {
      setError(null)
      const courseData = await CourseEntity.get(id)
      setCourse(courseData)

      if (courseData.lecturer_id) {
        try {
          const lecturerData = await Lecturer.get(courseData.lecturer_id)
          setLecturer(lecturerData)
        } catch (lecturerError) {
          console.warn(`Lecturer with ID ${courseData.lecturer_id} not found:`, lecturerError)
          setLecturer({ id: courseData.lecturer_id, full_name: 'מרצה לא זמין', email: 'לא זמין' })
        }
      } else {
        setLecturer({ id: 'unknown', full_name: 'לא שויך מרצה', email: 'לא זמין' })
      }

      const approvedFiles = await FileEntity.filter({ course_id: id, status: 'approved' })
      setFiles(approvedFiles)

    } catch (err) {
      console.error('Error loading course data:', err)
      setError('שגיאה בטעינת נתוני הקורס. אנא נסו שוב מאוחר יותר.')
    }
    setLoading(false)
  }

  const handleDownload = async (file: File) => {
    await FileEntity.update(file.id, { download_count: (file.download_count || 0) + 1 })
    window.open(file.file_url, '_blank')
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to={"/Courses"} variant="contained" sx={{ mt: 2 }}>חזרה לרשימת הקורסים</Button>
      </Box>
    )
  }

  if (!course) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">קורס לא נמצא</Typography>
        <Button component={Link} to={"/Courses"} variant="contained" sx={{ mt: 2 }}>חזרה לרשימת הקורסים</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Button
        component={Link}
        to="/Courses"
        variant="outlined"
        startIcon={<ArrowRight />}
        sx={{ mb: 3 }}
      >
        חזרה לרשימת הקורסים
      </Button>

      <Paper elevation={0} sx={{
        borderRadius: '16px', 
        p: { xs: 2, sm: 4 }, 
        mb: 4, 
        color: 'white',
        background: 'linear-gradient(to right, #84cc16, #65a30d)',
      }}>
        <Typography variant="h3" component="h1" fontWeight="bold">{course.course_name}</Typography>
        <Typography variant="h6" sx={{ opacity: 0.8, mt: 1 }}>{course.course_code}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <User /> {lecturer?.full_name || 'מרצה לא ידוע'}
          </Typography>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar /> {course.semester}
          </Typography>
        </Box>
        <Typography sx={{ mt: 2, maxWidth: '80ch' }}>{course.description}</Typography>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
          <FileTextIcon />
        </Avatar>
        <Typography variant="h5" fontWeight="bold">חומרי לימוד זמינים</Typography>
      </Box>

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {files.length > 0 ? (
            <Grid container spacing={2}>
              {files.map((file) => (
                <Grid size={12} key={file.id}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 56, height: 56 }}>
                        <FileTextIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{file.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{file.description}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={fileTypeToHebrew[file.file_type] || file.file_type} size="small" />
                          <Chip label={
                            file.created_date && !isNaN(new Date(file.created_date).getTime()) 
                              ? format(new Date(file.created_date), 'd MMM yyyy', { locale: he })
                              : 'תאריך לא תקין'
                          } size="small" variant="outlined" />
                        </Box>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => handleDownload(file)}
                    >
                      הורדה
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <FileTextIcon size={60} color="grey" />
              <Typography variant="h6">אין עדיין חומרי לימוד</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>היה הראשון להעלות חומר לימוד לקורס זה!</Typography>
              <Button
                component={Link}
                to={`/UploadFile?course_id=${course.id}`}
                variant="contained"
                startIcon={<Upload />}
              >
                העלה קובץ ראשון
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
