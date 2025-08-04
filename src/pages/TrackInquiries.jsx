
import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Message } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { MessagesSquare, Plus, Send, CheckCircle, Clock, MessageCircle, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function TrackInquiries() {
  const [user, setUser] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    loadData();
    // Check if we should open new inquiry form automatically
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      setShowNewInquiry(true);
      if(urlParams.get('type') === 'role_request') {
          const roleHe = urlParams.get('role_he');
          setFormData({
              subject: `בקשה להוספת תפקיד: ${roleHe}`,
              content: `שלום, אני מבקש/ת לקבל הרשאות "${roleHe}" במערכת. תודה.`
          });
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const userInquiries = await Message.filter({ sender_email: currentUser.email }, '-created_date');
      setInquiries(userInquiries);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
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
      setFormData({ subject: '', content: '' });
      setShowNewInquiry(false);
      
      const userInquiries = await Message.filter({ sender_email: user.email }, '-created_date');
      setInquiries(userInquiries);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending inquiry:', error);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status) => {
    if (status === 'handled') {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 ml-1" />טופל</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 ml-1" />ממתין לטיפול</Badge>;
  };

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <MessagesSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">מעקב פניות</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mt-3">שלחו פניות למנהלי המערכת ועקבו אחר הטיפול</p>
          </div>
          <div>
            <Button
              onClick={() => setShowNewInquiry(!showNewInquiry)}
              className="bg-lime-500 hover:bg-lime-600 text-white w-full md:w-auto"
            >
              <Plus className="w-4 h-4 ml-2" />
              פנייה חדשה
            </Button>
          </div>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">
              הפנייה נשלחה בהצלחה! נחזור אליך בהקדם האפשרי.
            </AlertDescription>
          </Alert>
        )}

        {showNewInquiry && (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 mb-8">
            <CardHeader>
              <CardTitle>פנייה חדשה</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">נושא הפנייה</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="נושא הפנייה..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">תוכן הפנייה</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="פרטו את בקשתכם או שאלתכם..."
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-start gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-lime-500 hover:bg-lime-600 text-white"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        שלח פנייה
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewInquiry(false)} className="dark:text-slate-200 dark:border-slate-600">
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                  <p className="mt-4 text-slate-500 dark:text-slate-400">טוען פניות...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-700">
                        <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-600">
                          <TableHead className="text-right text-slate-800 dark:text-slate-300">נושא הפנייה</TableHead>
                          <TableHead className="text-right text-slate-800 dark:text-slate-300">תאריך שליחה</TableHead>
                          <TableHead className="text-right text-slate-800 dark:text-slate-300">סטטוס</TableHead>
                          <TableHead className="text-right text-slate-800 dark:text-slate-300">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="dark:text-slate-200">
                        {inquiries.length > 0 ? (
                          inquiries.map((inquiry) => (
                            <TableRow key={inquiry.id} className="dark:border-slate-700">
                              <TableCell className="font-medium">{inquiry.subject}</TableCell>
                              <TableCell>{format(new Date(inquiry.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                              <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(inquiry)} className="dark:text-slate-200 dark:border-slate-600">
                                  <Eye className="w-4 h-4 ml-2" />
                                  צפייה
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-16 text-slate-500 dark:text-slate-400">
                              עדיין לא שלחתם פניות.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400">טוען פניות...</p>
            </div>
          ) : inquiries.length > 0 ? (
            inquiries.map((inquiry) => (
              <Card key={inquiry.id} className="border-0 shadow-lg bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-slate-900 dark:text-slate-100 text-base leading-tight">{inquiry.subject}</span>
                    {getStatusBadge(inquiry.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4"/>
                    <span>{format(new Date(inquiry.created_date), 'd MMM yyyy', { locale: he })}</span>
                  </div>
                  <div className="flex justify-start">
                    <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(inquiry)} className="dark:text-slate-200 dark:border-slate-600">
                      <Eye className="w-4 h-4 ml-2" />
                      צפייה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <MessagesSquare className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p>עדיין לא שלחתם פניות.</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400 text-right space-y-1">
          <p><span className="font-bold">הערה:</span> הפניות כאן מיועדות למנהלי המערכת בלבד.</p>
          <p>לתקשורת עם מרצים או סטודנטים אחרים, השתמשו בכלי התקשורת הרגילים של המוסד.</p>
        </div>
      </div>
      
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent dir="rtl" className="sm:max-w-[525px]">
          {selectedInquiry && (
            <>
              <DialogHeader className="text-right pl-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-right">{selectedInquiry.subject}</DialogTitle>
                    <DialogDescription className="text-right mt-2">
                      נשלח בתאריך {format(new Date(selectedInquiry.created_date), 'd בMMM yyyy, HH:mm', { locale: he })}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-1">
                  <Label>תוכן הפנייה:</Label>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-md border dark:border-slate-600">{selectedInquiry.content}</p>
                </div>

                {selectedInquiry.admin_response ? (
                  <div className="bg-lime-50 dark:bg-lime-900/20 border-r-4 border-lime-400 dark:border-lime-500 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                      <span className="font-medium text-lime-800 dark:text-lime-200">תשובת המנהל</span>
                      {selectedInquiry.response_date && (
                        <span className="text-xs text-lime-600 dark:text-lime-400">
                          {format(new Date(selectedInquiry.response_date), 'd בMMM yyyy', { locale: he })}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-200">{selectedInquiry.admin_response}</p>
                  </div>
                ) : (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-700 rounded-md border dark:border-slate-600">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    הפנייה עדיין ממתינה לטיפול.
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="dark:text-slate-200 dark:border-slate-600">סגור</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
