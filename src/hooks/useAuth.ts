import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/types';

export const useAuth = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  const loadUser = async () => {
    try {
      setLoading(true);
      
      // Simulate user loading - replace with real API call
      const mockUser: User = {
        id: "1",
        full_name: "משתמש דמו",
        email: "demo@ono.ac.il",
        roles: ["student", "lecturer", "admin"],
        current_role: "admin", // Changed to admin to see all menu items
        theme_preference: "light"
      };
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(mockUser);
      setLoginError('');
    } catch (error) {
      console.error('Error loading user:', error);
      setLoginError('שגיאה בטעינת פרטי המשתמש');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setLoginError('');
  };

  useEffect(() => {
    loadUser();
  }, [location.pathname]);

  return {
    user,
    loading,
    loginError,
    setLoginError,
    logout,
    loadUser
  };
}; 