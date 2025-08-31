import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/types';
import { LocalStorageService } from '@/services/localStorage';

export const useAuth = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  const loadUser = async () => {
    try {
      setLoading(true);
      
      // Initialize localStorage data
      LocalStorageService.initializeData();
      
      // Check if user is already logged in (session)
      const sessionUser = LocalStorageService.getUserSession();
      if (sessionUser) {
        setUser(sessionUser);
        setLoginError('');
        setLoading(false);
        return;
      }
      
      // Create demo user if no session exists - use same user as apiClient
      const mockUser: User = {
        id: "user-006",
        full_name: "ד\"ר רונה סופר יוזר",
        email: "all.roles@ono.ac.il",
        roles: ["student", "lecturer", "admin"],
        current_role: "admin", // Changed to admin to see all menu items
        theme_preference: "light"
      };
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set user session
      LocalStorageService.setUserSession(mockUser);
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
    LocalStorageService.clearUserSession();
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