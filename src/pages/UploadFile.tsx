
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

            let relevantCourses = allCourses;
            if (currentUser.current_role === 'student') {
                const studentProfile = await Student.filter({ user_id: currentUser.id });
                if (studentProfile.length > 0 && studentProfile[0].academic_track_ids) {
                    const studentTrackIds = studentProfile[0].academic_track_ids;
                    relevantCourses = allCourses.filter((course: CourseInfo) => 
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
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        if (!formState.title.trim()) newErrors.title = "כותרת הקובץ היא שדה חובה";
        if (!formState.description.trim()) newErrors.description = "תיאור הקובץ הוא שדה חובה";
        if (!formState.course_id) newErrors.course_id = "חובה לבחור קורס";
        if (!formState.file_type) newErrors.file_type = "חובה לבחור סוג קובץ";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string; value: unknown }>) => {
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
                if (studentRecords.length > 0) uploaderRecord = studentRecords[0];
            } else if (currentUser.current_role === 'lecturer') {
                const lecturerRecords = await Lecturer.filter({ user_id: currentUser.id });
                if (lecturerRecords.length > 0) uploaderRecord = lecturerRecords[0];
            } else { // Admin
                const studentRecords = await Student.filter({ user_id: currentUser.id });
                 if (studentRecords.length > 0) {
                    uploaderRecord = studentRecords[0];
                 } else {
                    const lecturerRecords = await Lecturer.filter({ user_id: currentUser.id });
                    if (lecturerRecords.length > 0) uploaderRecord = lecturerRecords[0];
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
            alert((error as Error).message || "שגיאה בהעלאת הקובץ. נסה שוב.");
        }
        setIsSubmitting(false);
    };

    if (isSubmitted) {
        return (
            <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Paper sx={{ maxWidth: 400, textAlign: 'center' }}>
                    <Box sx={{ p: 4 }}>
                        <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                            <CheckCircleIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>הקובץ הועלה בהצלחה!</Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            {user?.current_role === 'student'
                                ? <>הקובץ שלך הוגש לאישור המרצה.<br/>תקבל התראה ברגע שהוא ייבדק.</>
                                : 'הקובץ זמין כעת לסטודנטים בקורס.'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button variant="contained" onClick={() => navigate('/my-files')}>צפייה בקבצים שלי</Button>
                            <Button variant="outlined" onClick={() => {
                                setIsSubmitted(false);
                                setFormState({ title: "", description: "", course_id: "", file_type: "note" });
                            }}>העלאת קובץ נוסף</Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
                        <CloudUploadIcon />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold">העלאת קובץ חדש</Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mb: 3 }}>שתפו חומרי לימוד עם סטודנטים אחרים</Typography>

                <Paper elevation={2}>
                    <Box sx={{ p: 3 }}>
                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Error and Success messages would go here if implemented */}
                            <TextField
                                label="כותרת הקובץ"
                                name="title"
                                value={formState.title}
                                onChange={handleChange}
                                error={!!errors.title}
                                helperText={errors.title}
                                required fullWidth
                            />
                            <Select
                                label="שיוך לקורס"
                                name="course_id"
                                value={formState.course_id}
                                onChange={handleChange as any}
                                error={!!errors.course_id}
                                required
                            >
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.id}>{course.course_code} - {course.course_name}</MenuItem>
                                ))}
                            </Select>
                            <TextField
                                label="תיאור (עד 200 תווים)"
                                name="description"
                                value={formState.description}
                                onChange={handleChange}
                                error={!!errors.description}
                                helperText={errors.description}
                                required multiline rows={4} fullWidth
                                inputProps={{ maxLength: 200 }}
                            />
                            <FormControl fullWidth error={!!errors.file_type}>
                                <InputLabel id="file-type-label">סוג הקובץ</InputLabel>
                                <Select
                                    labelId="file-type-label"
                                    name="file_type"
                                    value={formState.file_type}
                                    onChange={handleChange as any}
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
                                {/* File preview would go here if implemented */}
                                {errors.file && <Typography color="error" variant="caption">{errors.file}</Typography>}
                            </Box>
                            <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} /> : <CloudUploadIcon />}>
                                {isSubmitting ? 'מעלה...' : 'העלאת הקובץ'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
