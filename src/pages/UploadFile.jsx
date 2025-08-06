
import { useState, useEffect, useRef } from "react";
import { User, Course, File, Student, Lecturer } from "@/api/entities";
import { UploadFile as UploadFileIntegration } from "@/api/integrations";
import {
    Card, CardContent, Button, TextField, Select, MenuItem, InputLabel, FormControl,
    Box, Typography, CircularProgress, Alert, Autocomplete, Avatar, IconButton
} from '@mui/material';
import { Upload, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UploadFilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [uploader, setUploader] = useState(null);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file_type: "",
    course_id: "",
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      let userTrackIds = [];
      let uploaderRecord = null;

      // An admin might also be a student or lecturer, so we need to find an associated profile to upload files.
      // We will prioritize the student profile if both exist.
      const students = await Student.filter({ email: currentUser.email });
      if (students.length > 0) {
        uploaderRecord = students[0];
        userTrackIds = uploaderRecord.academic_track_ids || [];
      } else {
        const lecturers = await Lecturer.filter({ email: currentUser.email });
        if (lecturers.length > 0) {
          uploaderRecord = lecturers[0];
          userTrackIds = uploaderRecord.academic_track_ids || [];
        }
      }
      setUploader(uploaderRecord);

      const allCourses = await Course.list();
      let availableCourses = allCourses;

      // Admins see all courses, others see courses filtered by their tracks.
      if (currentUser.current_role !== 'admin') {
        if (userTrackIds.length > 0) {
            availableCourses = allCourses.filter(course =>
                course.academic_track_ids?.some(trackId => userTrackIds.includes(trackId))
            );
        } else {
            availableCourses = [];
        }
      }
      
      setCourses(availableCourses);

      const urlCourseId = new URLSearchParams(window.location.search).get('course_id');
      if (urlCourseId) {
          handleInputChange('course_id', urlCourseId);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("שגיאה בטעינת הנתונים. אנא נסה שוב.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        setError("אנא העלה קבצי PDF, DOCX, PNG או JPG בלבד");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError("גודל הקובץ חייב להיות פחות מ-10MB");
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file
      }));
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Clear the file input's value
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "כותרת הקובץ היא שדה חובה";
    if (!formData.description.trim()) errors.description = "תיאור הקובץ הוא שדה חובה";
    if (!formData.course_id) errors.course_id = "שיוך לקורס הוא שדה חובה";
    if (!formData.file_type) errors.file_type = "סוג הקובץ הוא שדה חובה";
    if (!formData.file) errors.file = "בחירת קובץ היא שדה חובה";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (!uploader) {
        throw new Error("פרופיל המשתמש לא נמצא. אנא פנה למנהל המערכת.");
      }

      const uploadResult = await UploadFileIntegration(formData.file);
      
      // Check if user is in lecturer mode - if so, auto-approve the file
      const currentUser = await User.me();
      const fileStatus = currentUser.current_role === 'lecturer' ? 'approved' : 'pending';
      
      await File.create({
        title: formData.title,
        description: formData.description,
        file_type: formData.file_type,
        course_id: formData.course_id,
        file_url: uploadResult.file_url,
        uploader_id: uploader.id,
        status: fileStatus,
        created_date: new Date().toISOString(),
        download_count: 0
      });

      setSuccess(true);
      
    } catch (error) {
      setError(error.message || "שגיאה בהעלאת הקובץ. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const fileTypes = [
    { value: "note", label: "הרצאות וסיכומים" },
    { value: "exam", label: "מבחני תרגול" },
    { value: "formulas", label: "דף נוסחאות" },
    { value: "assignment", label: "מטלות" },
    { value: "other", label: "אחר" }
  ];

  if (success) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <CheckCircle sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>הקובץ הועלה בהצלחה!</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {user?.current_role === 'lecturer' ? "הקובץ שלך אושר אוטומטיות וזמין כעת לכלל הסטודנטים." : "הקובץ שלך הוגש לאישור המרצה. תקבל התראה ברגע שהוא ייבדק."}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => navigate(createPageUrl("MyFiles"))}>צפייה בקבצים שלי</Button>
              <Button variant="contained" onClick={() => {
                setSuccess(false);
                setFormData({ title: "", description: "", file_type: "", course_id: "", file: null });
              }}>העלאת קובץ נוסף</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
            <Upload />
          </Avatar>
          <Typography variant="h4" fontWeight="bold">העלאת קובץ חדש</Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 3 }}>שתפו חומרי לימוד עם סטודנטים אחרים</Typography>

        <Card elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="כותרת הקובץ"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                error={!!validationErrors.title}
                helperText={validationErrors.title}
                required fullWidth
              />
              <Autocomplete
                options={courses}
                getOptionLabel={(option) => `${option.course_code} - ${option.course_name}`}
                value={courses.find(c => c.id === formData.course_id) || null}
                onChange={(event, newValue) => {
                  handleInputChange("course_id", newValue ? newValue.id : "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="שיוך לקורס"
                    error={!!validationErrors.course_id}
                    helperText={validationErrors.course_id}
                    required
                  />
                )}
              />
              <TextField
                label="תיאור (עד 200 תווים)"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                required multiline rows={4} fullWidth
                inputProps={{ maxLength: 200 }}
              />
              <FormControl fullWidth error={!!validationErrors.file_type}>
                <InputLabel id="file-type-label">סוג הקובץ</InputLabel>
                <Select
                  labelId="file-type-label"
                  value={formData.file_type}
                  label="סוג הקובץ"
                  onChange={(e) => handleInputChange("file_type", e.target.value)}
                  required
                >
                  {fileTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
                {validationErrors.file_type && <Typography color="error" variant="caption">{validationErrors.file_type}</Typography>}
              </FormControl>
              <Box>
                <Button variant="contained" component="label">
                  בחר קובץ
                  <input type="file" hidden accept=".pdf,.docx,.png,.jpg,.jpeg" ref={fileInputRef} onChange={handleFileChange} />
                </Button>
                {formData.file && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography>{formData.file.name}</Typography>
                    <IconButton onClick={handleRemoveFile}><X /></IconButton>
                  </Box>
                )}
                {validationErrors.file && <Typography color="error" variant="caption">{validationErrors.file}</Typography>}
              </Box>
              <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <Upload />}>
                {loading ? 'מעלה...' : 'העלאת הקובץ'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
