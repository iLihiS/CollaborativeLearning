import { useState, useEffect } from "react";
import { User, Notification } from "@/api/entities";
import {
    Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableHead,
    TableRow, TableContainer, Box, Typography, Paper, CircularProgress,
    ToggleButtonGroup, ToggleButton, Avatar
} from '@mui/material';
import { Bell, BellOff, CheckCircle, XCircle, MessageSquare, Upload, Eye } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";

const notificationIcons = {
  file_uploaded: { icon: Upload, color: "primary" },
  file_approved: { icon: CheckCircle, color: "success" },
  file_rejected: { icon: XCircle, color: "error" },
  inquiry_responded: { icon: MessageSquare, color: "secondary" }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await User.me();
        
      const userNotifications = await Notification.filter({ user_email: currentUser.email }, '-created_date');
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
      );
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(notification => filter === 'unread' ? !notification.is_read : true);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    const config = notificationIcons[type] || { icon: Bell, color: "action" };
    const IconComponent = config.icon;
    return <Avatar sx={{ bgcolor: `${config.color}.light`, color: `${config.color}.main` }}><IconComponent /></Avatar>;
  };

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><Bell /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">התראות</Typography>
            <Typography color="text.secondary">עקוב אחר עדכונים בפעילות שלך במערכת</Typography>
          </Box>
        </Box>
        <ToggleButtonGroup value={filter} exclusive onChange={(e, newFilter) => newFilter && setFilter(newFilter)}>
          <ToggleButton value="all">כל ההתראות ({notifications.length})</ToggleButton>
          <ToggleButton value="unread">לא נקראו ({unreadCount})</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {unreadCount > 0 && (
        <Button variant="outlined" startIcon={<BellOff />} onClick={markAllAsRead} sx={{ mb: 2 }}>
          סמן הכל כנקרא
        </Button>
      )}

      {loading ? <CircularProgress /> : (
        <>
          {/* Desktop Table View */}
          <Paper elevation={2} sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>כותרת</TableCell>
                    <TableCell>הודעה</TableCell>
                    <TableCell>תאריך</TableCell>
                    <TableCell>סטטוס</TableCell>
                    <TableCell align="left">פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id} hover sx={{ bgcolor: !notification.is_read ? 'action.hover' : 'inherit' }}>
                      <TableCell>{getNotificationIcon(notification.type)}</TableCell>
                      <TableCell>{notification.title}</TableCell>
                      <TableCell>{notification.message}</TableCell>
                      <TableCell>{format(new Date(notification.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                      <TableCell>{!notification.is_read ? <Chip label="חדש" color="primary" size="small" /> : <Chip label="נקרא" size="small" />}</TableCell>
                      <TableCell align="left">
                        {notification.action_url && <Button component={Link} to={notification.action_url} variant="outlined" startIcon={<Eye />}>צפייה</Button>}
                        {!notification.is_read && <Button onClick={() => markAsRead(notification.id)}>סמן כנקרא</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} sx={{ mb: 2, borderLeft: !notification.is_read ? 4 : 0, borderColor: 'primary.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {getNotificationIcon(notification.type)}
                    <Box>
                      <Typography variant="h6">{notification.title}</Typography>
                      <Typography color="text.secondary">{notification.message}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{format(new Date(notification.created_date), 'd MMM yyyy', { locale: he })}</Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        {notification.action_url && <Button component={Link} to={notification.action_url} variant="outlined" size="small" startIcon={<Eye />}>צפייה</Button>}
                        {!notification.is_read && <Button onClick={() => markAsRead(notification.id)} size="small">סמן כנקרא</Button>}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
