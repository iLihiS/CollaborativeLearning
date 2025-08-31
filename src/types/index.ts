export interface User {
  id: string;
  full_name: string;
  email: string;
  national_id: string; // תעודת זהות ייחודית
  roles: UserRole[]; // תפקידים מרובים
  current_role?: UserRole; // התפקיד הנוכחי הפעיל
  
  // Student specific fields (when role includes 'student')
  student_id?: string;
  academic_track_ids?: string[];
  year?: number;
  status?: 'active' | 'inactive' | 'graduated';
  
  // Lecturer specific fields (when role includes 'lecturer')  
  employee_id?: string;
  lecturer_academic_track_ids?: string[];
  
  // Admin specific fields (when role includes 'admin')
  admin_id?: string;
  
  // Common fields
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'student' | 'lecturer' | 'admin';

export interface RoleSpecificData {
  student?: {
    student_id: string;
    academic_track_ids: string[];
    year: number;
    status: 'active' | 'inactive' | 'graduated';
  };
  lecturer?: {
    employee_id: string;
    academic_track_ids: string[];
  };
  admin?: {
    admin_id: string;
  };
}

export interface UserSession {
  user: User;
  current_role: UserRole;
  available_roles: UserRole[];
}

// Legacy interfaces for backward compatibility
export interface Student {
  id: string;
  full_name: string;
  email: string;
  national_id: string;
  student_id: string;
  academic_track_ids: string[];
  year: number;
  status: 'active' | 'inactive' | 'graduated';
}

export interface Lecturer {
  id: string;
  full_name: string;
  email: string;
  national_id: string;
  employee_id: string;
  academic_track_ids: string[];
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  national_id: string;
  admin_id: string;
}

export interface ToastState {
  open: boolean;
  message: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
} 