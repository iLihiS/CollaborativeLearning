/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/api/entities';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginForm({ onLoginSuccess, onLoginError }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await User.login(formData);
      onLoginSuccess(response);
    } catch (error) {
      console.error('Login failed:', error);
      onLoginError(error.message || 'שגיאה בהתחברות. אנא בדוק את הפרטים וחזור שוב.');
    } finally {
      setLoading(false);
    }
  };

  // Demo users for easy access
  const demoUsers = [
    { email: 'student@ono.ac.il', label: 'סטודנט בלבד' },
    { email: 'lecturer@ono.ac.il', label: 'מרצה בלבד' },
    { email: 'admin@ono.ac.il', label: 'מנהל בלבד' },
    { email: 'student.lecturer@ono.ac.il', label: 'סטודנט + מרצה' },
    { email: 'lecturer.admin@ono.ac.il', label: 'מרצה + מנהל' },
    { email: 'all.roles@ono.ac.il', label: 'כל התפקידים' }
  ];

  const fillDemoUser = (email) => {
    setFormData({ email, password: '123456' });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">התחברות למערכת</CardTitle>
        <CardDescription>
          הזן את כתובת המייל והסיסמה שלך כדי להתחבר
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">כתובת מייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@ono.ac.il"
              value={formData.email}
              onChange={handleInputChange}
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="הזן סיסמה"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.email || !formData.password}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            התחבר
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600 mb-3 text-center">משתמשי דמו לבדיקה:</p>
          <div className="grid gap-2">
            {demoUsers.map((user) => (
              <Button
                key={user.email}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => fillDemoUser(user.email)}
                type="button"
              >
                <span className="font-medium">{user.label}</span>
                <span className="ml-2 text-gray-500" dir="ltr">{user.email}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            סיסמה לכל המשתמשים: 123456
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 