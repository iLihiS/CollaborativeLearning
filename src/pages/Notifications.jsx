import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Notification } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, BellOff, CheckCircle, XCircle, MessageSquare, Upload, Eye } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";

const notificationIcons = {
  file_uploaded: { icon: Upload, color: "text-blue-500", bgColor: "bg-blue-100" },
  file_approved: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-100" },
  file_rejected: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-100" },
  inquiry_responded: { icon: MessageSquare, color: "text-purple-500", bgColor: "bg-purple-100" }
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    const config = notificationIcons[type] || { icon: Bell, color: "text-slate-500", bgColor: "bg-slate-100" };
    const IconComponent = config.icon;
    return (
      <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
        <IconComponent className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">התראות</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mt-3">עקוב אחר עדכונים בפעילות שלך במערכת</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="flex gap-2 flex-grow">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={`flex-grow ${filter === 'all' ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'dark:text-slate-200 dark:border-slate-600'}`}
              >
                כל ההתראות ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={`flex-grow ${filter === 'unread' ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'dark:text-slate-200 dark:border-slate-600'}`}
              >
                לא נקראו ({unreadCount})
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="dark:text-slate-200 dark:border-slate-600">
                <BellOff className="w-4 h-4 ml-2" />
                סמן הכל כנקרא
              </Button>
            )}
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
           {loading ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400">טוען...</div>
           ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                    <Card key={notification.id} className={`border-0 shadow-lg bg-white dark:bg-slate-800 ${!notification.is_read ? 'border-r-4 border-lime-400' : ''}`}>
                        <CardContent className="p-4 flex items-start gap-4">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-grow">
                                <p className="font-bold text-slate-900 dark:text-slate-100">{notification.title}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
                                <p className="text-xs text-slate-400 mt-2">{format(new Date(notification.created_date), 'd MMM yyyy', { locale: he })}</p>
                                <div className="flex gap-2 mt-3">
                                    {notification.action_url && (
                                        <Link to={notification.action_url} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full dark:text-slate-200 dark:border-slate-600">
                                                <Eye className="w-4 h-4 ml-2" />
                                                צפייה
                                            </Button>
                                        </Link>
                                    )}
                                    {!notification.is_read && (
                                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="flex-1 text-lime-600 dark:text-lime-400">
                                            סמן כנקרא
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <p>אין התראות להצגה</p>
                </div>
            )}
        </div>


        {/* Desktop View */}
        <div className="hidden md:block">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">טוען התראות...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-700">
                      <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-600">
                        <TableHead className="text-right w-12"></TableHead>
                        <TableHead className="text-right text-slate-800 dark:text-slate-300">כותרת</TableHead>
                        <TableHead className="text-right text-slate-800 dark:text-slate-300">הודעה</TableHead>
                        <TableHead className="text-right text-slate-800 dark:text-slate-300">תאריך</TableHead>
                        <TableHead className="text-right text-slate-800 dark:text-slate-300">סטטוס</TableHead>
                        <TableHead className="text-right text-slate-800 dark:text-slate-300">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="dark:text-slate-200">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                          <TableRow key={notification.id} className={`dark:border-slate-700 ${!notification.is_read ? 'bg-lime-50/50 dark:bg-lime-900/10' : ''}`}>
                            <TableCell>{getNotificationIcon(notification.type)}</TableCell>
                            <TableCell className="font-medium">{notification.title}</TableCell>
                            <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                            <TableCell>
                              {format(new Date(notification.created_date), 'd MMM yyyy', { locale: he })}
                            </TableCell>
                            <TableCell>
                              {!notification.is_read ? (
                                <Badge className="bg-lime-100 text-lime-800 border-lime-200 text-xs">חדש</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs dark:border-slate-600">נקרא</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {notification.action_url && (
                                  <Link to={notification.action_url}>
                                    <Button variant="outline" size="sm" className="dark:text-slate-200 dark:border-slate-600">
                                      <Eye className="w-4 h-4 ml-2" />
                                      צפייה
                                    </Button>
                                  </Link>
                                )}
                                {!notification.is_read && (
                                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="text-lime-600 dark:text-lime-400">
                                    סמן כנקרא
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-slate-500 dark:text-slate-400">
                            {filter === 'unread' ? (
                              <>
                                <BellOff className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">אין התראות שלא נקראו</h3>
                                <p className="text-slate-500 dark:text-slate-400">כל ההתראות שלך כבר נקראו!</p>
                              </>
                            ) : (
                              <>
                                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">אין התראות עדיין</h3>
                                <p className="text-slate-500 dark:text-slate-400">התראות על פעילות במערכת יופיעו כאן</p>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400 text-right space-y-1">
          <p><span className="font-bold">הערה:</span> התראות מאפשרות לעקוב אחר עדכונים בפעילות שלכם במערכת.</p>
          <p>ניתן לסמן התראות כנקראות או לצפות בפרטים נוספים באמצעות הכפתורים.</p>
        </div>
      </div>
    </div>
  );
}
