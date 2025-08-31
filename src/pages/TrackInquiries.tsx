
import { useState, useEffect } from 'react';
import { Message, User } from '@/api/entities';
import {
    Card, CardContent, CardHeader, Typography, Button, TextField, Chip, Alert,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Paper, Avatar,
    CircularProgress
} from '@mui/material';
import { MessagesSquare, Plus, Send, CheckCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type Message = {
    id: string;
    subject: string;
    content: string;
    sender_name: string;
    sender_email: string;
    status: 'pending' | 'handled';
    created_date: string;
    admin_response?: string;
};

type FormState = {
    subject: string;
    content: string;
    sender_name: string;
    sender_email: string;
};

export default function TrackInquiries() {
  const [user, setUser] = useState<any>(null);
  const [inquiries, setInquiries] = useState<Message[]>([]);
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    subject: '',
    content: '',
    sender_name: '',
    sender_email: ''
  });
  const [selectedInquiry, setSelectedInquiry] = useState<Message | null>(null);

  useEffect(() => {
    loadData();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      setShowNewInquiry(true);
      if(urlParams.get('type') === 'role_request') {
          const roleHe = urlParams.get('role_he');
          setFormData({
              subject: `בקשה להוספת תפקיד: ${roleHe}`,
              content: `שלום, אני מבקש/ת לקבל הרשאות "${roleHe}" במערכת. תודה.`,
              sender_name: user?.full_name || '',
              sender_email: user?.email || ''
          });
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const userInquiries = await Message.filter({ sender_email: currentUser.email });
      setInquiries(userInquiries);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await Message.create({
        subject: formData.subject,
        content: formData.content,
        sender_name: user.full_name,
        sender_email: user.email,
        status: 'pending'
      });
      
      setSuccess(true);
      setFormData({ subject: '', content: '', sender_name: '', sender_email: '' });
      setShowNewInquiry(false);
      
      const userInquiries = await Message.filter({ sender_email: user.email });
      setInquiries(userInquiries);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending inquiry:', error);
    }
    setSubmitting(false);
  };

  const getStatusChip = (status: 'pending' | 'handled') => {
    if (status === 'handled') {
      return <Chip icon={<CheckCircle />} label="טופל" color="success" size="small" />;
    }
    return <Chip icon={<Clock />} label="ממתין לטיפול" color="warning" size="small" />;
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><MessagesSquare /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" textAlign="left">מעקב פניות</Typography>
            <Typography color="text.secondary" textAlign="left">שלחו פניות למנהלי המערכת ועקבו אחר הטיפול</Typography>
          </Box>
        </Box>
        <Button onClick={() => setShowNewInquiry(!showNewInquiry)} variant="contained" startIcon={<Plus />} sx={{textAlign: 'center'}}>
          פנייה חדשה
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>הפנייה נשלחה בהצלחה! נחזור אליך בהקדם האפשרי.</Alert>}

      {showNewInquiry && (
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardHeader title="פנייה חדשה" />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="נושא הפנייה" value={formData.subject} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, subject: e.target.value })} required fullWidth />
              <TextField label="תוכן הפנייה" value={formData.content} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })} required multiline rows={4} fullWidth />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} /> : <Send />}>
                  {submitting ? 'שולח...' : 'שלח פנייה'}
                </Button>
                <Button variant="outlined" onClick={() => setShowNewInquiry(false)}>ביטול</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">נושא הפנייה</TableCell>
                <TableCell align="left">תאריך שליחה</TableCell>
                <TableCell align="left">סטטוס</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : inquiries.map((inquiry) => (
                <TableRow key={inquiry.id} hover>
                  <TableCell align="left">{inquiry.subject}</TableCell>
                  <TableCell align="left">{format(new Date(inquiry.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                  <TableCell align="left">{getStatusChip(inquiry.status)}</TableCell>
                  <TableCell align="left">
                    <Button variant="outlined" startIcon={<Eye />} onClick={() => setSelectedInquiry(inquiry)}>צפייה</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!selectedInquiry} onClose={() => setSelectedInquiry(null)}>
        <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            נשלח בתאריך {selectedInquiry && format(new Date(selectedInquiry.created_date), 'd בMMM yyyy, HH:mm', { locale: he })}
          </Typography>
          <Typography sx={{ mt: 2 }}>{selectedInquiry?.content}</Typography>
          {selectedInquiry?.admin_response && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
              <Typography variant="subtitle2">תשובת המנהל:</Typography>
              <Typography>{selectedInquiry.admin_response}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInquiry(null)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
