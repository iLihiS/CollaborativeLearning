
import { useState, useEffect } from "react";
import { Course, File as FileEntity, Student, Lecturer, User } from "@/api/entities";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Box, Button, TextField, Select, MenuItem, FormControl, InputLabel,
    Typography, Paper, CircularProgress, Avatar
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

type CourseInfo = {
    id: string;
    course_name: string;
    course_code: string;
    academic_track_ids: string[];
};

type FormState = {
    title: string;
    description: string;
    course_id: string;
    file_type: string;
};

type FormErrors = {
    title?: string;
    description?: string;
    course_id?: string;
    file_type?: string;
    file?: string;
};

export default function UploadFile() {
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [formState, setFormState] = useState<FormState>({
        title: '',
        description: '',
        course_id: '',
        file_type: 'note',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            const allCourses = await Course.list();
            
            const validCourses = Array.isArray(allCourses) ? allCourses : [];
            let relevantCourses = validCourses;
            
            if (currentUser.current_role === 'student') {
                const studentProfile = await Student.filter({ user_id: currentUser.id });
                if (Array.isArray(studentProfile) && studentProfile.length > 0 && studentProfile[0].academic_track_ids) {
                    const studentTrackIds = studentProfile[0].academic_track_ids;
                    relevantCourses = validCourses.filter((course: CourseInfo) => 
                        Array.isArray(course.academic_track_ids) && 
                        course.academic_track_ids.some((trackId: string) => studentTrackIds.includes(trackId))
                    );
                }
            }
            setCourses(relevantCourses);
            
            const params = new URLSearchParams(location.search);
            const courseIdFromUrl = params.get('course_id');
            if (courseIdFromUrl) {
                setFormState(prev => ({ ...prev, course_id: courseIdFromUrl }));
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
            setCourses([]);
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        
        if (!formState.title.trim()) {
            newErrors.title = 'שם הקובץ הוא שדה חובה';
        }
        
        if (!formState.description.trim()) {
            newErrors.description = 'תיאור הקובץ הוא שדה חובה';
        }
        
        if (!formState.course_id) {
            newErrors.course_id = 'יש לבחור קורס';
        }
        
        if (!formState.file_type) {
            newErrors.file_type = 'יש לבחור סוג קובץ';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name!]: value as string }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const currentUser = await User.me();
            let uploaderRecord;
            if (currentUser.current_role === 'student') {
                const studentRecords = await Student.filter({ user_id: currentUser.id });
                if (Array.isArray(studentRecords) && studentRecords.length > 0) uploaderRecord = studentRecords[0];
            } else if (currentUser.current_role === 'lecturer') {
                const lecturerRecords = await Lecturer.filter({ user_id: currentUser.id });
                if (Array.isArray(lecturerRecords) && lecturerRecords.length > 0) uploaderRecord = lecturerRecords[0];
            } else { // Admin
                const studentRecords = await Student.filter({ user_id: currentUser.id });
                 if (Array.isArray(studentRecords) && studentRecords.length > 0) {
                    uploaderRecord = studentRecords[0];
                 } else {
                    const lecturerRecords = await Lecturer.filter({ user_id: currentUser.id });
                    if (Array.isArray(lecturerRecords) && lecturerRecords.length > 0) uploaderRecord = lecturerRecords[0];
                 }
            }

            if (!uploaderRecord) {
                throw new Error("פרופיל המשתמש לא נמצא. אנא פנה למנהל המערכת.");
            }

            const status = ['admin', 'lecturer'].includes(currentUser.current_role) ? 'approved' : 'pending';

            const newFile = {
                ...formState,
                uploader_id: uploaderRecord.id,
                status,
                created_date: new Date().toISOString(),
                download_count: 0,
                file_url: 'https://example.com/mock-file.pdf' // Mock URL
            };

            await FileEntity.create(newFile);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to upload file:", error);
            alert('שגיאה בהעלאת הקובץ. אנא נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
                <Paper elevation={2} sx={{ p: 6, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 8 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                        <CheckCircleIcon sx={{ fontSize: 48 }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        הקובץ הועלה בהצלחה!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {user?.current_role === 'student' 
                            ? 'הקובץ שלך נשלח לאישור מרצה.<br/>תקבל התראה כאשר הקובץ יאושר.'
                            : 'הקובץ שלך אושר אוטומטית והוא זמין כעת לסטודנטים.'
                        }
                    </Typography>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button 
                            variant="contained" 
                            onClick={() => setIsSubmitted(false)}
                            sx={{ 
                                bgcolor: 'success.main',
                                '&:hover': { bgcolor: 'success.dark' }
                            }}
                        >
                            העלה קובץ נוסף
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate('/courses')}
                        >
                            חזרה לקורסים
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <CloudUploadIcon />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold">העלאת קובץ חדש</Typography>
                    <Typography color="text.secondary">העלה קבצים ללימוד ושיתוף עם הקהילה</Typography>
                </Box>
            </Box>

            <Paper elevation={2} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        name="title"
                        label="שם הקובץ"
                        value={formState.title}
                        onChange={handleChange}
                        error={!!errors.title}
                        helperText={errors.title}
                        required
                        fullWidth
                    />
                    
                    <TextField
                        name="description"
                        label="תיאור הקובץ"
                        value={formState.description}
                        onChange={handleChange}
                        error={!!errors.description}
                        helperText={errors.description}
                        required
                        multiline
                        rows={3}
                        fullWidth
                    />
                    
                    <FormControl fullWidth error={!!errors.course_id} required>
                        <InputLabel id="course-label">קורס</InputLabel>
                        <Select
                            labelId="course-label"
                            name="course_id"
                            value={formState.course_id}
                            onChange={handleChange}
                            label="קורס"
                        >
                            {courses.map((course) => (
                                <MenuItem key={course.id} value={course.id}>
                                    {course.course_name} ({course.course_code})
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.course_id && <Typography color="error" variant="caption">{errors.course_id}</Typography>}
                    </FormControl>
                    
                    <FormControl fullWidth error={!!errors.file_type}>
                        <InputLabel id="file-type-label">סוג הקובץ</InputLabel>
                        <Select
                            labelId="file-type-label"
                            name="file_type"
                            value={formState.file_type}
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="note">הרצאות וסיכומים</MenuItem>
                            <MenuItem value="exam">מבחני תרגול</MenuItem>
                            <MenuItem value="formulas">דף נוסחאות</MenuItem>
                            <MenuItem value="assignment">מטלות</MenuItem>
                            <MenuItem value="other">אחר</MenuItem>
                        </Select>
                        {errors.file_type && <Typography color="error" variant="caption">{errors.file_type}</Typography>}
                    </FormControl>
                    
                    <Box>
                        <Button variant="contained" component="label">
                            בחר קובץ
                            <input type="file" hidden accept=".pdf,.docx,.png,.jpg,.jpeg" />
                        </Button>
                        {errors.file && <Typography color="error" variant="caption">{errors.file}</Typography>}
                    </Box>
                    
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isSubmitting}
                        sx={{ mt: 2 }}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'העלה קובץ'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
