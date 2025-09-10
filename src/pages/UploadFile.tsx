
import { useState, useEffect } from 'react';
import { Course, File as FileEntity, Student, Lecturer, User } from '@/api/entities';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Button, TextField, Select, MenuItem, FormControl, InputLabel,
    Typography, Paper, CircularProgress, Avatar, Autocomplete, Dialog,
    DialogTitle, DialogContent, DialogActions, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    CloudUpload,
    Link as LinkIcon,
    AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { Lock, Unlock, Plus, X, RefreshCw } from 'lucide-react';

type CourseInfo = {
    id: string;
    course_name?: string;
    name?: string;
    course_code?: string;
    code?: string;
};

type FormData = {
    title: string;
    description: string;
    course_id: string;
    file_type: string;
    file_code: string;
    file_url?: string;
};

type UploadMode = 'file' | 'url';

type FormErrors = {
    title?: string;
    description?: string;
    course_id?: string;
    file_type?: string;
    file_code?: string;
    file?: string;
    file_url?: string;
};

export default function UploadFile() {
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        course_id: '',
        file_type: '',
        file_code: '',
        file_url: ''
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [isFileCodeEditable, setIsFileCodeEditable] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadMode, setUploadMode] = useState<UploadMode>('file');
    const [user, setUser] = useState<any>(null);
    const [files, setFiles] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        validateForm();
    }, [formData, selectedFile, uploadMode]);

    // Auto-generate file code when course and file type are selected
    useEffect(() => {
        if (formData.course_id && formData.file_type && !isFileCodeEditable && courses.length > 0) {
            const generatedCode = generateFileCode(formData.course_id, formData.file_type);
            setFormData(prev => ({ ...prev, file_code: generatedCode }));
        }
    }, [formData.course_id, formData.file_type, isFileCodeEditable, courses, files]);

    const loadData = async () => {
        try {
            const [courseList, fileList, currentUser] = await Promise.all([
                Course.list(),
                FileEntity.list(),
                User.me()
            ]);

            setCourses(Array.isArray(courseList) ? courseList : []);
            setFiles(Array.isArray(fileList) ? fileList : []);
            setUser(currentUser);
        } catch (error) {
            console.error('Error loading data:', error);
            setCourses([]);
            setFiles([]);
        }
    };

    const generateFileCode = (courseId: string, fileType: string): string => {
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            return 'FILE-001';
        }
        
        const courseCode = course?.course_code || course?.code || course?.name?.substring(0, 4).toUpperCase() || 'FILE';
        
        const typePrefix = {
            'note': 'N',
            'exam': 'E', 
            'formulas': 'F',
            'assignment': 'A',
            'other': 'O'
        }[fileType] || 'O';
        
        // Find next available number for this course and type
        const existingCodes = files
            .filter(f => f.file_code && f.file_code.startsWith(`${courseCode}-${typePrefix}`))
            .map(f => {
                const match = f.file_code.match(/\d+$/);
                return match ? parseInt(match[0]) : 0;
            });
        
        const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
        return `${courseCode}-${typePrefix}${nextNumber.toString().padStart(3, '0')}`;
    };

    const isFileCodeUnique = (code: string): boolean => {
        return !files.some(f => f.file_code === code);
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'שם הקובץ הוא שדה חובה';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'תיאור הקובץ הוא שדה חובה';
        }
        
        if (!formData.course_id) {
            newErrors.course_id = 'יש לבחור קורס';
        }
        
        if (!formData.file_type) {
            newErrors.file_type = 'יש לבחור סוג קובץ';
        }
        
        if (!formData.file_code.trim()) {
            newErrors.file_code = 'קוד קובץ הוא שדה חובה';
        } else if (!isFileCodeUnique(formData.file_code)) {
            newErrors.file_code = 'קוד קובץ זה כבר קיים במערכת';
        }
        
        // Validate based on upload mode
        if (uploadMode === 'file') {
            if (!selectedFile) {
                newErrors.file = 'יש לבחור קובץ להעלאה';
            }
        } else if (uploadMode === 'url') {
            if (!formData.file_url?.trim()) {
                newErrors.file_url = 'יש להכניס קישור לקובץ';
            } else if (!isValidUrl(formData.file_url)) {
                newErrors.file_url = 'הקישור שהוכנס אינו תקין';
            }
        }
        
        setFormErrors(newErrors);
        
        const isValid = Object.keys(newErrors).length === 0 && 
            formData.title.trim() !== '' &&
            formData.description.trim() !== '' &&
            formData.course_id !== '' &&
            formData.file_type !== '' &&
            formData.file_code.trim() !== '' &&
            ((uploadMode === 'file' && selectedFile !== null) || 
             (uploadMode === 'url' && formData.file_url?.trim() && isValidUrl(formData.file_url)));
        
        setIsFormValid(isValid);
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
        
        // Reset attempt flag when user starts interacting with form
        if (hasAttemptedSubmit) {
            setHasAttemptedSubmit(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        
        if (file && !formData.title) {
            // Auto-fill title from filename
            const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
            setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
        }
        
        // Clear file error
        if (formErrors.file) {
            setFormErrors(prev => ({ ...prev, file: undefined }));
        }
        
        // Reset attempt flag when user starts interacting with form
        if (hasAttemptedSubmit) {
            setHasAttemptedSubmit(false);
        }
    };

    const handleUploadModeChange = (mode: UploadMode) => {
        setUploadMode(mode);
        // Clear relevant errors when switching modes
        if (mode === 'file') {
            setFormErrors(prev => ({ ...prev, file_url: undefined }));
            setFormData(prev => ({ ...prev, file_url: '' }));
        } else {
            setFormErrors(prev => ({ ...prev, file: undefined }));
            setSelectedFile(null);
        }
        
        // Reset attempt flag when user changes mode
        if (hasAttemptedSubmit) {
            setHasAttemptedSubmit(false);
        }
    };

    const handleSubmit = async () => {
        setHasAttemptedSubmit(true);
        
        if (!isFormValid) {
            validateForm();
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Get current user info for uploader details
            const currentUser = await User.me();
            let uploaderId = currentUser.id;
            let uploaderType: 'student' | 'lecturer' | 'admin' = 'student';
            
            // Determine uploader type based on current role
            if (currentUser.current_role === 'lecturer') {
                uploaderType = 'lecturer';
            } else if (currentUser.current_role === 'admin') {
                uploaderType = 'admin';
            }
            
            // Create file entity
            const isAutoApproved = uploaderType === 'lecturer' || uploaderType === 'admin';
            const fileData = {
                filename: uploadMode === 'file' ? (selectedFile?.name || formData.title) : formData.title,
                original_name: formData.title,
                file_type: formData.file_type,
                file_code: formData.file_code,
                course_id: formData.course_id,
                uploader_id: uploaderId,
                uploader_type: uploaderType,
                status: uploaderType === 'student' ? 'pending' : 'approved', // Auto-approve for lecturers/admins
                approval_date: isAutoApproved ? new Date().toISOString() : undefined,
                approved_by: isAutoApproved ? uploaderId : undefined,
                file_size: uploadMode === 'file' ? (selectedFile?.size || 0) : 0,
                file_url: uploadMode === 'url' ? formData.file_url : undefined,
                download_count: 0,
                tags: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            await FileEntity.create(fileData);
            
            setIsSubmitted(true);
            
            // Navigate to my files after a short delay
            setTimeout(() => {
                navigate('/myfiles', { replace: true, state: { refresh: true } });
            }, 1500);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('שגיאה בהעלאת הקובץ. אנא נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/my-files');
    };

    if (isSubmitted) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="h6" textAlign="center" gutterBottom>
                        הקובץ הועלה בהצלחה!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        מעביר אותך לעמוד הקבצים שלי...
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={2} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                {/* Header - Same as Dialog Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Plus />
                    <Typography variant="h4" fontWeight="bold" textAlign="left">הוספת קובץ חדש</Typography>
                </Box>

                {/* Form Content - Same as Dialog Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    <TextField
                        name="title"
                        label="שם הקובץ"
                        value={formData.title}
                        onChange={handleFormChange}
                        error={hasAttemptedSubmit && !!formErrors.title}
                        helperText={hasAttemptedSubmit ? formErrors.title : ''}
                        required
                        fullWidth
                    />
                    
                    <TextField
                        name="description"
                        label="תיאור הקובץ"
                        value={formData.description}
                        onChange={handleFormChange}
                        error={hasAttemptedSubmit && !!formErrors.description}
                        helperText={hasAttemptedSubmit ? formErrors.description : ''}
                        required
                        multiline
                        rows={3}
                        fullWidth
                    />
                    
                    <Autocomplete
                        options={courses}
                        getOptionLabel={(option) => `${option.course_name || option.name} ${option.course_code ? `(${option.course_code})` : ''}`}
                        value={courses.find(course => course.id === formData.course_id) || null}
                        onChange={(event, newValue) => {
                            setFormData(prev => ({ ...prev, course_id: newValue?.id || '' }));
                            if (formErrors.course_id) {
                                setFormErrors(prev => ({ ...prev, course_id: undefined }));
                            }
                            
                            // Reset attempt flag when user starts interacting with form
                            if (hasAttemptedSubmit) {
                                setHasAttemptedSubmit(false);
                            }
                            
                            // Reset file code when course changes
                            if (newValue?.id && formData.file_type && !isFileCodeEditable) {
                                const generatedCode = generateFileCode(newValue.id, formData.file_type);
                                setFormData(prev => ({ ...prev, file_code: generatedCode }));
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="קורס"
                                required
                                error={hasAttemptedSubmit && !!formErrors.course_id}
                                helperText={hasAttemptedSubmit ? formErrors.course_id : ''}
                            />
                        )}
                        noOptionsText="לא נמצאו קורסים"
                        fullWidth
                    />
                    
                    <FormControl fullWidth error={hasAttemptedSubmit && !!formErrors.file_type} required sx={{ direction: 'rtl' }}>
                        <InputLabel id="file-type-label" sx={{ textAlign: 'left', transformOrigin: 'top left', direction: 'ltr' }}>סוג הקובץ</InputLabel>
                        <Select
                            labelId="file-type-label"
                            name="file_type"
                            value={formData.file_type}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, file_type: e.target.value }));
                                if (formErrors.file_type) {
                                    setFormErrors(prev => ({ ...prev, file_type: undefined }));
                                }
                                
                                // Reset attempt flag when user starts interacting with form
                                if (hasAttemptedSubmit) {
                                    setHasAttemptedSubmit(false);
                                }
                                
                                // Reset file code when file type changes
                                if (formData.course_id && e.target.value && !isFileCodeEditable) {
                                    const generatedCode = generateFileCode(formData.course_id, e.target.value);
                                    setFormData(prev => ({ ...prev, file_code: generatedCode }));
                                }
                            }}
                            label="סוג הקובץ"
                            sx={{
                                '& .MuiSelect-select': {
                                    textAlign: 'left'
                                }
                            }}
                        >
                            <MenuItem value="note">הרצאות וסיכומים</MenuItem>
                            <MenuItem value="exam">מבחני תרגול</MenuItem>
                            <MenuItem value="formulas">דף נוסחאות</MenuItem>
                            <MenuItem value="assignment">מטלות</MenuItem>
                            <MenuItem value="other">אחר</MenuItem>
                        </Select>
                        {hasAttemptedSubmit && formErrors.file_type && <Typography color="error" textAlign="left" variant="caption">{formErrors.file_type}</Typography>}
                    </FormControl>
                    
                    <TextField
                        name="file_code"
                        label="קוד קובץ"
                        value={formData.file_code}
                        onChange={handleFormChange}
                        required
                        fullWidth
                        InputProps={{
                            readOnly: !isFileCodeEditable
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: !isFileCodeEditable ? '#ff9800' : undefined,
                                    },
                                },
                            },
                            '& .MuiInputLabel-root': {
                                '&.Mui-focused': {
                                    color: !isFileCodeEditable ? '#ff9800' : undefined,
                                },
                            },
                        }}
                        error={hasAttemptedSubmit && Boolean(formErrors.file_code)}
                        helperText={
                            (hasAttemptedSubmit && formErrors.file_code) ? formErrors.file_code : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Lock size={16} style={{ color: '#ff9800' }} />
                                    <span>קוד הקובץ יתמלא אוטומטית לאחר בחירת קורס וסוג קובץ</span>
                                </Box>
                            )
                        }
                        placeholder="יתמלא אוטומטית..."
                    />
                    
                    {/* Upload Mode Selection */}
                    <Box>
                        <Typography variant="body1" textAlign="left" gutterBottom sx={{ mb: 2 }}>
                            בחר אופן הוספת קובץ
                        </Typography>
                        <ToggleButtonGroup
                            value={uploadMode}
                            exclusive
                            onChange={(_, newMode) => newMode && handleUploadModeChange(newMode)}
                            fullWidth
                            sx={{ mb: 3 }}
                        >
                            <ToggleButton value="file" sx={{ py: 2 }}>
                                <AttachFileIcon sx={{ mr: 1 }} />
                                העלאה מהמחשב
                            </ToggleButton>
                            <ToggleButton value="url" sx={{ py: 2 }}>
                                <LinkIcon sx={{ mr: 1 }} />
                                קישור לקובץ
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* File Upload Section */}
                    {uploadMode === 'file' && (
                        <Box>
                            <Button variant="outlined" component="label" fullWidth sx={{ py: 2 }}>
                                {selectedFile ? selectedFile.name : 'בחר קובץ להעלאה'}
                                <input 
                                    type="file" 
                                    hidden 
                                    accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,.pptx,.xlsx"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {hasAttemptedSubmit && formErrors.file && <Typography color="error" textAlign="left" variant="caption" sx={{ mt: 1, display: 'block' }}>{formErrors.file}</Typography>}
                        </Box>
                    )}

                    {/* URL Input Section */}
                    {uploadMode === 'url' && (
                        <Box>
                            <TextField
                                name="file_url"
                                label="קישור לקובץ"
                                value={formData.file_url || ''}
                                onChange={handleFormChange}
                                error={hasAttemptedSubmit && !!formErrors.file_url}
                                helperText={hasAttemptedSubmit ? formErrors.file_url : 'הכנס קישור לקובץ (URL)'}
                                required
                                fullWidth
                                placeholder="https://example.com/file.pdf"
                                InputProps={{
                                    startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Actions - Same as Dialog Actions */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 2 }}>
                    <Button onClick={handleCancel}>
                        ביטול
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSubmitting || !isFormValid}
                        startIcon={isSubmitting ? <CircularProgress size={16} /> : <CloudUpload />}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'הוסף קובץ'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
