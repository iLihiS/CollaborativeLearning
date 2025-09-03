import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, UserSession, UserRole } from '@/types';
import { FirestoreUserService } from '@/services/firestoreUserService';
import { FirestoreService } from '@/services/firestoreService';
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
      await FirestoreUserService.initializeUsers();
      // Initialize Firestore data
      await FirestoreService.initializeData();
      
      // Check for existing unified session
      let currentSession = await FirestoreUserService.getCurrentSession();
      
      if (!currentSession) {
        // Always use the main demo user - no migration from old system
        console.log('🔄 No session found, creating demo session');
        const demoUser = await FirestoreUserService.getUserByEmail('all.roles@ono.ac.il');
        if (demoUser) {
          currentSession = {
            user: demoUser,
            current_role: demoUser.current_role || 'admin',
            available_roles: demoUser.roles
          };
          await FirestoreUserService.setCurrentSession(currentSession);
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

  const logout = async () => {
    try {
      await FirestoreUserService.clearCurrentSession();
      setSession(null);
      setLoginError('');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    if (!session || !session.user.roles.includes(newRole)) return false;
    
    console.log(`🔄 Switching role from ${session.current_role} to ${newRole}`);
    
    try {
      const success = await FirestoreUserService.switchUserRole(session.user.id, newRole);
      if (success) {
        const updatedUser = await FirestoreUserService.getUserById(session.user.id);
        if (updatedUser) {
          const updatedSession: UserSession = {
            user: updatedUser,
            current_role: newRole,
            available_roles: updatedUser.roles
          };
          
          // Update session state
          setSession(updatedSession);
          
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
    } catch (error) {
      console.error(`❌ Error switching role to ${newRole}:`, error);
      return false;
    }
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