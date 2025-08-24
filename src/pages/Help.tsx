
import {
    Card, CardContent, Typography, Accordion, AccordionSummary,
    AccordionDetails, Box, Avatar, Grid, Button, Paper
} from '@mui/material';
import { HelpCircle, Upload, CheckSquare, BarChart3 } from 'lucide-react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Help() {
  const howItWorks = [
    {
      title: "1. העלאת קבצים",
      description: "סטודנטים מעלים חומרי לימוד כמו סיכומים, מבחנים ודפי נוסחאות ומשייכים אותם לקורס הרלוונטי.",
      icon: <Upload />,
    },
    {
      title: "2. אישור מרצה",
      description: "כל קובץ עובר בדיקה ואישור של המרצה המלמד בקורס כדי להבטיח את איכות ודיוק התכנים.",
      icon: <CheckSquare />,
    },
    {
      title: "3. שיתוף ולימוד",
      description: "לאחר האישור, הקבצים זמינים לכלל הסטודנטים בקורס, ויוצרים מאגר ידע קהילתי עשיר.",
      icon: <BarChart3 />,
    }
  ];

  const faqs = [
    {
      question: "איך אני מעלה קובץ חדש?",
      answer: "פשוט! נווטו לעמוד 'העלאת קובץ' מהתפריט הראשי, מלאו את פרטי הקובץ, בחרו את הקורס הרלוונטי וצרפו את הקובץ מהמחשב שלכם."
    },
    {
      question: "איפה אני יכול לראות את סטטוס הקבצים שהעליתי?",
      answer: "כל הקבצים שהעליתם, יחד עם הסטטוס העדכני שלהם (ממתין, אושר, נדחה), מרוכזים בעמוד 'הקבצים שלי'."
    },
    {
      question: "הקובץ שלי נדחה, מה לעשות?",
      answer: "אם קובץ נדחה, ייתכן שהוא לא עמד בהנחיות האיכות או התוכן של הקורס. לעיתים המרצה יוסיף הערה. תוכלו לערוך את הפרטים ולהעלות גרסה מתוקנת."
    },
    {
      question: "האם אני יכול למחוק קובץ לאחר שהועלה?",
      answer: "כן, כל עוד הקובץ נמצא בסטטוס 'ממתין' לאישור, תוכלו למחוק אותו מעמוד 'הקבצים שלי'. לאחר שהקובץ אושר, לא ניתן למחוק אותו כדי לשמור על רצף המידע לכלל הסטודנטים."
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><HelpCircle /></Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold" textAlign="left">מרכז העזרה</Typography>
                    <Typography color="text.secondary">מצאו תשובות לשאלות נפוצות ומדריכים לשימוש במערכת.</Typography>
                </Box>
            </Box>
        </Box>

        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="left" sx={{ mb: 2 }}>איך המערכת עובדת?</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {howItWorks.map((step) => (
                        <Paper key={step.title} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>{step.icon}</Avatar>
                            <Box>
                                <Typography variant="h6" textAlign="left">{step.title}</Typography>
                                <Typography color="text.secondary" textAlign="left">{step.description}</Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="left" sx={{ mb: 2 }}>שאלות נפוצות</Typography>
                {faqs.map((faq, index) => (
                    <Accordion key={index}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{faq.question}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography color="text.secondary" textAlign="left">{faq.answer}</Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Grid>
        </Grid>

        <Card sx={{
            mt: 4, 
            color: 'white',
            background: 'linear-gradient(to right, #84cc16, #65a30d)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 3s infinite',
            },
            '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
            }
        }}>
            <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>צריך עזרה נוספת?</Typography>
                <Typography textAlign="center" sx={{ mb: 2, opacity: 0.9 }}>
                    אם לא מצאת את התשובה שחיפשת, אנחנו כאן לעזור
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.200' } }}
                        onClick={() => window.open('tel:+972525551981', '_self')}
                    >
                        צור קשר
                    </Button>
                    <Button
                        component={Link}
                        to={createPageUrl("TrackInquiries?new=true")}
                        variant="outlined"
                        sx={{ color: 'white', borderColor: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        שלח פנייה
                    </Button>
                </Box>
            </CardContent>
        </Card>
    </Box>
  );
}
