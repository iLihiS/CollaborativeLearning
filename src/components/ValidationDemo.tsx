import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Grid,
  Button,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { FormValidator, Validators, FileValidator } from '@/utils/validation';

export function ValidationDemo() {
  const [testValues, setTestValues] = useState({
    email: '',
    phone: '',
    studentId: '',
    employeeId: '',
    courseCode: '',
    hebrewName: '',
    password: ''
  });

  const [validationResults, setValidationResults] = useState<Record<string, any>>({});

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTestValues(prev => ({ ...prev, [field]: value }));

    // Validate in real-time
    const result = FormValidator.validateField(field, value);
    setValidationResults(prev => ({ ...prev, [field]: result }));
  };

  const testEmailValidation = () => {
    const emails = [
      'test@example.com',
      'invalid-email',
      'test..test@example.com',
      'test@domain',
      'a@b.co',
      'very-long-email-address-that-exceeds-normal-limits@very-long-domain-name-that-should-be-rejected.com'
    ];

    const results = emails.map(email => ({
      email,
      result: Validators.validateEmail(email)
    }));

    console.log('Email validation results:', results);
    return results;
  };

  const emailResults = testEmailValidation();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        מערכת Validation מחודשת - הדגמה
      </Typography>

      <Grid container spacing={3}>
        {/* Real-time validation demo */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="בדיקה בזמן אמת" />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="כתובת אימייל"
                  value={testValues.email}
                  onChange={handleInputChange('email')}
                  error={validationResults.email && !validationResults.email.isValid}
                  helperText={validationResults.email?.error}
                  fullWidth
                  dir="ltr"
                />
                
                <TextField
                  label="מספר טלפון"
                  value={testValues.phone}
                  onChange={handleInputChange('phone')}
                  error={validationResults.phone && !validationResults.phone.isValid}
                  helperText={validationResults.phone?.error}
                  fullWidth
                  dir="ltr"
                />
                
                <TextField
                  label="מספר סטודנט"
                  value={testValues.studentId}
                  onChange={handleInputChange('studentId')}
                  error={validationResults.studentId && !validationResults.studentId.isValid}
                  helperText={validationResults.studentId?.error}
                  fullWidth
                />
                
                <TextField
                  label="מספר עובד"
                  value={testValues.employeeId}
                  onChange={handleInputChange('employeeId')}
                  error={validationResults.employeeId && !validationResults.employeeId.isValid}
                  helperText={validationResults.employeeId?.error}
                  fullWidth
                />
                
                <TextField
                  label="קוד קורס"
                  value={testValues.courseCode}
                  onChange={handleInputChange('courseCode')}
                  error={validationResults.courseCode && !validationResults.courseCode.isValid}
                  helperText={validationResults.courseCode?.error}
                  fullWidth
                />
                
                <TextField
                  label="שם עברי"
                  value={testValues.hebrewName}
                  onChange={handleInputChange('hebrewName')}
                  error={validationResults.hebrewName && !validationResults.hebrewName.isValid}
                  helperText={validationResults.hebrewName?.error}
                  fullWidth
                />
                
                <TextField
                  label="סיסמה"
                  type="password"
                  value={testValues.password}
                  onChange={handleInputChange('password')}
                  error={validationResults.password && !validationResults.password.isValid}
                  helperText={validationResults.password?.error}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Email validation examples */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="דוגמאות בדיקת אימייל" />
            <CardContent>
              <Stack spacing={1}>
                {emailResults.map((item, index) => (
                  <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.email}
                    </Typography>
                    <Chip
                      label={item.result.isValid ? 'תקין' : 'לא תקין'}
                      color={item.result.isValid ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                    {!item.result.isValid && (
                      <Typography variant="caption" color="error" display="block">
                        {item.result.error}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Validation features summary */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="תכונות מערכת ה-Validation החדשה" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h6" gutterBottom>בדיקות אימייל מתקדמות</Typography>
                  <ul>
                    <li>בדיקת פורמט RFC-compliant</li>
                    <li>בדיקת אורך מקסימלי ומינימלי</li>
                    <li>בדיקת תווים עוקבים לא חוקיים</li>
                    <li>בדיקת מבנה דומיין</li>
                    <li>בדיקות אבטחה</li>
                  </ul>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h6" gutterBottom>בדיקות טלפון ישראליות</Typography>
                  <ul>
                    <li>תמיכה בפורמטים ישראליים</li>
                    <li>בדיקת קידומות נייד תקינות</li>
                    <li>בדיקת קודי אזור</li>
                    <li>תמיכה בפורמט בינלאומי</li>
                    <li>ניקוי אוטומטי של תווי עיצוב</li>
                  </ul>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h6" gutterBottom>בדיקות נוספות</Typography>
                  <ul>
                    <li>בדיקת שמות עבריים</li>
                    <li>בדיקת מספרי סטודנט</li>
                    <li>בדיקת מספרי עובד</li>
                    <li>בדיקת קודי קורס</li>
                    <li>בדיקת סיסמאות חזקות</li>
                    <li>בדיקת קבצים</li>
                  </ul>
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  מערכת ה-validation החדשה מספקת בדיקות מקיפות לכל הקלטים במערכת, 
                  כולל בדיקות בזמן אמת והודעות שגיאה מפורטות בעברית.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 