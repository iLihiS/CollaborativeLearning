
import { useState, useEffect } from "react";
import { Course, Lecturer, Student, AcademicTrack } from "@/api/entities";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Card, CardContent, CardActionArea, Typography, Box,
    TextField, Chip, Skeleton, InputAdornment, Avatar, ToggleButton, ToggleButtonGroup,
    CircularProgress
} from "@mui/material";
import Grid from '@mui/material/Grid';
import { BookOpen, User as UserIcon, Search } from "lucide-react";

type CourseInfo = {
    id: string;
    course_name: string;
    course_code: string;
    description: string;
    lecturer_id: string;
    semester: string;
    academic_track_ids: string[];
    name?: string;  // Alternative name field for compatibility
    code?: string;  // Alternative code field for compatibility
};

type LecturerInfo = {
    id: string;
    full_name: string;
};

type AcademicTrackInfo = {
    id: string;
    name: string;
};

export default function Courses() {
  const { session } = useAuth();
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [lecturers, setLecturers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [filterableTracks, setFilterableTracks] = useState<AcademicTrackInfo[]>([]);
  
  // Initialize state from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedTrack, setSelectedTrack] = useState(searchParams.get('track') || null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  // Set loading to false after a reasonable timeout if session is null
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!session) {
        setLoading(false);
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timeout);
  }, [session]);

  const loadData = async () => {
    if (!session) {
      return; // Don't set loading to false yet, wait for session
    }

    try {
      setLoading(true);
      const user = session.user;
      const currentRole = session.current_role;

      const [allCourses, allLecturers, allAcademicTracks] = await Promise.all([
        Course.list(),
        Lecturer.list(),
        AcademicTrack.list(),
      ]);

      const lecturersMap = allLecturers.reduce((acc: { [key: string]: string }, lec: LecturerInfo) => {
        acc[lec.id] = lec.full_name;
        return acc;
      }, {});
      setLecturers(lecturersMap);

      if (currentRole === 'admin') {
        console.log('🔧 Admin user detected, showing all courses:', allCourses.length, 'courses');
        setCourses(allCourses);
        setFilterableTracks(allAcademicTracks);
      } else {
        console.log('👤 Non-admin user:', currentRole);
        let userTrackIds: string[] = [];
        if (currentRole === 'student') {
          const studentRecords = await Student.filter({ email: user.email });
          if (studentRecords.length > 0 && studentRecords[0].academic_track_ids) {
            userTrackIds = studentRecords[0].academic_track_ids;
          }
        } else if (currentRole === 'lecturer') {
          const lecturerRecords = await Lecturer.filter({ email: user.email });
          if (lecturerRecords.length > 0 && lecturerRecords[0].academic_track_ids) {
            userTrackIds = lecturerRecords[0].academic_track_ids;
          }
        }
        
        const userCourses = userTrackIds.length > 0
          ? allCourses.filter((course: CourseInfo) => course.academic_track_ids?.some((trackId: string) => userTrackIds.includes(trackId)))
          : [];
        setCourses(userCourses);
        
        const tracksForFiltering = allAcademicTracks.filter((track: AcademicTrackInfo) => userTrackIds.includes(track.id));
        setFilterableTracks(tracksForFiltering);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };
  
  const searchFilteredCourses = courses.filter((course: CourseInfo) => {
    const trackMatch = !selectedTrack || (course.academic_track_ids && course.academic_track_ids.includes(selectedTrack));
    const courseName = course.course_name || course.name || '';
    const courseCode = course.course_code || course.code || '';
    const searchMatch = !searchTerm || courseName.toLowerCase().includes(searchTerm.toLowerCase()) || courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    return trackMatch && searchMatch;
  });

  return (
    <Box sx={{ p: 2, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <BookOpen />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" textAlign="left">רשימת קורסים</Typography>
            <Typography color="text.secondary" textAlign="left">מצא חומרי לימוד לפי הקורסים הזמינים במערכת</Typography>
          </Box>
        </Box>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="חפש קורס לפי שם או קוד..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={selectedTrack || 'all'}
          exclusive
          onChange={(_, newValue) => setSelectedTrack(newValue === 'all' ? null : newValue)}
          aria-label="סינון לפי מסלול אקדמי"
          sx={{ 
            gap: 1,
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              px: 3,
              py: 0.5,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: '#f3f4f6',
                borderColor: '#9ca3af'
              },
              '&.Mui-selected': {
                backgroundColor: '#84cc16',
                color: 'white',
                borderColor: '#65a30d',
                '&:hover': {
                  backgroundColor: '#65a30d'
                }
              }
            }
          }}
        >
          <ToggleButton value="all" aria-label="הצג הכל">
            הצג הכל
          </ToggleButton>
          {filterableTracks.map((track) => (
            <ToggleButton key={track.id} value={track.id} aria-label={track.name}>
              {track.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(8)).map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
            </Grid>
          ))
        ) : (
          searchFilteredCourses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={course.id}>
              <Card component={Link} to={`/Course/${course.id}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <CardContent sx={{ width: '100%' }}>
                    <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main', mb: 2 }}>
                      <BookOpen />
                    </Avatar>
                    <Typography textAlign="left" gutterBottom variant="h6" component="h2">{course.course_name || course.name}</Typography>
                    <Typography textAlign="left" variant="body2" color="text.secondary" sx={{ mb: 1 }}>{course.course_code || course.code}</Typography>
                    <Typography textAlign="left" variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <UserIcon size={16} />
                      <Typography textAlign="left" variant="body2" color="text.secondary">{lecturers[course.lecturer_id] || "מרצה לא ידוע"}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.5 }}>
                      {(course.academic_track_ids || []).map(trackId => (
                        <Chip key={trackId} label={lecturers[trackId] || trackId} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" textAlign="center">
            טוען קורסים...
          </Typography>
        </Box>
      )}

      {!loading && searchFilteredCourses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" textAlign="center">
            {searchTerm
              ? `לא נמצאו קורסים עבור החיפוש "${searchTerm}"`
              : 'לא נמצאו קורסים זמינים.'
            }
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            {searchTerm
              ? 'נסה מונח חיפוש אחר.'
              : session?.current_role === 'admin'
                ? 'נראה שעדיין לא הוספו קורסים למערכת.'
                : 'יתכן ואין קורסים המשויכים למסלולים האקדמיים שלך עבור תפקידך הנוכחי.'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
}
