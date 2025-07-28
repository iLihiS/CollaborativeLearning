
import React, { useState, useEffect } from 'react';
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
import { MessagesSquare, Plus, Send, CheckCircle, Clock, MessageCircle, Eye } from 'lucide-react';
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
          const role = urlParams.get('role');
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
      <style>{`
        .table-row-hover:hover {
          background-color: #64748b !important;
          color: white !important;
        }
        .table-row-hover:hover * {
          color: white !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <MessagesSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">מעקב פניות</h1>
            </div>
            <p className="text-white mt-3">שלחו פניות למנהלי המערכת ועקבו אחר הטיפול</p>
          </div>
          <div>
            <Button
              onClick={() => setShowNewInquiry(!showNewInquiry)}
              className="bg-lime-500 hover:bg-lime-600 text-white"
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
          <Card className="border-0 shadow-lg bg-white mb-8">
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
                  <Button type="button" variant="outline" onClick={() => setShowNewInquiry(false)}>
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto mb-4"></div>
                <p className="text-slate-500">טוען פניות...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                  <Table>
                      <TableHeader className="sticky top-0 z-10">
                          <TableRow className="hover:bg-[#ebeced]" style={{backgroundColor: '#ebeced'}}>
                              <TableHead className="text-right text-black">נושא</TableHead>
                              <TableHead className="text-right text-black">תאריך שליחה</TableHead>
                              <TableHead className="text-right text-black">סטטוס</TableHead>
                              <TableHead className="text-right text-black">פעולות</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {inquiries.length > 0 ? (
                              inquiries.map((inquiry) => (
                                  <TableRow key={inquiry.id} className="table-row-hover">
                                      <TableCell className="font-medium text-right">{inquiry.subject}</TableCell>
                                      <TableCell className="text-right">{format(new Date(inquiry.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                                      <TableCell className="text-right">{getStatusBadge(inquiry.status)}</TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(inquiry)}>
                                              <Eye className="w-4 h-4 ml-2" />
                                              צפייה
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={4} className="text-center py-16 text-slate-500">
                                  עדיין לא שלחתם פניות.
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-white text-right space-y-1">
          <p><span className="font-bold">הערה:</span> הפניות כאן מיועדות למנהלי המערכת בלבד.</p>
          <p>לתקשורת עם מרצים או סטודנטים אחרים, השתמשו בכלי התקשורת הרגילים של המוסד.</p>
        </div>
      </div> {/* Closing div for max-w-7xl mx-auto */}
      
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
                              <p className="text-slate-600 bg-slate-50 p-3 rounded-md border">{selectedInquiry.content}</p>
                          </div>

                          {selectedInquiry.admin_response ? (
                              <div className="bg-lime-50 border-r-4 border-lime-400 p-3 rounded">
                                  <div className="flex items-center gap-2 mb-2">
                                      <MessageCircle className="w-4 h-4 text-lime-600" />
                                      <span className="font-medium text-lime-800">תשובת המנהל</span>
                                      {selectedInquiry.response_date && (
                                      <span className="text-xs text-lime-600">
                                          {format(new Date(selectedInquiry.response_date), 'd בMMM yyyy', { locale: he })}
                                      </span>
                                      )}
                                  </div>
                                  <p className="text-slate-700">{selectedInquiry.admin_response}</p>
                              </div>
                          ) : (
                              <div className="text-center text-sm text-slate-500 p-4 bg-slate-50 rounded-md border">
                                  <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                                  הפנייה עדיין ממתינה לטיפול.
                              </div>
                          )}
                      </div>
                      <DialogFooter>
                          <DialogClose asChild>
                              <Button variant="outline">סגור</Button>
                          </DialogClose>
                      </DialogFooter>
                  </>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
