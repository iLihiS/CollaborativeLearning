
import { useState, useEffect } from "react";
import { Course, Lecturer, User, Student, AcademicTrack } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Card, CardContent, CardActionArea, Typography, Grid, Box,
    TextField, Button, Chip, Skeleton, InputAdornment, Avatar
} from "@mui/material";
import { BookOpen, User as UserIcon, Calendar, Search } from "lucide-react";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterableTracks, setFilterableTracks] = useState([]);
  
  // Initialize state from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedTrack, setSelectedTrack] = useState(searchParams.get('track') || null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);

      const [allCourses, allLecturers, allAcademicTracks] = await Promise.all([
        Course.list("-semester"),
        Lecturer.list(),
        AcademicTrack.list(),
      ]);

      const lecturersMap = allLecturers.reduce((acc, lec) => {
        acc[lec.id] = lec.full_name;
        return acc;
      }, {});
      setLecturers(lecturersMap);

      if (user.current_role === 'admin') {
        setCourses(allCourses);
        setFilterableTracks(allAcademicTracks);
      } else {
        let userTrackIds = [];
        if (user.current_role === 'student') {
          const studentRecords = await Student.filter({ email: user.email });
          if (studentRecords.length > 0 && studentRecords[0].academic_track_ids) {
            userTrackIds = studentRecords[0].academic_track_ids;
          }
        } else if (user.current_role === 'lecturer') {
          const lecturerRecords = await Lecturer.filter({ email: user.email });
          if (lecturerRecords.length > 0 && lecturerRecords[0].academic_track_ids) {
            userTrackIds = lecturerRecords[0].academic_track_ids;
          }
        }
        
        const userCourses = userTrackIds.length > 0
          ? allCourses.filter(course => course.academic_track_ids?.some(trackId => userTrackIds.includes(trackId)))
          : [];
        setCourses(userCourses);
        
        const tracksForFiltering = allAcademicTracks.filter(track => userTrackIds.includes(track.id));
        setFilterableTracks(tracksForFiltering);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };
  
  const searchFilteredCourses = courses.filter(course => {
    const trackMatch = !selectedTrack || (course.academic_track_ids && course.academic_track_ids.includes(selectedTrack));
    const searchMatch = !searchTerm || course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) || course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
    return trackMatch && searchMatch;
  });

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <BookOpen />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">רשימת קורסים</Typography>
            <Typography color="text.secondary">מצא חומרי לימוד לפי הקורסים הזמינים במערכת</Typography>
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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
        <Button
          variant={!selectedTrack ? 'contained' : 'outlined'}
          onClick={() => setSelectedTrack(null)}
        >
          הצג הכל
        </Button>
        {filterableTracks.map((track) => (
          <Button
            key={track.id}
            variant={selectedTrack === track.id ? 'contained' : 'outlined'}
            onClick={() => setSelectedTrack(track.id)}
          >
            {track.name}
          </Button>
        ))}
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
            </Grid>
          ))
        ) : (
          searchFilteredCourses.map((course) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
              <Card component={Link} to={createPageUrl(`Course?id=${course.id}&track=${selectedTrack || ''}&search=${searchTerm || ''}`)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <CardContent>
                    <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main', mb: 2 }}>
                      <BookOpen />
                    </Avatar>
                    <Typography variant="h6" component="div" gutterBottom>{course.course_name}</Typography>
                    <Chip label={course.course_code} size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {course.description || 'אין תיאור זמין לקורס זה.'}
                    </Typography>
                    <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <UserIcon size={16} /> {lecturers[course.lecturer_id] || 'מרצה לא ידוע'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} /> {course.semester}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {!loading && searchFilteredCourses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6">
            {searchTerm
              ? `לא נמצאו קורסים עבור החיפוש "${searchTerm}"`
              : 'לא נמצאו קורסים זמינים.'
            }
          </Typography>
          <Typography color="text.secondary">
            {searchTerm
              ? 'נסה מונח חיפוש אחר.'
              : currentUser?.current_role === 'admin'
                ? 'נראה שעדיין לא הוספו קורסים למערכת.'
                : 'יתכן ואין קורסים המשויכים למסלולים האקדמיים שלך עבור תפקידך הנוכחי.'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
}
