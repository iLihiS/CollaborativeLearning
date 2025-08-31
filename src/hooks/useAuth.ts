import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, UserSession, UserRole } from '@/types';
import { UserService } from '@/services/userService';
import { LocalStorageService } from '@/services/localStorage';
import { createPageUrl } from '@/utils';

export const useAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  const loadUser = async () => {
    try {
      setLoading(true);
      
      // Initialize unified user system only
      UserService.initializeUsers();
      // Keep old system for backward compatibility but don't use for auth
      LocalStorageService.initializeData();
      
      // Check for existing unified session
      let currentSession = UserService.getCurrentSession();
      
      if (!currentSession) {
        // Always use the main demo user - no migration from old system
        console.log('🔄 No session found, creating demo session');
        const demoUser = UserService.getUserByEmail('all.roles@ono.ac.il');
        if (demoUser) {
          currentSession = {
            user: demoUser,
            current_role: demoUser.current_role || 'admin',
            available_roles: demoUser.roles
          };
          UserService.setCurrentSession(currentSession);
          console.log('✅ Demo session created:', currentSession);
        } else {
          console.log('❌ Demo user not found');
        }
      } else {
        console.log('✅ Existing session found:', currentSession);
      }
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSession(currentSession);
      setLoginError('');
    } catch (error) {
      console.error('Error loading user:', error);
      setLoginError('שגיאה בטעינת פרטי המשתמש');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    UserService.clearCurrentSession();
    setSession(null);
    setLoginError('');
  };

  const switchRole = (newRole: UserRole) => {
    if (!session || !session.user.roles.includes(newRole)) return false;
    
    console.log(`🔄 Switching role from ${session.current_role} to ${newRole}`);
    
    const success = UserService.switchUserRole(session.user.id, newRole);
    if (success) {
      const updatedUser = UserService.getUserById(session.user.id);
      if (updatedUser) {
        const updatedSession: UserSession = {
          user: updatedUser,
          current_role: newRole,
          available_roles: updatedUser.roles
        };
        
        // Update both session state and localStorage
        setSession(updatedSession);
        UserService.setCurrentSession(updatedSession);
        
        console.log(`✅ Role switched successfully to ${newRole}`);
        
        // Navigate to Dashboard
        navigate(createPageUrl("Dashboard"), { replace: true });
        
        // Force a small delay to ensure state updates and then reload
        setTimeout(() => {
          console.log(`🔄 Reloading page to ensure full sync`);
          window.location.href = createPageUrl("Dashboard");
        }, 200);
        
        return true;
      }
    }
    
    console.log(`❌ Failed to switch role to ${newRole}`);
    return false;
  };

  useEffect(() => {
    loadUser();
  }, [location.pathname]);

  return {
    session,
    user: session?.user || null,
    currentRole: session?.current_role,
    availableRoles: session?.available_roles || [],
    loading,
    loginError,
    setLoginError,
    logout,
    loadUser,
    switchRole
  };
}; 